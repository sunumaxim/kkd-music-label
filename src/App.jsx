import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Public layout
import PublicLayout from './components/layout/PublicLayout';
import ControleLayout from './components/layout/ControleLayout';

// Partner
import PartnerDashboard from './pages/partner/PartnerDashboard.jsx';

// Public pages
import Home from './pages/Home';
import Artists from './pages/Artists';
import ArtistDetail from './pages/ArtistDetail';
import Music from './pages/Music';
import ReleaseDetail from './pages/ReleaseDetail';
import Videos from './pages/Videos';
import VideoDetail from './pages/VideoDetail';
import Actualites from './pages/Actualites';
import ArticleDetail from './pages/ArticleDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Partnership from './pages/Partnership';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Search from './pages/Search';
import Explorer from './pages/Explorer';
import MesAchats from './pages/MesAchats';
import MesBillets from './pages/MesBillets';
import ControleAcces from './pages/ControleAcces';
import PublicVerifTicket from './pages/PublicVerifTicket';
import Playlists from './pages/Playlists';

// Admin layout & pages
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminArtists from './pages/admin/AdminArtists.jsx';
import AdminReleases from './pages/admin/AdminReleases';
import AdminVideos from './pages/admin/AdminVideos.jsx';
import AdminNews from './pages/admin/AdminNews.jsx';
import AdminEvents from './pages/admin/AdminEvents';
import AdminRequests from './pages/admin/AdminRequests';
import AdminInvites from './pages/admin/AdminInvites.jsx';
import AdminPublications from './pages/admin/AdminPublications';
import AdminPromotions from './pages/admin/AdminPromotions';
import AdminPromoBanners from './pages/admin/AdminPromoBanners';
import AdminMailing from './pages/admin/AdminMailing';
import AdminSocial from './pages/admin/AdminSocial';
import AdminPayments from './pages/admin/AdminPayments';
import AdminTickets from './pages/admin/AdminTickets';
import AdminStudios from './pages/admin/AdminStudios.jsx';
import AdminMediaStudio from './pages/admin/AdminMediaStudio.jsx';
import AdminLicenses from './pages/admin/AdminLicenses.jsx';
import SplashScreen from './components/shared/SplashScreen';
import InstallPrompt from '@/components/shared/InstallPrompt';
import PublishHost from '@/components/shared/PublishHost';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Sous-domaine controle.kkdmusic.com — accès strictement isolé au scanner
  const isControleSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('controle.');

  if (isControleSubdomain) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route element={<ControleLayout />}>
            <Route path="/controle-acces" element={<ControleAcces />} />
            <Route path="*" element={<Navigate to="/controle-acces" replace />} />
          </Route>
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/artistes" element={<Artists />} />
        <Route path="/artistes/:id" element={<ArtistDetail />} />
        <Route path="/musique" element={<Music />} />
        <Route path="/musique/:slug" element={<ReleaseDetail />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/videos/:id" element={<VideoDetail />} />
        <Route path="/actualites" element={<Actualites />} />
        <Route path="/actualites/:id" element={<ArticleDetail />} />
        <Route path="/evenements" element={<Events />} />
        <Route path="/evenements/:slug" element={<EventDetail />} />
        <Route path="/partenaires" element={<Partnership />} />
        <Route path="/a-propos" element={<About />} />
        <Route path="/confidentialite" element={<PrivacyPolicy />} />
        <Route path="/mes-achats" element={<MesAchats />} />
        <Route path="/playlists" element={<Playlists />} />
        <Route path="/mes-billets" element={<MesBillets />} />
        <Route path="/billet/:number" element={<PublicVerifTicket />} />
        <Route path="/recherche" element={<Search />} />
        <Route path="/explorer" element={<Explorer />} />
      </Route>

      {/* Partner dashboard (protected) */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/mon-espace" element={<PartnerDashboard />} />
      </Route>

      {/* Contrôle d'accès — sous-domaine isolé (controle.kkdmusic.com) */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<ControleLayout />}>
          <Route path="/controle-acces" element={<ControleAcces />} />
        </Route>
      </Route>

      {/* Admin routes (admin only) */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/artistes" element={<AdminArtists />} />
          <Route path="/admin/sorties" element={<AdminReleases />} />
          <Route path="/admin/videos" element={<AdminVideos />} />
          <Route path="/admin/actualites" element={<AdminNews />} />
          <Route path="/admin/evenements" element={<AdminEvents />} />
          <Route path="/admin/demandes" element={<AdminRequests />} />
          <Route path="/admin/invitations" element={<AdminInvites />} />
          <Route path="/admin/publications" element={<AdminPublications />} />
          <Route path="/admin/promotions" element={<AdminPromotions />} />
          <Route path="/admin/promo-banners" element={<AdminPromoBanners />} />
          <Route path="/admin/mailing" element={<AdminMailing />} />
          <Route path="/admin/social" element={<AdminSocial />} />
          <Route path="/admin/paiements" element={<AdminPayments />} />
          <Route path="/admin/tickets" element={<AdminTickets />} />
          <Route path="/admin/studios" element={<AdminStudios />} />
          <Route path="/admin/studio-medias" element={<AdminMediaStudio />} />
          <Route path="/admin/documents" element={<AdminLicenses />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  const [splashDone, setSplashDone] = React.useState(false);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <SplashScreen onDone={() => setSplashDone(true)} />
        <Router>
          <AuthenticatedApp />
          <PublishHost />
        </Router>
        <Toaster />
        <InstallPrompt />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App