import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { verifyOtpSchema } from "@/validations/auth.validation";
import { VerifyOtpData } from "@/types";

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
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<VerifyOtpData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      email: email,
      otp: "",
    },
  });

  useEffect(() => {
    setValue("email", email);
  }, [email, setValue]);

  useEffect(() => {
    if (!email) {
      toast.error("No pending email verification found. Please signup again.");
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
      setError("otp", { type: "manual", message: "OTP expired. Please click Resend OTP." });
      toast.warning("OTP expired. Please resend OTP.");
      return;
    }

    if (!email) {
      toast.error("Email missing. Please sign up again.");
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
      toast.success(result.message || "Verification successful");
      navigate("/chats");
    } else {
      const errMsg = result?.message || "Verification failed";
      setError("otp", { type: "manual", message: errMsg });
      toast.error(errMsg);
    }
  };

  const resendOtp = async () => {
    clearErrors();
    if (!email) {
      toast.error("No email found to resend OTP");
      return;
    }
    const result = await sendOtp({ email });
    if (result?.success) {
      setTimeLeft(300);
      toast.success("New OTP sent to your email");
    } else {
      const errMsg = result?.message || "Failed to resend OTP";
      setError("otp", { type: "manual", message: errMsg });
      toast.error(errMsg);
    }
  };

  const otpRegister = register("otp", {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = e.target.value.replace(/\D/g, "");
      setValue("otp", sanitized, { shouldValidate: true });
    },
  });

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Email OTP</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Sent to <span className="font-semibold text-foreground">{email}</span>
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(handleVerifyOtpSubmit)} noValidate>
            <Label>6 Digit OTP</Label>

            <Input
              className={`mt-2 text-center tracking-widest text-lg font-mono ${errors.otp ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              maxLength={6}
              placeholder="000000"
              {...otpRegister}
            />
            {errors.otp && (
              <p className="text-xs text-red-500 font-medium mt-1">{errors.otp.message}</p>
            )}

            <div className="flex justify-between mt-3 text-sm">
              <span>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </span>

              <Button type="button" variant="ghost" onClick={resendOtp} disabled={loading}>
                Resend OTP
              </Button>
            </div>

            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default VerifyOtp;
