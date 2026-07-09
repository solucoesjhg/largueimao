import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate, useLocation } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PostItem from "./pages/PostItem";
import MyItems from "./pages/MyItems";
import Favorites from "./pages/Favorites";
import Chats from "./pages/Chats";
import ChatDetail from "./pages/ChatDetail";
import Profile from "./pages/Profile";
import ItemDetail from "./pages/ItemDetail";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import SplashScreen from "./components/SplashScreen";

const queryClient = new QueryClient();

const BackButtonHandler = () => {
  const LNavigate = useNavigate();
  const LLocation = useLocation();

  useEffect(() => {
    const LListener = CapacitorApp.addListener('backButton', () => {
      if (LLocation.pathname === '/' || LLocation.pathname === '/login') {
        CapacitorApp.exitApp();
      } else {
        LNavigate(-1);
      }
    });
    return () => {
      LListener.then(L => L.remove());
    };
  }, [LNavigate, LLocation]);

  return null;
};

import { useSwipeToBack } from "./hooks/useSwipeToBack";

const SwipeBackHandler = () => {
  useSwipeToBack();
  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppContent = () => {
  const { loading } = useAuth();
  
  useEffect(() => {
    // Esconde a tela nativa IMEDIATAMENTE para a nossa tela bonita do React aparecer
    import('@capacitor/splash-screen').then(({ SplashScreen }) => {
      SplashScreen.hide().catch(console.error);
    });
  }, []);

  return (
    <TooltipProvider>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="fav-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3d5e44" />
            <stop offset="100%" stopColor="#253b2a" />
          </linearGradient>
          <filter id="fav-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1" floodOpacity="0.4" />
          </filter>
        </defs>
      </svg>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BackButtonHandler />
        <SwipeBackHandler />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/post-item" element={<ProtectedRoute><PostItem /></ProtectedRoute>} />
          <Route path="/my-items" element={<ProtectedRoute><MyItems /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/item/:id" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute><ChatDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" enableSystem attribute="class">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
