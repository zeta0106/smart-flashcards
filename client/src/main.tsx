import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Data is now stored in Firebase Firestore per user — no local seeding needed.
createRoot(document.getElementById("root")!).render(<App />);
