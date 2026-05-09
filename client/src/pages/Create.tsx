/**
 * Create Page — Smart Flashcards
 * Design: Scholarly Minimal
 * Features: Question/Answer form, tag input, category selector,
 *           saved cards list, delete cards, export/import JSON
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Tag, X, Save, Trash2, Download, Upload,
  BookOpen, Search, ChevronDown, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  getAllCards, addCard, deleteCard, saveAllCards,
  getAllSets, addSet, addCardToSet,
  type Flashcard, type FlashcardSet,
} from "@/lib/flashcards";

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
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [sets, setSets] = useState<FlashcardSet[]>([]);

  // Form state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("Mathematics");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [saved, setSaved] = useState(false);

  // Library state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // New set modal
  const [showNewSet, setShowNewSet] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [newSetDesc, setNewSetDesc] = useState("");
  const [newSetColor, setNewSetColor] = useState(SET_COLORS[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCards(getAllCards());
    setSets(getAllSets());
  }, []);

  // ── Tag handling ──
  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  // ── Save card ──
  function handleSave() {
    if (!question.trim() || !answer.trim()) {
      toast.error("Please fill in both Question and Answer fields.");
      return;
    }
    const card = addCard(question.trim(), answer.trim(), tags, category);
    if (selectedSetId) {
      addCardToSet(selectedSetId, card.id);
      setSets(getAllSets());
    }
    setCards(getAllCards());
    setQuestion("");
    setAnswer("");
    setTags([]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success("Flashcard saved!");
  }

  // ── Delete card ──
  function handleDelete(id: string) {
    deleteCard(id);
    setCards(getAllCards());
    setSets(getAllSets());
    toast.success("Card deleted.");
  }

  // ── New set ──
  function handleCreateSet() {
    if (!newSetName.trim()) {
      toast.error("Please enter a set name.");
      return;
    }
    const s = addSet(newSetName.trim(), newSetDesc.trim(), newSetColor);
    setSets(getAllSets());
    setSelectedSetId(s.id);
    setShowNewSet(false);
    setNewSetName("");
    setNewSetDesc("");
    toast.success(`Set "${s.name}" created!`);
  }

  // ── Export ──
  function handleExport() {
    const data = JSON.stringify(getAllCards(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smart-flashcards.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Cards exported!");
  }

  // ── Import ──
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string) as Flashcard[];
        if (!Array.isArray(imported)) throw new Error("Invalid format");
        const existing = getAllCards();
        const existingIds = new Set(existing.map((c) => c.id));
        const newCards = imported.filter((c) => !existingIds.has(c.id));
        saveAllCards([...existing, ...newCards]);
        setCards(getAllCards());
        toast.success(`Imported ${newCards.length} new card(s)!`);
      } catch {
        toast.error("Failed to import: invalid JSON format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ── Filtered cards ──
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
          {/* ── Form ── */}
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
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Tag size={13} /> Tags
                  <span className="text-muted-foreground font-normal">(press Enter or comma to add)</span>
                </label>
                <div className="flex flex-wrap gap-1.5 min-h-[42px] rounded-xl border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring transition-shadow">
                  {tags.map((t) => (
                    <span key={t} className="tag-pill flex items-center gap-1">
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
                    onBlur={addTag}
                    placeholder={tags.length === 0 ? "e.g. formula, algebra" : ""}
                    className="flex-1 min-w-[100px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Add to Set */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <BookOpen size={13} /> Add to Set
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedSetId}
                      onChange={(e) => setSelectedSetId(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">— No set —</option>
                      {sets.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewSet(true)}
                    className="shrink-0 gap-1.5 bg-background"
                  >
                    <Plus size={14} /> New Set
                  </Button>
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                className="w-full gap-2 h-11 text-base shadow-sm"
              >
                <AnimatePresence mode="wait">
                  {saved ? (
                    <motion.span
                      key="saved"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 size={17} /> Saved!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="save"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <Save size={17} /> Save Flashcard
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>

            {/* Import / Export */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleExport} className="flex-1 gap-2 bg-background">
                <Download size={15} /> Export JSON
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 gap-2 bg-background">
                <Upload size={15} /> Import JSON
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </div>
          </div>

          {/* ── Card Library ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-foreground">Your Library</h2>
              <span className="text-xs text-muted-foreground">{cards.length} card{cards.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards…"
                className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Cards list */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              <AnimatePresence>
                {filteredCards.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
                    {cards.length === 0
                      ? "No cards yet. Create your first one!"
                      : "No cards match your search."}
                  </motion.div>
                ) : (
                  filteredCards.map((card) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="group bg-card rounded-xl border border-border/60 p-4 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                            {card.question}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {card.answer}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="tag-pill">{card.category}</span>
                            {card.tags.slice(0, 2).map((t) => (
                              <span key={t} className="tag-pill">{t}</span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── New Set Modal ── */}
      <AnimatePresence>
        {showNewSet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowNewSet(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border/60 shadow-2xl p-6 w-full max-w-md space-y-4"
            >
              <h3 className="font-serif text-xl text-foreground">Create New Set</h3>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Set Name</label>
                <input
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  placeholder="e.g. Biology Chapter 3"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Description (optional)</label>
                <input
                  value={newSetDesc}
                  onChange={(e) => setNewSetDesc(e.target.value)}
                  placeholder="Brief description of this set"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Colour</label>
                <div className="flex gap-2">
                  {SET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewSetColor(c)}
                      className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor: newSetColor === c ? c : "transparent",
                        boxShadow: newSetColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowNewSet(false)} className="flex-1 bg-background">
                  Cancel
                </Button>
                <Button onClick={handleCreateSet} className="flex-1 gap-1.5">
                  <Plus size={15} /> Create Set
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
