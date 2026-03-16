import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { AppTopbar } from "@/components/app-topbar";
import { RevizMascotDoodle, RevizMindOrbitDoodle, RevizNotebookDoodle } from "@/components/reviz-illustrations";
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
        <div className="reviz-sheet-frame">
          <div className="reviz-sheet-orb reviz-sheet-orb-a" aria-hidden="true" />
          <div className="reviz-sheet-orb reviz-sheet-orb-b" aria-hidden="true" />
          <header className="reviz-sheet-page-header">
            <div className="reviz-sheet-page-top">
              <div>
                <p className="eyebrow">Fiche generee</p>
                <h1 className="reviz-sheet-page-title">{sheet.title}</h1>
              </div>
              <div className="cta-row reviz-sheet-page-actions">
                <Link href="/library" className="btn btn-soft">
                  Retour
                </Link>
                <Link href={`/review/${sheet.id}`} className="btn btn-primary">
                  Reviser
                </Link>
              </div>
            </div>
            <p className="reviz-sheet-page-summary">{sheet.summary}</p>
            <div className="reviz-sheet-page-art" aria-hidden="true">
              <RevizNotebookDoodle className="reviz-illustration reviz-illustration-notebook" />
              <RevizMindOrbitDoodle className="reviz-illustration reviz-illustration-orbit" />
              <RevizMascotDoodle className="reviz-illustration reviz-illustration-mascot" />
            </div>
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
