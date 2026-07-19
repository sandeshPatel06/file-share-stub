import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rateLimiter";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// GET /api/pages/[slug] — fetch page metadata (strips passwordHash)
export async function GET(req: NextRequest, ctx: RouteContext) {
  const limited = await rateLimit(req, "general");
  if (limited) return limited;

  const { slug } = await ctx.params;
  const doc = await adminDb.collection("pages").doc(slug).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const data = doc.data()!;

  // NEVER expose passwordHash to the client
  const { passwordHash: _omit, ...safeData } = data;

  return NextResponse.json(safeData);
}
