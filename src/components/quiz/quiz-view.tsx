"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n";
import { ArrowRight, Brain, Check, CircleCheck, CircleX, Clock, Lightbulb, Sparkles, X } from "@/components/ui/icons";
import { QUIZ_SIZE, quizText, type ClientQuestion, type QuizAnswerResponse, type QuizAnswerResult } from "@/lib/quiz";

type Answered = QuizAnswerResult & { choice: number };

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Header of the quiz screen: title, short text and the rules as chips. */
export function QuizHero({ lang }: { lang: Lang }) {
  const text = quizText(lang);
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-500 p-5 text-white shadow-sm md:p-6" data-testid="quiz-hero">
      <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" aria-hidden />
      <div className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/10" aria-hidden />
      <div className="relative flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur" aria-hidden>
          <Brain className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold leading-tight md:text-3xl">{text.title}</h1>
          <p className="mt-1 text-sm leading-relaxed text-white/90">{text.tagline}</p>
        </div>
      </div>
      <div className="relative mt-4 flex flex-wrap gap-2 text-xs font-bold">
        {[text.chipQuestions, text.chipPerRight, text.chipBonus].map((chip) => (
          <span key={chip} className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}

function ProgressSegments({ count, current, answers }: { count: number; current: number; answers: Answered[] }) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const a = answers[i];
        const color = a ? (a.correct ? "bg-emerald-500" : "bg-red-400") : i === current ? "bg-sky-500" : "bg-slate-200";
        return <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${color}`} />;
      })}
    </div>
  );
}

/** Circular score (right answers out of the total). */
function ScoreRing({ correct }: { correct: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = correct / QUIZ_SIZE;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-slate-100" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          className={pct >= 0.6 ? "stroke-emerald-500" : pct > 0 ? "stroke-amber-500" : "stroke-slate-200"}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <p className="text-3xl font-extrabold leading-none text-slate-900">
          {correct}
          <span className="text-base font-bold text-slate-400">/{QUIZ_SIZE}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * The daily quiz, one question at a time. After each answer it shows the right option and a short
 * explanation (the point is to learn). Shared by the web app and the APK: `onAnswer` checks the
 * answer (server action on the web, local store in the APK).
 */
export function QuizView({
  lang,
  questions,
  initialAnswers,
  initialFinished,
  onAnswer,
}: {
  lang: Lang;
  questions: ClientQuestion[];
  initialAnswers: Answered[];
  initialFinished: { correct: number; points: number } | null;
  onAnswer: (index: number, choice: number) => Promise<QuizAnswerResponse>;
}) {
  const text = quizText(lang);
  const [answers, setAnswers] = useState<Answered[]>(initialAnswers);
  const [finished, setFinished] = useState(initialFinished);
  // Question on screen: the next unanswered one, or the one just answered (until "Next").
  const [current, setCurrent] = useState(Math.min(initialAnswers.length, QUIZ_SIZE - 1));
  const [showSummary, setShowSummary] = useState(!!initialFinished);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const correctSoFar = answers.filter((a) => a?.correct).length;

  if (showSummary && finished) {
    return (
      <div className="space-y-4">
        <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm md:p-6" data-testid="quiz-summary">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <ScoreRing correct={finished.correct} />
            <div className="min-w-0">
              <p className="text-xl font-extrabold text-slate-900">{text.resultTitle(finished.correct)}</p>
              <p className="mt-1 text-sm text-slate-600">{text.resultText(finished.correct)}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-700">
                <Sparkles className="h-4 w-4" /> {text.points(finished.points)}
              </span>
            </div>
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-900 sm:justify-start">
            <Clock className="h-4 w-4 shrink-0" /> {text.comeBack}
          </p>
        </section>

        <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">{text.review}</h2>
          <ol className="mt-3 space-y-3">
            {questions.map((q, i) => {
              const a = answers[i];
              return (
                <li key={q.id} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${a?.correct ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                    aria-label={a?.correct ? text.right : text.wrong}
                  >
                    {a?.correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">{q.text}</p>
                    {a && (
                      <p className="mt-1 flex items-start gap-1 text-xs font-bold text-emerald-700">
                        <Check className="mt-px h-3.5 w-3.5 shrink-0" /> {q.options[a.correctIndex]}
                      </p>
                    )}
                    {a && <p className="mt-1 text-xs leading-relaxed text-slate-600">{a.explanation}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    );
  }

  const q = questions[current];
  const answer = answers[current];
  const choose = (choice: number) => {
    if (answer || pending) return;
    setError(false);
    start(async () => {
      const r = await onAnswer(current, choice);
      if ("error" in r) {
        if (r.error === "new_day") window.location.reload();
        else setError(true);
        return;
      }
      setAnswers((prev) => {
        const next = [...prev];
        next[current] = { correct: r.correct, correctIndex: r.correctIndex, explanation: r.explanation, choice };
        return next;
      });
      if (r.finished) setFinished(r.finished);
    });
  };

  const optionState = (i: number): "idle" | "right" | "wrong" | "dim" => {
    if (!answer) return "idle";
    if (i === answer.correctIndex) return "right";
    if (i === answer.choice) return "wrong";
    return "dim";
  };
  const OPTION: Record<ReturnType<typeof optionState>, { box: string; badge: string }> = {
    idle: {
      box: "border-slate-200 bg-white text-slate-800 hover:border-sky-400 hover:bg-sky-50 active:scale-[0.99] disabled:opacity-60",
      badge: "bg-slate-100 text-slate-600",
    },
    right: { box: "border-emerald-500 bg-emerald-50 text-emerald-900", badge: "bg-emerald-500 text-white" },
    wrong: { box: "border-red-400 bg-red-50 text-red-900", badge: "bg-red-500 text-white" },
    dim: { box: "border-slate-100 bg-slate-50 text-slate-400", badge: "bg-slate-100 text-slate-400" },
  };

  return (
    <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm md:p-6" data-testid="quiz">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-sky-700">{text.question(current + 1)}</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
          <Check className="h-3.5 w-3.5" /> {text.score(correctSoFar)}
        </span>
      </div>
      <div className="mt-3">
        <ProgressSegments count={questions.length} current={current} answers={answers} />
      </div>
      <h2 className="mt-5 text-lg font-bold leading-snug text-slate-900 md:text-xl">{q.text}</h2>
      <div className="mt-4 grid grid-cols-1 gap-2.5">
        {q.options.map((option, i) => {
          const state = optionState(i);
          return (
            <button
              key={i}
              type="button"
              disabled={!!answer || pending}
              onClick={() => choose(i)}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left text-sm font-semibold transition ${OPTION[state].box}`}
              data-quiz-option={i}
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${OPTION[state].badge}`}>
                {state === "right" ? <Check className="h-4 w-4" /> : state === "wrong" ? <X className="h-4 w-4" /> : LETTERS[i]}
              </span>
              <span className="min-w-0 flex-1">{option}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{text.error}</p>}
      {answer && (
        <div className="mt-4 animate-fade-in" data-testid="quiz-feedback">
          <div className={`rounded-2xl p-4 ${answer.correct ? "bg-emerald-50" : "bg-red-50"}`}>
            <p className={`flex items-center gap-2 text-base font-extrabold ${answer.correct ? "text-emerald-800" : "text-red-800"}`}>
              {answer.correct ? <CircleCheck className="h-5 w-5" /> : <CircleX className="h-5 w-5" />}
              {answer.correct ? text.right : text.wrong}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
              <Lightbulb className="h-4 w-4" /> {text.learn}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">{answer.explanation}</p>
          </div>
          <button
            type="button"
            onClick={() => (current + 1 < QUIZ_SIZE ? setCurrent(current + 1) : setShowSummary(true))}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
            data-testid="quiz-next"
          >
            {current + 1 < QUIZ_SIZE ? text.next : text.finish} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}

export const QUIZ_CARD_BUTTON = "shrink-0 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700";

/** Small card on the missions screen; `action` is the link/button that opens the quiz. */
export function QuizCard({ lang, donePoints, action }: { lang: Lang; donePoints: number | null; action: ReactNode }) {
  const text = quizText(lang);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3" data-testid="quiz-card">
      <div className="min-w-0">
        <p className="text-sm font-bold text-sky-950">{text.cardTitle}</p>
        <p className="text-xs text-sky-900">{donePoints === null ? text.cardText : text.cardDone(donePoints)}</p>
      </div>
      {action}
    </div>
  );
}
