/**
 * Detects Prisma/database connection errors so callers can degrade gracefully
 * instead of throwing a 500 when the DB is unreachable.
 */
export function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = (error as { message?: string }).message ?? "";
  const code = (error as { code?: string }).code ?? "";

  // Prisma connection / tenant errors
  if (
    message.includes("Tenant or user not found") ||
    message.includes("Can't reach database server") ||
    message.includes("Connection refused") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    code === "P1001" || // Prisma: can't reach server
    code === "P1002" || // Prisma: timed out
    code === "P1008" || // Prisma: operations timed out
    code === "P1017"    // Prisma: server closed connection
  ) {
    return true;
  }

  return false;
}
