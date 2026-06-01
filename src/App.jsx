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

// Partner
import PartnerDashboard from './pages/partner/PartnerDashboard';

// Public pages
import Home from './pages/Home';
import Artists from './pages/Artists';
import ArtistDetail from './pages/ArtistDetail';
import Music from './pages/Music';
import Videos from './pages/Videos';
import NewsPage from './pages/NewsPage';
import NewsDetail from './pages/NewsDetail';
import Events from './pages/Events';
import Partnership from './pages/Partnership';

// Admin layout & pages
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminArtists from './pages/admin/AdminArtists.jsx';
import AdminReleases from './pages/admin/AdminReleases';
import AdminVideos from './pages/admin/AdminVideos.jsx';
import AdminNews from './pages/admin/AdminNews.jsx';
import AdminEvents from './pages/admin/AdminEvents';
import AdminRequests from './pages/admin/AdminRequests';
import AdminInvites from './pages/admin/AdminInvites';
import AdminPublications from './pages/admin/AdminPublications';

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
        <Route path="/videos" element={<Videos />} />
        <Route path="/actualites" element={<NewsPage />} />
        <Route path="/actualites/:id" element={<NewsDetail />} />
        <Route path="/evenements" element={<Events />} />
        <Route path="/partenaires" element={<Partnership />} />
      </Route>

      {/* Partner dashboard (protected) */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/mon-espace" element={<PartnerDashboard />} />
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
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App