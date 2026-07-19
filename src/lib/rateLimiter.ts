import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextRequest, NextResponse } from "next/server";

// Strict limiter for password verify — 5 attempts per 60s per IP
const verifyLimiter = new RateLimiterMemory({
  points:   5,
  duration: 60,
});

// General API limiter — 60 req per 60s per IP
const generalLimiter = new RateLimiterMemory({
  points:   60,
  duration: 60,
});

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function rateLimit(
  req: NextRequest,
  type: "verify" | "general" = "general"
): Promise<NextResponse | null> {
  const ip      = getIp(req);
  const limiter = type === "verify" ? verifyLimiter : generalLimiter;

  try {
    await limiter.consume(ip);
    return null; // allowed
  } catch {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
}
