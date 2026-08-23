import { create } from "zustand";
import { authApi } from "@/api/authApi";
import { useChatStore } from "./chatStore";
import { useSocketStore } from "./socketStore";
import { useInvitationStore } from "./invitationStore";
import type {
  AuthState,
  AuthResult,
  ApiFieldError,
  LoginData,
  SignupData,
  SendOtpData,
  VerifyOtpData,
  ForgotPasswordData,
  ResetPasswordData,
  User,
} from "@/types";

function handleError(error: any): AuthResult {
  let message = "Something went wrong";
  if (error?.response?.data?.message) {
    message = error.response.data.message;
  } else if (error?.message) {
    message = error.message;
  }

  let errors: ApiFieldError[] | null = null;
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    errors = error.response.data.errors;
    const fieldMessages = error.response.data.errors.map(
      (e: ApiFieldError) => e.message || String(e)
    );
    const joined = fieldMessages.join(", ");
    if (joined.length > 0) {
      message = joined;
    }
  }

  return {
    success: false,
    message: message,
    errors: errors,
  };
}

function clearEverythingOnClient() {
  (useChatStore.getState() as any).reset?.();
  (useInvitationStore.getState() as any).reset?.();
  (useSocketStore.getState() as any).disconnectSocket?.();
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  setUser: (userObject: User | null) => {
    set({ user: userObject });
  },

  checkAuth: async (): Promise<AuthResult> => {
    try {
      set({ checkingAuth: true });

      const response = await authApi.me();
      const userData: User | null = response.data?.user || response.data?.data || null;
      set({ user: userData, checkingAuth: false });
      return { success: true, user: userData };
    } catch (err: any) {
      clearEverythingOnClient();
      set({ user: null, checkingAuth: false });
      return handleError(err);
    }
  },

  login: async (loginData: LoginData): Promise<AuthResult> => {
    try {
      set({ loading: true });

      const response = await authApi.login(loginData);
      clearEverythingOnClient();

      const rawUser = response.data?.user || response.data?.data || null;
      const savedUser: User | null = rawUser
        ? { ...rawUser, token: response.data?.token || null }
        : null;
      set({ user: savedUser });

      return { success: true, message: response.data?.message };
    } catch (err: any) {
      return handleError(err);
    } finally {
      set({ loading: false });
    }
  },

  logout: async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
    } finally {
      clearEverythingOnClient();
      set({ user: null });
    }
  },

  sendOtp: async (data: SendOtpData): Promise<AuthResult> => {
    try {
      set({ loading: true });
      const response = await authApi.sendOtp(data);
      return { success: true, message: response.data?.message };
    } catch (err: any) {
      return handleError(err);
    } finally {
      set({ loading: false });
    }
  },

  verifyOtp: async (data: VerifyOtpData): Promise<AuthResult> => {
    try {
      set({ loading: true });
      const response = await authApi.verifyOtp(data);

      clearEverythingOnClient();
      const rawUser = response.data?.user || response.data?.data || null;
      const savedUser: User | null = rawUser
        ? { ...rawUser, token: response.data?.token || null }
        : null;
      set({ user: savedUser });

      return { success: true, message: response.data?.message };
    } catch (err: any) {
      return handleError(err);
    } finally {
      set({ loading: false });
    }
  },

  signup: async (data: SignupData): Promise<AuthResult> => {
    try {
      set({ loading: true });
      const response = await authApi.signup(data);
      return {
        success: true,
        message: response.data?.message,
        email: response.data?.email || data.email,
      };
    } catch (err: any) {
      return handleError(err);
    } finally {
      set({ loading: false });
    }
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<AuthResult> => {
    try {
      set({ loading: true });
      const response = await authApi.forgotPassword(data);
      return { success: true, message: response.data?.message };
    } catch (err: any) {
      return handleError(err);
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (data: ResetPasswordData): Promise<AuthResult> => {
    try {
      set({ loading: true });
      const response = await authApi.resetPassword(data);
      return { success: true, message: response.data?.message };
    } catch (err: any) {
      return handleError(err);
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (formData: FormData): Promise<AuthResult> => {
    try {
      set({ loading: true });
      const { queryApi } = await import("@/api/userApi");
      const response = await queryApi.updateProfile(formData);
      const updatedUser: User | null = response.data?.data || null;

      if (updatedUser) {
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                ...updatedUser,
              }
            : updatedUser,
        }));
      }

      return {
        success: true,
        message: response.data?.message || "Profile updated successfully.",
        user: updatedUser,
      };
    } catch (err: any) {
      return handleError(err);
    } finally {
      set({ loading: false });
    }
  },
}));
