import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  // Total users (excluding me)
  const myEmail = "madrid-192010@hotmail.fr";
  const me = await db.user.findUnique({ where: { email: myEmail }, select: { id: true } });
  const myId = me?.id ?? "";

  const allUsers = await db.user.findMany({
    where: { id: { not: myId } },
    select: { id: true, email: true, createdAt: true },
  });

  console.log(`\n=== USERS (excluding ${myEmail}) ===`);
  console.log(`Total users: ${allUsers.length}\n`);

  // Sheet stats grouped by status
  const sheets = await db.studySheet.findMany({
    where: { userId: { not: myId } },
    select: {
      id: true,
      userId: true,
      status: true,
      title: true,
      createdAt: true,
      
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`=== SHEETS (all users except me) ===`);
  console.log(`Total sheets: ${sheets.length}`);
  const byStatus: Record<string, number> = {};
  sheets.forEach(s => { byStatus[s.status] = (byStatus[s.status] ?? 0) + 1; });
  console.log(`By status:`, byStatus);

  // Per-user success rate
  const userStats = new Map<string, { email: string; completed: number; failed: number; processing: number; titles: string[] }>();
  for (const sheet of sheets) {
    const user = allUsers.find(u => u.id === sheet.userId);
    if (!user) continue;
    const key = user.id;
    if (!userStats.has(key)) {
      userStats.set(key, { email: user.email ?? "unknown", completed: 0, failed: 0, processing: 0, titles: [] });
    }
    const s = userStats.get(key)!;
    if (sheet.status === "COMPLETED") s.completed++;
    else if (sheet.status === "FAILED") s.failed++;
    else s.processing++;
    if (sheet.title) s.titles.push(`${sheet.title} [${sheet.status}]`);
  }

  console.log(`\n=== PER-USER BREAKDOWN ===`);
  for (const [uid, s] of userStats) {
    const total = s.completed + s.failed + s.processing;
    console.log(`\n${s.email} (total: ${total})`);
    console.log(`  ✓ completed: ${s.completed} | ✗ failed: ${s.failed} | ⏳ processing: ${s.processing}`);
    s.titles.slice(0, 10).forEach(t => console.log(`    - ${t}`));
    if (s.titles.length > 10) console.log(`    ... and ${s.titles.length - 10} more`);
  }

  // Recent errors
  console.log(`\n=== RECENT FAILURES (last 20) ===`);
  const failures = sheets.filter(s => s.status === "FAILED").slice(0, 20);
  for (const f of failures) {
    const user = allUsers.find(u => u.id === f.userId);
    console.log(`[${f.createdAt.toISOString().slice(0, 16)}] ${user?.email?.slice(0, 25) ?? "?"} | ${f.title?.slice(0, 50) ?? "no title"}`);
  }

  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
