/**
 * Review Page — Smart Flashcards
 * Design: Scholarly Minimal
 * Data: Firebase Firestore via useFlashcards hook
 * Features: 3D flip animation, Got It / Need Review, progress bar, session summary, study log
 */
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw, CheckCircle2, XCircle, ChevronDown,
  BookOpen, Trophy, ArrowRight, BarChart2, Loader2, Shuffle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useFlashcards } from "@/hooks/useFlashcards";
import type { Flashcard } from "@/lib/flashcards";

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = "setup" | "reviewing" | "done";

export default function Review() {
  const { cards, sets, loading, updateCardReview, logSession } = useFlashcards();

  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedSetId, setSelectedSetId] = useState<string>("all");
  const [doShuffle, setDoShuffle] = useState(true);
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const sessionStartRef = useRef<number>(Date.now());

  const currentCard = queue[currentIndex];
  const progress = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;

  const dueCount = cards.filter((c) => c.nextReview <= Date.now()).length;
  const poolSize =
    selectedSetId === "all" ? cards.length
    : selectedSetId === "due" ? dueCount
    : (sets.find((s) => s.id === selectedSetId)?.cardIds.length ?? 0);

  // ── Start session ─────────────────────────────────────────────────────────
  function startSession() {
    let pool: Flashcard[] = [];
    if (selectedSetId === "all") pool = [...cards];
    else if (selectedSetId === "due") pool = cards.filter((c) => c.nextReview <= Date.now());
    else {
      const set = sets.find((s) => s.id === selectedSetId);
      if (set) pool = cards.filter((c) => set.cardIds.includes(c.id));
    }
    if (pool.length === 0) return;
    setQueue(doShuffle ? shuffleArr(pool) : pool);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCorrect(0);
    setIncorrect(0);
    sessionStartRef.current = Date.now();
    setPhase("reviewing");
  }

  // ── Answer ────────────────────────────────────────────────────────────────
  async function handleAnswer(isCorrect: boolean) {
    if (!currentCard) return;
    await updateCardReview(currentCard.id, isCorrect);
    const newCorrect = isCorrect ? correct + 1 : correct;
    const newIncorrect = isCorrect ? incorrect : incorrect + 1;
    if (isCorrect) setCorrect(newCorrect);
    else setIncorrect(newIncorrect);

    const next = currentIndex + 1;
    if (next >= queue.length) {
      const minutes = Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 60000));
      await logSession(queue.length, newCorrect, minutes);
      setPhase("done");
    } else {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(next), 200);
    }
  }

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="container py-10 flex-1">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Review</p>
            <h1 className="text-3xl md:text-4xl font-serif text-foreground">Study Session</h1>
            <p className="mt-2 text-muted-foreground">Flip each card, test your recall, and mark your confidence.</p>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
                <Loader2 size={20} className="animate-spin" /> Loading your cards…
              </div>
            ) : cards.length === 0 ? (
              <div className="bg-muted/40 rounded-2xl p-10 text-center text-muted-foreground text-sm flex flex-col items-center gap-3">
                <BookOpen size={32} className="text-muted-foreground/40" />
                <p>You don't have any flashcards yet.</p>
                <Link href="/create">
                  <span className="text-primary underline underline-offset-2 cursor-pointer">Create your first card →</span>
                </Link>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm space-y-5">
                <h2 className="font-serif text-xl text-foreground">Configure your session</h2>

                {/* Set selector */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Flashcard Set</label>
                  <div className="relative">
                    <select
                      value={selectedSetId}
                      onChange={(e) => setSelectedSetId(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="all">All Cards ({cards.length})</option>
                      <option value="due">Due for Review ({dueCount})</option>
                      {sets.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.cardIds.length} cards)</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Shuffle toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Shuffle cards</p>
                    <p className="text-xs text-muted-foreground">Randomise order to avoid pattern memorisation</p>
                  </div>
                  <button
                    onClick={() => setDoShuffle((s) => !s)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${doShuffle ? "bg-primary" : "bg-muted"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${doShuffle ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>

                <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                  <BarChart2 size={15} className="text-primary shrink-0" />
                  {poolSize} card{poolSize !== 1 ? "s" : ""} in this session
                </div>

                <Button onClick={startSession} disabled={poolSize === 0} className="w-full h-11 gap-2 text-base shadow-sm">
                  Start Session <ArrowRight size={16} />
                </Button>
              </div>
            )}
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Done screen ───────────────────────────────────────────────────────────
  if (phase === "done") {
    const total = correct + incorrect;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="container py-10 flex-1">
          <div className="max-w-md mx-auto text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card rounded-2xl border border-border/60 p-8 shadow-sm space-y-5"
            >
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <Trophy size={28} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-serif text-foreground">Session Complete!</h2>
              <p className="text-muted-foreground text-sm">You reviewed {total} card{total !== 1 ? "s" : ""}.</p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Correct", value: correct, color: "text-emerald-600" },
                  { label: "Incorrect", value: incorrect, color: "text-red-500" },
                  { label: "Accuracy", value: `${pct}%`, color: "text-primary" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-muted/40 rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2 bg-background" onClick={() => setPhase("setup")}>
                  <RotateCcw size={14} /> New Session
                </Button>
                <Button className="flex-1 gap-2" onClick={startSession}>
                  <Shuffle size={14} /> Retry Same
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Review screen ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="container py-10 flex-1">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Card {currentIndex + 1} of {queue.length}</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={12} /> {correct}</span>
                <span className="flex items-center gap-1 text-red-500"><XCircle size={12} /> {incorrect}</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Tags */}
          {currentCard && (
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5">{currentCard.category}</span>
              {currentCard.tags.map((t) => (
                <span key={t} className="inline-flex items-center text-xs bg-muted text-muted-foreground rounded-full px-2.5 py-0.5">{t}</span>
              ))}
            </div>
          )}

          {/* Flashcard */}
          <AnimatePresence mode="wait">
            {currentCard && (
              <motion.div
                key={currentCard.id + String(isFlipped)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  className="flashcard-scene cursor-pointer select-none"
                  style={{ height: "280px" }}
                  onClick={() => setIsFlipped((f) => !f)}
                >
                  <div className={`flashcard-inner ${isFlipped ? "flipped" : ""}`}>
                    {/* Front */}
                    <div className="flashcard-face flashcard-front">
                      <div className="h-full w-full rounded-2xl border border-border/60 bg-card shadow-lg flex flex-col items-center justify-center p-8 text-center">
                        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Question</p>
                        <p className="text-xl md:text-2xl font-serif text-foreground leading-snug">{currentCard.question}</p>
                        <p className="mt-6 text-xs text-muted-foreground flex items-center gap-1.5">
                          <RotateCcw size={12} /> Click to reveal answer
                        </p>
                      </div>
                    </div>
                    {/* Back */}
                    <div className="flashcard-face flashcard-back">
                      <div className="h-full w-full rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-50 dark:from-primary/20 dark:to-emerald-900/20 shadow-lg flex flex-col items-center justify-center p-8 text-center">
                        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-4">Answer</p>
                        <p className="text-xl md:text-2xl font-serif text-foreground leading-snug">{currentCard.answer}</p>
                        <p className="mt-6 text-xs text-muted-foreground flex items-center gap-1.5">
                          <RotateCcw size={12} /> Click to flip back
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Answer buttons */}
          <AnimatePresence>
            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="grid grid-cols-2 gap-4"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 bg-background h-14 text-base"
                  onClick={() => handleAnswer(false)}
                >
                  <XCircle size={20} /> Need Review
                </Button>
                <Button
                  size="lg"
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-14 text-base"
                  onClick={() => handleAnswer(true)}
                >
                  <CheckCircle2 size={20} /> Got It!
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {!isFlipped && (
            <p className="text-center text-xs text-muted-foreground">
              Click the card to flip it, then mark your answer.
            </p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
