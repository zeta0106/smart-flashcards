/**
 * Footer — Shared site footer
 * Design: Scholarly Minimal — understated, clean
 */
import { Link } from "wouter";
import { BookOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30 mt-auto">
      <div className="container py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen size={14} strokeWidth={2.5} />
          </div>
          <span className="font-serif text-base font-semibold text-foreground">
            Smart<span className="text-primary">Cards</span>
          </span>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/">
            <span className="hover:text-foreground transition-colors">Home</span>
          </Link>
          <Link href="/features">
            <span className="hover:text-foreground transition-colors">Features</span>
          </Link>
          <Link href="/create">
            <span className="hover:text-foreground transition-colors">Create</span>
          </Link>
          <Link href="/review">
            <span className="hover:text-foreground transition-colors">Review</span>
          </Link>
        </nav>

        {/* Tagline */}
        <p className="text-xs text-muted-foreground text-center">
          Study smarter with active recall &amp; spaced repetition.
        </p>
      </div>
    </footer>
  );
}
