import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { renameSlugSchema } from "@/lib/validators";
import { verifyPageToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/rateLimiter";
import { FieldValue } from "firebase-admin/firestore";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// PATCH /api/pages/[slug]/rename
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const limited = await rateLimit(req, "general");
  if (limited) return limited;

  const { slug } = await ctx.params;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = renameSlugSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation error" }, { status: 422 });
  }
  const { newSlug } = parsed.data;

  // Fetch old page
  const oldDoc = await adminDb.collection("pages").doc(slug).get();
  if (!oldDoc.exists) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }
  const oldData = oldDoc.data()!;

  // Auth check for protected pages
  if (oldData.isProtected) {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyPageToken(token);
    if (payload?.slug !== slug) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check new slug is available
  const newDoc = await adminDb.collection("pages").doc(newSlug).get();
  if (newDoc.exists) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  const batch = adminDb.batch();

  // Create new page document with updated slug
  const newPageRef = adminDb.collection("pages").doc(newSlug);
  batch.set(newPageRef, {
    ...oldData,
    slug:      newSlug,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Migrate all files — update their storagePath references conceptually only
  // (Storage paths don't need to change — download URLs remain valid)
  const filesSnap = await adminDb
    .collection("pages").doc(slug)
    .collection("files")
    .get();

  filesSnap.forEach((fileDoc) => {
    batch.set(
      adminDb.collection("pages").doc(newSlug).collection("files").doc(fileDoc.id),
      fileDoc.data()
    );
    batch.delete(fileDoc.ref);
  });

  // Delete old page document
  batch.delete(adminDb.collection("pages").doc(slug));

  await batch.commit();

  return NextResponse.json({ newSlug });
}
