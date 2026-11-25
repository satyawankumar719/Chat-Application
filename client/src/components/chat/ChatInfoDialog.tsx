import type { ReactNode, RefObject } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

interface ChatInfoDialogProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
  icon?: ReactNode;
  children: ReactNode;
}

export default function ChatInfoDialog({
  title,
  isOpen,
  onClose,
  returnFocusRef,
  icon,
  children,
}: ChatInfoDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup
            finalFocus={returnFocusRef}
            className="pointer-events-auto max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b pb-4">
              <Dialog.Title className="flex items-center gap-2 text-lg font-semibold">
                {icon}
                {title}
              </Dialog.Title>
              <Dialog.Close
                aria-label={`Close ${title}`}
                className="rounded-full p-1 hover:bg-muted"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
