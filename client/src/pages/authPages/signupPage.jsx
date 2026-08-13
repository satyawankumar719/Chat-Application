import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { signupSchema, formatZodErrors, validateFieldWithZod } from "@/validations/auth.validation";

function SignupForm() {
  const navigate = useNavigate();
  const { signup, loading } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const validateForm = () => {
    const result = signupSchema.safeParse(formData);
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
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      const errorMsg = validateFieldWithZod(signupSchema, id, value);
      setErrors(prev => ({ ...prev, [id]: errorMsg }));
    }
  };

  const handleBlur = (e) => {
    const { id, value } = e.target;
    const errorMsg = validateFieldWithZod(signupSchema, id, value);
    setErrors(prev => ({ ...prev, [id]: errorMsg }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }
  
    const result = await signup({
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim()
    });

    if (result.success) {
       navigate("/verify-otp", { state: { email: formData.email.trim() } });
      localStorage.setItem("pendingEmail", formData.email.trim());
      toast.success(result.message || "OTP sent to your email!");
     
    } else {
      setFeedback({ type: "error", message: result.message || "Unable to send OTP" });
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
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-3">

              <div className="grid gap-1">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`h-10 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  required
                />
                {errors.name && (
                  <p className="text-xs text-red-500 font-medium mt-0.5">{errors.name}</p>
                )}
              </div>

              <div className="grid gap-1">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`h-10 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  required
                />
                {errors.email && (
                  <p className="text-xs text-red-500 font-medium mt-0.5">{errors.email}</p>
                )}
              </div>

              <div className="grid gap-1">
                <Label htmlFor="phoneNumber">
                  Phone Number <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="phoneNumber"
                  placeholder="+91 9876543210"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`h-10 ${errors.phoneNumber ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {errors.phoneNumber && (
                  <p className="text-xs text-red-500 font-medium mt-0.5">{errors.phoneNumber}</p>
                )}
              </div>

              <div className="grid gap-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password (min 6 chars)"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`h-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  required
                />
                {errors.password && (
                  <p className="text-xs text-red-500 font-medium mt-0.5">{errors.password}</p>
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

export default SignupForm;