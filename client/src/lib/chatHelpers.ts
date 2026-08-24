import { Chat, User, ChatMember } from "@/types";
import { useAuthStore } from "@/store/authStore";


export function getUserId(userObjOrId: User | string | null | undefined): string {
  if (!userObjOrId) return "";
  if (typeof userObjOrId === "string") return userObjOrId;
  return (userObjOrId._id || userObjOrId.id || "").toString();
}

export function getResolvedCurrentUserId(currentUserId?: string | null): string {
  if (currentUserId) return currentUserId.toString();
  const user = useAuthStore.getState().user;
  return getUserId(user);
}

export function getOtherUser(
  chat: Chat | null | undefined,
  currentUserId?: string | null
): User | null {
  if (!chat || !Array.isArray(chat.members) || chat.members.length === 0) {
    return null;
  }

  const myId = getResolvedCurrentUserId(currentUserId);

 
  let otherMemberObj: ChatMember | undefined;

  if (myId) {
    otherMemberObj = chat.members.find((member) => {
      const memberId = getUserId(member.user);
      return memberId && memberId !== myId;
    });
  }

  if (otherMemberObj && typeof otherMemberObj.user === "object" && otherMemberObj.user !== null) {
    return otherMemberObj.user as User;
  }

  for (const member of chat.members) {
    if (typeof member.user === "object" && member.user !== null) {
      const u = member.user as User;
      const uId = getUserId(u);
      if (!myId || (uId && uId !== myId)) {
        return u;
      }
    }
  }

  return null;
}
