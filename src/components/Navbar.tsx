import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Film, Search, User as UserIcon } from "lucide-react";

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-md border-b border-border" : "bg-gradient-to-b from-background/80 to-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <Film className="h-6 w-6 text-primary" />
            <span className="font-display text-2xl font-bold text-gradient-gold tracking-wide">
              Lumière
            </span>
          </Link>
          {user && (
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link
                to="/"
                className={`transition-colors hover:text-primary ${path === "/" ? "text-foreground" : "text-muted-foreground"}`}
              >
                Accueil
              </Link>
              <Link
                to="/browse"
                className={`transition-colors hover:text-primary ${path.startsWith("/browse") ? "text-foreground" : "text-muted-foreground"}`}
              >
                Parcourir
              </Link>
              <Link
                to="/watchlist"
                className={`transition-colors hover:text-primary ${path === "/watchlist" ? "text-foreground" : "text-muted-foreground"}`}
              >
                Ma liste
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`transition-colors hover:text-primary flex items-center gap-1 ${path.startsWith("/admin") ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <Settings className="h-3.5 w-3.5" /> Admin
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[160px]">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/login" });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate({ to: "/login" })} size="sm">
              Connexion
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
