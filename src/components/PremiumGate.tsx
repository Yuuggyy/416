/**
 * PremiumGate — wrap du contenu premium avec CTA upgrade.
 * Usage : <PremiumGate> <ContenusPayants /> </PremiumGate>
 */
import { Zap } from "lucide-react";
import { useSubscription } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function PremiumBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 ${className}`}>
      <Zap className="h-2.5 w-2.5" /> Premium
    </span>
  );
}

export function PremiumGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { isPremium } = useSubscription();
  if (isPremium) return <>{children}</>;
  return (
    <>
      {fallback ?? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <p className="font-semibold text-sm">Contenu Premium</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Accédez à tout le contenu sans limite et sans pub pour 1,50$/mois.
          </p>
          <Button asChild size="sm" className="mt-1">
            <Link to="/premium">Passer Premium</Link>
          </Button>
        </div>
      )}
    </>
  );
}
