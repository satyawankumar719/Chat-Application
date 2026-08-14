import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useAuthStore } from "@/store/authStore";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  formatZodErrors,
  validateFieldWithZod,
} from "@/validations/auth.validation";
const FieldError = ({ message }) => {
  if (!message) return null;

  return (
    <p className="text-xs text-red-500 font-medium">
      {message}
    </p>
  );
};
const PasswordInput = ({
  id,
  label,
  placeholder,
  value,
  error,
  showPassword,
  onToggle,
  onChange,
  onBlur,
}) => {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`pr-10 ${
            error
              ? "border-red-500 focus-visible:ring-red-500"
              : ""
          }`}
          required
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      <FieldError message={error} />
    </div>
  );
};
export function ForgotPassword() {
  const navigate = useNavigate();

  const {
    forgotPassword,
    resetPassword,
    loading,
  } = useAuthStore();

  const [step, setStep] = useState(1);

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
  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);
  const clearErrors = () => {
    setErrors({});
  };

  const goToStepOne = () => {
    setStep(1);
    clearErrors();
  };

  const getSchema = () => {
    return step === 1
      ? forgotPasswordSchema
      : resetPasswordSchema;
  };
  const handleChange = (e) => {
    const { id, value } = e.target;

    const sanitizedValue =
      id === "otp"
        ? value.replace(/\D/g, "")
        : value;

    setFormData((prev) => ({
      ...prev,
      [id]: sanitizedValue,
    }));

    if (errors[id]) {
      const errorMessage = validateFieldWithZod(
        getSchema(),
        id,
        sanitizedValue
      );

      setErrors((prev) => ({
        ...prev,
        [id]: errorMessage,
      }));
    }
  };
  const handleBlur = (e) => {
    const { id, value } = e.target;

    const errorMessage = validateFieldWithZod(
      getSchema(),
      id,
      value
    );

    setErrors((prev) => ({
      ...prev,
      [id]: errorMessage,
    }));
  };


  // --------------------
  // Step 1
  // Request OTP
  // --------------------
  const handleRequestOtp = async (e) => {
    e.preventDefault();

    clearErrors();

    const email = formData.email.trim();

    const validationResult =
      forgotPasswordSchema.safeParse({ email });

    if (!validationResult.success) {
      const formattedErrors = formatZodErrors(
        validationResult.error
      );

      setErrors(formattedErrors);

      const firstError =
        Object.values(formattedErrors)[0] ||
        "Invalid email address";

      toast.error(firstError);

      return;
    }

    const result = await forgotPassword({ email });

    if (!result.success) {
      const message =
        result.message || "Failed to send reset OTP";

      setErrors({ email: message });
      toast.error(message);

      return;
    }

    toast.success(
      result.message ||
        "Password reset OTP sent to your email"
    );

    setStep(2);
    setTimeLeft(300);
  };


  // --------------------
  // Step 2
  // Reset Password
  // --------------------
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();

    clearErrors();

    if (timeLeft === 0) {
      const message =
        "OTP expired. Please resend.";

      toast.warning(
        "OTP has expired. Please click Resend OTP."
      );

      setErrors({ otp: message });

      return;
    }

    const email = formData.email.trim();
    const otp = formData.otp.trim();

    const validationResult =
      resetPasswordSchema.safeParse({
        email,
        otp,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

    if (!validationResult.success) {
      const formattedErrors = formatZodErrors(
        validationResult.error
      );

      setErrors(formattedErrors);

      const firstError =
        Object.values(formattedErrors)[0] ||
        "Please check your inputs";

      toast.error(firstError);

      return;
    }

    const result = await resetPassword({
      email,
      otp,
      newPassword: formData.newPassword,
    });

    if (!result.success) {
      const message =
        result.message || "Failed to reset password";

      setErrors({ general: message });
      toast.error(message);

      return;
    }

    toast.success(
      "Password reset successfully! Please login with your new password."
    );

    navigate("/login");
  };
  const handleResendOtp = async () => {
    clearErrors();

    const email = formData.email.trim();

    if (!email) {
      toast.error(
        "Email address missing. Please go back to Step 1."
      );

      setStep(1);

      return;
    }

    const result = await forgotPassword({ email });

    if (!result.success) {
      toast.error(
        result.message || "Failed to resend OTP"
      );

      return;
    }

    setTimeLeft(300);

    toast.success(
      "A new OTP code has been sent to your email"
    );
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
                onClick={goToStepOne}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            <CardTitle className="text-xl font-bold">
              {step === 1
                ? "Forgot Password"
                : "Reset Password"}
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
            <form
              onSubmit={handleRequestOtp}
              noValidate
            >
              <div className="grid gap-1.5">

                <Label
                  htmlFor="email"
                  className="flex items-center gap-1.5"
                >
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
                  className={
                    errors.email
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  required
                />

                <FieldError message={errors.email} />

              </div>


              <Button
                type="submit"
                className="w-full mt-6"
                disabled={loading}
              >
                {loading
                  ? "Sending OTP..."
                  : "Send Reset Code"}
              </Button>


              <div className="mt-4 text-center">
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Login
                </Link>
              </div>

            </form>
          ) : (
            <form
              onSubmit={handleResetPasswordSubmit}
              noValidate
            >
              <div className="flex flex-col gap-4">
                <div className="grid gap-1.5">

                  <div className="flex justify-between items-center">

                    <Label
                      htmlFor="otp"
                      className="flex items-center gap-1.5"
                    >
                      <KeyRound className="w-4 h-4 text-muted-foreground" />
                      6-Digit OTP Code
                    </Label>

                    <span className="text-xs font-mono text-muted-foreground">
                      {Math.floor(timeLeft / 60)}:
                      {String(timeLeft % 60).padStart(2, "0")}
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
                      errors.otp
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                    required
                  />

                  <FieldError message={errors.otp} />

                </div>
                <PasswordInput
                  id="newPassword"
                  label="New Password"
                  placeholder="At least 6 characters"
                  value={formData.newPassword}
                  error={errors.newPassword}
                  showPassword={showPassword}
                  onToggle={() =>
                    setShowPassword((prev) => !prev)
                  }
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <PasswordInput
                  id="confirmPassword"
                  label="Confirm New Password"
                  placeholder="Re-enter your new password"
                  value={formData.confirmPassword}
                  error={errors.confirmPassword}
                  showPassword={showConfirmPassword}
                  onToggle={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  onChange={handleChange}
                  onBlur={handleBlur}
                />

              </div>


              {/* General Error */}
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
                  onClick={goToStepOne}
                >
                  Change Email
                </Button>

              </div>
              <Button
                type="submit"
                className="w-full mt-4"
                disabled={loading}
              >
                {loading
                  ? "Resetting Password..."
                  : "Reset Password"}
              </Button>
              <div className="mt-4 text-center">
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Login
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