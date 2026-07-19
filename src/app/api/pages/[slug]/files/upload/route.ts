import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { uploadRequestSchema } from "@/lib/validators";
import { verifyPageToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/rateLimiter";
import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

async function isAuthorized(req: NextRequest, slug: string, isProtected: boolean) {
  if (!isProtected) return true;
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return false;
  const payload = await verifyPageToken(token);
  return payload?.slug === slug;
}

// POST /api/pages/[slug]/files/upload — validate + register file metadata + generate signed URL
export async function POST(req: NextRequest, ctx: RouteContext) {
  const limited = await rateLimit(req, "general");
  if (limited) return limited;

  const { slug } = await ctx.params;

  const pageDoc = await adminDb.collection("pages").doc(slug).get();
  if (!pageDoc.exists) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }
  const pageData = pageDoc.data()!;

  if (!(await isAuthorized(req, slug, pageData.isProtected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = uploadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation error" }, { status: 422 });
  }

  const { filename, mimetype, size } = parsed.data;
  const fileId      = randomUUID();
  const extension   = filename.split(".").pop() ?? "bin";
  const storagePath = `pages/${slug}/files/${fileId}.${extension}`;

  // Generate a resumable upload signed URL (15 min expiry)
  const bucket = adminStorage.bucket();
  const file   = bucket.file(storagePath);

  const [signedUrl] = await file.getSignedUrl({
    version: "v4",
    action:  "write",
    expires: Date.now() + 15 * 60 * 1000,
    contentType: mimetype,
  });

  // Get download URL (will be valid after upload completes)
  const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

  // Write file metadata to Firestore
  await adminDb
    .collection("pages").doc(slug)
    .collection("files").doc(fileId)
    .set({
      fileId,
      originalName: filename,
      storagePath,
      downloadURL,
      mimetype,
      size,
      uploadedAt: FieldValue.serverTimestamp(),
    });

  return NextResponse.json({ fileId, signedUrl, downloadURL }, { status: 201 });
}
