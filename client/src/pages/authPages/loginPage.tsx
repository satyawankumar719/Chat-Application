import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { loginSchema } from "@/validations/auth.validation";
import { LoginData } from "@/types";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const { login, loading } = useAuthStore();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginData) => {
    setFeedback({ type: "", message: "" });

    const result = await login({
      email: data.email.trim(),
      password: data.password,
    });

    if (result.success) {
      setFeedback({ type: "success", message: "Login successful!" });
      toast.success("Login successful!");
      const to = (location?.state as any)?.from?.pathname || "/chats";
      setTimeout(() => {
        navigate(to, { replace: true });
      }, 500);
    } else {
      const errMsg = result.message || "Failed to log in. Please check your credentials.";

      if (result.isVerified === false) {
        const targetEmail = result.email || data.email.trim();
        toast.info(errMsg);
        localStorage.setItem("pendingEmail", targetEmail);
        navigate("/verify-otp", { state: { email: targetEmail } });
        return;
      }

      setFeedback({ type: "error", message: errMsg });
      setError("root", { type: "manual", message: errMsg });
      toast.error(errMsg);
    }
  };

  return (
    <div className="h-screen flex justify-center items-center px-4 bg-background text-foreground">
      <Card className="w-full max-w-sm border shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Login to your account</CardTitle>

          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>

          <CardAction>
            <Link to="/signup">
              <Button variant="link" className="p-0">Sign Up</Button>
            </Link>
          </CardAction>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                  className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="grid gap-1.5">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>

                  <Link
                    to="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>

                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
                )}
              </div>
            </div>

            {feedback.message ? (
              <div className={`mt-4 p-2 text-sm rounded border ${feedback.type === "error" ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300" : "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300"}`}>
                {feedback.message}
              </div>
            ) : null}

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <Button type="button" variant="outline" className="w-full mt-2">
              Login with Google
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-2"></CardFooter>
      </Card>
    </div>
  );
}

export default LoginPage;
