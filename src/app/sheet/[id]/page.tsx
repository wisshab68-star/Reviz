import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { AppTopbar } from "@/components/app-topbar";
import { SheetView } from "@/components/sheet-view";
import { db } from "@/lib/db";
import { readKeyPointsPayload } from "@/lib/fiche-storage";
import type { FicheGeneree } from "@/types/fiche-generated";
import type {
  ContentBlock,
  Definition,
  Flashcard,
  KeyMetric,
  QuizQuestion,
} from "@/types/sheet";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SheetPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;
  const sheet = session?.user?.id
    ? await db.studySheet.findFirst({
        where: { id, userId: session.user.id },
      })
    : await db.studySheet.findUnique({
        where: { id },
      });

  if (!sheet) {
    notFound();
  }

  const enrichedSheet = sheet as typeof sheet & {
    contentBlocks?: ContentBlock[];
    feynmanExplanation?: string;
    keyMetrics?: KeyMetric[];
  };
  const keyPointsPayload = readKeyPointsPayload(sheet.keyPointsJson);
  const ficheGeneree = keyPointsPayload.fiche as FicheGeneree | null;

  return (
    <main className="app-layout">
      <AppTopbar />

      <div className="content-shell sheet-content-shell">
        <div style={{ maxWidth: 768, margin: "0 auto", width: "100%" }}>
          <header style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--line)", marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <p className="eyebrow">Fiche generee</p>
                <h1 style={{ margin: 0, fontSize: "clamp(1.8rem, 3vw, 2.4rem)", lineHeight: 1.1 }}>{sheet.title}</h1>
              </div>
              <div className="cta-row" style={{ flexShrink: 0 }}>
                <Link href="/library" className="btn btn-soft">
                  Retour
                </Link>
                <Link href={`/review/${sheet.id}`} className="btn btn-primary">
                  Reviser
                </Link>
              </div>
            </div>
            <p style={{ marginTop: "0.75rem", color: "var(--muted)", lineHeight: 1.7, fontSize: "1.02rem" }}>{sheet.summary}</p>
          </header>

        <SheetView
          summary={sheet.summary}
          keyPoints={keyPointsPayload.items}
          definitions={sheet.definitionsJson as Definition[]}
          flashcards={sheet.flashcardsJson as Flashcard[]}
          quiz={sheet.quizJson as QuizQuestion[]}
          contentBlocks={enrichedSheet.contentBlocks}
          feynmanExplanation={enrichedSheet.feynmanExplanation}
          keyMetrics={enrichedSheet.keyMetrics}
          ficheGeneree={ficheGeneree}
        />
        </div>
      </div>
    </main>
  );
}
