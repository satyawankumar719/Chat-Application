import { create } from "zustand";
import { authApi } from "@/api/authApi";

const handleError = (err) => {
  return {
    message: err.response?.data?.message || "Something went wrong",
    success: false,
  };
};

export const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  setUser: (user) => set({ user }),

 

  login: async (data) => {
    console.log(data)
    try {
      set({ loading: true });

      const res = await authApi.login(data);

      set({
        user: res.data.data,
      });

      return {
        message: res.data.message,
        success: true,
      };
    } catch (err) {
      return handleError(err);
    } finally {
      set({
        loading: false,
      });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();

      set({
        user: null,
      });
    } catch {
      set({
        user: null,
      });
    }
  },

  sendOtp: async (data) => {
    try {
      set({ loading: true });

      const res = await authApi.sendOtp(data);

      return {
        message: res.data.message,
        success: true,
      };
    } catch (err) {
      return handleError(err);
    } finally {
      set({
        loading: false,
      });
    }
  },

  verifyOtp: async (data) => {
    try {
      set({ loading: true });

      const res = await authApi.verifyOtp(data);

      return {
        message: res.data.message,
        success: true,
      };
    } catch (err) {
      return handleError(err);
    } finally {
      set({
        loading: false,
      });
    }
  },

  signup: async (data) => {
    try {
      set({ loading: true });

      const res = await authApi.signup(data);

      set({
        user: res.data.data,
      });

      return {
        message: res.data.message,
        success: true,
      };
    } catch (err) {
      return handleError(err);
    } finally {
      set({
        loading: false,
      });
    }
  },

  forgotPassword: async (data) => {
    try {
      set({ loading: true });

      const res = await authApi.forgotPassword(data);

      return {
        message: res.data.message,
        success: true,
      };
    } catch (err) {
      return handleError(err);
    } finally {
      set({
        loading: false,
      });
    }
  },

  resetPassword: async (data) => {
    try {
      set({ loading: true });

      const res = await authApi.resetPassword(data);

      return {
        message: res.data.message,
        success: true,
      };
    } catch (err) {
      return handleError(err);
    } finally {
      set({
        loading: false,
      });
    }
  },

 
  
}));