import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [sheetsTodayCount, usersToday, totalUsers, totalSheets, last7days, recentSheets] = await Promise.all([
    // Fiches générées aujourd'hui
    prisma.studySheet.count({ where: { createdAt: { gte: today } } }),

    // Utilisateurs uniques aujourd'hui
    prisma.studySheet.findMany({
      where: { createdAt: { gte: today } },
      select: { userId: true },
      distinct: ["userId"],
    }),

    // Total utilisateurs inscrits
    prisma.user.count(),

    // Total fiches all time
    prisma.studySheet.count(),

    // Fiches par jour sur 7 jours
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT DATE_TRUNC('day', "createdAt") as day, COUNT(*) as count
      FROM "StudySheet"
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day DESC
    `,

    // 10 dernières fiches
    prisma.studySheet.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { title: true, createdAt: true, userId: true, sourceType: true },
    }),
  ]);

  console.log("\n═══════════════════════════════════════════════");
  console.log("      STATS REVIZ — " + new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }));
  console.log("═══════════════════════════════════════════════\n");

  console.log("📅  AUJOURD'HUI");
  console.log(`   Fiches générées  : ${sheetsTodayCount}`);
  console.log(`   Utilisateurs actifs : ${usersToday.length}`);

  console.log("\n📊  ALL TIME");
  console.log(`   Utilisateurs inscrits : ${totalUsers}`);
  console.log(`   Fiches générées total : ${totalSheets}`);

  console.log("\n📈  7 DERNIERS JOURS");
  for (const row of last7days) {
    const d = new Date(row.day).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
    const n = Number(row.count);
    const bar = "█".repeat(Math.min(n, 20));
    console.log(`   ${d.padEnd(14)} ${bar.padEnd(20)} ${n}`);
  }

  console.log("\n🕐  10 DERNIÈRES FICHES");
  for (const s of recentSheets) {
    const time = new Date(s.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const date = new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    console.log(`   [${date} ${time}] ${s.title.slice(0, 45).padEnd(45)} (${s.sourceType})`);
  }

  console.log("\n═══════════════════════════════════════════════\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
