import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminDb } from "@/lib/firebase-admin";
import { createPageSchema, slugSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rateLimiter";
import { FieldValue } from "firebase-admin/firestore";

// POST /api/pages/create
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "general");
  if (limited) return limited;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = createPageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation error" }, { status: 422 });
  }

  const { slug, password } = parsed.data;

  // Check slug uniqueness
  const existing = await adminDb.collection("pages").doc(slug).get();
  if (existing.exists) {
    return NextResponse.json({ error: "This slug is already taken" }, { status: 409 });
  }

  const passwordHash = password
    ? await bcrypt.hash(password, 12)
    : null;

  await adminDb.collection("pages").doc(slug).set({
    slug,
    content:     "",
    isProtected: !!password,
    passwordHash,
    createdAt:   FieldValue.serverTimestamp(),
    updatedAt:   FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ slug }, { status: 201 });
}

// GET /api/pages/create?slug=xyz  — check availability
export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, "general");
  if (limited) return limited;

  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) {
    return NextResponse.json({ available: false, error: parsed.error.issues[0]?.message ?? "Validation error" });
  }

  const doc = await adminDb.collection("pages").doc(slug).get();
  return NextResponse.json({ available: !doc.exists });
}
