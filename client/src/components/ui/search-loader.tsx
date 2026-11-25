import { Loader2 } from "lucide-react";

export function SearchLoader() {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground"
    >
      <Loader2 aria-hidden="true" className="size-4 text-primary motion-safe:animate-spin" />
      <span>Searching…</span>
    </div>
  );
}
