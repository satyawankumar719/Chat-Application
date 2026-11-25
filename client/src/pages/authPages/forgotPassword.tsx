import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, Mail, KeyRound, Loader2, RotateCw } from "lucide-react";
import { notify } from "@/lib/notify";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useAuthStore } from "@/store/authStore";
import { forgotPasswordSchema, resetPasswordSchema } from "@/validations/auth.validation";
import { ForgotPasswordData, ResetPasswordData } from "@/types";

const PasswordInput = ({
  id,
  label,
  placeholder,
  showPassword,
  onToggle,
  registration,
}: {
  id: string;
  label: string;
  placeholder: string;
  showPassword: boolean;
  onToggle: () => void;
  registration: any;
}) => {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          {...registration}
          className="pr-10 h-10"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

interface ResetPasswordFormValues {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export function ForgotPassword() {
  const navigate = useNavigate();

  const { forgotPassword, resetPassword, loading } = useAuthStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [timeLeft, setTimeLeft] = useState(300);

  const step1Form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const step2Form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onInvalidStep1 = (errors: any) => {
    const firstKey = Object.keys(errors)[0];
    if (firstKey && errors[firstKey]?.message) {
      notify.error(errors[firstKey].message);
    }
  };

  const onInvalidStep2 = (errors: any) => {
    const firstKey = Object.keys(errors)[0];
    if (firstKey && errors[firstKey]?.message) {
      notify.error(errors[firstKey].message);
    }
  };

  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const goToStepOne = () => {
    setStep(1);
    step1Form.clearErrors();
    step2Form.clearErrors();
  };

  const handleRequestOtp = async (data: ForgotPasswordData) => {
    const email = data.email.trim();
    const result = await forgotPassword({ email });

    if (!result.success) {
      const message = result.message || "Failed to send reset OTP";
      notify.error(message);
      return;
    }

    notify.success("OTP Sent!", result.message || "Password reset OTP sent to your email.");
    setSubmittedEmail(email);
    step2Form.setValue("email", email);
    setStep(2);
    setTimeLeft(300);
  };

  const handleResetPasswordSubmit = async (data: ResetPasswordData) => {
    if (timeLeft === 0) {
      notify.warning("OTP expired", "Please click Resend OTP to receive a new code.");
      return;
    }

    const result = await resetPassword({
      email: submittedEmail || data.email?.trim(),
      otp: data.otp?.trim(),
      newPassword: data.newPassword,
    });

    if (!result.success) {
      const message = result.message || "Failed to reset password";
      notify.error(message);
      return;
    }

    notify.success("Password reset successfully!", "Please login with your new password.");
    navigate("/login");
  };

  const handleResendOtp = async () => {
    step2Form.clearErrors();
    const email = submittedEmail || step2Form.getValues("email");

    if (!email) {
      notify.error("Email address missing. Please go back to Step 1.");
      setStep(1);
      return;
    }

    const result = await forgotPassword({ email });

    if (!result.success) {
      notify.error(result.message || "Failed to resend OTP");
      return;
    }

    setTimeLeft(300);
    notify.success("New OTP code sent to your email");
  };

  const otpRegister = step2Form.register("otp", {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = e.target.value.replace(/\D/g, "");
      step2Form.setValue("otp", sanitized, { shouldValidate: true });
    },
  });

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4 py-8">
      <Card className="w-full max-w-md rounded-3xl border border-border bg-card shadow-lg shadow-primary/5">
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

            <CardTitle className="text-2xl font-bold tracking-tight">
              {step === 1 ? "Forgot Password" : "Reset Password"}
            </CardTitle>
          </div>

          <CardDescription>
            {step === 1
              ? "Enter your registered email address and we'll send you an OTP to reset your password."
              : `Enter the 6-digit OTP sent to ${submittedEmail} and set your new password.`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 ? (
            <form
              onSubmit={step1Form.handleSubmit(handleRequestOtp, onInvalidStep1)}
              noValidate
              className="space-y-4"
            >
              <div className="grid gap-1.5">
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...step1Form.register("email")}
                  className="h-10"
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-4 h-10 font-semibold shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending OTP...
                  </span>
                ) : (
                  "Send Reset Code"
                )}
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
              onSubmit={step2Form.handleSubmit(handleResetPasswordSubmit, onInvalidStep2)}
              noValidate
              className="space-y-4"
            >
              <div className="flex flex-col gap-3.5">
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
                    {...otpRegister}
                    className="text-center tracking-widest text-lg font-mono h-11"
                  />
                </div>

                <PasswordInput
                  id="newPassword"
                  label="New Password"
                  placeholder="At least 6 characters"
                  showPassword={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                  registration={step2Form.register("newPassword")}
                />

                <PasswordInput
                  id="confirmPassword"
                  label="Confirm New Password"
                  placeholder="Re-enter your new password"
                  showPassword={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((prev) => !prev)}
                  registration={step2Form.register("confirmPassword")}
                />
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={loading || timeLeft > 240}
                  className="text-xs"
                >
                  <RotateCw className="mr-1.5 h-3.5 w-3.5" />
                  Resend Code
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full mt-2 h-10 font-semibold shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ForgotPassword;
