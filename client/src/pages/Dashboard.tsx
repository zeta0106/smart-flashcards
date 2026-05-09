/**
 * Dashboard Page — Smart Flashcards
 * Design: Scholarly Minimal
 * Data: Firebase Firestore via useFlashcards + AuthContext
 * Features: User overview, real statistics, set management, quick start, charts
 * Note: No fake/sample data, no reminders section
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  BookOpen, Plus, Trash2, Download, Upload, Edit3,
  Settings, ChevronRight, Target, Clock, TrendingUp,
  CheckCircle2, Zap, LogOut, BarChart2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useFlashcards } from "@/hooks/useFlashcards";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { cards, sets, sessions, loading, deleteSet, exportCards, importCards } = useFlashcards();
  const [, navigate] = useLocation();
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Derived statistics (100% real data) ──────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const todaySessions = sessions.filter((s) => s.date >= today.getTime());
    const weekSessions = sessions.filter((s) => s.date >= weekAgo.getTime());

    const todayCards = todaySessions.reduce((a, s) => a + s.cardsReviewed, 0);
    const weekCards = weekSessions.reduce((a, s) => a + s.cardsReviewed, 0);
    const weekCorrect = weekSessions.reduce((a, s) => a + s.correctCount, 0);
    const weekTotal = weekSessions.reduce((a, s) => a + s.cardsReviewed, 0);
    const accuracy = weekTotal > 0 ? Math.round((weekCorrect / weekTotal) * 100) : 0;
    const weekMinutes = weekSessions.reduce((a, s) => a + s.durationMinutes, 0);
    const dueCount = cards.filter((c) => c.nextReview <= Date.now()).length;
    const totalStudyTime = sessions.reduce((a, s) => a + s.durationMinutes, 0);

    return { todayCards, weekCards, accuracy, weekMinutes, dueCount, totalStudyTime };
  }, [sessions, cards]);

  // ── Weekly line chart data ────────────────────────────────────────────────
  const weeklyData = useMemo(() => {
    const days: { day: string; cards: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const daySessions = sessions.filter((s) => s.date >= d.getTime() && s.date < next.getTime());
      days.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        cards: daySessions.reduce((a, s) => a + s.cardsReviewed, 0),
      });
    }
    return days;
  }, [sessions]);

  // ── Accuracy by set bar chart ─────────────────────────────────────────────
  const setAccuracyData = useMemo(() => {
    return sets.map((s) => {
      const setCards = cards.filter((c) => s.cardIds.includes(c.id));
      const reviewed = setCards.filter((c) => c.reviewCount > 0);
      const acc = reviewed.length > 0
        ? Math.round(reviewed.reduce((a, c) => a + (c.correctCount / c.reviewCount), 0) / reviewed.length * 100)
        : 0;
      return { name: s.name.length > 12 ? s.name.slice(0, 12) + "…" : s.name, accuracy: acc };
    });
  }, [sets, cards]);

  // ── Import handler ────────────────────────────────────────────────────────
  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await importCards(data);
        toast.success("Cards imported successfully!");
      } catch {
        toast.error("Invalid JSON file.");
      }
    };
    input.click();
  }

  // ── Export handler ────────────────────────────────────────────────────────
  function handleExport() {
    if (cards.length === 0) { toast.error("No cards to export."); return; }
    const data = exportCards();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smartcards-export.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Cards exported!");
  }

  const statCards = [
    { label: "Cards Today", value: stats.todayCards, icon: <Zap size={18} />, color: "text-primary", bg: "bg-primary/10" },
    { label: "Cards This Week", value: stats.weekCards, icon: <TrendingUp size={18} />, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { label: "Weekly Accuracy", value: `${stats.accuracy}%`, icon: <Target size={18} />, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
    { label: "Due for Review", value: stats.dueCount, icon: <Clock size={18} />, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/30" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8 space-y-8">

        {/* ── Welcome header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="h-12 w-12 rounded-full border-2 border-border object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                {user?.displayName?.[0] ?? "U"}
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Dashboard</p>
              <h1 className="text-2xl font-serif text-foreground">
                Welcome back, {user?.displayName?.split(" ")[0] ?? "Learner"}!
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/settings">
              <Button variant="outline" size="sm" className="gap-1.5 bg-background">
                <Settings size={14} /> Settings
              </Button>
            </Link>
            <Button
              variant="outline" size="sm"
              className="gap-1.5 bg-background text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={signOut}
            >
              <LogOut size={14} /> Sign Out
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 size={20} className="animate-spin" /> Loading your data…
          </div>
        ) : (
          <>
            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm"
                >
                  <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center ${s.color} mb-3`}>
                    {s.icon}
                  </div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* ── Quick Start ── */}
            <div className="bg-gradient-to-r from-primary/10 to-emerald-50 dark:from-primary/20 dark:to-emerald-900/20 rounded-2xl border border-primary/20 p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-serif text-xl text-foreground">Ready to study?</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.dueCount > 0
                      ? `You have ${stats.dueCount} card${stats.dueCount !== 1 ? "s" : ""} due for review.`
                      : cards.length > 0
                      ? "All caught up! Review any set to keep sharp."
                      : "Create your first flashcard to get started."}
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {cards.length > 0 && (
                    <Link href="/review">
                      <Button className="gap-2 shadow-sm">
                        <Zap size={16} /> Start Review <ChevronRight size={14} />
                      </Button>
                    </Link>
                  )}
                  <Link href="/create">
                    <Button variant="outline" className="gap-2 bg-background">
                      <Plus size={16} /> New Card
                    </Button>
                  </Link>
                </div>
              </div>
              {sets.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {sets.slice(0, 4).map((s) => (
                    <Link key={s.id} href="/review">
                      <button className="text-xs bg-white/70 dark:bg-black/20 hover:bg-white dark:hover:bg-black/30 text-foreground rounded-full px-3 py-1.5 border border-border/40 transition-colors">
                        {s.name} · {s.cardIds.length} cards
                      </button>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* ── Charts — only shown when there's real data ── */}
            {sessions.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={16} className="text-primary" />
                    <h3 className="font-semibold text-sm text-foreground">Cards Reviewed — Last 7 Days</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: "var(--color-foreground)" }}
                      />
                      <Line type="monotone" dataKey="cards" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 size={16} className="text-emerald-600" />
                    <h3 className="font-semibold text-sm text-foreground">Accuracy by Set</h3>
                  </div>
                  {setAccuracyData.length === 0 ? (
                    <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">No set data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={setAccuracyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                          formatter={(v) => [`${v}%`, "Accuracy"]}
                        />
                        <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                          {setAccuracyData.map((_, i) => (
                            <Cell key={i} fill={`hsl(${160 + i * 25}, 55%, 50%)`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border/60 p-8 text-center text-muted-foreground shadow-sm">
                <BarChart2 size={32} className="mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm font-medium">No study data yet</p>
                <p className="text-xs mt-1">Complete your first review session to see statistics here.</p>
              </div>
            )}

            {/* ── Flashcard Sets Management ── */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  <h2 className="font-semibold text-foreground">My Flashcard Sets</h2>
                  <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">{sets.length}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 bg-background text-xs" onClick={handleImport}>
                    <Upload size={13} /> Import
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 bg-background text-xs" onClick={handleExport} disabled={cards.length === 0}>
                    <Download size={13} /> Export
                  </Button>
                  <Link href="/create">
                    <Button size="sm" className="gap-1.5 text-xs">
                      <Plus size={13} /> New Set
                    </Button>
                  </Link>
                </div>
              </div>

              {sets.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground text-sm flex flex-col items-center gap-3">
                  <BookOpen size={28} className="text-muted-foreground/30" />
                  <p>No flashcard sets yet.</p>
                  <Link href="/create">
                    <span className="text-primary hover:underline cursor-pointer text-sm">Create your first set →</span>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {sets.map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="h-9 w-9 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-sm"
                          style={{ backgroundColor: s.color || "#2D7DD2" }}
                        >
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                        {editingSetId === s.id ? (
                          <input
                            autoFocus
                            className="text-sm font-medium text-foreground bg-transparent border-b border-primary outline-none flex-1"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => setEditingSetId(null)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "Escape") setEditingSetId(null);
                            }}
                          />
                        ) : (
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.cardIds.length} card{s.cardIds.length !== 1 ? "s" : ""}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-4 shrink-0">
                        <Link href="/review">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:text-primary">
                            <Zap size={11} /> Review
                          </Button>
                        </Link>
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditingSetId(s.id); setEditingName(s.name); }}
                        >
                          <Edit3 size={13} />
                        </Button>
                        {deleteConfirmId === s.id ? (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost" size="sm"
                              className="h-7 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={async () => { await deleteSet(s.id); setDeleteConfirmId(null); toast.success("Set deleted."); }}
                            >
                              Delete
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDeleteConfirmId(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                            onClick={() => setDeleteConfirmId(s.id)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Summary totals ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: <BookOpen size={18} />, value: cards.length, label: "Total Cards", bg: "bg-primary/10", color: "text-primary" },
                { icon: <CheckCircle2 size={18} />, value: sessions.length, label: "Sessions Completed", bg: "bg-emerald-100 dark:bg-emerald-900/30", color: "text-emerald-600" },
                { icon: <Clock size={18} />, value: `${stats.totalStudyTime}m`, label: "Total Study Time", bg: "bg-amber-100 dark:bg-amber-900/30", color: "text-amber-600" },
              ].map((item) => (
                <div key={item.label} className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color} shrink-0`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
