import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Search, Shield, Crown, Sparkles } from "lucide-react";
import ChatContainer from "@/components/chat/ChatContainer";
import CreateGroupModal from "@/components/groupChat/createGroup";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import GroupInfoModal from "@/components/groupChat/GroupInfoModal";

export default function GroupChat() {
  const navigate = useNavigate();
  const { user, checkingAuth } = useAuthStore();
  const { chats, selectedChatId, loadingChats, setSelectedChatId, fetchChats } = useChatStore();

  const currentUserId = (user?._id || user?.id)?.toString();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [mobileViewChat, setMobileViewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  useEffect(() => {
    if (!checkingAuth && !user) {
      navigate("/login", { replace: true });
      return;
    }
    if (user) {
      fetchChats();
    }
  }, [user, checkingAuth, navigate, fetchChats]);

  const groupChats = chats.filter((c) => c.type === "group");

  useEffect(() => {
    if (loadingChats) return;

    const isSelectedGroupValid = groupChats.some((c) => c._id === selectedChatId);

    if (!isSelectedGroupValid) {
      if (groupChats.length > 0) {
        setSelectedChatId(groupChats[0]._id);
      } else if (selectedChatId !== null) {
        setSelectedChatId(null);
      }
    }
  }, [chats, selectedChatId, loadingChats, setSelectedChatId]);

  const filteredGroups = groupChats.filter((group) => {
    const matchesSearch =
      group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const myMemberObj = group.members?.find(
      (m) => (m.user?._id || m.user?.id || m.user)?.toString() === currentUserId
    );

    if (filterTab === "managed") {
      return ["owner", "admin"].includes(myMemberObj?.role);
    }
    if (filterTab === "member") {
      return myMemberObj?.role === "member";
    }
    return true;
  });

  const selectedGroup = groupChats.find((c) => c._id === selectedChatId) || null;

  const handleSelectGroup = (groupId) => {
    setSelectedChatId(groupId);
    setMobileViewChat(true);
  };

  const handleBack = () => {
    setMobileViewChat(false);
  };

  if (checkingAuth || !user) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <div className="flex h-full w-full">

        <aside
          className={`${mobileViewChat ? "hidden" : "flex"
            } md:flex h-full w-full flex-col md:w-[380px] md:flex-shrink-0 md:border-r md:border-border`}
        >

          <div className="border-b border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Group Chats</h2>
                  <p className="text-xs text-muted-foreground">
                    {groupChats.length} {groupChats.length === 1 ? "group" : "groups"} active
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateGroup(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-xs"
                title="Create New Group"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="w-full rounded-xl border border-border bg-muted/40 pl-9 pr-3 py-2 text-xs focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary transition"
              />
            </div>

            <div className="flex gap-1 rounded-lg bg-muted/50 p-1 text-xs">
              <button
                onClick={() => setFilterTab("all")}
                className={`flex-1 rounded-md py-1 font-medium transition ${filterTab === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterTab("managed")}
                className={`flex-1 rounded-md py-1 font-medium transition ${filterTab === "managed" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Managed
              </button>
              <button
                onClick={() => setFilterTab("member")}
                className={`flex-1 rounded-md py-1 font-medium transition ${filterTab === "member" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Member
              </button>
            </div>
          </div>

          {/* Group List Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loadingChats ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Loading groups...</span>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-4 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">No groups found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery
                      ? "Try searching for a different name."
                      : "You are not part of any groups yet."}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Your First Group</span>
                  </button>
                )}
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isSelected = selectedChatId === group._id;
                const myMemberObj = group.members?.find(
                  (m) => (m.user?._id || m.user?.id || m.user)?.toString() === currentUserId
                );
                const role = myMemberObj?.role || "member";

                const onlineCount =
                  group.members?.filter((m) => m.user?.isOnline).length || 0;

                const lastMsg = group.lastMessage?.content || "No messages yet";
                const time = group.lastMessage?.createdAt || group.updatedAt;

                let unread = 0;
                if (group.unreadCount && currentUserId) {
                  if (typeof group.unreadCount.get === "function") {
                    unread = group.unreadCount.get(currentUserId) || 0;
                  } else if (typeof group.unreadCount === "object") {
                    unread = group.unreadCount[currentUserId] || 0;
                  }
                }

                return (
                  <button
                    key={group._id}
                    onClick={() => handleSelectGroup(group._id)}
                    className={`flex items-center gap-3 w-full rounded-xl border p-3 text-left transition ${isSelected
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-transparent bg-card hover:border-border"
                      }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 font-bold text-primary text-sm">
                      {group.name?.[0]?.toUpperCase() || "G"}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="truncate font-semibold text-sm text-foreground">
                            {group.name}
                          </p>
                          {role === "owner" && (
                            <span title="Owner">
                              <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            </span>
                          )}
                          {role === "admin" && (
                            <span title="Admin">
                              <Shield className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            </span>
                          )}
                        </div>

                        {time && (
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                            {new Date(time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      <p className="truncate text-xs text-muted-foreground mt-0.5">
                        {lastMsg}
                      </p>

                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          <span>{group.members?.length || 0} members</span>
                          <span>•</span>
                          <span className="text-green-600 font-semibold">{onlineCount} online</span>
                        </span>

                        {unread > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-xs animate-bounce">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section
          className={`${mobileViewChat ? "flex" : "hidden"
            } md:flex h-full flex-1`}
        >
          {selectedGroup ? (
            <ChatContainer chat={selectedGroup} onBack={handleBack} setShowGroupInfo={setShowGroupInfo} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center bg-muted/10">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-4">
                <Users className="h-10 w-10" />
                <Sparkles className="h-5 w-5 absolute -top-1 -right-1 text-amber-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Select a Group</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-2 leading-relaxed">
                Choose a group chat from the sidebar to view messages, share files, and collaborate with your team in real time.
              </p>

              <button
                onClick={() => setShowCreateGroup(true)}
                className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Group</span>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />


    </div>
  );
}