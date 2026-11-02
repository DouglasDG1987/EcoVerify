import { useState } from "react";
import { answeredResults, quizDay, quizForClient } from "@/lib/quiz";
import { QuizHero, QuizView } from "@/components/quiz/quiz-view";
import { answerQuiz, quizAttemptOf, useLang, useStore, type User } from "../store";

export function QuizScreen({ user }: { user: User }) {
  const lang = useLang();
  // The day is fixed when the screen opens (answering after midnight starts the new quiz).
  const [day] = useState(() => quizDay());
  const attempt = useStore((s) => quizAttemptOf(s, user.id, day));
  // Initial values only: the view keeps its own state while answering.
  const [initial] = useState(() => attempt);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <QuizHero lang={lang} />
      <QuizView
        key={`${day}-${lang}`}
        lang={lang}
        questions={quizForClient(day, lang)}
        initialAnswers={answeredResults(day, initial?.answers ?? [], lang)}
        initialFinished={initial?.finishedAt ? { correct: initial.correct, points: initial.points } : null}
        onAnswer={(index, choice) => answerQuiz(day, index, choice)}
      />
    </div>
  );
}
