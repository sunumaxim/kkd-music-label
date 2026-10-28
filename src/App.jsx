import React, { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { PlayerProvider } from '@/lib/PlayerContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';

// Chaque page est téléchargée à la demande : l'ouverture du site est bien plus rapide.
// Auth pages
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));

// Public layout
const PublicLayout = lazy(() => import('./components/layout/PublicLayout'));
const ControleLayout = lazy(() => import('./components/layout/ControleLayout'));

// Partner
const PartnerDashboard = lazy(() => import('./pages/partner/PartnerDashboard.jsx'));

// Public pages
const Home = lazy(() => import('./pages/Home'));
const Artists = lazy(() => import('./pages/Artists'));
const ArtistDetail = lazy(() => import('./pages/ArtistDetail'));
const Music = lazy(() => import('./pages/Music'));
const ReleaseDetail = lazy(() => import('./pages/ReleaseDetail'));
const Videos = lazy(() => import('./pages/Videos'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const VideoDetail = lazy(() => import('./pages/VideoDetail'));
const Actualites = lazy(() => import('./pages/Actualites'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const Partnership = lazy(() => import('./pages/Partnership'));
const About = lazy(() => import('./pages/About'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Search = lazy(() => import('./pages/Search'));
const Explorer = lazy(() => import('./pages/Explorer'));
const MesAchats = lazy(() => import('./pages/MesAchats'));
const MesBillets = lazy(() => import('./pages/MesBillets'));
const ControleAcces = lazy(() => import('./pages/ControleAcces'));
const PublicVerifTicket = lazy(() => import('./pages/PublicVerifTicket'));
const Playlists = lazy(() => import('./pages/Playlists'));
const DocumentViewer = lazy(() => import('./pages/DocumentViewer'));
const ArtistLinktree = lazy(() => import('./pages/ArtistLinktree'));
const Showcase = lazy(() => import('./pages/Showcase'));
const ConcertLanding = lazy(() => import('./pages/ConcertLanding'));

// Admin layout & pages
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminArtists = lazy(() => import('./pages/admin/AdminArtists.jsx'));
const AdminReleases = lazy(() => import('./pages/admin/AdminReleases'));
const AdminVideos = lazy(() => import('./pages/admin/AdminVideos.jsx'));
const AdminNews = lazy(() => import('./pages/admin/AdminNews.jsx'));
const AdminRequests = lazy(() => import('./pages/admin/AdminRequests'));
const AdminInvites = lazy(() => import('./pages/admin/AdminInvites.jsx'));
const AdminPublications = lazy(() => import('./pages/admin/AdminPublications'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents.jsx'));
const AdminPromotions = lazy(() => import('./pages/admin/AdminPromotions.jsx'));
const AdminPromoBanners = lazy(() => import('./pages/admin/AdminPromoBanners.jsx'));
const AdminMailing = lazy(() => import('./pages/admin/AdminMailing.jsx'));
const AdminSocial = lazy(() => import('./pages/admin/AdminSocial.jsx'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments.jsx'));
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets.jsx'));
const AdminStudios = lazy(() => import('./pages/admin/AdminStudios.jsx'));
const AdminMediaStudio = lazy(() => import('./pages/admin/AdminMediaStudio.jsx'));
const AdminVideoStudio = lazy(() => import('./pages/admin/AdminVideoStudio.jsx'));
const AdminLicenses = lazy(() => import('./pages/admin/AdminLicenses.jsx'));
const DevenirArtiste = lazy(() => import('./pages/DevenirArtiste.jsx'));
const AccountSettings = lazy(() => import('./pages/AccountSettings.jsx'));
import SplashScreen from './components/shared/SplashScreen';
import InstallPrompt from '@/components/shared/InstallPrompt';
import PublishHost from '@/components/shared/PublishHost';

const RouteLoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
  </div>
);

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
        {/* Checkout public : les commandes sont créées dans la même base que les scanners. */}
        <Route path="/evenements" element={<Events />} />
        <Route path="/evenements/:slug" element={<EventDetail />} />
        <Route path="/mes-billets" element={<MesBillets />} />
        <Route path="/billet/:number" element={<PublicVerifTicket />} />
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
        <Route path="/studio-video" element={<Navigate to="/videos" replace />} />
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
        <Route path="/devenir-artiste" element={<DevenirArtiste />} />
        <Route path="/demande-artiste" element={<DevenirArtiste />} />
        <Route path="/parametres" element={<AccountSettings />} />
        <Route path="/mon-compte" element={<AccountSettings />} />
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
          <Route path="/admin/utilisateurs" element={<AdminUsers />} />
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
          <Route path="/admin/studio-video" element={<AdminVideoStudio />} />
          <Route path="/admin/documents" element={<AdminLicenses />} />
        </Route>
      </Route>

      <Route path="/l/:slug" element={<ArtistLinktree />} />
      <Route path="/showcase" element={<Showcase />} />
      <Route path="/concert/:slug" element={<ConcertLanding />} />
      <Route path="/document/:id" element={<DocumentViewer />} />
      <Route path="/auth/tiktok/callback" element={<Navigate to="/videos" replace />} />
      <Route path="/auth/callback" element={<Navigate to="/videos" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <PlayerProvider>
          <SplashScreen />
          <Router>
            <Suspense fallback={<RouteLoadingFallback />}>
              <AuthenticatedApp />
            </Suspense>
            <PublishHost />
          </Router>
          <Toaster />
          <InstallPrompt />
        </PlayerProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App