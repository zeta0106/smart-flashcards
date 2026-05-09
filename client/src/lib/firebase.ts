/**
 * Firebase service module
 * Initializes Firebase App, Auth (Google), and Firestore.
 */
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCc3PBptElM_k52wWjLbaEY3fX5aPOItBc",
  authDomain: "smartcards-8f950.firebaseapp.com",
  projectId: "smartcards-8f950",
  storageBucket: "smartcards-8f950.firebasestorage.app",
  messagingSenderId: "451007485171",
  appId: "1:451007485171:web:8ca86790755c1228701386",
  measurementId: "G-BT3YVZN969",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// ── Auth helpers ──────────────────────────────────────────────────────────────
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

// ── Firestore path helpers ────────────────────────────────────────────────────
export function userCardsRef(uid: string) {
  return collection(db, "users", uid, "cards");
}

export function userSetsRef(uid: string) {
  return collection(db, "users", uid, "sets");
}

export function userSettingsRef(uid: string) {
  return doc(db, "users", uid, "meta", "settings");
}

// ── Card CRUD ─────────────────────────────────────────────────────────────────
export async function fsGetAllCards(uid: string) {
  const snap = await getDocs(userCardsRef(uid));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as import("./flashcards").Flashcard[];
}

export async function fsSaveCard(uid: string, card: import("./flashcards").Flashcard) {
  await setDoc(doc(userCardsRef(uid), card.id), card);
}

export async function fsDeleteCard(uid: string, cardId: string) {
  await deleteDoc(doc(userCardsRef(uid), cardId));
}

export async function fsUpdateCardReview(
  uid: string,
  cardId: string,
  correct: boolean,
  nextReview: number
) {
  const ref = doc(userCardsRef(uid), cardId);
  if (correct) {
    await updateDoc(ref, {
      correctCount: (await getDocs(userCardsRef(uid))).docs
        .find((d) => d.id === cardId)
        ?.data().correctCount + 1 || 1,
      nextReview,
    });
  } else {
    await updateDoc(ref, {
      incorrectCount: (await getDocs(userCardsRef(uid))).docs
        .find((d) => d.id === cardId)
        ?.data().incorrectCount + 1 || 1,
      nextReview,
    });
  }
}

// ── Set CRUD ──────────────────────────────────────────────────────────────────
export async function fsGetAllSets(uid: string) {
  const snap = await getDocs(userSetsRef(uid));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as import("./flashcards").FlashcardSet[];
}

export async function fsSaveSet(uid: string, set: import("./flashcards").FlashcardSet) {
  await setDoc(doc(userSetsRef(uid), set.id), set);
}

export async function fsDeleteSet(uid: string, setId: string) {
  await deleteDoc(doc(userSetsRef(uid), setId));
}

// ── Settings ──────────────────────────────────────────────────────────────────
export interface UserSettings {
  theme: "light" | "dark";
  dailyGoal: number;
  displayName: string;
  language: string;
  notificationsEnabled: boolean;
  customCategories: string[];
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: "light",
  dailyGoal: 20,
  displayName: "",
  language: "en",
  notificationsEnabled: true,
  customCategories: [],
};

export async function fsGetSettings(uid: string): Promise<UserSettings> {
  const { getDoc } = await import("firebase/firestore");
  const snap = await getDoc(userSettingsRef(uid));
  if (snap.exists()) return { ...DEFAULT_SETTINGS, ...(snap.data() as UserSettings) };
  return DEFAULT_SETTINGS;
}

export async function fsSaveSettings(uid: string, settings: Partial<UserSettings>) {
  const { setDoc: sd } = await import("firebase/firestore");
  await sd(userSettingsRef(uid), settings, { merge: true });
}

// ── Study log (for real statistics) ──────────────────────────────────────────
export async function fsLogStudySession(
  uid: string,
  sessionData: { date: string; cardsReviewed: number; correct: number; minutes: number }
) {
  const ref = doc(db, "users", uid, "studyLog", sessionData.date);
  const { getDoc, setDoc: sd } = await import("firebase/firestore");
  const existing = await getDoc(ref);
  if (existing.exists()) {
    const prev = existing.data();
    await sd(ref, {
      date: sessionData.date,
      cardsReviewed: (prev.cardsReviewed || 0) + sessionData.cardsReviewed,
      correct: (prev.correct || 0) + sessionData.correct,
      minutes: (prev.minutes || 0) + sessionData.minutes,
    });
  } else {
    await sd(ref, sessionData);
  }
}

export async function fsGetStudyLog(uid: string) {
  const snap = await getDocs(collection(db, "users", uid, "studyLog"));
  return snap.docs.map((d) => d.data()) as {
    date: string; cardsReviewed: number; correct: number; minutes: number;
  }[];
}
