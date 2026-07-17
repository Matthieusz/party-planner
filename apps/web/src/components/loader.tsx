import { Loader2 } from "lucide-react";

export default function Loader() {
  return (
    <output className="flex h-full min-h-40 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
      <span className="sr-only">Loading…</span>
    </output>
  );
}
