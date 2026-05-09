/**
 * Smart Flashcards — App Router
 * Design: Scholarly Minimal
 * Routes: Login (public), Home/Features (public), Create/Review/Dashboard (protected)
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Features from "./pages/Features";
import Create from "./pages/Create";
import Review from "./pages/Review";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import { useEffect } from "react";

// Detect the base path from Vite env (set to /smart-flashcards/ for GitHub Pages, / for local dev)
const BASE = (import.meta.env.VITE_BASE_PATH as string | undefined)?.replace(/\/$/, "") || "";

/** Sync theme from user settings into ThemeProvider */
function ThemeSync() {
  const { settings } = useAuth();
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);
  return null;
}

/** Protected route: redirects to /login if not authenticated */
function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  return (
    <WouterRouter base={BASE}>
      <Switch>
        {/* Public routes */}
        <Route path="/login" component={Login} />
        <Route path="/" component={Home} />
        <Route path="/features" component={Features} />

        {/* Protected routes — require login */}
        <Route path="/create">
          <ProtectedRoute component={Create} />
        </Route>
        <Route path="/review">
          <ProtectedRoute component={Review} />
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute component={Dashboard} />
        </Route>
        <Route path="/settings">
          <ProtectedRoute component={Settings} />
        </Route>

        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function AppInner() {
  return (
    <TooltipProvider>
      <ThemeSync />
      <Toaster position="bottom-right" richColors />
      <Router />
    </TooltipProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
