/**
 * Review Page — Smart Flashcards
 * Design: Scholarly Minimal
 * Features:
 *  - 3D card flip animation (CSS perspective + rotateY)
 *  - "Got it" / "Need review" buttons
 *  - Session progress bar
 *  - Spaced repetition scoring
 *  - Set selector & shuffle toggle
 *  - Session summary screen
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw, CheckCircle2, XCircle, Shuffle, ChevronDown,
  BookOpen, Trophy, ArrowRight, BarChart2, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  getAllCards, getAllSets, updateCardReview,
  type Flashcard, type FlashcardSet,
} from "@/lib/flashcards";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type SessionCard = Flashcard & { sessionResult?: "correct" | "incorrect" };

export default function Review() {
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("all");
  const [doShuffle, setDoShuffle] = useState(true);

  // Session
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);

  // Stats
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);

  useEffect(() => {
    setAllCards(getAllCards());
    setSets(getAllSets());
  }, []);

  // ── Build session ──
  const buildSession = useCallback(() => {
    let pool: Flashcard[];
    if (selectedSetId === "all") {
      pool = getAllCards();
    } else {
      const set = getAllSets().find((s) => s.id === selectedSetId);
      const cardIds = new Set(set?.cardIds ?? []);
      pool = getAllCards().filter((c) => cardIds.has(c.id));
    }
    if (pool.length === 0) return;
    const ordered = doShuffle ? shuffle(pool) : [...pool];
    setSessionCards(ordered);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCorrect(0);
    setIncorrect(0);
    setSessionDone(false);
    setSessionStarted(true);
  }, [selectedSetId, doShuffle]);

  const currentCard = sessionCards[currentIndex];
  const progress = sessionCards.length > 0 ? (currentIndex / sessionCards.length) * 100 : 0;

  function handleFlip() {
    setIsFlipped((f) => !f);
  }

  function handleAnswer(result: "correct" | "incorrect") {
    if (!currentCard) return;
    updateCardReview(currentCard.id, result === "correct");
    if (result === "correct") setCorrect((c) => c + 1);
    else setIncorrect((c) => c + 1);

    const next = currentIndex + 1;
    if (next >= sessionCards.length) {
      setSessionDone(true);
    } else {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(next), 200);
    }
  }

  function handleRestart() {
    buildSession();
  }

  const poolSize =
    selectedSetId === "all"
      ? allCards.length
      : (sets.find((s) => s.id === selectedSetId)?.cardIds.length ?? 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="container py-10 flex-1">
        {/* ── Header ── */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Review</p>
          <h1 className="text-3xl md:text-4xl font-serif text-foreground">Study Session</h1>
          <p className="mt-2 text-muted-foreground">
            Flip each card, test your recall, and mark your confidence.
          </p>
        </div>

        {/* ── Setup / Not started ── */}
        {!sessionStarted && !sessionDone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto space-y-6"
          >
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
                    <option value="all">All Cards ({allCards.length})</option>
                    {sets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.cardIds.length} cards)
                      </option>
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
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${doShuffle ? "translate-x-5" : "translate-x-0.5"}`}
                  />
                </button>
              </div>

              {/* Info */}
              <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                <BarChart2 size={15} className="text-primary shrink-0" />
                {poolSize} card{poolSize !== 1 ? "s" : ""} in this session
              </div>

              <Button
                onClick={buildSession}
                disabled={poolSize === 0}
                className="w-full h-11 gap-2 text-base shadow-sm"
              >
                Start Session <ArrowRight size={16} />
              </Button>

              {poolSize === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  No cards found.{" "}
                  <Link href="/create">
                    <span className="text-primary underline underline-offset-2">Create some first.</span>
                  </Link>
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Active Session ── */}
        {sessionStarted && !sessionDone && currentCard && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Card {currentIndex + 1} of {sessionCards.length}</span>
                <span className="flex items-center gap-3">
                  <span className="text-accent flex items-center gap-1">
                    <CheckCircle2 size={12} /> {correct}
                  </span>
                  <span className="text-destructive flex items-center gap-1">
                    <XCircle size={12} /> {incorrect}
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary progress-fill"
                  style={{ width: `${progress}%` }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* Category & Tags */}
            <div className="flex flex-wrap gap-1.5">
              <span className="tag-pill">{currentCard.category}</span>
              {currentCard.tags.map((t) => (
                <span key={t} className="tag-pill">{t}</span>
              ))}
            </div>

            {/* ── Flashcard ── */}
            <div
              className="flashcard-scene cursor-pointer select-none"
              style={{ height: "280px" }}
              onClick={handleFlip}
            >
              <div className={`flashcard-inner ${isFlipped ? "flipped" : ""}`}>
                {/* Front */}
                <div className="flashcard-face flashcard-front">
                  <div className="h-full w-full rounded-2xl border border-border/60 bg-card shadow-lg flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Question</p>
                    <p className="text-xl md:text-2xl font-serif text-foreground leading-snug">
                      {currentCard.question}
                    </p>
                    <p className="mt-6 text-xs text-muted-foreground flex items-center gap-1.5">
                      <RotateCcw size={12} /> Click to reveal answer
                    </p>
                  </div>
                </div>

                {/* Back */}
                <div className="flashcard-face flashcard-back">
                  <div className="h-full w-full rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Answer</p>
                    <p className="text-xl md:text-2xl font-serif text-foreground leading-snug">
                      {currentCard.answer}
                    </p>
                    <p className="mt-6 text-xs text-muted-foreground flex items-center gap-1.5">
                      <RotateCcw size={12} /> Click to flip back
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Answer buttons — only visible after flip */}
            <AnimatePresence>
              {isFlipped && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <Button
                    onClick={() => handleAnswer("incorrect")}
                    variant="outline"
                    className="h-14 gap-2.5 text-base border-destructive/40 text-destructive hover:bg-destructive/5 bg-background"
                  >
                    <XCircle size={20} />
                    Need Review
                  </Button>
                  <Button
                    onClick={() => handleAnswer("correct")}
                    className="h-14 gap-2.5 text-base bg-accent hover:bg-accent/90 text-white shadow-sm"
                  >
                    <CheckCircle2 size={20} />
                    Got It!
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Skip / Restart */}
            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setTimeout(() => {
                    if (currentIndex + 1 >= sessionCards.length) setSessionDone(true);
                    else setCurrentIndex((i) => i + 1);
                  }, 150);
                }}
                className="hover:text-foreground transition-colors"
              >
                Skip →
              </button>
              <button onClick={handleRestart} className="hover:text-foreground transition-colors flex items-center gap-1">
                <RefreshCw size={13} /> Restart
              </button>
            </div>
          </div>
        )}

        {/* ── Session Summary ── */}
        {sessionDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto"
          >
            <div className="bg-card rounded-2xl border border-border/60 shadow-lg p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <Trophy size={32} className="text-accent" />
                </div>
              </div>

              <div>
                <h2 className="font-serif text-3xl text-foreground">Session Complete!</h2>
                <p className="text-muted-foreground mt-2">
                  You reviewed all {sessionCards.length} card{sessionCards.length !== 1 ? "s" : ""}.
                </p>
              </div>

              {/* Score */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-2xl font-serif font-semibold text-foreground">{sessionCards.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Reviewed</p>
                </div>
                <div className="rounded-xl bg-accent/10 p-4">
                  <p className="text-2xl font-serif font-semibold text-accent">{correct}</p>
                  <p className="text-xs text-muted-foreground mt-1">Got Right</p>
                </div>
                <div className="rounded-xl bg-destructive/8 p-4">
                  <p className="text-2xl font-serif font-semibold text-destructive">{incorrect}</p>
                  <p className="text-xs text-muted-foreground mt-1">To Review</p>
                </div>
              </div>

              {/* Accuracy bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Accuracy</span>
                  <span>{sessionCards.length > 0 ? Math.round((correct / sessionCards.length) * 100) : 0}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${sessionCards.length > 0 ? (correct / sessionCards.length) * 100 : 0}%`,
                    }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </div>

              {/* Spaced repetition note */}
              {incorrect > 0 && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl px-4 py-3">
                  <strong className="text-foreground">{incorrect} card{incorrect !== 1 ? "s" : ""}</strong> marked for review
                  will appear more frequently in future sessions.
                </p>
              )}

              <div className="flex gap-3">
                <Button onClick={handleRestart} variant="outline" className="flex-1 gap-2 bg-background">
                  <RefreshCw size={15} /> Study Again
                </Button>
                <Link href="/create" className="flex-1">
                  <Button className="w-full gap-2">
                    <BookOpen size={15} /> Add More Cards
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
