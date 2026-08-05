import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/authPages/loginPage";
import SignupPage from "./pages/authPages/signupPage";
import ChatsPage from "./pages/chatDashboard/ChatsPage";
import InvitationsPage from "./pages/InvitationsPage";
import CreateChatPage from "./pages/CreateChatPage";
import ProtectedRoute from "./components/protectedRoutes";
import AppLayout from "./components/layout/AppLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/chats" replace />} />
            <Route path="/chats" element={<ChatsPage />} />
            <Route path="/chats/create" element={<CreateChatPage />} />
            <Route path="/invitations" element={<InvitationsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/chats" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
