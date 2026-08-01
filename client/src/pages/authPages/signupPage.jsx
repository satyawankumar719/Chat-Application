import React from 'react'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
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
import { useAuthStore } from '@/store/authStore';
function SignupPage() {
   const {signup,loading} = useAuthStore();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        phoneNumber:"",
        name:""
      });
  async function handleSignup(e){
        e.preventDefault();
         const result = await signup(formData);

    if (result.success) {
      console.log("Signup Successful");
    
    } else {
      console.log(result.message);
      
    }
   }
       const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };


  return (
    <div className="h-screen flex justify-center items-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>

          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>

          <CardAction>
         <Link to="/">
  <Button variant="link">Login</Button>
</Link>
          </CardAction>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignup}>
            <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>

                <Input
                  id="name"
                  type="name"
                  placeholder="your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
                  <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>

                <Input
                  id="phoneNumber"
                  type="phoneNumber"
                  placeholder="9999999999"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>

                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>

                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <Button variant="outline" className="w-full mt-2">
              Login with Google
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-2"></CardFooter>
      </Card>
    </div>
  )
}

export default SignupPage
