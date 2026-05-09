/**
 * Smart Flashcards — Data Store
 * Uses localStorage for persistence.
 * Implements a simple spaced repetition scoring system.
 */

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  category: string;
  createdAt: number;
  /** Spaced repetition: times answered correctly */
  correctCount: number;
  /** Spaced repetition: times answered incorrectly */
  incorrectCount: number;
  /** Next review timestamp (ms) */
  nextReview: number;
}

export interface FlashcardSet {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: number;
  cardIds: string[];
}

const CARDS_KEY = "sf_cards";
const SETS_KEY = "sf_sets";

// ── Helpers ──────────────────────────────────────────────────────────────────

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ── Cards ─────────────────────────────────────────────────────────────────────

export function getAllCards(): Flashcard[] {
  try {
    return JSON.parse(localStorage.getItem(CARDS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveAllCards(cards: Flashcard[]): void {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function addCard(
  question: string,
  answer: string,
  tags: string[],
  category: string
): Flashcard {
  const cards = getAllCards();
  const card: Flashcard = {
    id: genId(),
    question,
    answer,
    tags,
    category,
    createdAt: Date.now(),
    correctCount: 0,
    incorrectCount: 0,
    nextReview: Date.now(),
  };
  cards.push(card);
  saveAllCards(cards);
  return card;
}

export function deleteCard(id: string): void {
  const cards = getAllCards().filter((c) => c.id !== id);
  saveAllCards(cards);
  // Also remove from sets
  const sets = getAllSets();
  sets.forEach((s) => {
    s.cardIds = s.cardIds.filter((cid) => cid !== id);
  });
  saveAllSets(sets);
}

export function updateCardReview(id: string, correct: boolean): void {
  const cards = getAllCards();
  const card = cards.find((c) => c.id === id);
  if (!card) return;
  if (correct) {
    card.correctCount += 1;
    // Spaced repetition: interval doubles each correct answer (1,2,4,8,16 days…)
    const days = Math.pow(2, card.correctCount - 1);
    card.nextReview = Date.now() + days * 24 * 60 * 60 * 1000;
  } else {
    card.incorrectCount += 1;
    // Review again soon (10 minutes)
    card.nextReview = Date.now() + 10 * 60 * 1000;
  }
  saveAllCards(cards);
}

// ── Sets ──────────────────────────────────────────────────────────────────────

export function getAllSets(): FlashcardSet[] {
  try {
    return JSON.parse(localStorage.getItem(SETS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveAllSets(sets: FlashcardSet[]): void {
  localStorage.setItem(SETS_KEY, JSON.stringify(sets));
}

export function addSet(name: string, description: string, color: string): FlashcardSet {
  const sets = getAllSets();
  const set: FlashcardSet = {
    id: genId(),
    name,
    description,
    color,
    createdAt: Date.now(),
    cardIds: [],
  };
  sets.push(set);
  saveAllSets(sets);
  return set;
}

export function addCardToSet(setId: string, cardId: string): void {
  const sets = getAllSets();
  const set = sets.find((s) => s.id === setId);
  if (set && !set.cardIds.includes(cardId)) {
    set.cardIds.push(cardId);
    saveAllSets(sets);
  }
}

export function deleteSet(id: string): void {
  const sets = getAllSets().filter((s) => s.id !== id);
  saveAllSets(sets);
}

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SEED_CARDS: Omit<Flashcard, "id" | "createdAt" | "correctCount" | "incorrectCount" | "nextReview">[] = [
  {
    question: "What is the Pythagorean Theorem?",
    answer: "In a right triangle, a² + b² = c², where c is the hypotenuse.",
    tags: ["geometry", "formula"],
    category: "Mathematics",
  },
  {
    question: "What is the quadratic formula?",
    answer: "x = (−b ± √(b²−4ac)) / 2a, used to solve ax² + bx + c = 0.",
    tags: ["algebra", "formula"],
    category: "Mathematics",
  },
  {
    question: "What is photosynthesis?",
    answer: "The process by which plants convert sunlight, water, and CO₂ into glucose and oxygen: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.",
    tags: ["biology", "plants"],
    category: "Biology",
  },
  {
    question: "What are the stages of mitosis?",
    answer: "Prophase → Metaphase → Anaphase → Telophase (PMAT). The cell divides its nucleus into two identical nuclei.",
    tags: ["cell biology", "division"],
    category: "Biology",
  },
  {
    question: "What is Newton's Second Law of Motion?",
    answer: "Force = Mass × Acceleration (F = ma). The acceleration of an object is directly proportional to the net force acting on it.",
    tags: ["physics", "forces"],
    category: "Physics",
  },
  {
    question: "What is the speed of light in a vacuum?",
    answer: "Approximately 299,792,458 metres per second (≈ 3 × 10⁸ m/s), denoted as c.",
    tags: ["physics", "constants"],
    category: "Physics",
  },
  {
    question: "What does 'serendipity' mean?",
    answer: "The occurrence of events by chance in a happy or beneficial way; a fortunate accident.",
    tags: ["vocabulary", "english"],
    category: "Languages",
  },
  {
    question: "What is 'active recall' in learning?",
    answer: "A study technique where you actively stimulate memory during the learning process, e.g., testing yourself with flashcards rather than passively re-reading.",
    tags: ["study skills", "memory"],
    category: "Study Skills",
  },
];

export function seedIfEmpty(): void {
  const existing = getAllCards();
  if (existing.length > 0) return;

  const now = Date.now();
  const cards: Flashcard[] = SEED_CARDS.map((c) => ({
    ...c,
    id: genId(),
    createdAt: now,
    correctCount: 0,
    incorrectCount: 0,
    nextReview: now,
  }));
  saveAllCards(cards);

  // Create default sets
  const mathCards = cards.filter((c) => c.category === "Mathematics").map((c) => c.id);
  const bioCards = cards.filter((c) => c.category === "Biology").map((c) => c.id);
  const physicsCards = cards.filter((c) => c.category === "Physics").map((c) => c.id);
  const langCards = cards.filter((c) => c.category === "Languages" || c.category === "Study Skills").map((c) => c.id);

  const sets: FlashcardSet[] = [
    { id: genId(), name: "Mathematics", description: "Formulas and theorems", color: "#2D7DD2", createdAt: now, cardIds: mathCards },
    { id: genId(), name: "Biology", description: "Life science concepts", color: "#3BB273", createdAt: now, cardIds: bioCards },
    { id: genId(), name: "Physics", description: "Laws and constants", color: "#8B5CF6", createdAt: now, cardIds: physicsCards },
    { id: genId(), name: "Languages & Skills", description: "Vocabulary and study techniques", color: "#F59E0B", createdAt: now, cardIds: langCards },
  ];
  saveAllSets(sets);
}
