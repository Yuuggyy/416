import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Film, Search, User as UserIcon, Sun, Moon, ShoppingCart, Menu, X } from "lucide-react";
import { useAppSettings } from "@/lib/app-settings";
import { useTheme } from "@/lib/theme";
import { useCart } from "@/lib/cart";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { settings } = useAppSettings();
  const { theme, toggle: toggleTheme } = useTheme();
  const { count: cartCount, open: openCart } = useCart();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkCls = (active: boolean) =>
    `transition-colors hover:text-primary ${active ? "text-foreground" : "text-muted-foreground"}`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-md border-b border-border" : "bg-gradient-to-b from-background/80 to-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-2">
        <div className="flex items-center gap-8 min-w-0">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={settings.app_name} className="h-8 w-8 rounded object-cover shrink-0" />
            ) : (
              <Film className="h-6 w-6 text-primary shrink-0" />
            )}
            <span className="font-display text-2xl sm:text-3xl text-foreground tracking-wide truncate">{settings.app_name || "416"}</span>
          </Link>
          {user && (
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link to="/" className={linkCls(path === "/")}>Accueil</Link>
              <Link to="/browse" className={linkCls(path.startsWith("/browse"))}>Films</Link>
              <Link to="/artists" className={linkCls(path.startsWith("/artists"))}>Artistes</Link>
              <Link to="/merch" className={linkCls(path.startsWith("/merch"))}>Boutique</Link>
              <Link to="/watchlist" className={linkCls(path === "/watchlist")}>Ma liste</Link>
              {isAdmin && (
                <Link to="/admin" className={`${linkCls(path.startsWith("/admin"))} flex items-center gap-1`}>
                  <Settings className="h-3.5 w-3.5" /> Admin
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Thème">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={openCart} aria-label="Panier" className="relative">
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">{cartCount}</span>
            )}
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" aria-label="Rechercher" className="hidden sm:inline-flex"><Link to="/search"><Search className="h-4 w-4" /></Link></Button>
              <Button asChild variant="ghost" size="sm" aria-label="Mon compte" className="hidden sm:inline-flex"><Link to="/account"><UserIcon className="h-4 w-4" /></Link></Button>
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate({ to: "/login" }); }} aria-label="Déconnexion" className="hidden sm:inline-flex"><LogOut className="h-4 w-4" /></Button>
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden" aria-label="Menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 bg-background border-border">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <div className="flex flex-col gap-1 mt-8 text-base">
                    {[
                      { to: "/", label: "Accueil" },
                      { to: "/browse", label: "Films" },
                      { to: "/artists", label: "Artistes" },
                      { to: "/merch", label: "Boutique" },
                      { to: "/watchlist", label: "Ma liste" },
                      { to: "/search", label: "Rechercher" },
                      { to: "/account", label: "Mon compte" },
                      ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
                    ].map((l) => (
                      <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="px-3 py-3 rounded-md hover:bg-accent">
                        {l.label}
                      </Link>
                    ))}
                    <button
                      onClick={async () => { setMobileOpen(false); await signOut(); navigate({ to: "/login" }); }}
                      className="text-left px-3 py-3 rounded-md hover:bg-accent flex items-center gap-2 text-destructive"
                    >
                      <LogOut className="h-4 w-4" /> Déconnexion
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <Button onClick={() => navigate({ to: "/login" })} size="sm">Connexion</Button>
          )}
        </div>
      </div>
    </header>
  );
}
