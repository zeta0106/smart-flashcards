/**
 * Smart Flashcards — App Router
 * Design: Scholarly Minimal
 * Routes: Home, Features, Create, Review, 404
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Features from "./pages/Features";
import Create from "./pages/Create";
import Review from "./pages/Review";
import Dashboard from "./pages/Dashboard";


// Detect the base path from Vite env (set to /smart-flashcards/ for GitHub Pages, / for local dev)
const BASE = (import.meta.env.VITE_BASE_PATH as string | undefined)?.replace(/\/$/, "") || "";

function Router() {
  return (
    <WouterRouter base={BASE}>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/features" component={Features} />
      <Route path="/create" component={Create} />
      <Route path="/review" component={Review} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="bottom-right" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
