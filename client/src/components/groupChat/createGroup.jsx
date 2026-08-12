import React, { useState, useEffect } from "react";
import { Users, X, Search, Check } from "lucide-react";
import { queryApi } from "@/api/userApi";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";

export default function CreateGroupModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const { createGroup } = useChatStore();
  const currentUserId = user?._id?.toString() || user?.id?.toString();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUserIds([]);
      setSelectedUsers([]);
      setError("");
      return;
    }

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await queryApi.searchUsers(trimmedQuery);
        let users = res.data?.data || res.data || [];
        setSearchResults(users.filter((u) => (u._id || u.id)?.toString() !== currentUserId));
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUserId, isOpen]);

  if (!isOpen) return null;

  const toggleSelectUser = (u) => {
    const id = (u._id || u.id).toString();
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds((prev) => prev.filter((i) => i !== id));
      setSelectedUsers((prev) => prev.filter((item) => (item._id || item.id).toString() !== id));
    } else {
      setSelectedUserIds((prev) => [...prev, id]);
      setSelectedUsers((prev) => [...prev, u]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a group name.");
      return;
    }
    if (selectedUserIds.length === 0) {
      setError("Please select at least one member.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await createGroup({ name, description, memberIds: selectedUserIds });
      setName("");
      setDescription("");
      setSelectedUserIds([]);
      setSelectedUsers([]);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create group.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Users className="h-5 w-5 text-primary" />
            <span>Create New Group</span>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive font-medium">{error}</div>}

          <div>
            <label className="text-xs font-medium text-muted-foreground">Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Team"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Add Members</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </div>

            {selectedUsers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {selectedUsers.map((u) => (
                  <span
                    key={u._id || u.id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary font-medium"
                  >
                    {u.name}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => toggleSelectUser(u)}
                    />
                  </span>
                ))}
              </div>
            )}

            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
              {!searchQuery.trim() ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  Type a name or email to search users to add.
                </div>
              ) : searching ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  Searching users...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  No users match "{searchQuery}".
                </div>
              ) : (
                searchResults.map((u) => {
                  const uid = (u._id || u.id).toString();
                  const isSelected = selectedUserIds.includes(uid);
                  const isFriend = u.connectionStatus === "connected";
                  return (
                    <div
                      key={uid}
                      onClick={() => toggleSelectUser(u)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted text-sm ${
                        isSelected ? "bg-primary/10" : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{u.name}</p>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              isFriend
                                ? "bg-green-500/15 text-green-700 dark:text-green-400"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            }`}
                          >
                            {isFriend ? "Friend (Direct Add)" : "Invite Needed"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}