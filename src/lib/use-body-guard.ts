import { useEffect } from "react";

export function useBodyGuard() {
  useEffect(() => {
    const check = () => {
      const hasOverlay =
        document.querySelector('[role="dialog"][aria-modal="true"]') ||
        document.querySelector('[data-radix-overlay]');
      if (!hasOverlay) {
        if (document.body.style.pointerEvents === "none") {
          document.body.style.pointerEvents = "";
        }
        if (document.body.style.overflow === "hidden") {
          document.body.style.overflow = "";
        }
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
    return () => observer.disconnect();
  }, []);
}
