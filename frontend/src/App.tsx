import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/USERM/Login/Login';
import Register from './pages/USERM/Register/Register';
import HomePage from './pages/GAMF/HomePage/HomePage';
import CaptureImage from './pages/ANLS/CaptureImage';
import AssessmentResults from './pages/ANLS/AssessmentResults';
import LearnPage from './pages/GAMF/Learn/LearnPage';
import UnderConstruction from './pages/UnderConstruction';
import PrivacyPolicy from './pages/PrivacyPolicy/privacyPolicy';
import Terms from './pages/Terms/Terms';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />~
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/register" element={<Register />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/scan" element={<CaptureImage />} />
        <Route path="/assessment-results" element={<AssessmentResults />} />
        <Route
          path="/profile"
          element={<UnderConstruction title="Perfil" description="A area de perfil ainda esta em desenvolvimento." />}
        />
        <Route
          path="/history"
          element={<UnderConstruction title="Historico" description="O historico de exames ainda esta em desenvolvimento." />}
        />
        <Route path="/learn" element={<LearnPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;