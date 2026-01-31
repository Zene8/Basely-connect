import { Octokit } from "octokit";

export async function getGitHubProfile(username: string, accessToken?: string) {
  const octokit = new Octokit({ 
    auth: accessToken || process.env.GITHUB_TOKEN 
  });

  try {
    let user;
    if (accessToken) {
       const { data: authUser } = await octokit.rest.users.getAuthenticated();
       if (authUser.login.toLowerCase() === username.toLowerCase()) {
         user = authUser;
       }
    }
    
    if (!user) {
       const { data: publicUser } = await octokit.rest.users.getByUsername({ username });
       user = publicUser;
    }

    // Fixed type assignment for GitHub API
    const { data: repos } = await octokit.rest.repos.listForUser({
      username,
      sort: "updated",
      per_page: 100,
      type: accessToken ? "all" : "owner" 
    });

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
      bio: user.bio,
      location: user.location,
      publicRepos: user.public_repos,
      totalRepos: repos.length,
      topLanguages,
      totalStars,
      totalSize,
      repos: repos.slice(0, 10).map(r => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        url: r.html_url
      }))
    };
  } catch (error) {
    console.error("GitHub API Error:", error);
    throw new Error("User not found or GitHub API error");
  }
}
