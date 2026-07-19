import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminDb } from "@/lib/firebase-admin";
import { verifyPasswordSchema } from "@/lib/validators";
import { signPageToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/rateLimiter";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// POST /api/pages/[slug]/verify — compare password, return JWT
export async function POST(req: NextRequest, ctx: RouteContext) {
  // Strict rate limiting — 5 attempts per 60s
  const limited = await rateLimit(req, "verify");
  if (limited) return limited;

  const { slug } = await ctx.params;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = verifyPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation error" }, { status: 422 });
  }

  const doc = await adminDb.collection("pages").doc(slug).get();
  if (!doc.exists) {
    // Generic error — don't reveal if slug exists
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const data = doc.data()!;
  if (!data.isProtected || !data.passwordHash) {
    return NextResponse.json({ error: "Page is not protected" }, { status: 400 });
  }

  const match = await bcrypt.compare(parsed.data.password, data.passwordHash);
  if (!match) {
    // Add 200ms delay to slow brute force even if rate limiter is bypassed
    await new Promise((r) => setTimeout(r, 200));
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await signPageToken(slug);
  return NextResponse.json({ token }, { status: 200 });
}
