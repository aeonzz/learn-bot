import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { auth } from "@learn-bot/auth";
import { extractText } from "unpdf";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), "public/uploads");
    await mkdir(uploadDir, { recursive: true });

    const results = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Simple unique filename
      const uniqueName = `${Date.now()}-${file.name.replace(/ /g, "_")}`;
      const path = join(uploadDir, uniqueName);

      await writeFile(path, buffer);

      let content = "";
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        try {
          const { text } = await extractText(new Uint8Array(buffer));
          content = Array.isArray(text) ? text.join("\n") : text;
        } catch (err) {
          console.error(`Failed to extract text from ${file.name}:`, err);
        }
      }

      results.push({
        name: file.name,
        url: `/api/files/${uniqueName}`,
        content: content,
      });
    }

    return NextResponse.json({ files: results });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
