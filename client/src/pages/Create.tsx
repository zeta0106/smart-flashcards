/**
 * Create Page — Smart Flashcards
 * Design: Scholarly Minimal
 * Data: Firebase Firestore via useFlashcards hook
 * Features: Question/Answer form, tag input, category selector,
 *           set management, PDF.js import, card library
 */
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Tag, X, Save, Trash2, Download, Upload,
  BookOpen, Search, ChevronDown, Loader2, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useFlashcards } from "@/hooks/useFlashcards";
import { useAuth } from "@/contexts/AuthContext";
import type { Flashcard } from "@/lib/flashcards";

const CATEGORIES = [
  "Mathematics", "Biology", "Physics", "Chemistry",
  "History", "Geography", "Languages", "Literature",
  "Computer Science", "Economics", "Study Skills", "Other",
];

const SET_COLORS = [
  "#2D7DD2", "#3BB273", "#8B5CF6", "#F59E0B",
  "#EF4444", "#EC4899", "#14B8A6", "#F97316",
];

export default function Create() {
  const { user } = useAuth();
  const { cards, sets, loading, addCard, deleteCard, addSet, deleteSet, addCardToSet } = useFlashcards();

  // Form state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("Mathematics");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Library state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // New set form
  const [showNewSet, setShowNewSet] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [newSetDesc, setNewSetDesc] = useState("");
  const [newSetColor, setNewSetColor] = useState(SET_COLORS[0]);

  // PDF import state
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfText, setPdfText] = useState("");
  const [showPdfPanel, setShowPdfPanel] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // ── Tag handling ──────────────────────────────────────────────────────────
  function addTagFromInput() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTagFromInput(); }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) setTags(tags.slice(0, -1));
  }

  // ── Save card ─────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!question.trim() || !answer.trim()) {
      toast.error("Please fill in both Question and Answer fields.");
      return;
    }
    setSaving(true);
    try {
      const card = await addCard(question.trim(), answer.trim(), tags, category);
      if (selectedSetId) await addCardToSet(selectedSetId, card.id);
      setQuestion(""); setAnswer(""); setTags([]);
      toast.success("Flashcard saved!");
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── New set ───────────────────────────────────────────────────────────────
  async function handleCreateSet() {
    if (!newSetName.trim()) { toast.error("Please enter a set name."); return; }
    const s = await addSet(newSetName.trim(), newSetDesc.trim(), newSetColor);
    setSelectedSetId(s.id);
    setShowNewSet(false);
    setNewSetName(""); setNewSetDesc("");
    toast.success(`Set "${s.name}" created!`);
  }

  // ── Export JSON ───────────────────────────────────────────────────────────
  function handleExport() {
    const data = JSON.stringify(cards, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "smart-flashcards.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Cards exported!");
  }

  // ── Import JSON ───────────────────────────────────────────────────────────
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string) as Flashcard[];
        if (!Array.isArray(imported)) throw new Error("Invalid format");
        const existingIds = new Set(cards.map((c) => c.id));
        let count = 0;
        for (const c of imported) {
          if (!existingIds.has(c.id)) {
            await addCard(c.question, c.answer, c.tags || [], c.category || "Other");
            count++;
          }
        }
        toast.success(`Imported ${count} new card(s)!`);
      } catch {
        toast.error("Failed to import: invalid JSON format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ── PDF import ────────────────────────────────────────────────────────────
  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true);
    setShowPdfPanel(true);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n";
      }
      setPdfText(text.trim().slice(0, 6000));
      toast.success(`PDF extracted (${pdf.numPages} pages). Use the text to write your cards.`);
    } catch {
      toast.error("Could not read PDF. Make sure it contains selectable text.");
    } finally {
      setPdfLoading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  }

  // ── Filtered cards ────────────────────────────────────────────────────────
  const filteredCards = cards.filter((c) => {
    const matchSearch =
      !searchQuery ||
      c.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.includes(searchQuery.toLowerCase()));
    const matchCat = filterCategory === "All" || c.category === filterCategory;
    return matchSearch && matchCat;
  });

  const allCategories = ["All", ...Array.from(new Set(cards.map((c) => c.category)))];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="container py-10 flex-1">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Create</p>
          <h1 className="text-3xl md:text-4xl font-serif text-foreground">Add a new flashcard</h1>
          <p className="mt-2 text-muted-foreground">
            Fill in a question and answer, assign tags and a category, then save to your library.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* ── Form ─────────────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm space-y-5">
              {/* Question */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="question">
                  Question <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. What is the Pythagorean Theorem?"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>

              {/* Answer */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="answer">
                  Answer <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="e.g. a² + b² = c², where c is the hypotenuse."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Category</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Tag size={13} /> Tags
                  <span className="text-muted-foreground font-normal text-xs">(Enter or comma to add)</span>
                </label>
                <div className="flex flex-wrap gap-1.5 min-h-[42px] rounded-xl border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring transition-shadow">
                  {tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs rounded-full px-2.5 py-0.5">
                      {t}
                      <button onClick={() => removeTag(t)} className="ml-0.5 hover:text-destructive transition-colors">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={addTagFromInput}
                    placeholder={tags.length === 0 ? "e.g. formula, algebra" : ""}
                    className="flex-1 min-w-[100px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Add to Set */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Add to Set</label>
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => setShowNewSet(!showNewSet)}
                  >
                    {showNewSet ? "Cancel" : "+ New Set"}
                  </button>
                </div>
                <AnimatePresence>
                  {showNewSet && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-muted/40 rounded-xl p-4 space-y-3 border border-border/40">
                        <input
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Set name"
                          value={newSetName}
                          onChange={(e) => setNewSetName(e.target.value)}
                        />
                        <input
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Description (optional)"
                          value={newSetDesc}
                          onChange={(e) => setNewSetDesc(e.target.value)}
                        />
                        <div className="flex gap-2 flex-wrap items-center">
                          <span className="text-xs text-muted-foreground">Color:</span>
                          {SET_COLORS.map((c) => (
                            <button
                              key={c}
                              className={cn("h-5 w-5 rounded-full border-2 transition-transform", newSetColor === c ? "border-foreground scale-110" : "border-transparent")}
                              style={{ backgroundColor: c }}
                              onClick={() => setNewSetColor(c)}
                            />
                          ))}
                        </div>
                        <Button size="sm" onClick={handleCreateSet} className="w-full">Create Set</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="relative">
                  <select
                    value={selectedSetId}
                    onChange={(e) => setSelectedSetId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">— No set —</option>
                    {sets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Save button */}
              <Button
                size="lg"
                className="w-full gap-2 shadow-sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Saving…" : "Save Flashcard"}
              </Button>
            </div>

            {/* PDF Import panel */}
            <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Import from PDF</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a PDF to extract its text. Use the extracted content to write flashcards faster.
              </p>
              <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
              <Button
                size="sm" variant="outline" className="gap-2 bg-background w-full"
                onClick={() => pdfInputRef.current?.click()}
                disabled={pdfLoading}
              >
                {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {pdfLoading ? "Extracting text…" : "Upload PDF"}
              </Button>
              {showPdfPanel && pdfText && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Extracted text (first 6,000 chars). Copy sections to create your cards:</p>
                  <textarea
                    className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-mono resize-none focus:outline-none"
                    rows={10}
                    readOnly
                    value={pdfText}
                  />
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setPdfText(""); setShowPdfPanel(false); }}>
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Export / Import JSON */}
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="flex-1 gap-2 bg-background" onClick={handleExport}>
                <Download size={14} /> Export JSON
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2 bg-background" onClick={() => fileInputRef.current?.click()}>
                <Upload size={14} /> Import JSON
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </div>
          </div>

          {/* ── Card Library ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Your Cards
                <span className="ml-2 text-sm font-normal text-muted-foreground">({cards.length})</span>
              </h2>
            </div>

            {/* Search + filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Search cards…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none pr-8"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  {allCategories.map((c) => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Sets list */}
            {sets.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Sets</p>
                {sets.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 bg-card border border-border/60 rounded-lg px-3 py-2">
                    <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-sm font-medium text-foreground flex-1 truncate">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.cardIds.length} cards</span>
                    <button
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => deleteSet(s.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Cards list */}
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-sm">
                <Loader2 size={18} className="animate-spin" /> Loading your cards…
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="bg-muted/40 rounded-xl p-10 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                <BookOpen size={28} className="text-muted-foreground/40" />
                {cards.length === 0
                  ? "No cards yet. Create your first one!"
                  : "No cards match your search."}
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {filteredCards.map((card) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-card border border-border/60 rounded-xl p-3.5 flex gap-3 shadow-sm group hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{card.question}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{card.answer}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="inline-flex items-center text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                            {card.category}
                          </span>
                          {card.tags.slice(0, 2).map((t) => (
                            <span key={t} className="inline-flex items-center text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0 mt-0.5"
                        onClick={() => deleteCard(card.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
