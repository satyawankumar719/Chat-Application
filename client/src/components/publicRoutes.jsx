import React, { useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

function PublicRoutes() {
  const { user ,checkAuth} = useAuthStore();
  useEffect(()=>{
    checkAuth();
  },[])
  if (user) {
    return <Navigate to="/chats" replace />;
  }

  return <Outlet />;
}

export default PublicRoutes;