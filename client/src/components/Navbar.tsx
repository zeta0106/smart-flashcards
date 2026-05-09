/**
 * Navbar — Shared top navigation bar
 * Design: Scholarly Minimal — clean, sticky, with subtle backdrop blur
 */
import { Link, useLocation } from "wouter";
import { BookOpen, Plus, RotateCcw, Layers, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/create", label: "Create" },
  { href: "/review", label: "Review" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
            <BookOpen size={16} strokeWidth={2.5} />
          </div>
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            Smart<span className="text-primary">Cards</span>
          </span>
        </Link>

        {/* Nav Links — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  location === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <Link href="/create">
            <Button size="sm" className="hidden sm:flex gap-1.5 shadow-sm">
              <Plus size={15} />
              New Card
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm" variant="outline" className="hidden sm:flex gap-1.5 bg-background">
              <LayoutDashboard size={14} />
              Dashboard
            </Button>
          </Link>
          {/* Mobile menu icon */}
          <MobileMenu location={location} />
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ location }: { location: string }) {
  return (
    <div className="md:hidden">
      <details className="group relative">
        <summary className="list-none flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background cursor-pointer">
          <Layers size={18} className="text-muted-foreground" />
        </summary>
        <div className="absolute right-0 top-11 z-50 min-w-[160px] rounded-xl border border-border bg-background shadow-lg p-1.5">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className={cn(
                  "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </details>
    </div>
  );
}
