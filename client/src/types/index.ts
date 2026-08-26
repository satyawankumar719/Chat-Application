export interface UserAvatar {
  url?: string;
  publicId?: string;
}

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  avatar?: UserAvatar | string;
  bio?: string;
  isVerified?: boolean;
  provider?: "local" | "google";
  googleId?: string | null;
  isOnline?: boolean;
  lastSeen?: string | Date;
  role?: "user" | "admin";
  token?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface ApiFieldError {
  message: string;
  field?: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: User | null;
  email?: string;
  isVerified?: boolean;
  errors?: ApiFieldError[] | null;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface SendOtpData {
  email: string;
}

export interface VerifyOtpData {
  email: string;
  otp: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email?: string;
  otp?: string;
  newPassword?: string;
  password?: string;
  confirmPassword?: string;
  token?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  checkingAuth: boolean;

  setUser: (userObject: User | null) => void;
  checkAuth: () => Promise<AuthResult>;
  login: (loginData: LoginData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  sendOtp: (data: SendOtpData) => Promise<AuthResult>;
  verifyOtp: (data: VerifyOtpData) => Promise<AuthResult>;
  signup: (data: SignupData) => Promise<AuthResult>;
  forgotPassword: (data: ForgotPasswordData) => Promise<AuthResult>;
  resetPassword: (data: ResetPasswordData) => Promise<AuthResult>;
  updateProfile: (data: FormData | { name?: string; bio?: string; avatarUrl?: string; avatarKey?: string }) => Promise<AuthResult>;
}

export interface Attachment {
  type: "image" | "file" | string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  publicId?: string;
  [key: string]: any;
}

export interface RawFileItem {
  file: File;
  preview: string;
  [key: string]: any;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  isReconnecting?: boolean;
}

export interface PendingUpload {
  tempId: string;
  uploadId: string;
  chatId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  sender: string | null;
  status: string;
  createdAt: string;
}

export interface ChatMessage {
  _id: string;
  id?: string;
  chat: string;
  sender: User | string;
  content: string;
  status?: "sending" | "sent" | "delivered" | "read" | "failed" | string;
  isDeleted?: boolean;
  isEdited?: boolean;
  type?: "image" | "file" | "text" | "system" | string;
  attachments?: Attachment[];
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  createdAt: string;
  updatedAt?: string;
  
  tempId?: string;
  uploadId?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadStatus?: "uploading" | "upload_completed" | "upload_failed" | "upload_interrupted" | string;
  uploadError?: string | null;
  isFailed?: boolean;
  abortController?: AbortController | null;
  rawFileItems?: RawFileItem[];
  isReconnecting?: boolean;
  attachment?: Attachment;
  [key: string]: any;
}

export interface ChatMember {
  user: User | string;
  role?: "admin" | "member" | string;
  joinedAt?: string;
}

export interface Chat {
  _id: string;
  id?: string;
  name?: string;
  type: "direct" | "group" | string;
  members: ChatMember[];
  admin?: User | string;
  groupAvatar?: UserAvatar | string;
  groupDescription?: string;
  lastMessage?: ChatMessage | null;
  unreadCount?: Record<string, number> | any;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface ChatState {
  chats: Chat[];
  messages: ChatMessage[];
  selectedChatId: string | null;
  previousSelectedChatId: string | null;
  loadingChats: boolean;
  loadingMessages: boolean;
  loadingMore: boolean;
  sendingMessage: boolean;
  page: number;
  hasMore: boolean;
  isTyping: boolean;
  socketListenersAttached: boolean;
  error: string | null;
  onlineUserIds: string[];

  reset: () => void;
  addChat: (newChat: Chat) => void;
  setSelectedChatId: (chatId: string | null) => void;
  initSocketListeners: () => void;
  handleUserStatusChanged: (userId: string, isOnline: boolean, lastSeen?: string | Date) => void;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId?: string | null, page?: number) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  getTotalUnreadCount: () => number;
  handleIncomingMessage: (data: { message?: ChatMessage }) => void;
  cancelUpload: (messageId: string) => void;
  updateMessageProgress: (tempId: string, progress: number) => void;
  updateMessageUploadState: (tempId: string, updates: Partial<ChatMessage>) => void;
  retryUpload: (tempId: string, chosenFile?: File | null) => Promise<void>;
  sendMessage: (
    chatId: string,
    content?: string,
    attachments?: any[]
  ) => Promise<ChatMessage | null>;
  messageStatusUpdate: (messageId: string, newStatus: string) => void;
  editMessage: (messageId: string, newContent: string) => Promise<{ success: boolean; message?: string }>;
  deleteMessage: (messageId: string) => Promise<{ success: boolean; message?: string }>;
}

export interface Invitation {
  _id: string;
  type: "direct" | "group" | string;
  sender?: User;
  invitedBy?: User;
  receiver?: User;
  group?: Chat;
  status: "pending" | "accepted" | "rejected" | string;
  message?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface GroupState {
  loading: boolean;
  error: string | null;
  initGroupListeners: () => void;
  createGroup: (groupData: any) => Promise<{ success: boolean; group?: Chat; error?: string }>;
  updateGroupInfo: (groupId: string, data: any) => Promise<{ success: boolean; group?: Chat; error?: string }>;

  addMembers: (groupId: string, memberIds: string[]) => Promise<{ success: boolean; group?: Chat; error?: string }>;
  removeMember: (groupId: string, memberId: string) => Promise<{ success: boolean; group?: Chat; error?: string }>;
  updateMemberRole: (groupId: string, memberId: string, role: string) => Promise<{ success: boolean; group?: Chat; error?: string }>;
  leaveGroup: (groupId: string) => Promise<{ success: boolean; error?: string }>;
  deleteGroup: (groupId: string) => Promise<{ success: boolean; error?: string }>;
  sendGroupInvitation: (groupId: string, receiverId: string, message?: string) => Promise<{ success: boolean; invitation?: Invitation; error?: string }>;
}

export interface InvitationState {
  pendingInvitations: Invitation[];
  loadingInvitations: boolean;
  actionLoadingId: string | null;
  invitationMessage: string | null;

  reset: () => void;
  fetchPendingInvitations: () => Promise<void>;
  handleInvitationReceived: (data: any) => void;
  handleInvitationAccepted: (data: any) => void;
  handleInvitationRejected: (data: any) => void;
  acceptInvitation: (invitationId: string) => Promise<any>;
  rejectInvitation: (invitationId: string) => Promise<any>;
  initInvitationListeners: () => void;
}

export interface SocketState {
  socket: any | null;
  connected: boolean;

  connectSocket: () => any;
  disconnectSocket: () => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessageSocket: (
    chatId: string,
    content: string,
    tempId: string,
    ackCallback?: (res: any) => void,
    attachment?: Attachment | null,
    attachments?: Attachment[]
  ) => boolean;
  inviteUser: (receiverId: string) => void;
  markMessagesRead: (chatId: string) => void;
}