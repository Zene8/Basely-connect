import { Octokit } from "octokit";

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

    // 3. Get repositories
    // Note: 'all' type is only valid for authenticated user. 
    // For other users, we use 'owner'.
    const repoType = (accessToken && user.login.toLowerCase() === username.toLowerCase()) ? "all" : "owner";

    const { data: repos } = await octokit.rest.repos.listForUser({
      username,
      sort: "updated",
      per_page: 100,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: repoType as any
    });

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

    const topLanguages = Object.entries(languagesMap)
      .sort(([, a], [, b]) => b - a)
      .map(([lang]) => lang);

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
      repos: repos.slice(0, 15).map(r => ({
        name: r.name,
        description: r.description || "",
        language: r.language || "Unknown",
        stars: r.stargazers_count || 0,
        url: r.html_url,
        topics: r.topics || []
      }))
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
