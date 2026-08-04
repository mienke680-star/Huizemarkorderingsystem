import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireSession } from "@/lib/api-helpers";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE = 15 * 1024 * 1024; // 15MB

export async function POST(req: Request) {
  const { response } = await requireSession();
  if (response) return response;

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File exceeds 15MB limit" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storedName = `${randomUUID()}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), bytes);

  return NextResponse.json({ url: `/uploads/${storedName}`, name: file.name });
}
