/**
 * 404 Not Found — Smart Flashcards
 * Design: Scholarly Minimal
 */
import { Button } from "@/components/ui/button";
import { BookOpen, Home } from "lucide-react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <BookOpen size={36} className="text-primary" />
            </div>
          </div>
          <div>
            <p className="text-7xl font-serif font-semibold text-foreground/10">404</p>
            <h1 className="text-3xl font-serif text-foreground mt-2">Page not found</h1>
            <p className="text-muted-foreground mt-3">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>
          <Link href="/">
            <Button className="gap-2">
              <Home size={16} /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
