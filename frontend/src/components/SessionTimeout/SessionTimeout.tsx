import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, LogOut } from 'lucide-react';
import { getLoggedInUserId, logoutUser } from '../../services/session';
import './SessionTimeout.css';

// 5 minutes by default, but check localStorage for debug mode
const getTimeoutConfig = () => {
  const isDebug = localStorage.getItem('debug_timeout') === '1';
  return {
    inactivityLimit: isDebug ? 5 * 1000 : 5 * 60 * 1000, // 5 seconds in debug, 5 mins in prod
    countdownSeconds: 10
  };
};

export default function SessionTimeout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    if (!showModal) {
      lastActivityRef.current = Date.now();
    }
  }, [showModal]);

  // Reset inactivity timer when user navigates (e.g. logging in)
  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, [location.pathname]);

  // Handle logout
  const performLogout = useCallback(() => {
    logoutUser();
    setShowModal(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    navigate('/');
  }, [navigate]);

  // Handle continue
  const handleContinue = () => {
    setShowModal(false);
    lastActivityRef.current = Date.now();
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  useEffect(() => {
    const config = getTimeoutConfig();
    const userId = getLoggedInUserId();

    // Do not run if user is not logged in or is already on login screen
    if (!userId || location.pathname === '/' || location.pathname === '/register') {
      setShowModal(false);
      return;
    }

    // Attach event listeners
    const events = ['mousemove', 'mousedown', 'keypress', 'DOMMouseScroll', 'mousewheel', 'touchmove', 'MSPointerMove'];
    events.forEach(event => document.addEventListener(event, updateActivity));

    if (!showModal) {
      // Normal state: checking for inactivity
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        if (now - lastActivityRef.current >= config.inactivityLimit) {
          setShowModal(true);
          setTimeLeft(config.countdownSeconds);
        }
      }, 1000);
    } else {
      // Modal state: countdown to logout
      countdownRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            performLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      events.forEach(event => document.removeEventListener(event, updateActivity));
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [location.pathname, showModal, updateActivity, performLogout]);

  if (!showModal) return null;

  return (
    <div className="session-timeout-overlay" role="dialog" aria-modal="true" aria-labelledby="timeout-title">
      <div className="session-timeout-modal">
        <div className="session-timeout-icon">
          <Clock size={32} />
        </div>
        <h2 id="timeout-title">{t('session_timeout.title')}</h2>
        <p>{t('session_timeout.description')}</p>
        
        <div className="session-timeout-countdown" aria-live="assertive">
          {t('session_timeout.countdown', { seconds: timeLeft })}
        </div>

        <div className="session-timeout-actions">
          <button type="button" className="session-timeout-btn-primary" onClick={handleContinue}>
            {t('session_timeout.continue_btn')}
          </button>
          <button type="button" className="session-timeout-btn-secondary" onClick={performLogout}>
            <LogOut size={18} />
            {t('session_timeout.logout_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
