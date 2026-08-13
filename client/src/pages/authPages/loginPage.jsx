import { useState } from "react";
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
import { loginSchema, formatZodErrors, validateFieldWithZod } from "@/validations/auth.validation";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const { login, loading } = useAuthStore();

  const validateForm = () => {
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error);
      setErrors(formattedErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    if (errors[id]) {
      const errorMsg = validateFieldWithZod(loginSchema, id, value);
      setErrors((prev) => ({ ...prev, [id]: errorMsg }));
    }
  };

  const handleBlur = (e) => {
    const { id, value } = e.target;
    const errorMsg = validateFieldWithZod(loginSchema, id, value);
    setErrors((prev) => ({ ...prev, [id]: errorMsg }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    const result = await login({
      email: formData.email.trim(),
      password: formData.password
    });

    if (result.success) {
      setFeedback({ type: "success", message: "Login successful!" });
      toast.success("Login successful!");
      const to = location?.state?.from?.pathname || "/chats";
      setTimeout(() => {
        navigate(to, { replace: true });
      }, 500);
    } else {
      setFeedback({ type: "error", message: result.message || "Failed to log in. Please check your credentials." });
      toast.error(result.message || "Failed to log in. Please check your credentials.");
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
          <form onSubmit={handleLogin} noValidate>
            <div className="flex flex-col gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>

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
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
                  required
                />
                {errors.password && (
                  <p className="text-xs text-red-500 font-medium">{errors.password}</p>
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