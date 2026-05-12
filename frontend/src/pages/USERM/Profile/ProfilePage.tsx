import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, Eye, EyeOff, Languages, Lock,
  Moon, Palette, Save, ShieldCheck, Sun, User as UserIcon,
  LogOut, Trophy, Medal, Award
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ChameleonAvatar from '../../../components/ChameleonAvatar';
import FeedbackMessage from '../../../components/FeedbackMessage';
import { db, type User, type AdminBadge } from '../../../db/db';
import { getAvatar } from '../../../services/avatar';
import { getStoredTheme, setStoredTheme, type AppTheme } from '../../../services/preferences';
import { useSessionUser, validatePassword, logoutUser } from '../../../services/session';
import './ProfilePage.css';

type FeedbackState = {
  tone: 'success' | 'error' | 'warning' | 'info';
  message: string;
};

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const sessionUser = useSessionUser();

  // Estados do formulário e UI
  const [name, setName] = useState('');
  const [theme, setTheme] = useState<AppTheme>(() => getStoredTheme());
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Estado para os Badges
  const [allBadges, setAllBadges] = useState<AdminBadge[]>([]);

  useEffect(() => {
    if (sessionUser) {
      setName(sessionUser.name);
    }
    // Carregar todos os badges definidos pelo Admin
    db.adminBadges.toArray().then(setAllBadges);
  }, [sessionUser]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!sessionUser) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFeedback({ tone: 'error', message: t('profile.error_name_required') });
      return;
    }

    if (newPassword) {
      if (!validatePassword(newPassword)) {
        setFeedback({ tone: 'error', message: t('profile.password_policy_error') });
        return;
      }
      if (newPassword !== confirmPassword) {
        setFeedback({ tone: 'error', message: t('profile.password_mismatch') });
        return;
      }
    }

    try {
      setIsSaving(true);
      if (sessionUser.id) {
        await db.users.update(sessionUser.id, {
          name: trimmedName,
          password: newPassword || sessionUser.password
        });
      }
      setNewPassword('');
      setConfirmPassword('');
      setFeedback({ tone: 'success', message: t('profile.success_update') });
    } catch (error) {
      console.error('Profile update error:', error);
      setFeedback({ tone: 'error', message: t('profile.error_update') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  const handleLanguageChange = (language: 'pt' | 'en') => {
    i18n.changeLanguage(language);
  };

  const handleThemeChange = (nextTheme: AppTheme) => {
    setTheme(nextTheme);
    setStoredTheme(nextTheme);
  };

  if (sessionUser === undefined) return <main className="profile-container" aria-busy="true"><div style={{ padding: '20px', textAlign: 'center' }}>{t('profile.loading')}</div></main>;
  if (!sessionUser) { navigate('/'); return null; }

  return (
    <main className="profile-container" aria-labelledby="profile-title">
      <header className="profile-header">
        <button type="button" className="profile-icon-btn" onClick={() => navigate('/homepage')} aria-label={t('profile.back')}>
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <div>
          <p className="profile-kicker">{t('profile.kicker')}</p>
          <h1 id="profile-title">{t('profile.title')}</h1>
        </div>
      </header>

      {/* Resumo do Utilizador */}
      <section className="profile-summary">
        <div className="profile-avatar" aria-hidden="true">
          <ChameleonAvatar avatar={getAvatar(sessionUser)} size="sm" />
        </div>
        <div className="profile-summary-text">
          <strong>{sessionUser.name}</strong>
          <span>{sessionUser.email}</span>
        </div>
      </section>

      {/* Atalho para Avatar */}
      <button type="button" className="profile-avatar-link" onClick={() => navigate('/avatar')}>
        <div className="profile-section-icon">
          <Palette size={20} aria-hidden="true" />
        </div>
        <div>
          <strong>{t('avatar.profile_title')}</strong>
          <span>{t('avatar.profile_desc')}</span>
        </div>
        <ChevronRight size={18} aria-hidden="true" />
      </button>

      {/* SECÇÃO DE CONQUISTAS (BADGES) - Estilo lista conforme imagem */}
      <section className="profile-card profile-badges-section">
        <div className="profile-section-heading">
          <div className="profile-section-icon profile-section-icon-gold">
            <Award size={20} aria-hidden="true" />
          </div>
          <div>
            <h2>{t('home.recent_achievements')}</h2>
          </div>
        </div>

        <div className="badges-grid-compact">
          {allBadges.map(badge => {
            const isEarned = sessionUser.earnedBadges?.includes(badge.id!);
            return (
              <div key={badge.id} className={`badge-circle-item ${isEarned ? 'earned' : 'locked'}`} title={badge.description}>
                <div className="badge-icon-circle">
                  {isEarned ? <Trophy size={24} /> : <Medal size={24} opacity={0.3} />}
                </div>
                <span className="badge-name-tiny">{badge.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Preferências */}
      <section className="profile-card">
        <div className="profile-section-heading">
          <div className="profile-section-icon">
            <Languages size={20} aria-hidden="true" />
          </div>
          <div>
            <h2>{t('profile.preferences_section')}</h2>
            <p>{t('profile.preferences_subtitle')}</p>
          </div>
        </div>

        <div className="profile-preference-row">
          <span>{t('profile.language')}</span>
          <div className="profile-segmented">
            <button type="button" className={i18n.language.startsWith('pt') ? 'active' : ''} onClick={() => handleLanguageChange('pt')}>PT</button>
            <button type="button" className={i18n.language.startsWith('en') ? 'active' : ''} onClick={() => handleLanguageChange('en')}>EN</button>
          </div>
        </div>

        <div className="profile-preference-row">
          <span>{t('profile.theme')}</span>
          <div className="profile-segmented">
            <button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => handleThemeChange('light')}>
              <Sun size={14} /> {t('profile.theme_light')}
            </button>
            <button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => handleThemeChange('dark')}>
              <Moon size={14} /> {t('profile.theme_dark')}
            </button>
          </div>
        </div>
      </section>

      {feedback && <FeedbackMessage tone={feedback.tone} message={feedback.message} onClose={() => setFeedback(null)} />}

      {/* Formulário de Dados */}
      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <section className="profile-card">
          <div className="profile-section-heading">
            <div className="profile-section-icon">
              <UserIcon size={20} aria-hidden="true" />
            </div>
            <div>
              <h2>{t('profile.data_section')}</h2>
              <p>{t('profile.data_subtitle')}</p>
            </div>
          </div>

          <label className="profile-field" htmlFor="profile-name">
            <span>{t('profile.name')}</span>
            <input id="profile-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        </section>

        <section className="profile-card">
          <div className="profile-section-heading">
            <div className="profile-section-icon profile-section-icon-blue">
              <ShieldCheck size={20} aria-hidden="true" />
            </div>
            <div>
              <h2>{t('profile.password')}</h2>
              <p>{t('profile.password_subtitle')}</p>
            </div>
          </div>

          <label className="profile-field" htmlFor="profile-password">
            <span>{t('profile.new_password')}</span>
            <div className="profile-password-wrapper">
              <Lock size={18} aria-hidden="true" />
              <input
                id="profile-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('profile.password_placeholder')}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="profile-field" htmlFor="profile-confirm-password">
            <span>{t('profile.confirm_password')}</span>
            <div className="profile-password-wrapper">
              <Lock size={18} aria-hidden="true" />
              <input
                id="profile-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('profile.confirm_password')}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
        </section>

        <div className="profile-actions">
          <button type="submit" className="profile-save-btn" disabled={isSaving}>
            <Save size={20} aria-hidden="true" />
            {isSaving ? t('profile.saving') : t('profile.save_button')}
          </button>
          <button type="button" className="profile-logout-btn" onClick={handleLogout}>
            <LogOut size={20} aria-hidden="true" />
            {t('profile.logout')}
          </button>
        </div>
      </form>
    </main>
  );
}