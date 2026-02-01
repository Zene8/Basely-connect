import { Octokit } from "octokit";
import { analyzeAllRepos } from "./repo-analyzer";

export async function getGitHubProfile(username: string, accessToken?: string) {
  if (!username) {
    throw new Error("GitHub username is required");
  }

  const octokit = new Octokit({
    auth: accessToken || process.env.GITHUB_TOKEN
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let user: any = null;

    // 1. Try to get authenticated user if token exists
    if (accessToken) {
      try {
        const { data: authUser } = await octokit.rest.users.getAuthenticated();
        if (authUser.login.toLowerCase() === username.toLowerCase()) {
          user = authUser;
        }
      } catch (e) {
        console.warn("Token validation failed, falling back to public request", e);
      }
    }

    // 2. Fallback to public user info
    if (!user) {
      const { data: publicUser } = await octokit.rest.users.getByUsername({ username });
      user = publicUser;
    }

    if (!user) {
      throw new Error(`User ${username} not found on GitHub`);
    }

    // 3. Get repositories (Deep Fetch)
    // Note: 'all' type is only valid for authenticated user. 
    // For other users, we use 'owner'.
    const repoType = (accessToken && user.login.toLowerCase() === username.toLowerCase()) ? "all" : "owner";

    // Fetch up to 5 pages (500 repos max) to get a "deep" view
    let allRepos: any[] = [];
    if (repoType === "all") {
      // Authenticated user can use listForAuthenticatedUser to get private repos correctly
      for (let i = 1; i <= 5; i++) {
        const { data: pageRepos } = await octokit.rest.repos.listForAuthenticatedUser({
          sort: "pushed",
          per_page: 100,
          page: i,
          visibility: "all"
        });
        if (pageRepos.length === 0) break;
        allRepos = allRepos.concat(pageRepos);
      }
    } else {
      for (let i = 1; i <= 5; i++) {
        const { data: pageRepos } = await octokit.rest.repos.listForUser({
          username,
          sort: "pushed",
          per_page: 100,
          page: i,
          type: "owner"
        });
        if (pageRepos.length === 0) break;
        allRepos = allRepos.concat(pageRepos);
      }
    }

    const repos = allRepos;

    // 4. Get Organizations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let organizations: any[] = [];
    try {
      const { data: orgs } = await octokit.rest.orgs.listForUser({ username });
      organizations = orgs.map(o => ({ login: o.login, description: o.description }));
    } catch {
      console.warn("Failed to fetch organizations");
    }

    // 5. Get Social Accounts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let socialAccounts: any[] = [];
    try {
      const { data: socials } = await octokit.rest.users.listSocialAccountsForUser({ username });
      socialAccounts = socials.map(s => ({ provider: s.provider, url: s.url }));
    } catch {
      console.warn("Failed to fetch social accounts");
    }

    // 6. Try to get Profile README
    let profileReadme = "";
    try {
      const { data: readmeContent } = await octokit.rest.repos.getReadme({
        owner: username,
        repo: username,
        headers: {
          accept: "application/vnd.github.raw+json",
        },
      });
      profileReadme = readmeContent as unknown as string;
    } catch {
      // Profile README might not exist, ignore
    }

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

    // 7. Fetch Collaborators, Languages, and Frameworks for top 25 repos
    const enrichedRepos = await Promise.all(repos.slice(0, 25).map(async (r) => {
      let collaborators: string[] = [];
      let repoLanguages: Record<string, number> = {};
      let frameworks: string[] = [];

      try {
        // Only fetch collaborators if user is owner/admin
        if (r.permissions?.push || r.permissions?.admin) {
          const { data: collabs } = await octokit.rest.repos.listCollaborators({
            owner: r.owner.login,
            repo: r.name,
            per_page: 10
          });
          collaborators = collabs.map(c => c.login);
        }
      } catch (e) {
        // Might fail if token doesn't have enough scope or other reasons
        console.warn(`Failed to fetch collaborators for ${r.name}`);
      }

      try {
        const { data: langs } = await octokit.rest.repos.listLanguages({
          owner: r.owner.login,
          repo: r.name
        });
        repoLanguages = langs;
      } catch (e) {
        console.warn(`Failed to fetch languages for ${r.name}`);
      }

      // Try to detect frameworks/libraries by checking key files
      // If a repo is empty or otherwise inaccessible, we skip content-based detection
      if (r.size > 0) {
        try {
          const { data: contents } = await octokit.rest.repos.getContent({
            owner: r.owner.login,
            repo: r.name,
            path: ""
          });

          if (Array.isArray(contents)) {
            const filenames = contents.map(f => f.name);
            
            // Basic framework detection by filename
            if (filenames.includes('package.json')) frameworks.push('Node.js');
            if (filenames.includes('next.config.js') || filenames.includes('next.config.mjs')) frameworks.push('Next.js');
            if (filenames.includes('tailwind.config.js')) frameworks.push('TailwindCSS');
            if (filenames.includes('tsconfig.json')) frameworks.push('TypeScript');
            if (filenames.includes('requirements.txt') || filenames.includes('pyproject.toml')) frameworks.push('Python');
            if (filenames.includes('Gemfile')) frameworks.push('Ruby');
            if (filenames.includes('go.mod')) frameworks.push('Go');
            if (filenames.includes('Cargo.toml')) frameworks.push('Rust');
            if (filenames.includes('docker-compose.yml') || filenames.includes('Dockerfile')) frameworks.push('Docker');
            
            // Deep scan package.json if it exists
            if (filenames.includes('package.json')) {
              try {
                const { data: pkgData } = await octokit.rest.repos.getContent({
                  owner: r.owner.login,
                  repo: r.name,
                  path: "package.json",
                  headers: { accept: "application/vnd.github.raw+json" }
                });
                
                const pkg = JSON.parse(pkgData as unknown as string);
                const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
                
                const majorLibs = [
                  'react', 'vue', 'angular', 'svelte', 'express', 'prisma', 'sequelize', 
                  'mongoose', 'redux', 'mobx', 'jest', 'cypress', 'vite', 'webpack', 
                  'firebase', 'supabase', 'trpc', 'query', 'graphql', 'apollo'
                ];
                
                majorLibs.forEach(lib => {
                  if (allDeps[lib] || Object.keys(allDeps).some(k => k.includes(lib))) {
                    frameworks.push(lib.charAt(0).toUpperCase() + lib.slice(1));
                  }
                });
              } catch (e) {
                // package.json might be missing or invalid
              }
            }
          }
        } catch (e) {
          // Silent fail for content fetch - assume empty or inaccessible
        }
      }

      return {
        name: r.name,
        description: r.description || "",
        language: r.language || "Unknown",
        stars: r.stargazers_count || 0,
        url: r.html_url,
        topics: r.topics || [],
        isPrivate: r.private,
        updatedAt: r.updated_at,
        size: r.size,
        owner: r.owner.login,
        collaborators,
        repoLanguages,
        frameworks: Array.from(new Set(frameworks)) // unique values
      };
    }));

    const topLanguages = Object.entries(languagesMap)
      .sort(([, a], [, b]) => b - a)
      .map(([lang]) => lang);

    // 8. Analyze and Summarize Repositories
    const repoSummaries = await analyzeAllRepos(enrichedRepos);

    return {
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
      deepTechStack: [],
      repos: enrichedRepos.concat(repos.slice(25, 40).map(r => ({
        name: r.name,
        description: r.description || "",
        language: r.language || "Unknown",
        stars: r.stargazers_count || 0,
        url: r.html_url,
        topics: r.topics || [],
        isPrivate: r.private,
        updatedAt: r.updated_at,
        size: r.size,
        owner: r.owner.login,
        collaborators: [],
        repoLanguages: {},
        frameworks: []
      })))
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`GitHub API Error for ${username}:`, error.message, error.status);
    if (error.status === 404) {
      throw new Error(`GitHub user "${username}" not found.`);
    }
    throw new Error(`GitHub API error: ${error.message}`);
  }
}
