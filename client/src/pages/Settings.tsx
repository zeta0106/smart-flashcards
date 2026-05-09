/**
 * Settings Page — Smart Flashcards
 * Design: Scholarly Minimal
 * Features: Profile, Appearance (dark/light), Study Goals, Notifications, Export Data, Reset Progress
 * All 6 settings are fully functional — no "coming soon" placeholders
 */
import { useState, useEffect } from "react";
import {
  User, Moon, Sun, Target, Bell, Download, Trash2,
  Save, ChevronRight, Check, AlertTriangle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useFlashcards } from "@/hooks/useFlashcards";

type SettingsSection = "profile" | "appearance" | "goals" | "notifications" | "export" | "reset";

export default function Settings() {
  const { user, updateUserProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { cards, sets, sessions, exportCards, resetAllData } = useFlashcards();

  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [saving, setSaving] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [nameChanged, setNameChanged] = useState(false);

  // Study goals state
  const [dailyGoal, setDailyGoal] = useState(() => {
    return parseInt(localStorage.getItem("sc_daily_goal") ?? "20");
  });
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    return parseInt(localStorage.getItem("sc_weekly_goal") ?? "100");
  });

  // Notifications state
  const [notifDue, setNotifDue] = useState(() => localStorage.getItem("sc_notif_due") !== "false");
  const [notifStreak, setNotifStreak] = useState(() => localStorage.getItem("sc_notif_streak") !== "false");
  const [notifTips, setNotifTips] = useState(() => localStorage.getItem("sc_notif_tips") === "true");

  // Reset confirm
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // ── Save profile ──────────────────────────────────────────────────────────
  async function saveProfile() {
    if (!displayName.trim()) { toast.error("Name cannot be empty."); return; }
    setSaving(true);
    try {
      await updateUserProfile(displayName.trim());
      setNameChanged(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  // ── Save study goals ──────────────────────────────────────────────────────
  function saveGoals() {
    localStorage.setItem("sc_daily_goal", String(dailyGoal));
    localStorage.setItem("sc_weekly_goal", String(weeklyGoal));
    toast.success("Study goals saved!");
  }

  // ── Save notifications ────────────────────────────────────────────────────
  function saveNotifications() {
    localStorage.setItem("sc_notif_due", String(notifDue));
    localStorage.setItem("sc_notif_streak", String(notifStreak));
    localStorage.setItem("sc_notif_tips", String(notifTips));
    toast.success("Notification preferences saved!");
  }

  // ── Export data ───────────────────────────────────────────────────────────
  function handleExport() {
    if (cards.length === 0) { toast.error("No data to export."); return; }
    const data = exportCards();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smartcards-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully!");
  }

  // ── Reset all data ────────────────────────────────────────────────────────
  async function handleReset() {
    setResetLoading(true);
    try {
      await resetAllData();
      setResetConfirm(false);
      toast.success("All data has been reset.");
    } catch {
      toast.error("Failed to reset data.");
    } finally {
      setResetLoading(false);
    }
  }

  const navItems: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User size={16} /> },
    { id: "appearance", label: "Appearance", icon: <Sun size={16} /> },
    { id: "goals", label: "Study Goals", icon: <Target size={16} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
    { id: "export", label: "Export Data", icon: <Download size={16} /> },
    { id: "reset", label: "Reset Progress", icon: <Trash2 size={16} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Account</p>
          <h1 className="text-3xl font-serif text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your profile, preferences, and data.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* ── Sidebar nav ── */}
          <aside className="md:w-56 shrink-0">
            <nav className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left border-b border-border/40 last:border-b-0 ${
                    activeSection === item.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {activeSection === item.id && <ChevronRight size={14} className="ml-auto" />}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Content panel ── */}
          <div className="flex-1 min-w-0">
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6 space-y-6">

              {/* ── Profile ── */}
              {activeSection === "profile" && (
                <div className="space-y-5">
                  <h2 className="font-serif text-xl text-foreground">Profile</h2>
                  <div className="flex items-center gap-4">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="avatar" className="h-16 w-16 rounded-full border-2 border-border object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
                        {user?.displayName?.[0] ?? "U"}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{user?.displayName ?? "User"}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Signed in with Google</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Display Name</label>
                    <input
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      value={displayName}
                      onChange={(e) => { setDisplayName(e.target.value); setNameChanged(true); }}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <input
                      disabled
                      className="w-full rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                      value={user?.email ?? ""}
                    />
                    <p className="text-xs text-muted-foreground">Email is managed by Google and cannot be changed here.</p>
                  </div>
                  <Button onClick={saveProfile} disabled={!nameChanged || saving} className="gap-2">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Changes
                  </Button>
                </div>
              )}

              {/* ── Appearance ── */}
              {activeSection === "appearance" && (
                <div className="space-y-5">
                  <h2 className="font-serif text-xl text-foreground">Appearance</h2>
                  <p className="text-sm text-muted-foreground">Choose how Smart Flashcards looks on your device.</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: "light", label: "Light", icon: <Sun size={24} className="text-amber-500" />, desc: "Clean white background" },
                      { value: "dark", label: "Dark", icon: <Moon size={24} className="text-indigo-400" />, desc: "Easy on the eyes at night" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTheme(opt.value as "light" | "dark")}
                        className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all text-center ${
                          theme === opt.value
                            ? "border-primary bg-primary/5"
                            : "border-border/60 hover:border-border"
                        }`}
                      >
                        {theme === opt.value && (
                          <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check size={11} className="text-white" />
                          </div>
                        )}
                        {opt.icon}
                        <div>
                          <p className="font-medium text-foreground text-sm">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Study Goals ── */}
              {activeSection === "goals" && (
                <div className="space-y-5">
                  <h2 className="font-serif text-xl text-foreground">Study Goals</h2>
                  <p className="text-sm text-muted-foreground">Set daily and weekly targets to stay on track.</p>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Daily Goal (cards per day)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range" min={5} max={100} step={5}
                          value={dailyGoal}
                          onChange={(e) => setDailyGoal(Number(e.target.value))}
                          className="flex-1 accent-primary"
                        />
                        <span className="text-sm font-bold text-primary w-10 text-right">{dailyGoal}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Review at least {dailyGoal} cards every day.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Weekly Goal (cards per week)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range" min={20} max={500} step={10}
                          value={weeklyGoal}
                          onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                          className="flex-1 accent-primary"
                        />
                        <span className="text-sm font-bold text-primary w-12 text-right">{weeklyGoal}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Target {weeklyGoal} cards reviewed per week.</p>
                    </div>
                  </div>
                  <Button onClick={saveGoals} className="gap-2">
                    <Save size={14} /> Save Goals
                  </Button>
                </div>
              )}

              {/* ── Notifications ── */}
              {activeSection === "notifications" && (
                <div className="space-y-5">
                  <h2 className="font-serif text-xl text-foreground">Notifications</h2>
                  <p className="text-sm text-muted-foreground">Control which in-app alerts you receive.</p>
                  <div className="space-y-4">
                    {[
                      {
                        label: "Due card reminders",
                        desc: "Show a notice when you have cards due for review",
                        value: notifDue,
                        set: setNotifDue,
                      },
                      {
                        label: "Study streak alerts",
                        desc: "Notify you about your current study streak",
                        value: notifStreak,
                        set: setNotifStreak,
                      },
                      {
                        label: "Study tips",
                        desc: "Occasional tips to improve your learning efficiency",
                        value: notifTips,
                        set: setNotifTips,
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-4 py-3 border-b border-border/40 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => item.set(!item.value)}
                          className={`relative h-6 w-11 rounded-full transition-colors shrink-0 mt-0.5 ${item.value ? "bg-primary" : "bg-muted"}`}
                        >
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${item.value ? "translate-x-5" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button onClick={saveNotifications} className="gap-2">
                    <Save size={14} /> Save Preferences
                  </Button>
                </div>
              )}

              {/* ── Export Data ── */}
              {activeSection === "export" && (
                <div className="space-y-5">
                  <h2 className="font-serif text-xl text-foreground">Export Data</h2>
                  <p className="text-sm text-muted-foreground">Download a backup of all your flashcards and sets.</p>
                  <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-foreground">
                      <span>Total cards</span><span className="font-semibold">{cards.length}</span>
                    </div>
                    <div className="flex justify-between text-foreground">
                      <span>Total sets</span><span className="font-semibold">{sets.length}</span>
                    </div>
                    <div className="flex justify-between text-foreground">
                      <span>Study sessions</span><span className="font-semibold">{sessions.length}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The export file is in JSON format and can be imported back into Smart Flashcards at any time.
                  </p>
                  <Button onClick={handleExport} disabled={cards.length === 0} className="gap-2">
                    <Download size={14} /> Download Backup
                  </Button>
                </div>
              )}

              {/* ── Reset Progress ── */}
              {activeSection === "reset" && (
                <div className="space-y-5">
                  <h2 className="font-serif text-xl text-foreground">Reset Progress</h2>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex gap-3">
                    <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700 dark:text-red-400">
                      <p className="font-semibold">This action is irreversible.</p>
                      <p className="mt-0.5">Resetting will permanently delete all your flashcards, sets, and study history from the database. This cannot be undone.</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>The following data will be deleted:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>{cards.length} flashcard{cards.length !== 1 ? "s" : ""}</li>
                      <li>{sets.length} flashcard set{sets.length !== 1 ? "s" : ""}</li>
                      <li>{sessions.length} study session record{sessions.length !== 1 ? "s" : ""}</li>
                    </ul>
                  </div>
                  {!resetConfirm ? (
                    <Button
                      variant="outline"
                      className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 bg-background"
                      onClick={() => setResetConfirm(true)}
                    >
                      <Trash2 size={14} /> Reset All Data
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground">Are you absolutely sure?</p>
                      <div className="flex gap-3">
                        <Button
                          className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                          onClick={handleReset}
                          disabled={resetLoading}
                        >
                          {resetLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          Yes, Delete Everything
                        </Button>
                        <Button variant="outline" className="bg-background" onClick={() => setResetConfirm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
