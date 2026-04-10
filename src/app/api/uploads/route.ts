import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getUploadFallbackMessage, isDatabaseConnectionError } from "@/lib/database-fallback";
import { db } from "@/lib/db";
import { saveUploadedFile } from "@/lib/uploads";
import { extractTextFromFile } from "@/services/extract-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    let session = null;

    try {
      session = await auth();
    } catch (error) {
      if (!isDatabaseConnectionError(error)) {
        throw error;
      }

      console.error("Auth lookup failed during upload, continuing as guest.", error);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const userId = formData.get("userId");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier n'a ete envoye." },
        { status: 400 },
      );
    }

    const savedFile = await saveUploadedFile(file);
    const extracted = await extractTextFromFile(file);
    let warning: string | undefined;
    let document: {
      id: string | null;
      type: "TEXT" | "PDF" | "IMAGE";
      filename: string | null;
      extractedText: string | null;
    };

    try {
      const persistedDocument = await db.document.create({
        data: {
          userId:
            session?.user?.id ??
            (typeof userId === "string" && userId ? userId : undefined),
          type: extracted.sourceType,
          filename: file.name,
          mimeType: extracted.mimeType,
          storagePath: savedFile.relativePath,
          rawText: extracted.extractedText,
          extractedText: extracted.extractedText,
          processingStatus: "COMPLETED",
        },
        select: {
          id: true,
          type: true,
          filename: true,
          extractedText: true,
        },
      });

      document = {
        id: persistedDocument.id,
        type: extracted.sourceType,
        filename: persistedDocument.filename,
        extractedText: persistedDocument.extractedText,
      };
    } catch (error) {
      if (!isDatabaseConnectionError(error)) {
        throw error;
      }

      console.error("Document persistence failed, returning extracted text only.", error);
      warning = getUploadFallbackMessage();
      document = {
        id: null,
        type: extracted.sourceType,
        filename: file.name,
        extractedText: extracted.extractedText,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        documentId: document.id,
        sourceType: document.type,
        filename: document.filename,
        extractedText: document.extractedText,
      },
      warning,
    });
  } catch (error) {
    console.error("POST /api/uploads failed", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 400 },
    );
  }
}
