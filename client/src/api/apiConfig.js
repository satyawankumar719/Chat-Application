

export const API_CONFIG = { 
    
    API_BASE_URL :import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  ENDPOINTS : {
                LOGIN: '/auth/login',
            SIGNUP: '/auth/signup',
            SEND_OTP: '/auth/send-otp',
            VERIFY_OTP: '/auth/verify-otp',
            LOGOUT: '/auth/logout',
            FORGOT_PASSWORD: '/auth/forgot-password'

  }
}