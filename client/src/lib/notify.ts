import { toast } from "sonner";

/**
 * Formats raw database or server errors into friendly user messages
 */
function cleanRawErrorMessage(msg: string): string {
  if (!msg) return "An unexpected error occurred";

  // Check for MongoDB E11000 duplicate key error
  if (msg.includes("E11000") || msg.toLowerCase().includes("duplicate key")) {
    if (msg.includes("phoneNumber") || msg.includes("phone")) {
      return "This phone number is already registered. Please use another one.";
    }
    if (msg.includes("email")) {
      return "This email is already registered. Please login or use another email.";
    }
    // Generic duplicate key match
    const match = msg.match(/dup key:\s*\{\s*(\w+):/);
    if (match && match[1]) {
      const field = match[1];
      const formattedField = field.charAt(0).toUpperCase() + field.slice(1);
      return `${formattedField} is already in use. Please choose another one.`;
    }
    return "This record already exists. Please check your details.";
  }

  // Network / server connection issues
  if (msg.includes("Network Error") || msg.includes("ERR_CONNECTION_REFUSED")) {
    return "Unable to connect to the server. Please check your internet connection.";
  }

  return msg;
}

/**
 * Extracts a human-readable error message from an unknown error or Axios response
 */
export function getErrorMessage(error: any, fallback = "An unexpected error occurred"): string {
  if (!error) return fallback;

  if (typeof error === "string") return cleanRawErrorMessage(error);

  // Axios response error
  const resData = error.response?.data;
  if (resData) {
    if (typeof resData === "string") return cleanRawErrorMessage(resData);
    if (resData.message) return cleanRawErrorMessage(resData.message);
    if (resData.error) {
      const errStr = typeof resData.error === "string" ? resData.error : JSON.stringify(resData.error);
      return cleanRawErrorMessage(errStr);
    }
    if (Array.isArray(resData.errors) && resData.errors.length > 0) {
      const first = resData.errors[0];
      return cleanRawErrorMessage(first.message || String(first));
    }
  }

  if (error.message) return cleanRawErrorMessage(error.message);

  return fallback;
}

export const notify = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3500,
    });
  },

  error: (error: any, fallbackMessage?: string) => {
    const msg = getErrorMessage(error, fallbackMessage || "Something went wrong");
    toast.error(msg, {
      duration: 5000,
    });
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 3500,
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4000,
    });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },
};
