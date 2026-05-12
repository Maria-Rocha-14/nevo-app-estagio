import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import DevErrorBoundary from './components/DevErrorBoundary';
import { applyTheme, getStoredTheme } from './services/preferences';
import BrowserCompatibilityNotice from './components/BrowserCompatibilityNotice';
import { getBrowserSupport } from './services/browserSupport';

// Lazy load all pages for code-splitting
const Login = lazy(() => import('./pages/USERM/Login/Login'));
const Register = lazy(() => import('./pages/USERM/Register/Register'));
const HomePage = lazy(() => import('./pages/GAMF/HomePage/HomePage'));
const CaptureImage = lazy(() => import('./pages/ANLS/CaptureImage'));
const AssessmentResults = lazy(() => import('./pages/ANLS/AssessmentResults'));
const LearnPage = lazy(() => import('./pages/GAMF/Learn/LearnPage'));
const HistoryPage = lazy(() => import('./pages/HIST/HistoryPage'));
const ProfilePage = lazy(() => import('./pages/USERM/Profile/ProfilePage'));
const AvatarPage = lazy(() => import('./pages/USERM/Avatar/AvatarPage'));
const YellowAvatarTestPage = lazy(() => import('./pages/USERM/Avatar/YellowAvatarTestPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms/Terms'));
const AdminQuizzes = lazy(() => import('./pages/ADMIN/AdminQuizzes'));
const AdminUsers = lazy(() => import('./pages/ADMIN/AdminUsers'));
const AdminDashboard = lazy(() => import('./pages/ADMIN/AdminDashboard'));
const AdminBadges = lazy(() => import('./pages/ADMIN/AdminBadges'));
const ScanSettings = lazy(() => import('./pages/ADMIN/AdminScanSettings'));
// Loading component
const LoadingFallback = () => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>;

function App() {
  const browserSupport = getBrowserSupport();

  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  if (!browserSupport.supported) {
    return <BrowserCompatibilityNotice support={browserSupport} />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/register" element={<Register />} />
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/scan" element={<CaptureImage />} />
          <Route path="/assessment-results" element={<AssessmentResults />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/avatar" element={<AvatarPage />} />
          <Route path="/avatar/assets-test" element={<YellowAvatarTestPage />} />
          <Route path="/avatar/yellow-test" element={<YellowAvatarTestPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/learn" element={<DevErrorBoundary><LearnPage /></DevErrorBoundary>} />
          
          <Route path="/admin" element={<AdminDashboard />} >
            <Route path="quizzes" element={<AdminQuizzes />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="badges" element={<AdminBadges />} />
            <Route path="settings" element={<ScanSettings />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App;
