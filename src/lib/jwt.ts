import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);

export interface PageSessionPayload {
  slug: string;
  iat?: number;
  exp?: number;
}

/** Issue a 24-hour JWT scoped to a specific page slug */
export async function signPageToken(slug: string): Promise<string> {
  return new SignJWT({ slug })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

/** Verify a page token — returns payload or null if invalid/expired */
export async function verifyPageToken(
  token: string
): Promise<PageSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as PageSessionPayload;
  } catch {
    return null;
  }
}
