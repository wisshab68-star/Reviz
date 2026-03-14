import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const uploadRoot = join(process.cwd(), "uploads");

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function saveUploadedFile(file: File) {
  const timestamp = Date.now();
  const safeName = sanitizeFileName(file.name || "upload.bin");
  const relativePath = join("uploads", `${timestamp}-${safeName}`);
  const absolutePath = join(process.cwd(), relativePath);
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadRoot, { recursive: true });
  await writeFile(absolutePath, bytes);

  return {
    absolutePath,
    relativePath,
    size: bytes.length,
  };
}
