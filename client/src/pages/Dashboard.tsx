/**
 * Dashboard — Study overview and management hub
 * Design: Scholarly Minimal — card-based layout, teal-blue primary, sage green accents
 *
 * Sections:
 *  1. User Overview (welcome, today/week summary)
 *  2. Quick Start (prominent CTA + recent sets)
 *  3. Study Progress (cards done, accuracy, due today)
 *  4. Flashcard Sets Management (list + CRUD actions)
 *  5. Statistics (bar chart accuracy + line chart daily study)
 *  6. Reminders & Notifications
 *  7. Personal Settings shortcut panel
 */
import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  BookOpen, Plus, RotateCcw, Trash2, Download, Upload, Edit3,
  Bell, Settings, ChevronRight, Flame, Target, Clock, TrendingUp,
  CheckCircle2, AlertCircle, Star, Zap, User, Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  getAllCards,
  getAllSets,
  deleteSet,
  addSet,
  type FlashcardSet,
} from "@/lib/flashcards";

// ── Sample stats data (augments real localStorage data) ───────────────────────
const DAILY_STUDY = [
  { day: "Mon", cards: 12, minutes: 18 },
  { day: "Tue", cards: 20, minutes: 30 },
  { day: "Wed", cards: 8,  minutes: 12 },
  { day: "Thu", cards: 25, minutes: 38 },
  { day: "Fri", cards: 15, minutes: 22 },
  { day: "Sat", cards: 30, minutes: 45 },
  { day: "Sun", cards: 18, minutes: 27 },
];

const ACCURACY_BY_SET = [
  { name: "Mathematics",        accuracy: 72 },
  { name: "Biology",            accuracy: 88 },
  { name: "Physics",            accuracy: 65 },
  { name: "Languages & Skills", accuracy: 91 },
];

const PIE_COLORS = ["#2D7DD2", "#3BB273", "#8B5CF6", "#F59E0B"];

const NOTIFICATIONS = [
  { id: 1, type: "due",     text: "5 cards due for review today",           time: "Now",     icon: Bell },
  { id: 2, type: "streak",  text: "You're on a 7-day study streak! 🔥",     time: "Today",   icon: Flame },
  { id: 3, type: "feature", text: "New: Export sets as PDF is now available", time: "2h ago",  icon: Star },
  { id: 4, type: "tip",     text: "Tip: Review cards before bed to boost retention", time: "Yesterday", icon: Zap },
];

// ── Greeting helper ────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, color, progress,
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; progress?: number;
}) {
  return (
    <div className="bg-card border border-border/60 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", color)}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
      {progress !== undefined && (
        <Progress value={progress} className="h-1.5" />
      )}
    </div>
  );
}

// ── Set Card ──────────────────────────────────────────────────────────────────
function SetCard({
  set, cardCount, onDelete, onReview,
}: {
  set: FlashcardSet; cardCount: number;
  onDelete: (id: string) => void;
  onReview: (id: string) => void;
}) {
  return (
    <div className="bg-card border border-border/60 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow group">
      {/* Color dot */}
      <div
        className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-sm"
        style={{ backgroundColor: set.color }}
      >
        {set.name.slice(0, 2).toUpperCase()}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{set.name}</p>
        <p className="text-xs text-muted-foreground truncate">{set.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs px-1.5 py-0">{cardCount} cards</Badge>
        </div>
      </div>
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon" variant="ghost" className="h-8 w-8"
          onClick={() => onReview(set.id)}
          title="Review this set"
        >
          <RotateCcw size={14} />
        </Button>
        <Button
          size="icon" variant="ghost" className="h-8 w-8"
          onClick={() => toast.info("Edit set — coming soon!")}
          title="Edit set"
        >
          <Edit3 size={14} />
        </Button>
        <Button
          size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(set.id)}
          title="Delete set"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [cards, setCards] = useState(getAllCards());
  const [sets, setSets] = useState(getAllSets());
  const [dismissedNotifs, setDismissedNotifs] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"week" | "day">("week");

  // Refresh data when component mounts
  useEffect(() => {
    setCards(getAllCards());
    setSets(getAllSets());
  }, []);

  // Derived stats
  const totalCards = cards.length;
  const dueToday = useMemo(
    () => cards.filter((c) => c.nextReview <= Date.now()).length,
    [cards]
  );
  const totalCorrect = cards.reduce((s, c) => s + c.correctCount, 0);
  const totalAttempts = cards.reduce((s, c) => s + c.correctCount + c.incorrectCount, 0);
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const weekCards = DAILY_STUDY.reduce((s, d) => s + d.cards, 0);
  const weekMinutes = DAILY_STUDY.reduce((s, d) => s + d.minutes, 0);

  function handleDeleteSet(id: string) {
    deleteSet(id);
    setSets(getAllSets());
    toast.success("Set deleted.");
  }

  function handleReviewSet(id: string) {
    toast.info("Navigate to Review and select this set to start.");
  }

  function handleExport() {
    const data = { cards, sets };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "smart-flashcards-export.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Flashcards exported!");
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          toast.success(`Import preview: ${data.cards?.length ?? 0} cards, ${data.sets?.length ?? 0} sets found. Full import coming soon!`);
        } catch {
          toast.error("Invalid JSON file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  const visibleNotifs = NOTIFICATIONS.filter((n) => !dismissedNotifs.includes(n.id));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container py-8 space-y-8">

        {/* ── 1. User Overview ─────────────────────────────────────────────── */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <User size={26} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Sun size={14} className="text-yellow-500" />
                {getGreeting()}, <span className="font-semibold text-foreground">Learner</span>
              </p>
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                Your Study Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {dueToday > 0
                  ? `You have ${dueToday} card${dueToday > 1 ? "s" : ""} due for review today.`
                  : "You're all caught up for today! Great work."}
              </p>
            </div>
          </div>
          {/* Today / Week summary pills */}
          <div className="flex gap-3 flex-wrap">
            <div className="bg-primary/10 text-primary rounded-xl px-4 py-2 text-center min-w-[90px]">
              <p className="text-2xl font-bold">{DAILY_STUDY[6].cards}</p>
              <p className="text-xs font-medium">Today's cards</p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-600 rounded-xl px-4 py-2 text-center min-w-[90px]">
              <p className="text-2xl font-bold">{weekCards}</p>
              <p className="text-xs font-medium">This week</p>
            </div>
          </div>
        </section>

        {/* ── 2. Quick Start ───────────────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-primary to-blue-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Ready to study?</h2>
              <p className="text-blue-100 text-sm mt-1">
                {dueToday > 0
                  ? `${dueToday} cards are waiting for review.`
                  : "Keep your streak going with a quick session!"}
              </p>
              {/* Recent sets */}
              <div className="flex flex-wrap gap-2 mt-3">
                {sets.slice(0, 3).map((s) => (
                  <Link key={s.id} href="/review">
                    <span
                      className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-3 py-1 text-xs font-medium cursor-pointer"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <Link href="/review">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-blue-50 font-bold shadow-md flex-shrink-0 gap-2"
              >
                <RotateCcw size={18} />
                Start Review
              </Button>
            </Link>
          </div>
        </section>

        {/* ── 3. Study Progress Stats ──────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">Study Progress</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={BookOpen}
              label="Total Flashcards"
              value={totalCards}
              sub="across all sets"
              color="bg-primary"
            />
            <StatCard
              icon={Target}
              label="Accuracy"
              value={`${accuracy}%`}
              sub={`${totalCorrect} correct of ${totalAttempts}`}
              color="bg-emerald-500"
              progress={accuracy}
            />
            <StatCard
              icon={Bell}
              label="Due Today"
              value={dueToday}
              sub="cards need review"
              color={dueToday > 0 ? "bg-amber-500" : "bg-slate-400"}
            />
            <StatCard
              icon={Clock}
              label="Study Time"
              value={`${weekMinutes}m`}
              sub="this week"
              color="bg-violet-500"
              progress={Math.min((weekMinutes / 120) * 100, 100)}
            />
          </div>
        </section>

        {/* ── 4 + 5. Sets Management + Charts (side by side on desktop) ────── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Flashcard Sets */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Flashcard Sets</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 bg-background" onClick={handleImport}>
                  <Upload size={13} /> Import
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 bg-background" onClick={handleExport}>
                  <Download size={13} /> Export
                </Button>
                <Link href="/create">
                  <Button size="sm" className="gap-1.5">
                    <Plus size={13} /> New Set
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {sets.length === 0 ? (
                <div className="bg-muted/40 rounded-xl p-8 text-center text-muted-foreground text-sm">
                  No sets yet.{" "}
                  <Link href="/create">
                    <span className="text-primary underline cursor-pointer">Create your first set</span>
                  </Link>
                </div>
              ) : (
                sets.map((s) => (
                  <SetCard
                    key={s.id}
                    set={s}
                    cardCount={cards.filter((c) => s.cardIds.includes(c.id)).length}
                    onDelete={handleDeleteSet}
                    onReview={handleReviewSet}
                  />
                ))
              )}
            </div>
          </section>

          {/* Charts */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Statistics</h2>
              <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                <button
                  className={cn("px-3 py-1.5 font-medium transition-colors", activeTab === "week" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted")}
                  onClick={() => setActiveTab("week")}
                >Week</button>
                <button
                  className={cn("px-3 py-1.5 font-medium transition-colors", activeTab === "day" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted")}
                  onClick={() => setActiveTab("day")}
                >Day</button>
              </div>
            </div>

            {/* Line chart: daily cards reviewed */}
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp size={15} className="text-primary" />
                Cards Reviewed — This Week
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={DAILY_STUDY} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                  <Line
                    type="monotone" dataKey="cards" stroke="#2D7DD2"
                    strokeWidth={2.5} dot={{ r: 4, fill: "#2D7DD2" }} activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar chart: accuracy by set */}
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Target size={15} className="text-emerald-500" />
                Accuracy by Set (%)
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={ACCURACY_BY_SET} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                    formatter={(v) => [`${v}%`, "Accuracy"]}
                  />
                  <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                    {ACCURACY_BY_SET.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* ── 6. Reminders & Notifications ─────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">Reminders & Notifications</h2>
          {visibleNotifs.length === 0 ? (
            <div className="bg-muted/40 rounded-xl p-6 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              All caught up — no new notifications.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {visibleNotifs.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl p-4 border shadow-sm",
                    n.type === "due"
                      ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                      : n.type === "streak"
                      ? "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800"
                      : "bg-card border-border/60"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    n.type === "due" ? "bg-amber-100 text-amber-600" :
                    n.type === "streak" ? "bg-orange-100 text-orange-600" :
                    n.type === "feature" ? "bg-primary/10 text-primary" :
                    "bg-violet-100 text-violet-600"
                  )}>
                    <n.icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                  <button
                    className="text-muted-foreground hover:text-foreground text-xs flex-shrink-0 mt-0.5"
                    onClick={() => setDismissedNotifs((p) => [...p, n.id])}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 7. Personal Settings ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">Settings & Preferences</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: User, label: "Account",
                desc: "Manage your profile and password",
                action: () => toast.info("Account settings — coming soon!"),
              },
              {
                icon: Sun, label: "Appearance",
                desc: "Theme colour, font size, dark mode",
                action: () => toast.info("Appearance settings — coming soon!"),
              },
              {
                icon: Bell, label: "Notifications",
                desc: "Review reminders and alerts",
                action: () => toast.info("Notification settings — coming soon!"),
              },
              {
                icon: Zap, label: "Study Goals",
                desc: "Daily card target and streak goals",
                action: () => toast.info("Study goals — coming soon!"),
              },
              {
                icon: Download, label: "Export Data",
                desc: "Download all your flashcards as JSON",
                action: handleExport,
              },
              {
                icon: AlertCircle, label: "Reset Progress",
                desc: "Clear all review history and stats",
                action: () => toast.warning("This would clear all progress. Feature coming soon!"),
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group"
              >
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                  <item.icon size={17} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                </div>
                <ChevronRight size={15} className="text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
