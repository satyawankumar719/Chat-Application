import type { ComponentProps } from "react";
import type { User } from "@/types";
import ChatInfoDialog from "./ChatInfoDialog";

type ContactInfoDialogProps = Pick<
  ComponentProps<typeof ChatInfoDialog>,
  "isOpen" | "onClose" | "returnFocusRef"
> & {
  user: User | null;
  statusText: string;
};

export default function ContactInfoDialog({
  user,
  statusText,
  ...dialogProps
}: ContactInfoDialogProps) {
  const avatarUrl = typeof user?.avatar === "string" ? user.avatar : user?.avatar?.url;

  return (
    <ChatInfoDialog title="Contact Info" {...dialogProps}>
      {user ? (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-xl font-semibold text-primary">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span aria-hidden="true">{user.name?.[0]?.toUpperCase() || "U"}</span>
              )}
            </div>
            <div className="min-w-0 wrap-break-word">
              <h3 className="font-semibold">{user.name || "Unknown contact"}</h3>
              <p className="text-sm text-muted-foreground">{statusText}</p>
            </div>
          </div>
          <dl className="divide-y divide-border rounded-xl border border-border bg-muted/20 text-sm">
            <div className="px-4 py-3">
              <dt className="font-semibold">About</dt>
              <dd className="mt-1 whitespace-pre-wrap wrap-break-word text-muted-foreground">
                {user.bio?.trim() || "No bio added"}
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="font-semibold">Email address</dt>
              <dd className="mt-1 wrap-break-word text-muted-foreground">
                {user.email?.trim() || "Not provided"}
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="font-semibold">Mobile number</dt>
              <dd className="mt-1 wrap-break-word text-muted-foreground">
                {user.phoneNumber?.trim() || "Not provided"}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Contact information is unavailable.</p>
      )}
    </ChatInfoDialog>
  );
}
