import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Target, Flame, Award, Camera, Sun,
    Trophy, Home, History, BookOpen, AlertCircle, ChevronRight,
    User as UserIcon, Sparkles, CheckCircle, MapPin
} from 'lucide-react';
import './HomePage.css';
import FeedbackMessage from '../../../components/FeedbackMessage';
import { awardDailyMissionXp, getSessionUser } from '../../../services/session';

type FeedbackState = {
    tone: 'success' | 'error' | 'warning' | 'info';
    message: string;
};

type SessionUser = {
    id?: number;
    name: string;
    email: string;
    dob: string;
    password: string;
    xp?: number;
    points?: number;
    weeksStreak?: number;
    scansCount?: number;
    lastMissionDate?: string;
};

export default function HomePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const initialUser = getSessionUser() as SessionUser | null;
    const isMissionAlreadyCompleted = initialUser?.lastMissionDate === new Date().toLocaleDateString();

    const [user, setUser] = useState<SessionUser | null>(initialUser);
    const [xp, setXp] = useState(initialUser?.xp || 0);
    const [missionCompleted, setMissionCompleted] = useState(isMissionAlreadyCompleted);
    const [feedback, setFeedback] = useState<FeedbackState | null>(null);

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
        } else {
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

    const handleCompleteMission = () => {
        if (!user) return;
        if (missionCompleted) {
            setFeedback({ tone: 'info', message: t('feedback.home_mission_already_done') });
            return;
        }

        const updatedUser = awardDailyMissionXp(25) as SessionUser | null;
        if (!updatedUser) return;

        setUser(updatedUser);
        setXp(updatedUser.xp || 0);
        setMissionCompleted(true);
        setFeedback({ tone: 'success', message: t('feedback.home_mission_completed') });
    };

    const calculateProgress = (currentXp: number, total: number) => {
        const percentage = (currentXp / total) * 100;
        return percentage > 100 ? 100 : percentage;
    };

    if (!user) return null;

    return (
        <main className="home-container" aria-label="Página inicial do utilizador">
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
                <button type="button" className="avatar-circle" onClick={() => navigate('/profile')} aria-label="Abrir perfil">
                    <UserIcon size={30} color="#5fa79a" strokeWidth={2.5} />
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
                        <h3>{t('home.level_starter')}</h3>
                    </div>
                    <Sparkles className="sparkle-icon" size={28} color="#f1c40f" strokeWidth={2} />
                </div>

                <div className="progress-container">
                    <div className="progress-labels">
                        <span>{xp} XP</span>
                        <span>100 XP</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${calculateProgress(xp, 100)}%` }}></div>
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
                    <strong>{user.weeksStreak || 0}</strong>
                    <span>{t('home.weeks')}</span>
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
                            `${t('home.complete_mission')} (+25 XP)`
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