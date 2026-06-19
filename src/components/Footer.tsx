import { MessageCircle } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/243977555768";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-border bg-background/80">
      <div className="container mx-auto flex flex-col items-center gap-3 px-4 py-6 text-center text-xs text-muted-foreground sm:text-sm">
        <p>© {year} 416 Records. Tous droits réservés.</p>
        <p className="flex flex-wrap items-center justify-center gap-1">
          <span>Conçu et développé par</span>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/10 px-2.5 py-1 font-medium text-[#25D366] transition-colors hover:bg-[#25D366]/20"
            aria-label="Contacter Inspire by YuuStore sur WhatsApp"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Inspire by YuuStore
          </a>
        </p>
      </div>
    </footer>
  );
}
