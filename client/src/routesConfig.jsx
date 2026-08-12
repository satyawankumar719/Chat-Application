import { LoginPage } from "./pages/authPages/loginPage";
import SignupPage from "./pages/authPages/signupPage";
import ChatsPage from "./pages/chatDashboard/ChatsPage";
import InvitationsPage from "./pages/InvitationsPage";
import CreateChatPage from "./pages/CreateChatPage";
import GroupChat from "./pages/chatDashboard/groupChat";

export const PUBLIC_ROUTES = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
];

export const PROTECTED_ROUTES = [
  {
    index: true,
    redirectTo: "/chats",
  },
  {
    path: "/chats",
    element: <ChatsPage />,
  },
  {
    path :"/groups",
    element : <GroupChat/>
  },
  {
    path: "/chats/create",
    element: <CreateChatPage />,
  },
  {
    path: "/invitations",
    element: <InvitationsPage />,
  },
];

export const FALLBACK_ROUTE = {
  path: "*",
  redirectTo: "/chats",
};
