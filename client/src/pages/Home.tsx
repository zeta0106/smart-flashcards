/**
 * Home Page — Smart Flashcards
 * Design: Scholarly Minimal
 * Sections: Hero, Stats, How It Works, CTA Banner
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Shuffle, TrendingUp, BookOpen, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663639498628/7eNft99ZZ4sqZJ9ZBqcCEe/hero-flashcards-HvwW99HT82x7CTkTxiwFkk.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.55 },
  }),
};

const stats = [
  { value: "2×", label: "Better retention with active recall" },
  { value: "40%", label: "Less study time with spaced repetition" },
  { value: "∞", label: "Flashcard sets you can create" },
];

const howItWorks = [
  {
    step: "01",
    icon: <BookOpen size={22} className="text-primary" />,
    title: "Create Your Cards",
    desc: "Add questions and answers, assign categories and tags. Build your personal knowledge library.",
  },
  {
    step: "02",
    icon: <Shuffle size={22} className="text-accent" />,
    title: "Organise by Subject",
    desc: "Group cards into sets — Mathematics, Biology, History, or any topic you choose.",
  },
  {
    step: "03",
    icon: <Brain size={22} className="text-primary" />,
    title: "Review & Recall",
    desc: "Flip cards, test yourself, and mark what you know. The algorithm schedules harder cards more often.",
  },
  {
    step: "04",
    icon: <TrendingUp size={22} className="text-accent" />,
    title: "Track Progress",
    desc: "Watch your mastery grow with session progress bars and per-card performance history.",
  },
];

const benefits = [
  "Active recall strengthens long-term memory",
  "Spaced repetition reduces forgetting",
  "Self-testing beats passive re-reading",
  "Bite-sized sessions fit any schedule",
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden hero-gradient">
        <div className="container py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          {/* Text side */}
          <div className="space-y-7">
            <motion.div
              initial="hidden"
              animate="visible"
              custom={0}
              variants={fadeUp}
            >
              <span className="tag-pill mb-4 inline-block">
                <Zap size={11} className="mr-1 inline" />
                Active Recall · Spaced Repetition
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight text-foreground">
                Smart Flashcards<br />
                <em className="not-italic text-primary">for Effective</em><br />
                Learning
              </h1>
            </motion.div>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
              className="text-lg text-muted-foreground leading-relaxed max-w-lg"
            >
              Flashcards are one of the most proven study tools in cognitive science.
              By forcing your brain to <strong className="text-foreground font-medium">actively retrieve</strong> information,
              you build deeper, longer-lasting memories — far more effectively than re-reading notes.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeUp}
              className="flex flex-wrap gap-3"
            >
              <Link href="/create">
                <Button size="lg" className="gap-2 shadow-md hover:shadow-lg transition-shadow">
                  Start Making Flashcards
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/review">
                <Button size="lg" variant="outline" className="gap-2 bg-background">
                  Review Cards
                </Button>
              </Link>
            </motion.div>

            {/* Benefits checklist */}
            <motion.ul
              initial="hidden"
              animate="visible"
              custom={3}
              variants={fadeUp}
              className="space-y-2"
            >
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 size={15} className="text-accent shrink-0" />
                  {b}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border/40">
              <img
                src={HERO_IMG}
                alt="Flashcards spread on a study desk"
                className="w-full h-auto object-cover"
                loading="eager"
              />
              {/* Overlay badge */}
              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-lg border border-border/60">
                <p className="text-xs text-muted-foreground">Cards reviewed today</p>
                <p className="text-2xl font-serif font-semibold text-foreground">24 <span className="text-accent text-base">↑ 12%</span></p>
              </div>
            </div>
            {/* Decorative blob */}
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-primary/8 blur-2xl -z-10" />
            <div className="absolute -bottom-6 -left-6 w-40 h-40 rounded-full bg-accent/8 blur-2xl -z-10" />
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-border/60 bg-background">
        <div className="container py-10">
          <div className="grid grid-cols-3 divide-x divide-border/60">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="text-center px-4 py-4"
              >
                <p className="text-3xl md:text-4xl font-serif font-semibold text-primary">{s.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 bg-background">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-12 max-w-xl"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-serif text-foreground">
              Four steps to mastery
            </h2>
            <p className="mt-3 text-muted-foreground">
              A simple, science-backed workflow that fits into any study routine.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <motion.div
                key={item.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="group relative bg-card rounded-2xl border border-border/60 p-6 hover-lift"
              >
                <span className="absolute top-4 right-5 text-4xl font-serif font-bold text-border/60 select-none">
                  {item.step}
                </span>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  {item.icon}
                </div>
                <h3 className="font-serif text-lg text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16 bg-primary/5 border-y border-border/60">
        <div className="container text-center space-y-5">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-3xl md:text-4xl font-serif text-foreground">
              Ready to study smarter?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Your first set of example cards is already waiting. Start reviewing now, or create your own.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/create">
                <Button size="lg" className="gap-2 shadow-md">
                  Create Flashcards
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/features">
                <Button size="lg" variant="outline" className="bg-background">
                  Explore Features
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
