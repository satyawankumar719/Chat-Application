import { create } from "zustand";
import { authApi } from "@/api/authApi";
import { useChatStore } from "./chatStore";
import { useSocketStore } from "./socketStore";

const handleError = (err) => {
  let message = err.response?.data?.message || err.message || "Something went wrong";
  if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
    const fieldErrs = err.response.data.errors.map((e) => e.message).join(", ");
    if (fieldErrs) {
      message = fieldErrs;
    }
  }
  return {
    message,
    errors: err.response?.data?.errors || null,
    success: false,
  };
};

const resetClientSession = () => {
  useChatStore.getState().reset();
  useSocketStore.getState().disconnectSocket();
};

export const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  setUser: (user) => set({ user }),

  checkAuth: async () => {
    try {
      set({ checkingAuth: true });
      const res = await authApi.me();
      const user = res.data?.user || res.data?.data || null;
      set({ user, checkingAuth: false });
      return { success: true, user };
    } catch (err) {
      resetClientSession();
      set({ user: null, checkingAuth: false });
      return handleError(err);
    }
  },

  login: async (data) => {
    try {
      set({ loading: true });
      const res = await authApi.login(data);
      resetClientSession();
      const user = res.data.user || res.data.data || null;
      set({ user: user ? { ...user, token: res.data.token || null } : null });
      return { message: res.data.message, success: true };
    } catch (err) {
      return handleError(err);
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors and still clear the client session
    } finally {
      resetClientSession();
      set({ user: null });
    }
  },

  sendOtp: async (data) => {
    try {
      set({ loading: true });
      const res = await authApi.sendOtp(data);
      return { message: res.data.message, success: true };
    } catch (err) {
      return handleError(err);
    } finally {
      set({ loading: false });
    }
  },

  verifyOtp: async (data) => {
    try {
      set({ loading: true });
      const res = await authApi.verifyOtp(data);
      resetClientSession();
      const user = res.data.user || res.data.data || null;
      set({ user: user ? { ...user, token: res.data.token || null } : null });
      return { message: res.data.message, success: true };
    } catch (err) {
      return handleError(err);
    } finally {
      set({ loading: false });
    }
  },

  signup: async (data) => {
    try {
      set({ loading: true });
      const res = await authApi.signup(data);
      resetClientSession();
      const user = res.data.user || res.data.data || null;
      set({ user: user ? { ...user, token: res.data.token || null } : null });
      return { message: res.data.message, success: true };
    } catch (err) {
      return handleError(err);
    } finally {
      set({ loading: false });
    }
  },

  forgotPassword: async (data) => {
    try {
      set({ loading: true });
      const res = await authApi.forgotPassword(data);
      return { message: res.data.message, success: true };
    } catch (err) {
      return handleError(err);
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (data) => {
    try {
      set({ loading: true });
      const res = await authApi.resetPassword(data);
      return { message: res.data.message, success: true };
    } catch (err) {
      return handleError(err);
    } finally {
      set({ loading: false });
    }
  },
}));