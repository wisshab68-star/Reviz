import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const sunday   = new Date("2026-04-19T00:00:00.000+02:00");
  const monday   = new Date("2026-04-20T00:00:00.000+02:00");
  const tuesday  = new Date("2026-04-21T00:00:00.000+02:00");

  const [fichesSunday, fichesMonday] = await Promise.all([
    prisma.studySheet.findMany({
      where: { createdAt: { gte: sunday, lt: monday } },
      select: { title: true, createdAt: true, sourceType: true, userId: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.studySheet.findMany({
      where: { createdAt: { gte: monday, lt: tuesday } },
      select: { title: true, createdAt: true, sourceType: true, userId: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const fmt = (f: { title: string; createdAt: Date; sourceType: string }) => {
    const t = new Date(f.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
    return `   [${t}] ${f.title.slice(0, 50).padEnd(50)} (${f.sourceType})`;
  };

  console.log(`\n📅 LUNDI 20 AVRIL`);
  console.log(`   Fiches : ${fichesMonday.length} | Users : ${new Set(fichesMonday.map(f => f.userId)).size}`);
  fichesMonday.length ? fichesMonday.forEach(f => console.log(fmt(f))) : console.log("   Aucune fiche.");

  console.log(`\n📅 DIMANCHE 19 AVRIL`);
  console.log(`   Fiches : ${fichesSunday.length} | Users : ${new Set(fichesSunday.map(f => f.userId)).size}`);
  fichesSunday.forEach(f => console.log(fmt(f)));
  console.log();
}

main().catch(console.error).finally(() => prisma.$disconnect());
