import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { seedIfEmpty } from "./lib/flashcards";

// Seed example flashcards on first visit (before any page renders)
seedIfEmpty();

createRoot(document.getElementById("root")!).render(<App />);
