import { Button } from "@party-planner/ui/components/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const unsubscribe = () => null;
const subscribe = () => unsubscribe;

/**
 * Theme toggle that renders a neutral placeholder until hydration completes,
 * so the icon never flashes the wrong state.
 */
export default function ThemeToggle() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = mounted && resolvedTheme === "dark";

  const renderIcon = () => {
    if (!mounted) {
      return <span className="size-4" aria-hidden />;
    }
    return isDark ? <Sun aria-hidden /> : <Moon aria-hidden />;
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {renderIcon()}
    </Button>
  );
}
