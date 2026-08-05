import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";

function SignupPage() {
  const navigate = useNavigate();
  const { sendOtp, signup, loading } = useAuthStore();
  const [step, setStep] = useState("signup");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phoneNumber: "",
    name: "",
    otp: "",
  });
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300s)

  const isOtpStep = step === "otp";

  useEffect(() => {
    let timer;
    if (isOtpStep && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpStep, timeLeft]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    const result = await sendOtp({ email: formData.email });
    if (result.success) {
      setFeedback({ type: "success", message: result.message || "OTP sent to your email." });
      setStep("otp");
      setTimeLeft(300);
    } else {
      setFeedback({ type: "error", message: result.message || "Unable to send OTP." });
    }
  };

  const handleResendOtp = async () => {
    setFeedback({ type: "", message: "" });
    const result = await sendOtp({ email: formData.email });
    if (result.success) {
      setFeedback({ type: "success", message: "A new OTP has been sent to your email." });
      setTimeLeft(300);
    } else {
      setFeedback({ type: "error", message: result.message || "Failed to resend OTP." });
    }
  };

  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    if (timeLeft === 0) {
      setFeedback({ type: "error", message: "OTP has expired. Please request a new one." });
      return;
    }

    const result = await signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phoneNumber: formData.phoneNumber,
      otp: formData.otp,
    });

    if (result.success) {
      setFeedback({ type: "success", message: "Account created and logged in successfully!" });
      setTimeout(() => {
        navigate("/chats");
      }, 1000);
    } else {
      setFeedback({ type: "error", message: result.message || "OTP verification or signup failed." });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const buttonLabel = useMemo(() => {
    if (loading) return isOtpStep ? "Verifying & Registering..." : "Sending OTP...";
    return isOtpStep ? "Verify OTP & Register" : "Register & Send OTP";
  }, [loading, isOtpStep]);

  return (
    <div className="min-h-screen flex justify-center items-center px-4 bg-background text-foreground">
      <Card className="w-full max-w-sm border shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{isOtpStep ? "Verify your Email" : "Create Account"}</CardTitle>
        
          <CardAction>
            <Link to="/login">
              <Button variant="link" className="p-0 bold"> Login</Button>
            </Link>
          </CardAction>
        </CardHeader>

        <CardContent>
          <form onSubmit={isOtpStep ? handleVerifyAndSignup : handleSendOtp}>
            <div className="flex flex-col gap-4">
              {!isOtpStep ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" type="text" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                    <Input id="phoneNumber" type="text" placeholder="1234567890" value={formData.phoneNumber} onChange={handleChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="otp">6-Digit OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={formData.otp}
                      onChange={handleChange}
                      required
                      className="text-center tracking-widest text-lg font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className={`font-mono ${timeLeft < 60 ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                      {timeLeft > 0 ? `Time remaining: ${formatTime(timeLeft)}` : "OTP Expired"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-xs hover:underline p-1 h-auto"
                    >
                      Resend OTP
                    </Button>
                  </div>
                </>
              )}
            </div>

            {feedback.message ? (
              <div className={`mt-4 p-2 text-sm rounded border ${feedback.type === "error" ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300" : "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300"}`}>
                {feedback.message}
              </div>
            ) : null}

            <Button type="submit" className="w-full mt-6" disabled={loading || (isOtpStep && timeLeft === 0)}>
              {buttonLabel}
            </Button>

            {isOtpStep && (
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={() => {
                  setStep("signup");
                  setFeedback({ type: "", message: "" });
                }}
              >
                Back to Registration
              </Button>
            )}
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-2"></CardFooter>
      </Card>
    </div>
  );
}

export default SignupPage;
