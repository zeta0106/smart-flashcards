/**
 * Features Page — Smart Flashcards
 * Design: Scholarly Minimal
 * Sections: Hero, Feature Cards (with images), Science section, CTA
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  PenLine, FolderOpen, RefreshCw, BarChart2, Brain, Clock,
  Download, Upload, ArrowRight, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CREATE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663639498628/7eNft99ZZ4sqZJ9ZBqcCEe/feature-create-WQvn3i5UsCkXcUd2cT4Gar.webp";
const REVIEW_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663639498628/7eNft99ZZ4sqZJ9ZBqcCEe/feature-review-2bW7EyhYtwgpn4C4mUV7LK.webp";
const ORGANIZE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663639498628/7eNft99ZZ4sqZJ9ZBqcCEe/feature-organize-7XTBUs9W9pAceFFTVEGXBt.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const coreFeatures = [
  {
    icon: <PenLine size={20} className="text-primary" />,
    title: "Create Flashcards",
    desc: "Write questions and answers with a clean, distraction-free editor. Add tags for quick filtering.",
    color: "bg-primary/8",
  },
  {
    icon: <FolderOpen size={20} className="text-accent" />,
    title: "Organise by Subject",
    desc: "Group cards into named sets with custom colours. Switch between subjects in one click.",
    color: "bg-accent/8",
  },
  {
    icon: <RefreshCw size={20} className="text-purple-500" />,
    title: "Shuffle & Review",
    desc: "Randomise card order to break pattern memorisation and truly test your knowledge.",
    color: "bg-purple-500/8",
  },
  {
    icon: <Brain size={20} className="text-amber-500" />,
    title: "Spaced Repetition",
    desc: "Cards you struggle with appear more often. Cards you know well are spaced further apart.",
    color: "bg-amber-500/8",
  },
  {
    icon: <BarChart2 size={20} className="text-primary" />,
    title: "Progress Tracking",
    desc: "A live progress bar shows how many cards you've reviewed and how many remain each session.",
    color: "bg-primary/8",
  },
  {
    icon: <Clock size={20} className="text-accent" />,
    title: "Review Scheduling",
    desc: "The algorithm calculates the optimal next review time for each card based on your performance.",
    color: "bg-accent/8",
  },
  {
    icon: <Download size={20} className="text-purple-500" />,
    title: "Export Cards",
    desc: "Download your flashcard sets as JSON for backup or sharing with classmates.",
    color: "bg-purple-500/8",
  },
  {
    icon: <Upload size={20} className="text-amber-500" />,
    title: "Import Cards",
    desc: "Import a JSON file to instantly load a full set of flashcards someone else has prepared.",
    color: "bg-amber-500/8",
  },
];

const sciencePoints = [
  {
    title: "Active Recall",
    desc: "Retrieving information from memory — rather than re-reading — strengthens neural pathways and dramatically improves long-term retention.",
  },
  {
    title: "Spaced Repetition",
    desc: "Reviewing material at increasing intervals exploits the 'spacing effect', reducing forgetting by up to 40% compared to massed practice.",
  },
  {
    title: "The Testing Effect",
    desc: "Research consistently shows that testing yourself is more effective than any passive study method, including highlighting and summarising.",
  },
];

export default function Features() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ── Page Header ── */}
      <section className="hero-gradient border-b border-border/60 py-16 md:py-20">
        <div className="container max-w-3xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <span className="tag-pill mb-4 inline-block">
              <Sparkles size={11} className="mr-1 inline" />
              Everything you need to study
            </span>
            <h1 className="text-4xl md:text-5xl font-serif text-foreground mt-2">
              Powerful features,<br />
              <em className="not-italic text-primary">beautifully simple</em>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl">
              Every feature is designed around one goal: helping you remember more in less time,
              using techniques backed by decades of cognitive science research.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Feature Showcase: Create ── */}
      <section className="py-20 bg-background">
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="space-y-5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <PenLine size={22} className="text-primary" />
            </div>
            <h2 className="text-3xl font-serif text-foreground">
              Create cards with ease
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The card creation interface is intentionally minimal — just a question field, an answer field,
              and optional tags. No distractions, no friction. Add a card in under 10 seconds.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Question & answer format", "Tag and category assignment", "Instant save to your library", "Edit or delete any card at any time"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/create">
              <Button className="gap-2 mt-2">
                Create a Card <ArrowRight size={15} />
              </Button>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-border/40"
          >
            <img src={CREATE_IMG} alt="Flashcard creation interface on a tablet" className="w-full h-auto" />
          </motion.div>
        </div>
      </section>

      {/* ── Feature Showcase: Organise ── */}
      <section className="py-20 bg-muted/20 border-y border-border/60">
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-border/40 order-2 md:order-1"
          >
            <img src={ORGANIZE_IMG} alt="Flashcard sets organised by subject" className="w-full h-auto" />
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="space-y-5 order-1 md:order-2"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
              <FolderOpen size={22} className="text-accent" />
            </div>
            <h2 className="text-3xl font-serif text-foreground">
              Organise by subject
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Group your flashcards into colour-coded sets for each subject or topic.
              Switch between Mathematics, Biology, History, or any custom category you define.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Named sets with custom colours", "Multiple cards per set", "Filter cards by tag", "Create unlimited sets"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ── Feature Showcase: Review ── */}
      <section className="py-20 bg-background">
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="space-y-5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10">
              <Brain size={22} className="text-purple-500" />
            </div>
            <h2 className="text-3xl font-serif text-foreground">
              Review with spaced repetition
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Flip cards to reveal answers, then mark each one as known or needs review.
              The algorithm automatically schedules the next review based on your performance,
              showing difficult cards more frequently.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Smooth 3D flip animation", "Got it / Need review buttons", "Session progress bar", "Spaced repetition scheduling"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/review">
              <Button className="gap-2 mt-2 bg-purple-600 hover:bg-purple-700 text-white">
                Start Reviewing <ArrowRight size={15} />
              </Button>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-border/40"
          >
            <img src={REVIEW_IMG} alt="Flashcard flip animation" className="w-full h-auto" />
          </motion.div>
        </div>
      </section>

      {/* ── All Features Grid ── */}
      <section className="py-20 bg-muted/20 border-t border-border/60">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-12"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">All Features</p>
            <h2 className="text-3xl font-serif text-foreground">Everything in one place</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {coreFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="bg-card rounded-xl border border-border/60 p-5 hover-lift"
              >
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Science Section ── */}
      <section className="py-20 bg-background border-t border-border/60">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-12 max-w-xl"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">The Science</p>
            <h2 className="text-3xl font-serif text-foreground">
              Why flashcards work
            </h2>
            <p className="mt-3 text-muted-foreground">
              The effectiveness of flashcards is not opinion — it is backed by decades of peer-reviewed research in cognitive psychology.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {sciencePoints.map((p, i) => (
              <motion.div
                key={p.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="bg-card rounded-2xl border border-border/60 p-7"
              >
                <h3 className="font-serif text-xl text-foreground mb-3">{p.title}</h3>
                <div className="h-0.5 w-10 bg-primary/40 mb-4 rounded-full" />
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-primary/5 border-t border-border/60">
        <div className="container text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="space-y-5"
          >
            <h2 className="text-3xl font-serif text-foreground">Start learning today</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Example cards are already loaded. Jump into a review session or create your own set.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/create">
                <Button size="lg" className="gap-2 shadow-md">
                  Create Flashcards <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/review">
                <Button size="lg" variant="outline" className="bg-background">
                  Review Now
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
