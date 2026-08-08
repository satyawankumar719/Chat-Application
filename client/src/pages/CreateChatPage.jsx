import React, { useEffect, useState } from "react";
import { UserPlus, Search, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SearchResultCard from "@/components/chat/chatListContainer/SearchResultCard";
import { queryApi } from "@/api/userApi";
import { invitationApi } from "@/api/invitationApi";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function CreateChatPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const currentUserId = user?._id?.toString() || user?.id?.toString();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("info");

  const handleSearch = async (value) => {
    const searchValue = value.trim();

    if (!searchValue) {
      setSearchResults([]);
      setFeedback("");
      return;
    }

    setSearching(true);
    setFeedback("");

    try {
      const res = await queryApi.searchUsers(searchValue);

      const users = res.data?.data || res.data || [];

      const filteredUsers = users.filter(
        (u) =>
          u._id?.toString() !== currentUserId &&
          u.id?.toString() !== currentUserId
      );

      if (!filteredUsers.length) {
        setFeedback("No users found.");
        setFeedbackType("info");
      }

      setSearchResults(filteredUsers);
    } catch (error) {
      setSearchResults([]);
      setFeedback("Something went wrong searching users.");
      setFeedbackType("error");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleInvite = async (id) => {
    try {
      const res = await invitationApi.sendInvitation(id, message);

      setFeedback(
        res.data?.message || "Invitation sent successfully."
      );

      setFeedbackType("success");
      setMessage("");

      setTimeout(() => {
        navigate("/invitations");
      }, 800);
    } catch (err) {
      setFeedback(
        err.response?.data?.message || "Unable to send invitation"
      );
      setFeedbackType("error");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-2 -ml-2 text-muted-foreground"
        >
          &larr; Back
        </Button>

        <h1 className="text-2xl font-semibold tracking-tight">
          Start a new chat
        </h1>

        <p className="text-sm text-muted-foreground">
          Search people by name or email and send an invite
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />

          <Input
            value={query}
            onChange={(e) => {
              const value = e.target.value
                .replace(/\s+/g, " ")
                .trimStart();

              setQuery(value);
            }}
            placeholder="Search users to invite..."
            className="border-0 p-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {query && (
          <div className="mb-3 rounded-lg bg-muted/40 p-3">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Personal message (optional)
            </label>

            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, let's chat!"
            />
          </div>
        )}

        {feedback && (
          <p
            className={`mb-2 rounded-lg px-3 py-2 text-xs ${
              feedbackType === "error"
                ? "bg-destructive/10 text-destructive"
                : feedbackType === "success"
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {feedback}
          </p>
        )}

        {searching && (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">
            Searching...
          </p>
        )}

        {!searching &&
          searchResults.length === 0 &&
          query &&
          !feedback && (
            <div className="px-1 py-8 text-center text-xs text-muted-foreground">
              No users match "{query}".
            </div>
          )}

        {!searching && searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((person) => (
              <SearchResultCard
                key={person._id || person.id}
                person={person}
                message={message}
                setMessage={setMessage}
                onInvite={handleInvite}
              />
            ))}
          </div>
        )}

        {!query && (
          <div className="flex flex-col items-center justify-center gap-2 px-1 py-10 text-center text-sm text-muted-foreground">
            <UserPlus className="h-8 w-8 text-muted-foreground/50" />

            <p>
              Type above to find someone to chat with.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/chats")}
        >
          Go to chats
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default CreateChatPage;