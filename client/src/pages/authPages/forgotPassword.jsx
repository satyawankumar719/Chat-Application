import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  formatZodErrors,
  validateFieldWithZod,
} from "@/validations/auth.validation";
import { Eye, EyeOff, ArrowLeft, Mail, KeyRound } from "lucide-react";

export function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword, loading } = useAuthStore();

  const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);

  // OTP Countdown timer
  useEffect(() => {
    let timer;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    const sanitizedValue = id === "otp" ? value.replace(/\D/g, "") : value;

    setFormData((prev) => ({
      ...prev,
      [id]: sanitizedValue,
    }));

    if (errors[id]) {
      const currentSchema = step === 1 ? forgotPasswordSchema : resetPasswordSchema;
      const errorMsg = validateFieldWithZod(currentSchema, id, sanitizedValue);
      setErrors((prev) => ({ ...prev, [id]: errorMsg }));
    }
  };

  const handleBlur = (e) => {
    const { id, value } = e.target;
    const currentSchema = step === 1 ? forgotPasswordSchema : resetPasswordSchema;
    const errorMsg = validateFieldWithZod(currentSchema, id, value);
    setErrors((prev) => ({ ...prev, [id]: errorMsg }));
  };

  // Step 1: Request Password Reset OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrors({});

    const validationResult = forgotPasswordSchema.safeParse({ email: formData.email.trim() });
    if (!validationResult.success) {
      const formattedErrors = formatZodErrors(validationResult.error);
      setErrors(formattedErrors);
      const firstError = Object.values(formattedErrors)[0] || "Invalid email address";
      toast.error(firstError);
      return;
    }

    const result = await forgotPassword({ email: formData.email.trim() });

    if (result.success) {
      toast.success(result.message || "Password reset OTP sent to your email");
      setStep(2);
      setTimeLeft(300);
    } else {
      setErrors({ email: result.message || "Failed to send reset OTP" });
      toast.error(result.message || "Failed to send reset OTP");
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (timeLeft === 0) {
      toast.warning("OTP has expired. Please click Resend OTP.");
      setErrors({ otp: "OTP expired. Please resend." });
      return;
    }

    const validationResult = resetPasswordSchema.safeParse({
      email: formData.email.trim(),
      otp: formData.otp.trim(),
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    });

    if (!validationResult.success) {
      const formattedErrors = formatZodErrors(validationResult.error);
      setErrors(formattedErrors);
      const firstError = Object.values(formattedErrors)[0] || "Please check your inputs";
      toast.error(firstError);
      return;
    }

    const result = await resetPassword({
      email: formData.email.trim(),
      otp: formData.otp.trim(),
      newPassword: formData.newPassword,
    });

    if (result.success) {
      toast.success("Password reset successfully! Please login with your new password.");
      navigate("/login");
    } else {
      setErrors({ general: result.message || "Failed to reset password" });
      toast.error(result.message || "Failed to reset password");
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setErrors({});
    if (!formData.email) {
      toast.error("Email address missing. Please go back to Step 1.");
      setStep(1);
      return;
    }

    const result = await forgotPassword({ email: formData.email.trim() });
    if (result.success) {
      setTimeLeft(300);
      toast.success("A new OTP code has been sent to your email");
    } else {
      toast.error(result.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center px-4 bg-background text-foreground">
      <Card className="w-full max-w-md border shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            {step === 2 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStep(1);
                  setErrors({});
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <CardTitle className="text-xl font-bold">
              {step === 1 ? "Forgot Password" : "Reset Password"}
            </CardTitle>
          </div>
          <CardDescription>
            {step === 1
              ? "Enter your registered email address and we'll send you an OTP to reset your password."
              : `Enter the 6-digit OTP sent to ${formData.email} and set your new password.`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 ? (
            /* Step 1: Request OTP Form */
            <form onSubmit={handleRequestOtp} noValidate>
              <div className="flex flex-col gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                    required
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 font-medium">{errors.email}</p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full mt-6" disabled={loading}>
                {loading ? "Sending OTP..." : "Send Reset Code"}
              </Button>

              <div className="mt-4 text-center">
                <Link to="/login" className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>
            </form>
          ) : (
            /* Step 2: Verify OTP & Reset Password Form */
            <form onSubmit={handleResetPasswordSubmit} noValidate>
              <div className="flex flex-col gap-4">
                {/* 6 Digit OTP Input */}
                <div className="grid gap-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="otp" className="flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-muted-foreground" />
                      6-Digit OTP Code
                    </Label>
                    <span className="text-xs font-mono text-muted-foreground">
                      {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                    </span>
                  </div>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={formData.otp}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`text-center tracking-widest text-lg font-mono ${
                      errors.otp ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                    required
                  />
                  {errors.otp && (
                    <p className="text-xs text-red-500 font-medium">{errors.otp}</p>
                  )}
                </div>

                {/* New Password */}
                <div className="grid gap-1.5">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={formData.newPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`pr-10 ${errors.newPassword ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-xs text-red-500 font-medium">{errors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="grid gap-1.5">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`pr-10 ${errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 font-medium">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {errors.general && (
                <div className="mt-4 p-2 text-sm rounded bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
                  {errors.general}
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep(1);
                    setErrors({});
                  }}
                >
                  Change Email
                </Button>
              </div>

              <Button type="submit" className="w-full mt-4" disabled={loading}>
                {loading ? "Resetting Password..." : "Reset Password"}
              </Button>

              <div className="mt-4 text-center">
                <Link to="/login" className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ForgotPassword;