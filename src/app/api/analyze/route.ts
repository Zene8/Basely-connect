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
    // @ts-expect-error extending session type
    const token = session?.accessToken;

    const profile = await getGitHubProfile(username, token);

    return NextResponse.json({
      name: profile.name,
      bio: profile.bio,
      location: profile.location,
      languages: profile.topLanguages,
      organizations: profile.organizations,
      socials: profile.socialAccounts,
      frameworks: [], 
      skills: [], 
      totalRepos: profile.totalRepos,
      totalContributions: profile.totalSize, 
      topRepoStars: profile.totalStars,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
