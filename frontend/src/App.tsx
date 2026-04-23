import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/USERM/Login/Login';
import Register from './pages/USERM/Register/Register';
import HomePage from './pages/GAMF/HomePage/HomePage';
import CaptureImage from './pages/ANLS/CaptureImage';
import AssessmentResults from './pages/ANLS/AssessmentResults';
import LearnPage from './pages/GAMF/Learn/LearnPage';
import HistoryPage from './pages/HIST/HistoryPage';
import ProfilePage from './pages/USERM/Profile/ProfilePage';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import Terms from './pages/Terms/Terms';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/register" element={<Register />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/scan" element={<CaptureImage />} />
        <Route path="/assessment-results" element={<AssessmentResults />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/learn" element={<LearnPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
