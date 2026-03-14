import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { AppTopbar } from "@/components/app-topbar";
import { ReviewView } from "@/components/review-view";
import { db } from "@/lib/db";
import type { Flashcard, QuizQuestion } from "@/types/sheet";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReviewPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;

  const sheet = await db.studySheet.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      userId: true,
      flashcardsJson: true,
      quizJson: true,
    },
  });

  if (!sheet || (session?.user?.id && sheet.userId && sheet.userId !== session.user.id)) {
    notFound();
  }

  return (
    <main className="app-layout">
      <AppTopbar />
      <div className="content-shell review-content-shell">
        <div style={{ maxWidth: 768, margin: "0 auto", width: "100%" }}>
          <ReviewView
            sheetId={sheet.id}
            title={sheet.title}
            flashcards={sheet.flashcardsJson as Flashcard[]}
            quiz={sheet.quizJson as QuizQuestion[]}
          />
        </div>
      </div>
    </main>
  );
}
