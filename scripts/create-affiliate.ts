import { createAffiliateCode } from "../src/lib/stripe/affiliate-service";

async function main() {
  const affiliate = await createAffiliateCode("Celia", "cel1a.mh");
  console.log("\n✅ Affiliée créée :");
  console.log("  Nom   :", affiliate.name);
  console.log("  Email :", affiliate.email);
  console.log("  Code  :", affiliate.code);
  console.log("  Lien  :", `https://revizai.app?ref=${affiliate.code}`);
  console.log("  Dashboard :", `https://revizai.app/affiliate/${affiliate.code}`);
}

main().catch(console.error).finally(() => process.exit(0));
