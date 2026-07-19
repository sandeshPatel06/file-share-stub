import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { updateContentSchema } from "@/lib/validators";
import { verifyPageToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/rateLimiter";
import { FieldValue } from "firebase-admin/firestore";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

async function isAuthorized(req: NextRequest, slug: string): Promise<boolean> {
  const doc = await adminDb.collection("pages").doc(slug).get();
  if (!doc.exists) return false;

  const data = doc.data()!;
  if (!data.isProtected) return true;

  // Check Authorization header
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return false;

  const payload = await verifyPageToken(token);
  return payload?.slug === slug;
}

// PATCH /api/pages/[slug]/content — update editor text
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const limited = await rateLimit(req, "general");
  if (limited) return limited;

  const { slug } = await ctx.params;

  if (!(await isAuthorized(req, slug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = updateContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation error" }, { status: 422 });
  }

  await adminDb.collection("pages").doc(slug).update({
    content:   parsed.data.content,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
