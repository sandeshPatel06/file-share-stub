import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { setPasswordSchema } from "@/lib/validators";
import { verifyPageToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/rateLimiter";
import { FieldValue } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// PATCH /api/pages/[slug]/password — set or remove password
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const limited = await rateLimit(req, "general");
  if (limited) return limited;

  const { slug } = await ctx.params;

  const pageDoc = await adminDb.collection("pages").doc(slug).get();
  if (!pageDoc.exists) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }
  const pageData = pageDoc.data()!;

  // If currently protected, require valid token
  if (pageData.isProtected) {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyPageToken(token);
    if (payload?.slug !== slug) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = setPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation error" }, { status: 422 });
  }

  const { password } = parsed.data;

  if (password === null) {
    // Remove password
    await adminDb.collection("pages").doc(slug).update({
      isProtected:  false,
      passwordHash: null,
      updatedAt:    FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ isProtected: false });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await adminDb.collection("pages").doc(slug).update({
    isProtected:  true,
    passwordHash,
    updatedAt:    FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ isProtected: true });
}
