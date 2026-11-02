import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { quizAttempts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { citizenOnly } from "@/lib/role-guard";
import { answeredResults, quizDay, quizForClient } from "@/lib/quiz";
import { answerQuizAction } from "@/lib/actions/quiz";
import { QuizHero, QuizView } from "@/components/quiz/quiz-view";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  citizenOnly(user.role);
  const lang = user.language;
  const day = quizDay();
  const [attempt] = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.userId, user.id), eq(quizAttempts.day, day)))
    .limit(1);

  async function answer(index: number, choice: number) {
    "use server";
    return answerQuizAction(day, index, choice);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <QuizHero lang={lang} />
      <QuizView
        key={day}
        lang={lang}
        questions={quizForClient(day, lang)}
        initialAnswers={answeredResults(day, attempt?.answers ?? [], lang)}
        initialFinished={attempt?.finishedAt ? { correct: attempt.correct, points: attempt.points } : null}
        onAnswer={answer}
      />
    </div>
  );
}
