import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { notify } from "@/lib/notify";
import { verifyOtpSchema } from "@/validations/auth.validation";
import { VerifyOtpData } from "@/types";
import { KeyRound, ArrowLeft, Loader2, RotateCw } from "lucide-react";

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, sendOtp, loading } = useAuthStore();

  const [timeLeft, setTimeLeft] = useState(300);

  const email = (location.state as any)?.email || localStorage.getItem("pendingEmail") || "";

  const {
    register,
    handleSubmit,
    setValue,
  } = useForm<VerifyOtpData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      email: email,
      otp: "",
    },
  });

  const onInvalid = (fieldErrors: any) => {
    const firstKey = Object.keys(fieldErrors)[0];
    if (firstKey && fieldErrors[firstKey]?.message) {
      notify.error(fieldErrors[firstKey].message);
    }
  };

  useEffect(() => {
    setValue("email", email);
  }, [email, setValue]);

  useEffect(() => {
    if (!email) {
      notify.error("No pending email verification found. Please sign up again.");
      navigate("/signup");
    }
  }, [email, navigate]);

  useEffect(() => {
    let timer: any;

    if (timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleVerifyOtpSubmit = async (data: VerifyOtpData) => {
    if (timeLeft === 0) {
      notify.warning("OTP expired", "Please request a new OTP to continue.");
      return;
    }

    if (!email) {
      notify.error("Email missing. Please sign up again.");
      navigate("/signup");
      return;
    }

    const result = await verifyOtp({
      email,
      otp: data.otp.trim(),
    });

    if (result?.success) {
      localStorage.removeItem("pendingEmail");
      localStorage.removeItem("signupData");
      notify.success("Email verified!", result.message || "Welcome to ChatApp!");
      navigate("/chats");
    } else {
      const errMsg = result?.message || "Verification failed";
      notify.error(errMsg);
    }
  };

  const resendOtp = async () => {
    if (!email) {
      notify.error("No email found to resend OTP");
      return;
    }
    const result = await sendOtp({ email });
    if (result?.success) {
      setTimeLeft(300);
      notify.success("New OTP sent!", "Check your inbox for the code.");
    } else {
      const errMsg = result?.message || "Failed to resend OTP";
      notify.error(errMsg);
    }
  };

  const otpRegister = register("otp", {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = e.target.value.replace(/\D/g, "");
      setValue("otp", sanitized, { shouldValidate: true });
    },
  });

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4 py-8">
      <Card className="w-full max-w-md shadow-2xl border-border/80 bg-card/90 backdrop-blur-md">
        <CardHeader className="text-center space-y-1 pb-4">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Verify Your Email</CardTitle>
          <CardDescription className="text-sm">
            We sent a 6-digit code to <br />
            <span className="font-semibold text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(handleVerifyOtpSubmit, onInvalid)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="otp" className="text-center block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Enter Verification Code
              </Label>

              <Input
                id="otp"
                className="text-center tracking-[0.4em] text-2xl font-mono h-14"
                maxLength={6}
                placeholder="000000"
                autoComplete="one-time-code"
                {...otpRegister}
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-sm">
              <span className="font-mono text-xs text-muted-foreground">
                Expires in:{" "}
                <span className={timeLeft < 60 ? "text-destructive font-bold" : "font-semibold text-foreground"}>
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                </span>
              </span>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resendOtp}
                disabled={loading || timeLeft > 240}
                className="text-xs"
              >
                <RotateCw className="mr-1.5 h-3.5 w-3.5" />
                Resend Code
              </Button>
            </div>

            <Button type="submit" className="w-full font-semibold shadow-md mt-2 h-10" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify OTP"
              )}
            </Button>

            <div className="text-center pt-2">
              <Link to="/signup" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-1 h-3 w-3" /> Back to Signup
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default VerifyOtp;
