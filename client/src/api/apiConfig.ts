export const API_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      SIGNUP: "/auth/signup",
      SEND_OTP: "/auth/send-otp",
      VERIFY_OTP: "/auth/verify-otp",
      LOGOUT: "/auth/logout",
      ME: "/auth/me",
      FORGOT_PASSWORD: "/auth/forgot-password",
      RESET_PASSWORD: "/auth/reset-password"
    },
    USERS: {
      SEARCH: "/users/search",
      PROFILE: "/users/profile"
    },
    INVITATIONS: {
      SEND: "/invitation/send",
      ACCEPT: (id: string) => `/invitation/${id}/accept`,
      REJECT: (id: string) => `/invitation/${id}/reject`,
      PENDING: "/invitation/pending"
    },
    MESSAGES: {
      CHATS: "/messages/chats",
      UPLOAD: "/messages/upload",
      UPLOAD_MULTIPLE: "/messages/upload/multiple",
      BY_CHAT_ID: (chatId: string, page = 1, limit = 20) =>
        `/messages/${chatId}?page=${page}&limit=${limit}`,
      EDIT: (id: string) => `/messages/${id}`,
      DELETE: (id: string) => `/messages/${id}`,
      MARK_READ: "/messages/read",
    },
    GROUPS: {
      BASE: "/groups",
      BY_ID: (groupId: string) => `/groups/${groupId}`,
      MEMBERS: (groupId: string) => `/groups/${groupId}/members`,
      MEMBER_BY_ID: (groupId: string, memberId: string) => `/groups/${groupId}/members/${memberId}`,
      MEMBER_ROLE: (groupId: string, memberId: string) => `/groups/${groupId}/members/${memberId}/role`,
      LEAVE: (groupId: string) => `/groups/${groupId}/leave`,
      INVITATION: (groupId: string, receiverId: string) => `/groups/${groupId}/invite/${receiverId}`
    }
  }
} as const;

