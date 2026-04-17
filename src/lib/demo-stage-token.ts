import { createHash, createHmac, timingSafeEqual } from "node:crypto";

type DemoStageClaims = {
  payloadHash: string;
  clientIp: string;
  issuedAt: number;
};

const MAX_TOKEN_AGE_MS = 10 * 60 * 1000;

function getDemoStageSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required to sign demo stage tokens.");
  }

  return secret;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(encodedPayload: string) {
  return createHmac("sha256", getDemoStageSecret()).update(encodedPayload).digest("base64url");
}

export function hashDemoStagePayload(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function createDemoStageToken(claims: DemoStageClaims) {
  const encodedPayload = toBase64Url(JSON.stringify(claims));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyDemoStageToken(
  token: string,
  expected: { payloadHash: string; clientIp: string },
) {
  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return false;
  }

  const expectedSignature = sign(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");

  if (
    expectedBuffer.length !== providedBuffer.length
    || !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return false;
  }

  const claims = JSON.parse(fromBase64Url(encodedPayload)) as DemoStageClaims;
  const now = Date.now();

  if (now - claims.issuedAt > MAX_TOKEN_AGE_MS) {
    return false;
  }

  return claims.payloadHash === expected.payloadHash && claims.clientIp === expected.clientIp;
}
