import { Octokit } from "octokit";
import { analyzeAllRepos } from "./repo-analyzer";

// Helper for exponential backoff retry - FAIL FAST on Rate Limit as requested
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Fail Fast on Rate Limits (Quota Exhausted)
    if (error.status === 403 || error.status === 429) {
      console.error(`[GITHUB] Rate Limit Exceeded (Status ${error.status}). Failing immediately.`);
      throw new Error("GitHub API Rate Limit Exceeded. Please try again later or provide a token.");
    }

    if (retries > 0) {
      const waitTime = delay * 2;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Helper to chunk requests for concurrency control
async function chunkedPromiseAll<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  chunkSize = 5
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

const GITHUB_CACHE = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function getGitHubProfile(username: string, accessToken?: string) {
  if (!username) {
    throw new Error("GitHub username is required");
  }

  // 0. Check Cache
  const cacheKey = `${username}_${accessToken ? 'auth' : 'public'}`;
  const cached = GITHUB_CACHE.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.log(`[GITHUB] Using cached profile for ${username}`);
    return cached.data;
  }

  const octokit = new Octokit({
    auth: accessToken || process.env.GITHUB_TOKEN
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let user: any = null;

    // 1. Try to get user info - Optimize to avoid /user if possible
    // If we have an accessToken and it's the same user as the username,
    // we still need some info like bio, public_repos etc which might not be in the token.
    // However, we can try to get it via getByUsername even if authenticated to save quota on /user

    try {
      const { data: publicUser } = await withRetry(() => octokit.rest.users.getByUsername({ username }));
      user = publicUser;
    } catch (e) {
      console.warn(`Failed to fetch user info for ${username}`, e);
      if (accessToken) {
        // Last resort for authenticated user
        const { data: authUser } = await withRetry(() => octokit.rest.users.getAuthenticated());
        user = authUser;
      }
    }

    if (!user) {
      throw new Error(`User ${username} not found on GitHub`);
    }

    // 2. Determine repo type
    const repoType = (accessToken && user.login.toLowerCase() === username.toLowerCase()) ? "all" : "owner";

    // 3. Get repositories (Optimized fetch)
    // Fetch up to 2 pages (200 repos) - 300 might be overkill and slow down
    const pagePromises = [];
    const maxPages = 2;
    for (let i = 1; i <= maxPages; i++) {
      if (repoType === "all") {
        pagePromises.push(withRetry(() => octokit.rest.repos.listForAuthenticatedUser({
          sort: "pushed",
          per_page: 100,
          page: i,
          visibility: "all"
        })).then(res => res.data).catch(() => []));
      } else {
        pagePromises.push(withRetry(() => octokit.rest.repos.listForUser({
          username,
          sort: "pushed",
          per_page: 100,
          page: i,
          type: "owner"
        })).then(res => res.data).catch(() => []));
      }
    }

    // 4. Fetch Auxiliary Data in Parallel
    const [repoPages, orgsResult, socialsResult, readmeResult] = await Promise.all([
      Promise.all(pagePromises),
      withRetry(() => octokit.rest.orgs.listForUser({ username })).catch(() => ({ data: [] })),
      withRetry(() => octokit.rest.users.listSocialAccountsForUser({ username })).catch(() => ({ data: [] })),
      withRetry(() => octokit.rest.repos.getReadme({
        owner: username,
        repo: username,
        headers: { accept: "application/vnd.github.raw+json" },
      })).catch(() => ({ data: "" }))
    ]);

    const allRepos = repoPages.flat();
    const repos = allRepos;

    // Process Auxiliary Data
    const organizations: any[] = (orgsResult.data as any[]).map(o => ({ login: o.login, description: o.description }));
    const socialAccounts: any[] = (socialsResult.data as any[]).map(s => ({ provider: s.provider, url: s.url }));
    const profileReadme = readmeResult.data as unknown as string;

    const languagesMap: Record<string, number> = {};
    let totalStars = 0;
    let totalSize = 0;

    for (const repo of repos) {
      if (repo.language) {
        languagesMap[repo.language] = (languagesMap[repo.language] || 0) + 1;
      }
      totalStars += repo.stargazers_count || 0;
      totalSize += repo.size || 0;
    }

    // 5. Deep Analysis for top repositories (Limited to 8 for speed and quota)
    const enrichedRepos = await chunkedPromiseAll(repos.slice(0, 8), async (r) => {
      let collaborators: string[] = [];
      let repoLanguages: Record<string, number> = {};
      const frameworks: string[] = [];

      // Skip heavy calls if possible
      try {
        if (r.permissions?.push || r.permissions?.admin) {
          const { data: collabs } = await withRetry(() => octokit.rest.repos.listCollaborators({
            owner: r.owner.login,
            repo: r.name,
            per_page: 5 // Reduced from 10
          }));
          collaborators = collabs.map(c => c.login);
        }
      } catch (e) { }

      try {
        const { data: langs } = await withRetry(() => octokit.rest.repos.listLanguages({
          owner: r.owner.login,
          repo: r.name
        }));
        repoLanguages = langs;
      } catch (e) { }

      // Optimized framework detection
      if ((r.size || 0) > 0) {
        try {
          const { data: contents } = await withRetry(() => octokit.rest.repos.getContent({
            owner: r.owner.login,
            repo: r.name,
            path: ""
          }));

          if (Array.isArray(contents)) {
            const filenames = contents.map(f => f.name);
            if (filenames.includes('package.json')) frameworks.push('Node.js');
            if (filenames.includes('next.config.js') || filenames.includes('next.config.mjs')) frameworks.push('Next.js');
            if (filenames.includes('tailwind.config.js')) frameworks.push('TailwindCSS');
            if (filenames.includes('tsconfig.json')) frameworks.push('TypeScript');
            if (filenames.includes('go.mod')) frameworks.push('Go');
            if (filenames.includes('Cargo.toml')) frameworks.push('Rust');
            if (filenames.includes('docker-compose.yml') || filenames.includes('Dockerfile')) frameworks.push('Docker');

            // Only fetch package.json for top 5 repos to save calls
            if (filenames.includes('package.json') && repos.indexOf(r) < 5) {
              try {
                const { data: pkgData } = await withRetry(() => octokit.rest.repos.getContent({
                  owner: r.owner.login,
                  repo: r.name,
                  path: "package.json",
                  headers: { accept: "application/vnd.github.raw+json" }
                }));
                const pkg = JSON.parse(pkgData as unknown as string);
                const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
                const majorLibs = ['react', 'vue', 'angular', 'svelte', 'express', 'prisma', 'supabase', 'graphql'];
                majorLibs.forEach(lib => {
                  if (allDeps[lib] || Object.keys(allDeps).some(k => k.includes(lib))) {
                    frameworks.push(lib.charAt(0).toUpperCase() + lib.slice(1));
                  }
                });
              } catch { }
            }
          }
        } catch { }
      }

      return {
        name: r.name,
        description: r.description || "",
        language: r.language || "Unknown",
        stars: r.stargazers_count || 0,
        url: r.html_url,
        topics: r.topics || [],
        isPrivate: r.private,
        updatedAt: r.updated_at || null,
        size: r.size || 0,
        owner: r.owner.login,
        collaborators,
        repoLanguages,
        frameworks: Array.from(new Set(frameworks))
      };
    }, 4);

    const topLanguages = Object.entries(languagesMap)
      .sort(([, a], [, b]) => b - a)
      .map(([lang]) => lang);

    const repoSummaries = await analyzeAllRepos(enrichedRepos);

    const result = {
      username: user.login,
      name: user.name || "",
      bio: user.bio || "",
      blog: user.blog || "",
      company: user.company || "",
      location: user.location || "",
      email: user.email || "",
      hireable: user.hireable || false,
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      totalRepos: repos.length,
      topLanguages,
      totalStars,
      totalSize,
      organizations,
      socialAccounts,
      profileReadme,
      repoSummaries,
      repos: enrichedRepos.concat(repos.slice(enrichedRepos.length, 25).map(r => ({
        name: r.name,
        description: r.description || "",
        language: r.language || "Unknown",
        stars: r.stargazers_count || 0,
        url: r.html_url,
        topics: r.topics || [],
        isPrivate: r.private,
        updatedAt: r.updated_at || null,
        size: r.size || 0,
        owner: r.owner.login,
        collaborators: [],
        repoLanguages: {},
        frameworks: []
      })))
    };

    // Store in Cache
    GITHUB_CACHE.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;

  } catch (error: any) {
    console.error(`GitHub API Error for ${username}:`, error.message, error.status);
    if (error.status === 404) {
      throw new Error(`GitHub user "${username}" not found.`);
    }
    throw new Error(`GitHub API error: ${error.message}`);
  }
}
