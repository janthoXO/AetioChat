import { AuthProvider } from "./contexts/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ChatLayout } from "./components/ChatLayout";
import { ChatPage } from "./pages/ChatPage";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <AuthProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ChatLayout />}>
              <Route path="chat/:caseId" element={<ChatPage />} />
              <Route path="" element={
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a case from the sidebar or generate a new one.
                </div>
              } />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
