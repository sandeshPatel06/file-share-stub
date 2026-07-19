import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { verifyPageToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/rateLimiter";

interface RouteContext {
  params: Promise<{ slug: string; id: string }>;
}

// DELETE /api/pages/[slug]/files/[id]
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const limited = await rateLimit(req, "general");
  if (limited) return limited;

  const { slug, id } = await ctx.params;

  const pageDoc = await adminDb.collection("pages").doc(slug).get();
  if (!pageDoc.exists) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }
  const pageData = pageDoc.data()!;

  // Auth check for protected pages
  if (pageData.isProtected) {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyPageToken(token);
    if (payload?.slug !== slug) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fileRef = adminDb.collection("pages").doc(slug).collection("files").doc(id);
  const fileDoc = await fileRef.get();
  if (!fileDoc.exists) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const { storagePath } = fileDoc.data()!;

  // Delete from Firebase Storage
  try {
    await adminStorage.bucket().file(storagePath).delete();
  } catch {
    // File might not have been uploaded yet — continue with metadata delete
  }

  // Delete Firestore metadata
  await fileRef.delete();

  return NextResponse.json({ ok: true });
}
