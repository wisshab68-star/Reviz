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

  // Prisma connection / tenant / schema drift errors
  if (
    message.includes("Tenant or user not found") ||
    message.includes("Can't reach database server") ||
    message.includes("Connection refused") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("does not exist in the current database") ||
    message.includes("The table `public.") ||
    message.includes("relation") && message.includes("does not exist") ||
    code === "P1001" || // Prisma: can't reach server
    code === "P1002" || // Prisma: timed out
    code === "P1008" || // Prisma: operations timed out
    code === "P1017" || // Prisma: server closed connection
    code === "P2021"    // Prisma: table/view does not exist
  ) {
    return true;
  }

  return false;
}

export function getPersistenceFallbackMessage(): string {
  return "La fiche a bien ete generee, mais l'enregistrement est temporairement indisponible.";
}

export function getUploadFallbackMessage(): string {
  return "Le fichier a bien ete analyse, mais son enregistrement est temporairement indisponible.";
}
