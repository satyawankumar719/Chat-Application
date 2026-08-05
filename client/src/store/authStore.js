import { create } from "zustand";
import { authApi } from "@/api/authApi";
import { useChatStore } from "./chatStore";
import { useSocketStore } from "./socketStore";

function handleError(error) {

  let message = "Something went wrong";
  if (error.response?.data?.message) {
    message = error.response.data.message;
  } else if (error.message) {
    message = error.message;
  }

  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    const fieldMessages = error.response.data.errors.map((e) => e.message);
    const joined = fieldMessages.join(", ");
    if (joined.length > 0) {
      message = joined;
    }
  }return {
    success: false,
    message: message,
    errors: error.response?.data?.errors || null,
  };
}

function clearEverythingOnClient() {
 useChatStore.getState().reset();
useSocketStore.getState().disconnectSocket();
}
export const useAuthStore = create(function (set) {
  return {
     user: null,            
    loading: false,       
    checkingAuth: true,  

    setUser: function (userObject) {
      set({ user: userObject });
    },
    checkAuth: async function () {
      try {
        set({ checkingAuth: true });

        const response = await authApi.me();
          const userData = response.data?.user || response.data?.data || null;
           set({ user: userData, checkingAuth: false });
        return { success: true, user: userData };
      } catch (err) {
        clearEverythingOnClient();
        set({ user: null, checkingAuth: false });
        return handleError(err);
      }
    },
    login: async function (loginData) {
      try {
        set({ loading: true });

        const response = await authApi.login(loginData);
        clearEverythingOnClient();

        const rawUser = response.data.user || response.data.data || null;
        const savedUser = rawUser ? { ...rawUser, token: response.data.token || null } : null;
        set({ user: savedUser });

        return { success: true, message: response.data.message };
      } catch (err) {
        return handleError(err);
      } finally {
        set({ loading: false });
      }
    },
    logout: async function () {
      try {
        await authApi.logout();
      } catch (ignoreThisError) {
      } finally {
        clearEverythingOnClient();
        set({ user: null });
      }
    },
    sendOtp: async function (data) {
      try {
        set({ loading: true });
        const response = await authApi.sendOtp(data);
        return { success: true, message: response.data.message };
      } catch (err) {
        return handleError(err);
      } finally {
        set({ loading: false });
      }
    },
    verifyOtp: async function (data) {
      try {
        set({ loading: true });
        const response = await authApi.verifyOtp(data);

        clearEverythingOnClient();
      const rawUser = response.data.user || response.data.data || null;
        const savedUser = rawUser ? { ...rawUser, token: response.data.token || null } : null;
        set({ user: savedUser });

        return { success: true, message: response.data.message };
      } catch (err) {
        return handleError(err);
      } finally {
        set({ loading: false });
      }
    },
    signup: async function (data) {
      try {
        set({ loading: true });
        const response = await authApi.signup(data);

        clearEverythingOnClient();

        const rawUser = response.data.user || response.data.data || null;
        const savedUser = rawUser ? { ...rawUser, token: response.data.token || null } : null;
        set({ user: savedUser });

        return { success: true, message: response.data.message };
      } catch (err) {
        return handleError(err);
      } finally {
        set({ loading: false });
      }
    },

    forgotPassword: async function (data) {
      try {
        set({ loading: true });
        const response = await authApi.forgotPassword(data);
        return { success: true, message: response.data.message };
      } catch (err) {
        return handleError(err);
      } finally {
        set({ loading: false });
      }
    },
    resetPassword: async function (data) {
      try {
        set({ loading: true });
        const response = await authApi.resetPassword(data);
        return { success: true, message: response.data.message };
      } catch (err) {
        return handleError(err);
      } finally {
        set({ loading: false });
      }
    },
  };
});
