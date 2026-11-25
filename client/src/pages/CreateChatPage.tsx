import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Search, UserPlus, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SearchResultCard from "@/components/chat/chatListContainer/searchResultCard";
import { queryApi } from "@/api/userApi";
import { invitationApi } from "@/api/invitationApi";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/input";
import { SearchLoader } from "@/components/ui/search-loader";
import { SEARCH_DEBOUNCE_MS } from "@/lib/searchDebounce";
import type { User } from "@/types";

function CreateChatPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const currentUserId = user?._id?.toString() || user?.id?.toString();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"error" | "success">("success");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchValue = query.trim();

  const updateQuery = (value: string) => {
    if (value.trim() !== searchValue) {
      setSearching(Boolean(value.trim()));
      setSearchResults([]);
      setSearchError("");
    }
    setQuery(value);
    setFeedback("");
  };

  useEffect(() => {
    if (!searchValue) return;

    let ignore = false;
    const timer = setTimeout(async () => {
      try {
        const res = await queryApi.searchUsers(searchValue);
        if (ignore) return;
        const users: User[] = res.data?.data || res.data || [];
        setSearchResults(
          users.filter((person) => (person._id || person.id)?.toString() !== currentUserId)
        );
      } catch {
        if (!ignore) setSearchError("Couldn’t search for people. Try again.");
      } finally {
        if (!ignore) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [searchValue, currentUserId]);

  const handleInvite = async (id: string) => {
    try {
      const res = await invitationApi.sendInvitation(id, message);

      setFeedback(res.data?.message || "Invitation sent successfully.");

      setFeedbackType("success");
      setMessage("");

      setTimeout(() => {
        navigate("/invitations");
      }, 800);
    } catch (err: any) {
      setFeedback(err.response?.data?.message || "Unable to send invitation");
      setFeedbackType("error");
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 sm:mb-8">
          <Link
            to="/chats"
            className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg pr-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Chats
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Start a new chat</h1>
        </header>

        <section
          aria-label="Find people"
          className="space-y-5 rounded-2xl border border-foreground/25 bg-card p-4 shadow-sm sm:p-6 dark:border-foreground/35"
        >
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              ref={searchInputRef}
              aria-label="Search by name or email"
              value={query}
              onChange={(event) => updateQuery(event.target.value.replace(/\s+/g, " ").trimStart())}
              placeholder="Search by name or email"
              className="h-12 w-full rounded-xl border border-foreground/20 bg-background pl-12 pr-12 text-base placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring/50 dark:border-foreground/25"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  updateQuery("");
                  searchInputRef.current?.focus();
                }}
                className="absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>

          {!searchValue && (
            <div className="flex flex-col items-center border-t border-border px-4 py-8 text-center sm:py-10">
              <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <UserPlus aria-hidden="true" className="size-5" />
              </div>
              <h2 className="text-base font-semibold">Find someone to invite</h2>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Search for a person, then send them an invitation to chat.
              </p>
            </div>
          )}

          {searchValue && searching && (
            <div className="border-t border-border">
              <SearchLoader />
            </div>
          )}

          {searchValue && !searching && (
            <div
              role="status"
              className="border-t border-border pt-4 text-sm text-muted-foreground"
            >
              {searchError ? (
                <span className="text-destructive">{searchError}</span>
              ) : searchResults.length === 0 ? (
                <span className="wrap-break-word">No people match “{searchValue}”.</span>
              ) : (
                <span>
                  {searchResults.length} {searchResults.length === 1 ? "result" : "results"}
                </span>
              )}
            </div>
          )}

          {feedback && (
            <p
              role="status"
              className={`rounded-lg px-3 py-2 text-sm ${
                feedbackType === "error"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-green-500/10 text-green-700 dark:text-green-400"
              }`}
            >
              {feedback}
            </p>
          )}

          {searchResults.length > 0 && (
            <>
              <div className="space-y-2">
                <label htmlFor="invite-message" className="text-sm font-medium">
                  Invitation message{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="invite-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Hi, let’s chat!"
                  className="h-11 rounded-xl"
                />
              </div>
              <ul className="space-y-2">
                {searchResults.map((person) => (
                  <SearchResultCard
                    key={person._id || person.id}
                    person={person}
                    onInvite={handleInvite}
                  />
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default CreateChatPage;
