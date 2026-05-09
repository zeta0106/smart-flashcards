/**
 * useFlashcards — React hook providing all flashcard CRUD operations
 * backed by Firebase Firestore. Replaces the old localStorage-based lib.
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fsGetAllCards, fsSaveCard, fsDeleteCard,
  fsGetAllSets, fsSaveSet, fsDeleteSet,
  fsGetStudyLog, fsLogStudySession,
} from "@/lib/firebase";
import type { Flashcard, FlashcardSet } from "@/lib/flashcards";
import { nanoid } from "nanoid";

export interface StudySession {
  id: string;
  date: number;          // Unix ms
  cardsReviewed: number;
  correctCount: number;
  durationMinutes: number;
}

function genId() { return nanoid(10); }

function nextReviewTime(correctCount: number): number {
  const intervals = [1, 2, 4, 7, 14, 30];
  const days = intervals[Math.min(correctCount, intervals.length - 1)];
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

export function useFlashcards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setCards([]); setSets([]); setSessions([]); setLoading(false); return; }
    setLoading(true);
    const [c, s, log] = await Promise.all([
      fsGetAllCards(user.uid),
      fsGetAllSets(user.uid),
      fsGetStudyLog(user.uid),
    ]);
    setCards(c);
    setSets(s);
    // Convert study log to StudySession format
    const mapped: StudySession[] = (log as any[]).map((l) => ({
      id: l.id ?? genId(),
      date: l.date ?? (l.dateStr ? new Date(l.dateStr).getTime() : Date.now()),
      cardsReviewed: l.cardsReviewed ?? l.cards ?? 0,
      correctCount: l.correctCount ?? l.correct ?? 0,
      durationMinutes: l.durationMinutes ?? l.minutes ?? 0,
    }));
    setSessions(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Cards ────────────────────────────────────────────────────────────────────
  const addCard = useCallback(
    async (question: string, answer: string, tags: string[], category: string): Promise<Flashcard> => {
      if (!user) throw new Error("Not authenticated");
      const card: Flashcard = {
        id: genId(), question, answer, tags, category,
        createdAt: Date.now(),
        correctCount: 0, incorrectCount: 0,
        nextReview: Date.now(),
        reviewCount: 0,
      };
      await fsSaveCard(user.uid, card);
      setCards((prev) => [...prev, card]);
      return card;
    },
    [user]
  );

  const deleteCard = useCallback(
    async (cardId: string) => {
      if (!user) return;
      await fsDeleteCard(user.uid, cardId);
      const updatedSets = sets.map((s) => ({ ...s, cardIds: s.cardIds.filter((id) => id !== cardId) }));
      await Promise.all(updatedSets.map((s) => fsSaveSet(user.uid, s)));
      setSets(updatedSets);
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    },
    [user, sets]
  );

  const updateCardReview = useCallback(
    async (cardId: string, correct: boolean) => {
      if (!user) return;
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;
      const updated: Flashcard = {
        ...card,
        correctCount: correct ? card.correctCount + 1 : card.correctCount,
        incorrectCount: correct ? card.incorrectCount : card.incorrectCount + 1,
        reviewCount: (card.reviewCount ?? 0) + 1,
        nextReview: correct ? nextReviewTime(card.correctCount + 1) : Date.now() + 10 * 60 * 1000,
      };
      await fsSaveCard(user.uid, updated);
      setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    },
    [user, cards]
  );

  // ── Sets ─────────────────────────────────────────────────────────────────────
  const addSet = useCallback(
    async (name: string, description: string, color: string): Promise<FlashcardSet> => {
      if (!user) throw new Error("Not authenticated");
      const set: FlashcardSet = {
        id: genId(), name, description, color,
        createdAt: Date.now(), cardIds: [],
      };
      await fsSaveSet(user.uid, set);
      setSets((prev) => [...prev, set]);
      return set;
    },
    [user]
  );

  const deleteSet = useCallback(
    async (setId: string) => {
      if (!user) return;
      await fsDeleteSet(user.uid, setId);
      setSets((prev) => prev.filter((s) => s.id !== setId));
    },
    [user]
  );

  const addCardToSet = useCallback(
    async (setId: string, cardId: string) => {
      if (!user) return;
      const set = sets.find((s) => s.id === setId);
      if (!set || set.cardIds.includes(cardId)) return;
      const updated = { ...set, cardIds: [...set.cardIds, cardId] };
      await fsSaveSet(user.uid, updated);
      setSets((prev) => prev.map((s) => (s.id === setId ? updated : s)));
    },
    [user, sets]
  );

  // ── Study log ────────────────────────────────────────────────────────────────
  const logSession = useCallback(
    async (cardsReviewed: number, correctCount: number, durationMinutes: number) => {
      if (!user) return;
      const session = {
        id: genId(),
        date: Date.now(),
        cardsReviewed,
        correctCount,
        durationMinutes,
      };
      await fsLogStudySession(user.uid, {
        date: session.date,
        dateStr: new Date().toISOString().slice(0, 10),
        cardsReviewed,
        correctCount,
        durationMinutes,
      });
      setSessions((prev) => [...prev, session]);
    },
    [user]
  );

  // ── Export ───────────────────────────────────────────────────────────────────
  const exportCards = useCallback(() => {
    return { cards, sets, exportedAt: new Date().toISOString() };
  }, [cards, sets]);

  // ── Import ───────────────────────────────────────────────────────────────────
  const importCards = useCallback(
    async (data: { cards?: Flashcard[]; sets?: FlashcardSet[] }) => {
      if (!user) return;
      const importedCards: Flashcard[] = (data.cards ?? []).map((c) => ({
        ...c, id: genId(), createdAt: Date.now(), reviewCount: c.reviewCount ?? 0,
      }));
      const importedSets: FlashcardSet[] = (data.sets ?? []).map((s) => ({
        ...s, id: genId(), createdAt: Date.now(),
      }));
      await Promise.all([
        ...importedCards.map((c) => fsSaveCard(user.uid, c)),
        ...importedSets.map((s) => fsSaveSet(user.uid, s)),
      ]);
      setCards((prev) => [...prev, ...importedCards]);
      setSets((prev) => [...prev, ...importedSets]);
    },
    [user]
  );

  // ── Reset all data ───────────────────────────────────────────────────────────
  const resetAllData = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      ...cards.map((c) => fsDeleteCard(user.uid, c.id)),
      ...sets.map((s) => fsDeleteSet(user.uid, s.id)),
    ]);
    setCards([]);
    setSets([]);
    setSessions([]);
  }, [user, cards, sets]);

  return {
    cards, sets, sessions, loading,
    refresh,
    addCard, deleteCard, updateCardReview,
    addSet, deleteSet, addCardToSet,
    logSession,
    exportCards, importCards, resetAllData,
  };
}
