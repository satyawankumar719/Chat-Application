import React, { useRef, useState, useEffect } from "react";
import { Users, X, UserPlus, Shield, UserMinus, Search, Check, Edit2, LogOut, Save, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { queryApi } from "@/api/userApi";
import { invitationApi } from "@/api/invitationApi";

export default function GroupInfoModal({ isOpen, onClose, chat }) {
  const { user } = useAuthStore();
  const { addGroupMembers, removeGroupMember, updateGroupMemberRole, updateGroupInfo, leaveGroup, deleteGroup } =
    useChatStore();
  const currentUserId = (user?._id || user?.id)?.toString();

  const [showAddMembers, setShowAddMembers] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteMsg, setInviteMsg] = useState({});
  const [invitingUserId, setInvitingUserId] = useState(null);

  useEffect(() => {
    if (chat) {
      setName(chat.name || "");
      setDescription(chat.description || "");
    }
  }, [chat]);

  const currentMember = chat?.members?.find(
    (m) => (m.user?._id || m.user?.id || m.user)?.toString() === currentUserId
  );
  const isAdminOrOwner = ["owner", "admin"].includes(currentMember?.role);

  const [searching, setSearching] = useState(false);
  const searchSeqRef = useRef(0);

  useEffect(() => {
    if (!showAddMembers) {
      setSearchResults([]);
      return;
    }

    const queryToUse = searchQuery.trim();

    if (!queryToUse) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const currentSeq = ++searchSeqRef.current;

    const timer = setTimeout(async () => {
      try {
        const res = await queryApi.searchUsers(queryToUse);


        if (currentSeq !== searchSeqRef.current) return;

        const rawUsers = res.data?.data || res.data || [];
        const users = Array.isArray(rawUsers) ? rawUsers : [];

        const memberIdSet = new Set(
          (chat?.members || []).map((m) => {
            const uid = m.user?._id || m.user?.id || m.user;
            return uid ? uid.toString() : "";
          })
        );

        const seenIds = new Set();
        const filtered = [];

        for (const u of users) {
          const uid = (u._id || u.id)?.toString();
          if (uid && uid !== currentUserId && !memberIdSet.has(uid) && !seenIds.has(uid)) {
            seenIds.add(uid);
            filtered.push(u);
          }
        }

        setSearchResults(filtered);
      } catch (err) {
        if (currentSeq === searchSeqRef.current) {
          console.error("Search users error in GroupInfoModal:", err);
          setSearchResults([]);
        }
      } finally {
        if (currentSeq === searchSeqRef.current) {
          setSearching(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, showAddMembers, chat?.members, currentUserId]);

  const handleSendInvitation = async (receiverId) => {
    try {
      setInvitingUserId(receiverId);
      setError("");
      setInviteSuccess("");
      const msg = inviteMsg[receiverId] || "";
      const res = await invitationApi.sendInvitation(receiverId, msg);

      setInviteSuccess(res.data?.message || "Invitation sent successfully.");

      setSearchResults((prev) =>
        prev.map((u) => {
          const uid = (u._id || u.id)?.toString();
          if (uid === receiverId) {
            return { ...u, connectionStatus: "pending_sent" };
          }
          return u;
        })
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to send invitation.");
    } finally {
      setInvitingUserId(null);
    }
  };



  if (!isOpen || !chat) return null;
  const toggleSelectUser = (u) => {
    const id = (u._id || u.id).toString();
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };



  const handleSaveInfo = async () => {
    if (!name.trim()) {
      setError("Group name cannot be empty.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await updateGroupInfo(chat._id, { name, description });
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Failed to update group info.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembersSubmit = async () => {
    if (selectedUserIds.length === 0) return;
    setLoading(true);
    setError("");
    try {
      await addGroupMembers(chat._id, selectedUserIds);
      setSelectedUserIds([]);
      setShowAddMembers(false);
    } catch (err) {
      setError(err.message || "Failed to add members.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setLoading(true);
    setError("");
    try {
      await removeGroupMember(chat._id, memberId);
    } catch (err) {
      setError(err.message || "Failed to remove member.");
    } finally {
      setLoading(false);
    }
  };



  const handleToggleAdmin = async (memberId, currentRole) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    setLoading(true);
    setError("");
    try {
      await updateGroupMemberRole(chat._id, memberId, newRole);
    } catch (err) {
      setError(err.message || "Failed to update role.");
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteGroup = async () => {
    setLoading(true);
    setError("");
    try {
      await deleteGroup(chat._id);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to delete group.");
    } finally {
      setLoading(false);
    }
  }
  const handleLeaveGroup = async () => {
    setLoading(true);
    setError("");
    try {
      await leaveGroup(chat._id);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to leave group.");
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
            <span>Group Info</span>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-4">

          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Group Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Group description..."
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setName(chat.name || "");
                      setDescription(chat.description || "");
                    }}
                    className="rounded-lg px-3 py-1 text-xs hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveInfo}
                    disabled={loading}
                    className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base text-foreground">{chat.name}</h4>
                  {isAdminOrOwner && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Edit Group Info"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {chat.description && (
                  <p className="mt-1 text-xs text-muted-foreground break-words">
                    {chat.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Members Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              Members ({chat.members?.length || 0})
            </span>
            {isAdminOrOwner && (
              <button
                onClick={() => setShowAddMembers(!showAddMembers)}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <UserPlus className="h-4 w-4" />
                {showAddMembers ? "Back to List" : "Add Members"}
              </button>
            )}
          </div>

          {showAddMembers ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s+/g, " ").trimStart();
                    setSearchQuery(value);
                  }}
                  placeholder="Search users by name, email or phone..."
                  className="w-full bg-transparent text-sm focus:outline-none"
                />

              </div>

              {inviteSuccess && (
                <p className="rounded-lg bg-green-500/10 p-2 text-xs text-green-700 dark:text-green-400 font-medium">
                  {inviteSuccess}
                </p>
              )}

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {!searchQuery.trim() ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Type a name, email, or phone number above to search users.
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
                    const status = u.connectionStatus;
                    const isFriend = status === "connected";
                    const isPendingSent = status === "pending_sent";
                    const isPendingReceived = status === "pending_received";

                    return (
                      <div
                        key={uid}
                        className={`p-2.5 rounded-lg border transition ${isSelected
                            ? "bg-primary/10 border-primary"
                            : "bg-card border-border hover:border-primary/40"
                          }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div
                            onClick={() => {
                              if (isFriend) toggleSelectUser(u);
                            }}
                            className={`flex items-center gap-2.5 flex-1 min-w-0 ${isFriend ? "cursor-pointer" : ""
                              }`}
                          >
                            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary text-xs">
                              {u.name?.[0]?.toUpperCase() || "U"}
                              {u.isOnline && (
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm truncate">{u.name}</p>
                                <span
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isFriend
                                      ? "bg-green-500/15 text-green-700 dark:text-green-400"
                                      : isPendingSent
                                        ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                                        : isPendingReceived
                                          ? "bg-purple-500/15 text-purple-700 dark:text-purple-400"
                                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                    }`}
                                >
                                  {isFriend
                                    ? "Friend (Direct Add)"
                                    : isPendingSent
                                      ? "Invite Sent"
                                      : isPendingReceived
                                        ? "Invite Received"
                                        : "Not Connected"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>

                          {isFriend ? (
                            <button
                              type="button"
                              onClick={() => toggleSelectUser(u)}
                              className="shrink-0 p-1.5 rounded-md hover:bg-muted text-primary"
                            >
                              {isSelected ? (
                                <Check className="h-5 w-5 text-primary" />
                              ) : (
                                <span className="text-xs font-medium text-primary hover:underline">+ Select</span>
                              )}
                            </button>
                          ) : !isPendingSent && !isPendingReceived ? (
                            <button
                              type="button"
                              disabled={invitingUserId === uid}
                              onClick={() => handleSendInvitation(uid)}
                              className="shrink-0 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span>{invitingUserId === uid ? "Sending..." : "Send Invite"}</span>
                            </button>
                          ) : null}
                        </div>

                        {!isFriend && !isPendingSent && !isPendingReceived && (
                          <input
                            type="text"
                            value={inviteMsg[uid] || ""}
                            onChange={(e) => setInviteMsg({ ...inviteMsg, [uid]: e.target.value })}
                            placeholder="Personal message (optional)..."
                            className="mt-2 w-full rounded-md border border-border bg-background px-2.5 py-1 text-xs focus:outline-none focus:border-primary"
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>


              <button
                onClick={handleAddMembersSubmit}
                disabled={loading || selectedUserIds.length === 0}
                className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Adding..." : `Add Selected (${selectedUserIds.length})`}
              </button>
            </div>
          ) : (
            <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
              {chat.members?.map((m) => {
                const u = m.user;
                if (!u) return null;
                const uid = (u._id || u.id)?.toString();
                const isMe = uid === currentUserId;
                const isOnline = u.isOnline;

                const myRole = currentMember?.role;
                const targetRole = m.role;

                const canManageRole = myRole === "owner" && !isMe && targetRole !== "owner";
                const canRemoveMember = !isMe && targetRole !== "owner" && (
                  myRole === "owner" || (myRole === "admin" && targetRole === "member")
                );

                return (
                  <div
                    key={uid}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary text-xs">
                        {u.name?.[0]?.toUpperCase() || "U"}
                        <span
                          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                            isOnline ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {u.name} {isMe && "(You)"}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1">
                          <span className="capitalize text-primary font-medium">{m.role}</span>
                          <span>•</span>
                          <span>{isOnline ? "Online" : "Offline"}</span>
                        </p>
                      </div>
                    </div>

                    {(canManageRole || canRemoveMember) && (
                      <div className="flex items-center gap-1">
                        {canManageRole && (
                          <button
                            title={m.role === "admin" ? "Demote to member" : "Make Admin"}
                            onClick={() => handleToggleAdmin(uid, m.role)}
                            className={`p-1.5 rounded-md hover:bg-muted ${
                              m.role === "admin"
                                ? "text-primary font-semibold"
                                : "text-muted-foreground"
                            }`}
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                        )}

                        {canRemoveMember && (
                          <button
                            title="Remove from group"
                            onClick={() => handleRemoveMember(uid)}
                            className="p-1.5 rounded-md text-destructive hover:bg-destructive/10"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          )}

          {/* Leave Group Section */}
          <div className="pt-3 border-t">
            {confirmLeave ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 space-y-2">
                <p className="text-xs font-semibold text-destructive">
                  Are you sure you want to leave this group?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmLeave(false)}
                    className="rounded-lg px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLeaveGroup}
                    disabled={loading}
                    className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
                  >
                    {loading ? "Leaving..." : "Yes, Leave Group"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmLeave(true)}
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Leave Group</span>
              </button>
            )}
          </div>

          {isAdminOrOwner && (
            <div className="pt-3 border-t">
              {confirmDelete ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 space-y-2">
                  <p className="text-xs font-semibold text-destructive">
                    Are you sure you want to delete this group? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-lg px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteGroup}
                      disabled={loading}
                      className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
                    >
                      {loading ? "Deleting..." : "Yes, Delete Group"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Group</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
