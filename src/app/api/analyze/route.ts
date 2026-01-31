import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGitHubProfile } from "@/lib/github";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Use access token from session if available
    // @ts-ignore
    const token = session?.accessToken;

    const profile = await getGitHubProfile(username, token);

    return NextResponse.json({
      languages: profile.topLanguages,
      frameworks: [], // This would require deeper repo analysis (package.json parsing)
      skills: [], // Mapped from languages/bio
      totalRepos: profile.totalRepos,
      totalContributions: profile.totalSize, // Using size as proxy for now
      topRepoStars: profile.totalStars,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
