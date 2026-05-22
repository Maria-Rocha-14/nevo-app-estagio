import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, ArrowDownUp, Download, Eye, EyeOff, Languages, Lock, 
  Moon, Pencil, Save, ShieldCheck, Sun, UploadCloud, User as UserIcon, 
  LogOut, Award, HelpCircle, CheckCircle2 
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import ChameleonAvatar from '../../../components/ChameleonAvatar';
import DataExportModal from '../../../components/DataExportModal';
import DataImportModal from '../../../components/DataImportModal';
import FeedbackMessage from '../../../components/FeedbackMessage';
import { db } from '../../../db/db';
import { getAvatar } from '../../../services/avatar';
import { getStoredTheme, setStoredTheme, type AppTheme } from '../../../services/preferences';
import { useSessionUser, validatePassword, logoutUser } from '../../../services/session';
import { exportLocalData, downloadEncryptedBackup, importLocalData } from '../../../services/syncService';
import { api } from '../../../services/api';
import './ProfilePage.css';

type FeedbackState = {
  tone: 'success' | 'error' | 'warning' | 'info';
  message: string;
  autoCloseMs?: number;
};

const IconRenderer = ({ name, size = 24, color = 'currentColor' }: { name: string, size?: number, color?: string }) => {
  const IconComponent = (LucideIcons as any)[name];
  return IconComponent ? <IconComponent size={size} color={color} /> : <HelpCircle size={size} color={color} />;
};

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionUser = useSessionUser();
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [theme, setTheme] = useState<AppTheme>(() => getStoredTheme());
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(true);

  const [realScans, setRealScans] = useState(0);
  const [realXP, setRealXP] = useState(0);
  const [realStreak, setRealStreak] = useState(0);
  const [realEarnedBadges, setRealEarnedBadges] = useState<string[]>([]);

  useEffect(() => {
    if (sessionUser) {
      setName(sessionUser.name);

      const carregarDadosDoDexie = async () => {
        if (sessionUser.id) {
          const userAtualizado = await db.users.get(sessionUser.id);
          if (userAtualizado) {
            setRealScans(userAtualizado.scansCount || 0);
            setRealXP(userAtualizado.xp || 0);
            setRealStreak(userAtualizado.weeksStreak || 0);

            const listaMedalhasDexie = (userAtualizado.earnedBadges || []).map((id: any) =>
              String(id).toLowerCase().trim()
            );
            setRealEarnedBadges(listaMedalhasDexie);

            const totalBadgesGanhos = listaMedalhasDexie.length;
            const storageKey = `vistos_badges_${sessionUser.id}`;
            const registoOriginal = localStorage.getItem(storageKey);

            if (registoOriginal !== null) {
              const ultimosVistos = Number(registoOriginal);
              if (totalBadgesGanhos > ultimosVistos) {
                setFeedback({
                  tone: 'success',
                  message: t('profile.new_badge_alert', '🎉 Parabéns! Tens novas conquistas desbloqueadas no teu perfil!')
                });
              }
            } else if (totalBadgesGanhos > 0) {
              setFeedback({
                tone: 'success',
                message: t('profile.new_badge_alert', '🎉 Parabéns! Tens novas conquistas desbloqueadas no teu perfil!')
              });
            }
            localStorage.setItem(storageKey, totalBadgesGanhos.toString());
          }
        }
      };
      carregarDadosDoDexie();
    }

    const fetchRemoteBadges = async () => {
      try {
        const data = await api.getBadges();
        setAllBadges(data);
      } catch (err) {
        console.error("Erro ao obter badges do MongoDB, a carregar do Dexie local...", err);
        const localBadges = await db.adminBadges.toArray();
        setAllBadges(localBadges);
      } finally {
        setLoadingBadges(false);
      }
    };

    fetchRemoteBadges();
  }, [sessionUser, t]);

  useEffect(() => {
    const routeFeedback = (location.state as { feedback?: FeedbackState } | null)?.feedback;
    if (!routeFeedback) return;

    setFeedback(routeFeedback);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  if (sessionUser === undefined) return <main className="profile-container" aria-busy="true"><div style={{ padding: '20px', textAlign: 'center' }}>{t('profile.loading')}</div></main>;
  if (!sessionUser) { navigate('/'); return null; }

  const mascot = getAvatar(sessionUser);
  const mascotName = mascot.name?.trim() || t('avatar.default_name');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

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
      navigate('/homepage', {
        state: {
          feedback: {
            tone: 'success',
            message: t('profile.success_update')
          }
        }
      });
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

  const handleExportConfirm = async (password: string) => {
    setSyncLoading(true);
    try {
      const { encrypted, fileName } = await exportLocalData(password);
      await downloadEncryptedBackup(encrypted, fileName);
      setFeedback({ tone: 'success', message: t('profile.sync_export_success') });
      setExportOpen(false);
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : t('profile.sync_export_error') });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleImportClick = () => {
    importFileInputRef.current?.click();
  };

  const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.nevo')) {
      setFeedback({ tone: 'error', message: 'Escolhe um ficheiro .nevo válido.' });
      return;
    }

    setSelectedImportFile(file);
    setImportOpen(true);
  };

  const handleImportConfirm = async (password: string) => {
    if (!selectedImportFile) {
      setFeedback({ tone: 'error', message: t('profile.sync_import_error') });
      return;
    }

    setSyncLoading(true);
    try {
      const result = await importLocalData(selectedImportFile, password);
      setTheme(result.preferences.theme === 'dark' ? 'dark' : 'light');
      if (result.preferences.language) {
        i18n.changeLanguage(result.preferences.language);
      }
      setFeedback({ tone: 'success', message: t('profile.sync_import_success') });
      setSelectedImportFile(null);
      setImportOpen(false);
    } catch {
      setFeedback({ tone: 'error', message: t('profile.sync_import_wrong_password'), autoCloseMs: 3000 });
    } finally {
      setSyncLoading(false);
    }
  };

  const closeImportModal = () => {
    setImportOpen(false);
    setSelectedImportFile(null);
  };

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

      {/* Card do Camaleão */}
      <section className="profile-mascot-card" aria-label={t('avatar.profile_title')}>
        <div className="profile-mascot-copy">
          <span>{t('avatar.home_kicker')}</span>
          <h2>{mascotName}</h2>
        </div>
        <div className="profile-mascot-stage" aria-hidden="true">
          <ChameleonAvatar avatar={mascot} size="lg" />
        </div>
        <button type="button" className="profile-mascot-edit-btn" onClick={() => navigate('/avatar')} aria-label={t('avatar.edit')}>
          <Pencil size={20} aria-hidden="true" />
        </button>
      </section>

      {/* Grelha de Conquistas (Badges) */}
      <section className="profile-card profile-badges-section">
        <div className="profile-section-heading">
          <div className="profile-section-icon profile-section-icon-gold">
            <Award size={20} aria-hidden="true" />
          </div>
          <div>
            <h2>{t('home.recent_achievements')}</h2>
          </div>
        </div>

        <div className="profile-badges-grid-cards">
          {loadingBadges ? (
            <p className="profile-empty-text">A atualizar conquistas da plataforma...</p>
          ) : allBadges.length === 0 ? (
            <p className="profile-empty-text">Ainda não existem badges configurados.</p>
          ) : (
            allBadges.map(badge => {
              const currentId = String(badge._id || badge.id || '').toLowerCase().trim();

              const isEarned = realEarnedBadges.includes(currentId);
              const userScans = realScans;
              const userXP = realXP;
              const userStreak = realStreak;

              let currentValue = userXP;
              if (badge.requirementType === 'scans') currentValue = userScans;
              if (badge.requirementType === 'streak') currentValue = userStreak;

              const targetValue = badge.requirementValue || 1;
              const isEffectivelyDone = currentValue >= targetValue || isEarned;

              const visualCurrentValue = isEffectivelyDone ? targetValue : currentValue;
              const progressPercentage = isEffectivelyDone ? 100 : Math.min((visualCurrentValue / targetValue) * 100, 100);

              return (
                <div key={currentId} className={`profile-badge-card-item ${isEffectivelyDone ? 'earned' : 'locked'}`}>
                  <div className="status-indicator-corner">
                    {isEffectivelyDone ? (
                      <CheckCircle2 size={18} color="#5fa79a" />
                    ) : (
                      <Lock size={16} color="#cbd5e1" />
                    )}
                  </div>

                  <div className="badge-icon-box">
                    <IconRenderer
                      name={badge.iconType || 'Trophy'}
                      color={isEffectivelyDone ? '#5fa79a' : '#94a3b8'}
                      size={26}
                    />
                  </div>

                  <div className="badge-details">
                    <h4>{badge.name}</h4>
                    <p>{badge.description}</p>

                    <div className="badge-progress-container">
                      {isEffectivelyDone ? (
                        <>
                          <span className="badge-completed-tag">Concluído</span>
                          <span className="badge-progress-text">
                            {targetValue}/{targetValue}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="badge-progress-bar-bg">
                            <div
                              className="badge-progress-bar-fill"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                          <span className="badge-progress-text">
                            {visualCurrentValue}/{targetValue}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Preferências (Língua e Tema) */}
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

      {feedback && (
        <FeedbackMessage 
          tone={feedback.tone} 
          message={feedback.message} 
          autoCloseMs={feedback.autoCloseMs} 
          onClose={() => setFeedback(null)} 
        />
      )}

      {/* Formulário de Dados Pessoais */}
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

      {/* Portabilidade de Dados Unificada */}
      <section className="profile-card profile-sync-card" aria-label={t('profile.data_portability_title')}>
        <div className="profile-section-heading">
          <div className="profile-section-icon">
            <ArrowDownUp size={20} aria-hidden="true" />
          </div>
          <div>
            <h2>{t('profile.data_portability_title')}</h2>
            <p>{t('profile.data_portability_subtitle')}</p>
          </div>
        </div>
        <div className="profile-sync-actions">
          <button type="button" className="profile-sync-btn" onClick={() => setExportOpen(true)}>
            <Download size={17} aria-hidden="true" />
            {t('profile.export_data')}
          </button>
          <button type="button" className="profile-sync-btn" onClick={handleImportClick}>
            <UploadCloud size={17} aria-hidden="true" />
            {t('profile.import_data')}
          </button>
        </div>
        <input
          ref={importFileInputRef}
          className="profile-hidden-file-input"
          type="file"
          accept=".nevo,application/octet-stream"
          onChange={handleImportFileChange}
        />
      </section>

      <DataExportModal open={exportOpen} onClose={() => setExportOpen(false)} onExport={handleExportConfirm} loading={syncLoading} />
      <DataImportModal open={importOpen} onClose={closeImportModal} file={selectedImportFile} onImport={handleImportConfirm} loading={syncLoading} />
    </main>
  );
}
