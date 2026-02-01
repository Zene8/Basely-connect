import { NextResponse } from "next/server";
import { parseResume } from "@/lib/parse-resume";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const text = await parseResume(buffer, file.type);

        return NextResponse.json({ text });
    } catch (error) {
        console.error("Ingest Error:", error);
        const message = error instanceof Error ? error.message : 'Unknown Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
