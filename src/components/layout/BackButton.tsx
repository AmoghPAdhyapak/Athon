import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

/**
 * Persistent "back" affordance rendered top-left of the content area by Shell.
 * Uses real browser history (so it respects the actual navigation stack) and
 * falls back to Home when there is no in-app history to pop. Hidden on the
 * root route, where going "back" would leave the app.
 */
export function BackButton() {
  const [location, setLocation] = useLocation();

  if (location === "/" || location === "") return null;

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-5">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="group inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.04] px-3.5 py-2 text-sm font-medium text-foreground/80 backdrop-blur-xl transition-colors hover:border-foreground/20 hover:bg-foreground/[0.08] hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back
      </button>
    </div>
  );
}
