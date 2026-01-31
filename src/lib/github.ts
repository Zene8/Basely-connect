import { Octokit } from "octokit";

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN // Optional for higher rate limits
});

export async function getGitHubProfile(username: string) {
  try {
    const { data: user } = await octokit.rest.users.getByUsername({ username });
    
    const { data: repos } = await octokit.rest.repos.listForUser({
      username,
      sort: "updated",
      per_page: 10,
    });

    // Fetch languages for top 5 repos to get a skill overview
    const languagesMap: Record<string, number> = {};
    
    for (const repo of repos.slice(0, 5)) {
      if (repo.language) {
        languagesMap[repo.language] = (languagesMap[repo.language] || 0) + 1;
      }
      // Note: For a real app, we'd fetch languages URL for each repo for detail
    }
    
    const topLanguages = Object.entries(languagesMap)
      .sort(([, a], [, b]) => b - a)
      .map(([lang]) => lang);

    return {
      username: user.login,
      bio: user.bio,
      location: user.location,
      publicRepos: user.public_repos,
      topLanguages,
      repos: repos.map(r => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count
      }))
    };
  } catch (error) {
    console.error("GitHub API Error:", error);
    throw new Error("User not found or GitHub API error");
  }
}
