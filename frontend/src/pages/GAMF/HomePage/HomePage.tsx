import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Target, Flame, Award, Camera, Sun,
    Trophy, Home, History, BookOpen, AlertCircle, ChevronRight,
    Sparkles, CheckCircle, MapPin
} from 'lucide-react';
import './HomePage.css';
import ChameleonAvatar from '../../../components/ChameleonAvatar';
import FeedbackMessage from '../../../components/FeedbackMessage';
import { getAvatar } from '../../../services/avatar';
import { getLevelProgress } from '../../../services/levelService';
import { awardDailyMissionXp, useSessionUser } from '../../../services/session';
import { calculateAge, calculateClinicalRoutine, calculateMonthStreak, isScanDoneThisMonth } from '../../../services/riskProfile';

type FeedbackState = {
    tone: 'success' | 'error' | 'warning' | 'info';
    message: string;
};

const DAILY_MISSION_XP_REWARD = 25;
const DAILY_MISSION_POINTS_REWARD = 10;

const getXpFromStoredUserSession = (): number => {
    try {
        const storedSession = localStorage.getItem('user_session');
        if (!storedSession) return 0;

        const parsedSession = JSON.parse(storedSession) as { xp?: unknown; user?: { xp?: unknown } };
        const storedXp = parsedSession.xp ?? parsedSession.user?.xp;
        return typeof storedXp === 'number' && Number.isFinite(storedXp) ? storedXp : 0;
    } catch {
        return 0;
    }
};

export default function HomePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const user = useSessionUser();
    const hoje = new Date().toISOString().split('T')[0];
    const isMissionAlreadyCompleted = user?.lastMissionDate === hoje;
    const xp = user?.xp ?? getXpFromStoredUserSession();
    const levelProgress = getLevelProgress(xp);
    const missionCompleted = isMissionAlreadyCompleted;
    const [feedback, setFeedback] = useState<FeedbackState | null>(null);

    const age = calculateAge(user?.dob || '');
    const routine = calculateClinicalRoutine(age, user?.skinHistory || 'nao');
    const monthsStreak = calculateMonthStreak(user?.assessmentHistory || []);
    const scanDoneThisMonth = isScanDoneThisMonth(user?.assessmentHistory || []);

    const [uvIndex, setUvIndex] = useState<number | null>(null);
    const [locationError, setLocationError] = useState(false);

    const obterLocalizacaoEUV = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationError(true);
            setFeedback({ tone: 'warning', message: t('feedback.home_location_fallback') });
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            if (typeof latitude !== 'number' || typeof longitude !== 'number') {
                setLocationError(true);
                setUvIndex(5);
                setFeedback({ tone: 'warning', message: t('feedback.home_location_fallback') });
                return;
            }

            try {
                const response = await fetch('https://api.ipma.pt/open-data/forecast/meteorology/uv/uv.json');
                const data = await response.json();

                if (data && data.length > 0) {
                   
                    setUvIndex(data[0].iUv);
                }
            } catch (error) {
                console.error("Erro ao contactar o IPMA", error);
                setUvIndex(7); 
            }
        }, () => {
            setLocationError(true);
            setUvIndex(5);
            setFeedback({ tone: 'warning', message: t('feedback.home_location_fallback') });
        });
    }, [t]);

    useEffect(() => {
        if (user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            obterLocalizacaoEUV();
        } else if (user === null) {
            navigate('/');
        }
    }, [navigate, obterLocalizacaoEUV, user]);

    const getUVStatus = (index: number | null) => {
        if (index === null) return { text: "...", color: "#bdc3c7" };
        if (index <= 2) return { text: t('home.uv_low'), color: '#2ecc71' };
        if (index <= 5) return { text: t('home.uv_moderate'), color: '#f1c40f' };
        if (index <= 7) return { text: t('home.uv_high'), color: '#e67e22' };
        return { text: t('home.uv_extreme'), color: '#e74c3c' };
    };

    const uvStatus = getUVStatus(uvIndex);

    const handleCompleteMission = async () => {
        if (!user) return;
        if (missionCompleted) {
            setFeedback({ tone: 'info', message: t('feedback.home_mission_already_done') });
            return;
        }

            await awardDailyMissionXp(DAILY_MISSION_XP_REWARD, DAILY_MISSION_POINTS_REWARD);
            setFeedback({
                tone: 'success',
                message: t('feedback.home_mission_completed', {
                    points: DAILY_MISSION_POINTS_REWARD,
                    xp: DAILY_MISSION_XP_REWARD
                })
            });
    };

    if (user === undefined) return <main className="home-container" aria-busy="true"><div style={{padding: '20px', textAlign: 'center'}}>{t('profile.loading')}</div></main>;
    if (!user) return null;

    return (
        <main className="home-container" aria-label={t('nav.home')}>
            {feedback && (
                <FeedbackMessage
                    tone={feedback.tone}
                    message={feedback.message}
                    onClose={() => setFeedback(null)}
                />
            )}

            {/* Header */}
            <header className="home-header">
                <div className="user-info">
                    <h1>{t('home.welcome')}, {user.name.split(' ')[0]}!</h1>
                    <p>{t('home.subtitle')}</p>
                </div>
                <button type="button" className="avatar-circle" onClick={() => navigate('/profile')} aria-label={t('nav.profile')}>
                    <ChameleonAvatar avatar={getAvatar(user)} size="sm" />
                </button>
            </header>

            {/* Card de Nível */}
            <section className="level-card">
                <div className="level-header">
                    <div className="trophy-icon-container">
                        <Trophy size={26} color="white" strokeWidth={2} />
                    </div>
                    <div className="level-text">
                        <span>{t('home.level')}</span>
                        <h3>{t('avatar.level', { level: levelProgress.currentLevel })}</h3>
                    </div>
                    <Sparkles className="sparkle-icon" size={28} color="#f1c40f" strokeWidth={2} />
                </div>

                <div className="progress-container">
                    <div className="progress-labels">
                        <span>{t('home.progress')}</span>
                        <span>{levelProgress.currentLevelXp}/{levelProgress.xpForNextLevel} XP</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${levelProgress.progressPercentage}%` }}></div>
                    </div>
                </div>
            </section>

            {/* Estatísticas Rápidas */}
            <div className="quick-stats">
                <div className="stat-box">
                    <Target size={24} color="#2ecc71" />
                    <strong>{user.points || 0}</strong>
                    <span>{t('home.points')}</span>
                </div>
                <div className="stat-box">
                    <Flame size={24} color="#e67e22" />
                    <strong>{monthsStreak}</strong>
                    <span>{t('home.months')}</span>
                </div>
                <div className="stat-box">
                    <Award size={24} color="#3498db" />
                    <strong>{user.scansCount || 0}</strong>
                    <span>{t('home.scans')}</span>
                </div>
            </div>

            <button type="button" className="main-scan-btn" onClick={() => navigate('/scan')}>
                <Camera size={24} color="white" />
                {t('home.new_scan')}
            </button>

            {/* Meta Adaptativa e Lembrete */}
            <section className="adaptive-goal-card" style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={20} color="#3498db" />
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#2c3e50' }}>{t('home.adaptive_goal')}</h3>
                    </div>
                    <span style={{ fontSize: '12px', background: '#ecf0f1', padding: '4px 8px', borderRadius: '12px', color: '#7f8c8d', fontWeight: 600 }}>
                        {age} Anos
                    </span>
                </div>
                
                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '12px', borderLeft: `4px solid ${routine === 'semestral' ? '#9b59b6' : routine === 'annual' ? '#f1c40f' : '#3498db'}` }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#34495e' }}>
                        {t(`home.routine_${routine}`)}
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#7f8c8d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {scanDoneThisMonth ? (
                            <><CheckCircle size={14} color="#2ecc71" /> <span style={{ color: '#2ecc71', fontWeight: 500 }}>{t('home.scan_done')}</span></>
                        ) : (
                            <><AlertCircle size={14} color="#e67e22" /> <span style={{ color: '#e67e22', fontWeight: 500 }}>{t('home.scan_pending')}</span></>
                        )}
                    </p>
                </div>

                <div style={{ marginTop: '12px', fontSize: '13px', color: '#555', background: '#eef2f5', padding: '10px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span>{t(`home.reminder_${routine}`)}</span>
                </div>
            </section>


            {/* Missão Diária com IPMA */}
            <section className="mission-card">
                <div className="mission-icon-container" style={{ backgroundColor: uvStatus.color }}>
                    <Sun size={28} color="#fff" fill="#fff" />
                </div>
                <div className="mission-content">
                    <div className="mission-header-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3>{t('home.daily_mission_title')}</h3>
                        {locationError && (
                            <span title="Erro ao obter localização">
                                <MapPin size={14} color="#e74c3c" />
                            </span>
                        )}
                    </div>
                    <p aria-live="polite">
                        {uvIndex !== null
                            ? `Índice UV ${uvIndex} (${uvStatus.text}) - ${t('home.apply_sunscreen')}`
                            : "A carregar dados do IPMA..."}
                    </p>

                    <button
                        className={`complete-mission-btn ${missionCompleted ? 'completed' : ''}`}
                        onClick={handleCompleteMission}
                        disabled={missionCompleted}
                    >
                        {missionCompleted ? (
                            <>
                                <CheckCircle size={16} color="white" />
                                <span>{t('home.mission_done')}</span>
                            </>
                        ) : (
                            `${t('home.complete_mission')} (+${DAILY_MISSION_XP_REWARD} XP +${DAILY_MISSION_POINTS_REWARD} ${t('home.points')})`
                        )}
                    </button>
                </div>
            </section>

            {/* Conquistas */}
            <section className="achievements-card">
                <div className="section-title">
                    <Award size={18} color="#f1c40f" />
                    <h3>{t('home.recent_achievements')}</h3>
                </div>
                <button type="button" className="achievement-item unlocked achievement-action" onClick={() => navigate('/profile', { state: { tab: 'achievements' } })} aria-label="Ver conquista primeiro passo">
                    <div className="achievement-img">🎯</div>
                    <div className="achievement-info">
                        <h4>{t('home.achievement_first_step_title')}</h4>
                        <p>{t('home.achievement_first_step_desc')}</p>
                    </div>
                    <span className="achievement-count">0/1</span>
                    <ChevronRight size={16} color="#ccc" />
                </button>
                <div className="achievement-item locked">
                    <div className="achievement-img">🔍</div>
                    <div className="achievement-info">
                        <h4>{t('home.achievement_explorer_title')}</h4>
                        <p>{t('home.achievement_explorer_desc')}</p>
                    </div>
                    <span className="achievement-count">0/5</span>
                    <ChevronRight size={16} color="#ccc" />
                </div>
            </section>

            {/* Aviso Médico */}
            <div className="medical-disclaimer">
                <div className="disclaimer-icon">
                    <AlertCircle size={22} color="#1c4974" />
                </div>
                <p><strong>{t('home.warning')}:</strong> {t('home.medical_warning_text')}</p>
            </div>

            {/* Navbar */}
            <nav className="bottom-navbar" aria-label="Navegação principal">
                <button type="button" className="nav-btn active" aria-current="page">
                    <Home size={24} />
                    <span>{t('nav.home')}</span>
                </button>
                <button type="button" className="nav-btn" onClick={() => navigate('/scan')}>
                    <Camera size={24} />
                    <span>{t('nav.scan')}</span>
                </button>
                <button type="button" className="nav-btn" onClick={() => navigate('/history')}>
                    <History size={24} />
                    <span>{t('nav.history')}</span>
                </button>
                <button type="button" className="nav-btn" onClick={() => navigate('/learn')}>
                    <BookOpen size={24} />
                    <span>{t('nav.learn')}</span>
                </button>
            </nav>
        </main>
    );
}
