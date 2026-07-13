import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate, useLocation } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { useEffect, useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PostItem from "./pages/PostItem";
import Favorites from "./pages/Favorites";
import Chats from "./pages/Chats";
import ChatDetail from "./pages/ChatDetail";
import Profile from "./pages/Profile";
import ItemDetail from "./pages/ItemDetail";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import SplashScreen from "./components/SplashScreen";
import { Dialog } from '@capacitor/dialog';

const queryClient = new QueryClient();

const BackButtonHandler = () => {
  const LLocation = useLocation();

  useEffect(() => {
    const LListener = CapacitorApp.addListener('backButton', async () => {
      if ((window as any).__unsavedChanges) {
        const { value } = await Dialog.confirm({
          title: 'Sair sem salvar?',
          message: 'Tu começou a cadastrar um item.\nTem certeza que quer sair e perder o que já preencheu?',
          okButtonTitle: 'Sair',
          cancelButtonTitle: 'Cancelar'
        });
        if (!value) {
          return;
        }
        (window as any).__unsavedChanges = false;
      }

      if (LLocation.pathname === '/' || LLocation.pathname === '/login') {
        CapacitorApp.exitApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      LListener.then(handle => handle.remove());
    };
  }, [LLocation]);

  return null;
};

import { useSwipeToBack } from "./hooks/useSwipeToBack";
import { usePushNotifications } from "./hooks/usePushNotifications";

const SwipeBackHandler = () => {
  useSwipeToBack();
  return null;
};

const PushHandler = () => {
  usePushNotifications();
  return null;
};

let globalProfileChecked = false;
let globalNeedsProfile = false;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const LLocation = useLocation();
  const [LIsChecking, setIsChecking] = useState(!globalProfileChecked);
  const [LNeedsProfile, setNeedsProfile] = useState(globalNeedsProfile);

  useEffect(() => {
    if (!user || globalProfileChecked) {
      setIsChecking(false);
      return;
    }
    const checkProfile = async () => {
      const { data } = await supabase.from('perfis').select('nome_pe').eq('usuari_pe', user.id).single();
      const nome = data?.nome_pe || "";
      if (!nome || nome.includes("privaterelay.appleid.com") || nome.includes("appleid.com")) {
        globalNeedsProfile = true;
        setNeedsProfile(true);
      }
      globalProfileChecked = true;
      setIsChecking(false);
    };
    checkProfile();
  }, [user]);

  useEffect(() => {
    const handleProfileSaved = () => {
      globalNeedsProfile = false;
      setNeedsProfile(false);
    };
    window.addEventListener('profileSaved', handleProfileSaved);
    return () => window.removeEventListener('profileSaved', handleProfileSaved);
  }, []);

  if (loading || LIsChecking) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (LNeedsProfile && LLocation.pathname !== "/profile") {
    // Pode exibir um toast alertando para trocar o nome
    return <Navigate to="/profile" replace />;
  }
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

import { AnimatePresence, motion } from "framer-motion";

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 15 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -15 }}
    transition={{ duration: 0.25, ease: "easeInOut" }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const LLocation = useLocation();
  return (
    <Routes location={LLocation} key={LLocation.pathname}>
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/post-item" element={<ProtectedRoute><PostItem /></ProtectedRoute>} />
      <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
      <Route path="/item/:id" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
      <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
      <Route path="/chat/:id" element={<ProtectedRoute><ChatDetail /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const AppContent = () => {
  const { loading } = useAuth();
  const [minSplashDone, setMinSplashDone] = useState(false);
  
  useEffect(() => {
    // Esconde a tela nativa IMEDIATAMENTE para a nossa tela bonita do React aparecer
    import('@capacitor/splash-screen').then(({ SplashScreen }) => {
      SplashScreen.hide().catch(console.error);
    });

    // Prevent iOS from shifting the entire webview up when keyboard opens
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/keyboard').then(({ Keyboard }) => {
        Keyboard.setScroll({ isDisabled: true }).catch(console.error);
      });
    }

    const timer = setTimeout(() => {
      setMinSplashDone(true);
    }, 2500);

    // Initialize Google Sign-In para Android/Web
    import('@capawesome/capacitor-google-sign-in').then(({ GoogleSignIn }) => {
      GoogleSignIn.initialize({
        clientId: '1077803983918-9fn1clbcp1o2p6t6ibianvnamcou1sbh.apps.googleusercontent.com',
      }).catch(console.error);
    });

    // Tenta pegar a localização silenciosamente para calcular distâncias
    import('@/components/ItemLocation').then(({ isGeoDenied, setCachedUserCoords, markGeoDenied }) => {
      if (!isGeoDenied()) {
        import('@capacitor/geolocation').then(({ Geolocation }) => {
          Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 1000 * 60 * 5 })
            .then((pos) => setCachedUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }))
            .catch((err) => {
              if (err?.message?.includes("denied") || err?.message?.includes("Permission")) {
                markGeoDenied();
              }
            });
        });
      }
    });

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && minSplashDone) {
      document.body.style.backgroundColor = "hsl(var(--background))";
    }
  }, [loading, minSplashDone]);

  if (loading || !minSplashDone) {
    return <SplashScreen />;
  }

  return (
    <TooltipProvider>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="fav-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a3d9b0" />
            <stop offset="100%" stopColor="#8fce9e" />
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
        <PushHandler />
        <ScrollToTop />
        <AnimatedRoutes />
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
