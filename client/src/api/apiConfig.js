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
      SEARCH: "/users/search"
    },
    INVITATIONS: {
      SEND: "/invitation/send",
      ACCEPT: (id) => `/invitation/${id}/accept`,
      REJECT: (id) => `/invitation/${id}/reject`,
      PENDING: "/invitation/pending"
    },
    MESSAGES: {
      CHATS: "/messages/chats",
      UPLOAD: "/messages/upload",
      UPLOAD_MULTIPLE: "/messages/upload/multiple",
      BY_CHAT_ID: (chatId, page = 1, limit = 20) =>
        `/messages/${chatId}?page=${page}&limit=${limit}`,
    },
    GROUPS: {
      BASE: "/groups",
      BY_ID: (groupId) => `/groups/${groupId}`,
      MEMBERS: (groupId) => `/groups/${groupId}/members`,
      MEMBER_BY_ID: (groupId, memberId) => `/groups/${groupId}/members/${memberId}`,
      MEMBER_ROLE: (groupId, memberId) => `/groups/${groupId}/members/${memberId}/role`,
      LEAVE: (groupId) => `/groups/${groupId}/leave`,
      INVITATION : (groupId,recieverId) => `/groups/${groupId}/invite/${recieverId}`
    }
  }
};

