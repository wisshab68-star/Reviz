import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { isDatabaseConnectionError } from "@/lib/database-fallback";
import { AppTopbar } from "@/components/app-topbar";
import { MobileNav } from "@/components/mobile-nav";
import { RevizMascotDoodle, RevizMindOrbitDoodle, RevizNotebookDoodle } from "@/components/reviz-illustrations";
import { SaveSheetButton } from "@/components/save-sheet-button";
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
  let session = null;

  try {
    session = await auth();
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    console.error("Auth lookup failed on /sheet/[id], continuing as guest.", error);
  }

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

  if (sheet.status === "PROCESSING") {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#0F0F13", overflowX: "hidden" }}>
        <AppTopbar />
        <main className="app-main-content" style={{ flex: 1, minWidth: 0, width: "100%", background: "#0F0F13", overflowX: "hidden" }}>
        <div className="content-shell sheet-content-shell">
          <div className="reviz-sheet-frame">
            <div className="reviz-sheet-orb reviz-sheet-orb-a" aria-hidden="true" />
            <div className="reviz-sheet-orb reviz-sheet-orb-b" aria-hidden="true" />
            <header className="reviz-sheet-page-header">
              <div className="reviz-sheet-page-top">
                <div>
                  <p className="eyebrow">Generation en cours</p>
                  <h1 className="reviz-sheet-page-title">{sheet.title}</h1>
                </div>
                <div className="cta-row reviz-sheet-page-actions">
                  <Link href="/app" className="btn btn-soft">
                    Retour
                  </Link>
                  <Link href="/library" className="btn btn-primary">
                    Bibliotheque
                  </Link>
                </div>
              </div>
              <p className="reviz-sheet-page-summary">
                Reviz prepare ta fiche en arriere-plan. Recharge cette page dans quelques instants.
              </p>
              <div className="reviz-sheet-page-art" aria-hidden="true">
                <RevizNotebookDoodle className="reviz-illustration reviz-illustration-notebook" />
                <RevizMindOrbitDoodle className="reviz-illustration reviz-illustration-orbit" />
                <RevizMascotDoodle className="reviz-illustration reviz-illustration-mascot" />
              </div>
            </header>

            <section style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
              <div className="status-box">Generation en cours... la fiche apparaitra ici des qu'elle sera prete.</div>
            </section>
          </div>
        </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  if (sheet.status === "FAILED") {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#0F0F13", overflowX: "hidden" }}>
        <AppTopbar />
        <main className="app-main-content" style={{ flex: 1, minWidth: 0, width: "100%", background: "#0F0F13", overflowX: "hidden" }}>
        <div className="content-shell sheet-content-shell">
          <div className="reviz-sheet-frame">
            <div className="reviz-sheet-orb reviz-sheet-orb-a" aria-hidden="true" />
            <div className="reviz-sheet-orb reviz-sheet-orb-b" aria-hidden="true" />
            <header className="reviz-sheet-page-header">
              <div className="reviz-sheet-page-top">
                <div>
                  <p className="eyebrow">Generation interrompue</p>
                  <h1 className="reviz-sheet-page-title">{sheet.title}</h1>
                </div>
                <div className="cta-row reviz-sheet-page-actions">
                  <Link href="/app" className="btn btn-soft">
                    Retour
                  </Link>
                  <Link href="/library" className="btn btn-primary">
                    Bibliotheque
                  </Link>
                </div>
              </div>
              <p className="reviz-sheet-page-summary">
                {sheet.summary || "La generation a echoue. Tu peux relancer une nouvelle tentative depuis l'accueil."}
              </p>
              <div className="reviz-sheet-page-art" aria-hidden="true">
                <RevizNotebookDoodle className="reviz-illustration reviz-illustration-notebook" />
                <RevizMindOrbitDoodle className="reviz-illustration reviz-illustration-orbit" />
                <RevizMascotDoodle className="reviz-illustration reviz-illustration-mascot" />
              </div>
            </header>

            <section style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
              <div className="status-box error">
                {sheet.summary || "La generation a echoue. Relance une nouvelle tentative."}
              </div>
            </section>
          </div>
        </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0F0F13", overflowX: "hidden" }}>
      <AppTopbar />
      <main className="app-main-content" style={{ flex: 1, minWidth: 0, width: "100%", background: "#0F0F13", overflowX: "hidden" }}>
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
                <SaveSheetButton title={sheet.title} />
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
            sheetId={sheet.id}
          />
        </div>
      </div>
      </main>
      <MobileNav />
    </div>
  );
}
