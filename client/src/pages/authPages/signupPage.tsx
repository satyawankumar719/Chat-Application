import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { signupSchema } from "@/validations/auth.validation";
import { SignupData } from "@/types";

function SignupPage() {
  const navigate = useNavigate();
  const { signup, loading } = useAuthStore();
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupData) => {
    setFeedback({ type: "", message: "" });

    const trimmedData = {
      name: data.name.trim(),
      email: data.email.trim(),
      phoneNumber: (data.phoneNumber || "").trim(),
      password: data.password,
    };

    const result = await signup(trimmedData);

    if (result.success) {
      navigate("/verify-otp", { state: { email: trimmedData.email } });
      localStorage.setItem("pendingEmail", trimmedData.email);
      toast.success(result.message || "OTP sent to your email!");
    } else {
      const errMsg = result.message || "Unable to send OTP";
      setFeedback({ type: "error", message: errMsg });
      setError("root", { type: "manual", message: errMsg });
      toast.error(result.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/20 px-4">
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-xl font-bold">
            Create your Chat Account
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Connect with friends and start conversations instantly
          </p>

          <CardAction className="mx-auto">
            <span className="text-sm text-muted-foreground">
              Already have an account?
            </span>
            <Link to="/login">
              <Button variant="link" className="px-1">
                Login
              </Button>
            </Link>
          </CardAction>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-3">
              <div className="grid gap-1">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register("name")}
                  className={`h-10 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 font-medium mt-0.5">{errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-1">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className={`h-10 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 font-medium mt-0.5">{errors.email.message}</p>
                )}
              </div>

              <div className="grid gap-1">
                <Label htmlFor="phoneNumber">
                  Phone Number <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="phoneNumber"
                  placeholder="+91 9876543210"
                  {...register("phoneNumber")}
                  className={`h-10 ${errors.phoneNumber ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {errors.phoneNumber && (
                  <p className="text-xs text-red-500 font-medium mt-0.5">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="grid gap-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password (min 6 chars)"
                  {...register("password")}
                  className={`h-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {errors.password && (
                  <p className="text-xs text-red-500 font-medium mt-0.5">{errors.password.message}</p>
                )}
              </div>
            </div>

            {feedback.message && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                {feedback.message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-5 h-10"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Create Account & Continue"}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-3">
              By creating an account, you agree to our terms and privacy policy.
            </p>
          </form>
        </CardContent>

        <CardFooter className="justify-center py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Secure OTP verification enabled
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default SignupPage;
