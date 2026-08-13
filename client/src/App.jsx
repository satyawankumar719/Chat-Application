import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/authPages/loginPage";
import SignupPage from "./pages/authPages/signupPage";
import ForgotPassword from "./pages/authPages/forgotPassword";
import ChatsPage from "./pages/chatDashboard/ChatsPage";
import InvitationsPage from "./pages/InvitationsPage";
import CreateChatPage from "./pages/CreateChatPage";
import ProtectedRoute from "./components/protectedRoutes";
import AppLayout from "./components/layout/AppLayout";
import PublicRoutes from "./components/publicRoutes";
import VerifyOtp from "./pages/authPages/verifyOtp";
import { Toaster } from "sonner";
import GroupChat from "./pages/chatDashboard/groupChat";
function App() {

  
  return (
    <BrowserRouter>
      <Routes>
        <Route element = {<PublicRoutes/>}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-otp" element = {<VerifyOtp/>}/>
        <Route path="/forgot-password" element = {<ForgotPassword/>}/>
</Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/chats" replace />} />
            <Route path="/chats" element={<ChatsPage />} />
            <Route path="/groups" element= {<GroupChat/>}/>
            <Route path="/chats/create" element={<CreateChatPage />} />
            <Route path="/invitations" element={<InvitationsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/chats" replace />} />
      </Routes>
     <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}

export default App;