import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUTS = [
  ["⌘ K", "Open the command palette"],
  ["?", "Show keyboard shortcuts"],
  ["g o", "Go to overview"],
  ["g q", "Go to queues"],
  ["g e", "Go to exchanges"],
  ["g c", "Go to connections"],
  ["g u", "Go to users"],
  ["g v", "Go to virtual hosts"],
  ["g p", "Go to policies"],
  ["g l", "Go to limits"],
  ["g f", "Go to feature flags"],
  ["g d", "Go to deprecated features"],
  ["g k", "Go to cluster"],
  ["g i", "Go to import / export"],
  ["d", "Toggle dark mode"],
  ["⌘ B", "Collapse the sidebar"],
  ["Esc", "Close the current layer"],
];

type Props = {
  open: boolean;
  onClose: () => void;
}

export default function ShortcutsDialog({open, onClose}: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Move around the management UI without a mouse.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col divide-y divide-border">
          {SHORTCUTS.map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <kbd className="border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                {keys}
              </kbd>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
