import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { notify } from "@/lib/notify";
import { useTheme } from "@/lib/theme";
import { loginSchema } from "@/validations/auth.validation";
import { LoginData } from "@/types";
import {
  Eye,
  EyeOff,
  MessageSquare,
  Loader2,
  Mail,
  Lock,
  Sun,
  Moon,
  ArrowRight,
} from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const { login, loading } = useAuthStore();

  const { register, handleSubmit } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onInvalid = (fieldErrors: any) => {
    const firstKey = Object.keys(fieldErrors)[0];
    if (firstKey && fieldErrors[firstKey]?.message) {
      notify.error(fieldErrors[firstKey].message);
    }
  };

  const onSubmit = async (data: LoginData) => {
    const result = await login({
      email: data.email.trim(),
      password: data.password,
    });

    if (result.success) {
      notify.success("Welcome back!", "Login successful.");
      const to = (location?.state as any)?.from?.pathname || "/chats";
      navigate(to, { replace: true });
    } else {
      const errMsg = result.message || "Failed to log in. Please check your credentials.";

      if (result.isVerified === false) {
        const targetEmail = result.email || data.email.trim();
        notify.info("Verification needed", "Please verify your email with the OTP.");
        localStorage.setItem("pendingEmail", targetEmail);
        navigate("/verify-otp", { state: { email: targetEmail } });
        return;
      }

      notify.error(errMsg);
    }
  };

  return (
    <div className="relative h-screen h-dvh w-full overflow-hidden flex items-center justify-center p-4 bg-background text-foreground transition-colors duration-300">
      {/* Decorative ambient background glows - restrained to prevent overflow */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />

      {/* Top Branding (Left) */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-8 z-20">
        <Link to="/login" className="flex items-center gap-2 font-bold tracking-tight text-lg group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <MessageSquare className="h-4 w-4" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            ChatApp
          </span>
        </Link>
      </div>

      {/* Top Controls (Right) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-full p-0 text-muted-foreground hover:text-foreground transition-colors"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700" />
          )}
        </Button>

        <Link to="/signup">
          <Button variant="outline" size="sm" className="rounded-full text-xs font-semibold px-3.5 h-8 border-border/80 hover:bg-muted">
            Sign Up
          </Button>
        </Link>
      </div>

      {/* Centered Login Card */}
      <div className="relative z-10 w-full max-w-[420px] my-auto">
        <Card className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-xl">
          <CardHeader className="space-y-1.5 text-center pb-4 pt-6 px-6">
            <div className="mx-auto mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-4 ring-primary/5">
              <MessageSquare className="h-5 w-5" />
            </div>

            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome Back
            </CardTitle>

            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Sign in to continue to your messages
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-3.5">
              {/* Email Input */}
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    {...register("email")}
                    className="h-10 pl-9 rounded-lg bg-background/60 border-border/70 text-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-primary hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register("password")}
                    className="h-10 pl-9 pr-9 rounded-lg bg-background/60 border-border/70 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors p-0.5 rounded"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 mt-2 rounded-lg font-semibold shadow-md transition-all group"
              >
                {loading ? (
                  <span className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing In...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5 text-sm">
                    Sign In
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </Button>

              {/* Sign Up Link */}
              <div className="pt-2 text-center text-xs text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-primary hover:underline underline-offset-4 transition-colors"
                >
                  Create one
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
