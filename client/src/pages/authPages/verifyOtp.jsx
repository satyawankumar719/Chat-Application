import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { verifyOtpSchema } from "@/validations/auth.validation";

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, sendOtp, loading } = useAuthStore();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);

  const email = location.state?.email || localStorage.getItem("pendingEmail");

  useEffect(() => {
    if (!email) {
      toast.error("No pending email verification found. Please signup again.");
      navigate("/signup");
    }
  }, [email, navigate]);

  useEffect(() => {
    let timer;

    if (timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [timeLeft]);


  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    const validationResult = verifyOtpSchema.safeParse({ email, otp: otp.trim() });
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]?.message || "Invalid OTP format";
      setError(firstIssue);
      toast.error(firstIssue);
      return;
    }

    if (timeLeft === 0) {
      setError("OTP expired. Please click Resend OTP.");
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
      otp: otp.trim()
    });

    if (result?.success) {
      localStorage.removeItem("pendingEmail");
      localStorage.removeItem("signupData");
      toast.success(result.message || "Verification successful");
      navigate("/chats");
    } else {
      setError(result?.message || "Verification failed");
      toast.error(result?.message || "Verification failed");
    }
  };


  const resendOtp = async () => {
    setError("");
    if (!email) {
      toast.error("No email found to resend OTP");
      return;
    }
    const result = await sendOtp({ email });
    if (result?.success) {
      setTimeLeft(300);
      toast.success("New OTP sent to your email");
    } else {
      setError(result?.message || "Failed to resend OTP");
      toast.error(result?.message || "Failed to resend OTP");
    }
  };


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

          <form onSubmit={handleVerifyOtp} noValidate>

            <Label>6 Digit OTP</Label>

            <Input
              className={`mt-2 text-center tracking-widest text-lg font-mono ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              maxLength={6}
              value={otp}
              onChange={e => {
                setOtp(e.target.value.replace(/\D/g, ""));
                if (error) setError("");
              }}
              placeholder="000000"
              required
            />
            {error && (
              <p className="text-xs text-red-500 font-medium mt-1">{error}</p>
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