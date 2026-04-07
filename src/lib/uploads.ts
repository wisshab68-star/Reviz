import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

function resolveUploadRoot() {
  if (process.env.VERCEL) {
    return join("/tmp", "uploads");
  }

  return join(process.cwd(), "uploads");
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function saveUploadedFile(file: File) {
  const timestamp = Date.now();
  const safeName = sanitizeFileName(file.name || "upload.bin");
  const uploadRoot = resolveUploadRoot();
  const filename = `${timestamp}-${safeName}`;
  const absolutePath = join(uploadRoot, filename);
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadRoot, { recursive: true });
  await writeFile(absolutePath, bytes);

  return {
    absolutePath,
    relativePath: process.env.VERCEL ? absolutePath : join("uploads", filename),
    size: bytes.length,
  };
}
