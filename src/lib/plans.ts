import { Plan } from "@prisma/client";

export const FREE_MONTHLY_SHEET_LIMIT = 5;

export function getPlanLabel(plan: Plan | undefined) {
  return plan === "PREMIUM" ? "Premium" : "Gratuit";
}

export function hasUnlimitedSheets(plan: Plan | undefined) {
  return plan === "PREMIUM";
}
