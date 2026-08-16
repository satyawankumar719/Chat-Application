import React, { useState } from "react";
import { Edit3, Trash2, X, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chatStore";

function MessageActionDialog({ message, isOpen, onClose }) {
  const [mode, setMode] = useState("select"); // "select" | "edit" | "delete"
  const [editedText, setEditedText] = useState(message?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editMessage = useChatStore((state) => state.editMessage);
  const deleteMessage = useChatStore((state) => state.deleteMessage);

  if (!isOpen || !message) return null;

  const handleSaveEdit = async () => {
    if (!editedText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await editMessage(message._id, editedText);
      if (res?.success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const res = await deleteMessage(message._id);
      if (res?.success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setMode("select");
    setEditedText(message?.content || "");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
          <h3 className="text-base font-semibold tracking-tight">
            {mode === "edit"
              ? "Edit Message"
              : mode === "delete"
              ? "Delete Message"
              : "Message Options"}
          </h3>
          <button
            onClick={handleCloseDialog}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X size={18} />
          </button>
        </div>

        {mode === "select" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground line-clamp-2 italic bg-muted/40 p-2.5 rounded-lg border border-border/40">
              "{message.content}"
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="flex items-center gap-3 w-full p-3 rounded-xl border border-border bg-background hover:bg-primary/10 hover:border-primary/40 transition text-left group cursor-pointer"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary group-hover:scale-105 transition-transform">
                  <Edit3 size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Edit Message</p>
                  <p className="text-xs text-muted-foreground">Modify content of your message</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("delete")}
                className="flex items-center gap-3 w-full p-3 rounded-xl border border-destructive/20 bg-background hover:bg-destructive/10 hover:border-destructive/40 transition text-left group cursor-pointer"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/15 text-destructive group-hover:scale-105 transition-transform">
                  <Trash2 size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-destructive">Delete Message</p>
                  <p className="text-xs text-muted-foreground">Remove this message from conversation</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {mode === "edit" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Edit Content
              </label>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 resize-none"
                placeholder="Type your message..."
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode("select")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSubmitting || !editedText.trim()}
                className="gap-1.5"
              >
                <Check size={14} />
                <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
              </Button>
            </div>
          </div>
        )}

        {mode === "delete" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-destructive/10 p-3 text-destructive border border-destructive/20">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold">Confirm Deletion</p>
                <p className="opacity-90">
                  Are you sure you want to delete this message? This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2 italic bg-muted/40 p-2.5 rounded-lg border border-border/40">
              "{message.content}"
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode("select")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="gap-1.5"
              >
                <Trash2 size={14} />
                <span>{isSubmitting ? "Deleting..." : "Delete Message"}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageActionDialog;
