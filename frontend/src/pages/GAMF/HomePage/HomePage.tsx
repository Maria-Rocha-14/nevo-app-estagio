import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Target, Flame, Award, Camera, Sun,
    Trophy, Home, History, BookOpen, AlertCircle, ChevronRight,
    Sparkles, CheckCircle, MapPin, HelpCircle
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import './HomePage.css';
import ChameleonAvatar from '../../../components/ChameleonAvatar';
import FeedbackMessage from '../../../components/FeedbackMessage';
import { db } from '../../../db/db';
import { getAvatar } from '../../../services/avatar';
import { getLevelProgress } from '../../../services/levelService';
import { awardDailyMissionXp, useSessionUser } from '../../../services/session';
import { calculateAge, calculateClinicalRoutine, calculateMonthStreak, isScanDoneThisMonth } from '../../../services/riskProfile';
import { api } from '../../../services/api';

type FeedbackState = {
    tone: 'success' | 'error' | 'warning' | 'info';
    message: string;
};

const DAILY_MISSION_XP_REWARD = 25;
const DAILY_MISSION_POINTS_REWARD = 10;

const IconRenderer = ({ name, size = 24, color = 'currentColor' }: { name: string, size?: number, color?: string }) => {
    const IconComponent = (LucideIcons as any)[name];
    return IconComponent ? <IconComponent size={size} color={color} /> : <HelpCircle size={size} color={color} />;
};

const getXpFromStoredUserSession = (): number => {
    try {
        const storedSession = localStorage.getItem('user_session');
        if (!storedSession) return 0;
        const parsedSession = JSON.parse(storedSession) as { xp?: number; user?: { xp?: number } };
        const storedXp = parsedSession.xp ?? parsedSession.user?.xp;
        return typeof storedXp === 'number' && Number.isFinite(storedXp) ? storedXp : 0;
    } catch {
        return 0;
    }
};

export default function HomePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation(); // 🔥 Resolvido conflito do cabeçalho da função (main)
    const user = useSessionUser();

    const hoje = new Date().toISOString().split('T')[0];

    const [realScans, setRealScans] = useState(0);
    const [realXP, setRealXP] = useState(0);
    const [realStreak, setRealStreak] = useState(0);
    const [realEarnedBadges, setRealEarnedBadges] = useState<string[]>([]);

    const [allBadges, setAllBadges] = useState<any[]>([]);
    const [loadingBadges, setLoadingBadges] = useState(true);

    const [localMissionCompleted, setLocalMissionCompleted] = useState(false);
    const [feedback, setFeedback] = useState<FeedbackState | null>(null);

    // 🔥 Unificados ambos os blocos em conflito (Lógica de badges + Tratamento de feedbacks vindos de rotas)
    const xp = realXP > 0 ? realXP : ((user?.xp as number) ?? getXpFromStoredUserSession());
    const levelProgress = getLevelProgress(xp);
    const missionCompleted = localMissionCompleted || user?.lastMissionDate === hoje;

    useEffect(() => {
        const routeFeedback = (location.state as { feedback?: FeedbackState } | null)?.feedback;
        if (!routeFeedback) return;

        setFeedback(routeFeedback);
        navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate]);

    const age = calculateAge(user?.dob || '');
    const routine = calculateClinicalRoutine(age, user?.skinHistory || 'nao');
    const monthsStreak = realStreak > 0 ? realStreak : calculateMonthStreak(user?.assessmentHistory || []);
    const scanDoneThisMonth = isScanDoneThisMonth(user?.assessmentHistory || []);

    const lastScan = user?.assessmentHistory?.length ? new Date(user.assessmentHistory[user.assessmentHistory.length - 1].createdAt) : null;
    const lastScanStr = lastScan ? lastScan.toLocaleDateString() : 'Nenhum registo';
    const deadlineDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const deadlineStr = deadlineDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    
    const streakProgress = Math.min(monthsStreak, 12);
    const streakPercentage = (streakProgress / 12) * 100;

    const todayStr = new Date().toISOString().split('T')[0];
    const educativeCompleted = user?.challengeHistory?.some(entry => entry.completedAt.startsWith(todayStr)) || false;

    const [uvIndex, setUvIndex] = useState<number | null>(null);
    const [locationError, setLocationError] = useState(false);

    useEffect(() => {
        if (user && user.id) {
            const carregarProgressoDexie = async () => {
                const localUser = await db.users.get(user.id);
                if (localUser) {
                    setRealScans(localUser.scansCount || 0);
                    setRealXP(localUser.xp || 0);
                    setRealStreak(localUser.weeksStreak || 0);
                    setRealEarnedBadges((localUser.earnedBadges || []).map(id => String(id).toLowerCase().trim()));
                }
            };
            carregarProgressoDexie();
        }

        const fetchRemoteBadges = async () => {
            try {
                const data = await api.getBadges();
                setAllBadges(data);
            } catch (err) {
                console.error("Erro ao obter moldes de badges, a usar locais...", err);
                const localBadges = await db.adminBadges.toArray();
                setAllBadges(localBadges);
            } finally {
                setLoadingBadges(false);
            }
        };

        fetchRemoteBadges();
    }, [user]);

    const carregarUvIndexFallback = useCallback(async () => {
        try {
            const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://api.ipma.pt/open-data/forecast/meteorology/uv/uv.json');
            const res = await fetch(proxyUrl);
            const data = await res.json();
            const ipmaData = JSON.parse(data.contents);

            if (ipmaData && ipmaData.length > 0) {
                const agora = Date.now();
                setUvIndex(ipmaData[0].iUv);

                sessionStorage.setItem('cached_uv_index', ipmaData[0].iUv.toString());
                sessionStorage.setItem('cached_uv_time', agora.toString());
                sessionStorage.setItem('cached_location_error', 'true');
            } else {
                setUvIndex(4);
            }
        } catch {
            setUvIndex(4);
        }
    }, []);

    useEffect(() => {
        if (user === null) {
            navigate('/');
            return;
        }
        if (!user) return;

        const cachedUv = sessionStorage.getItem('cached_uv_index');
        const cachedTime = sessionStorage.getItem('cached_uv_time');
        const cachedError = sessionStorage.getItem('cached_location_error');

        const agora = Date.now();
        const trintaMinutos = 30 * 60 * 1000;

        if (cachedUv !== null && cachedTime !== null && (agora - Number(cachedTime) < trintaMinutos)) {
            setUvIndex(Number(cachedUv));
            setLocationError(cachedError === 'true');
            return;
        }

        if (!navigator.geolocation) {
            setLocationError(true);
            carregarUvIndexFallback();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://api.ipma.pt/open-data/forecast/meteorology/uv/uv.json');
                    const response = await fetch(proxyUrl);
                    const data = await response.json();
                    const ipmaData = JSON.parse(data.contents);

                    if (ipmaData && ipmaData.length > 0) {
                        let maisProximo = ipmaData[0];
                        let menorDistancia = Infinity;

                        ipmaData.forEach((local: any) => {
                            const dStr = Math.pow(local.latitude - latitude, 2) + Math.pow(local.longitude - longitude, 2);
                            if (dStr < menorDistancia) {
                                menorDistancia = dStr;
                                maisProximo = local;
                            }
                        });

                        setUvIndex(maisProximo.iUv);
                        setLocationError(false);

                        sessionStorage.setItem('cached_uv_index', maisProximo.iUv.toString());
                        sessionStorage.setItem('cached_uv_time', agora.toString());
                        sessionStorage.setItem('cached_location_error', 'false');
                    }
                } catch {
                    setUvIndex(5);
                }
            },
            (error) => {
                console.warn("Acesso ao GPS recusado ou indisponível. A ativar estimativa por IP.", error);
                setLocationError(true);
                carregarUvIndexFallback();
            },
            { timeout: 8000, enableHighAccuracy: false, maximumAge: 300000 }
        );
    }, [user, navigate, carregarUvIndexFallback]);

    const getUVStatus = (index: number | null) => {
        if (index === null) return { text: "...", color: "#bdc3c7" };
        if (index <= 2) return { text: t('home.uv_low', 'Baixo'), color: '#2ecc71' };
        if (index <= 5) return { text: t('home.uv_moderate', 'Moderado'), color: '#f1c40f' };
        if (index <= 7) return { text: t('home.uv_high', 'Alto'), color: '#e67e22' };
        return { text: t('home.uv_extreme', 'Extremo'), color: '#e74c3c' };
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

        setLocalMissionCompleted(true);
        setRealXP(prev => prev + DAILY_MISSION_XP_REWARD);
    };

    const obterBadgesDinamicosParaAHome = () => {
        if (allBadges.length === 0) return [];

        const mapeados = allBadges.map(badge => {
            const currentId = String(badge._id || badge.id || '').toLowerCase().trim();
            const isEarned = realEarnedBadges.includes(currentId);

            let currentValue = xp;
            if (badge.requirementType === 'scans') currentValue = realScans;
            if (badge.requirementType === 'streak') currentValue = realStreak;

            const targetValue = badge.requirementValue || 1;

            const visualCurrentValue = (currentValue >= targetValue || isEarned) ? targetValue : currentValue;
            const percentage = (currentValue >= targetValue || isEarned) ? 100 : Math.min((visualCurrentValue / targetValue) * 100, 100);

            return { ...badge, isEarned: (currentValue >= targetValue || isEarned), visualCurrentValue, targetValue, percentage };
        });

        return mapeados.sort((a, b) => {
            if (a.isEarned && !b.isEarned) return 1;
            if (!a.isEarned && b.isEarned) return -1;
            return b.percentage - a.percentage;
        }).slice(0, 2);
    };

    const badgesVisiveisNaHome = obterBadgesDinamicosParaAHome();

    if (user === undefined) return <main className="home-container" aria-busy="true"><div style={{ padding: '20px', textAlign: 'center' }}>{t('profile.loading')}</div></main>;
    if (!user) return null;

    return (
        <main className="home-container" aria-label={t('nav.home')}>
            {feedback && (
                <FeedbackMessage tone={feedback.tone} message={feedback.message} onClose={() => setFeedback(null)} />
            )}

            {/* Header */}
            <header className="home-header">
                <div className="user-info">
                    <h1>{t('home.welcome')}, {user?.name ? user.name.split(' ')[0] : ''}!</h1>
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
                        <span>{levelProgress.totalXp}/{levelProgress.nextLevelTotalXp} XP</span>
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
                    <strong>{user?.points || 0}</strong>
                    <span>{t('home.points')}</span>
                </div>
                <div className="stat-box">
                    <Flame size={24} color="#e67e22" />
                    <strong>{monthsStreak}</strong>
                    <span>{t('home.months')}</span>
                </div>
                <div className="stat-box">
                    <Award size={24} color="#3498db" />
                    <strong>{realScans}</strong>
                    <span>{t('home.scans')}</span>
                </div>
            </div>

            <button type="button" className="main-scan-btn" onClick={() => navigate('/scan')}>
                <Camera size={24} color="white" />
                {t('home.new_scan')}
            </button>

            {/* Meta Adaptativa */}
            <section className="adaptive-goal-card" style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                {/* Header do Cartão */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Target size={22} color="#3498db" />
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#2c3e50' }}>{t('home.adaptive_goal')}</h3>
                        <span style={{ fontSize: '13px', color: '#7f8c8d' }}>{t(`home.routine_${routine}`)}</span>
                    </div>
                </div>
                
                {/* 🔥 Resolvido Conflito do Bloco Central: Mantém a Checklist e a Barra de Progresso de Streak (main) */}
                <div style={{ background: '#f8f9fa', padding: '14px', borderRadius: '12px', marginBottom: '16px', borderLeft: `4px solid ${routine === 'semestral' ? '#9b59b6' : routine === 'annual' ? '#f1c40f' : '#3498db'}` }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#34495e'}}>
                        <span>🔥 Streak de Scans</span>
                        <span>{monthsStreak} / 12 Meses</span>
                    </div>
                    
                    <div style={{ background: '#ecf0f1', height: '8px', borderRadius: '4px', margin: '8px 0' }}>
                         <div style={{ background: '#e67e22', width: `${streakPercentage}%`, height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                    </div>
                    
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#7f8c8d'}}>
                         <span>Último: {lastScanStr}</span>
                         <span style={{ color: scanDoneThisMonth ? '#2ecc71' : '#e67e22', fontWeight: scanDoneThisMonth ? 'normal' : 'bold' }}>
                            {!scanDoneThisMonth && `⏳ Fazer Scan até: ${deadlineStr}`}
                         </span>
                    </div>
                </div>

                {/* Checklist Diária */}
                <div>
                    <h4 style={{fontSize: '14px', margin: '0 0 10px 0', color: '#2c3e50'}}>{t('home.checklist_title')}</h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontSize: '14px', color: missionCompleted ? '#2ecc71' : '#34495e', transition: 'color 0.3s' }}>
                        {missionCompleted ? <CheckCircle size={18} /> : <div style={{width: 16, height: 16, border: '2px solid #bdc3c7', borderRadius: '50%'}} />}
                        <span style={{ textDecoration: missionCompleted ? 'line-through' : 'none' }}>{t('home.checklist_uv')}</span>
                    </div>

                    {!scanDoneThisMonth && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontSize: '14px', color: '#e67e22' }}>
                             <div style={{width: 16, height: 16, border: '2px solid #e67e22', borderRadius: '50%'}} />
                             <span>{t('home.checklist_scan_pending')}</span>
                        </div>
                    )}
                    
                    {routine === 'educative' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: educativeCompleted ? '#2ecc71' : '#34495e', transition: 'color 0.3s' }}>
                             {educativeCompleted ? <CheckCircle size={18} /> : <div style={{width: 16, height: 16, border: '2px solid #bdc3c7', borderRadius: '50%'}} />}
                             <span dangerouslySetInnerHTML={{ __html: t('home.checklist_educative') }} style={{ textDecoration: educativeCompleted ? 'line-through' : 'none' }} />
                        </div>
                    )}

                    {(routine === 'annual' || routine === 'semestral') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#34495e' }}>
                            <div style={{width: 16, height: 16, border: '2px solid #bdc3c7', borderRadius: '4px'}} />
                            <span>{t(`home.checklist_schedule_${routine}`)}</span>
                        </div>
                    )}
                </div>

                {/* Reminder Box */}
                <div style={{ marginTop: '16px', fontSize: '14px', fontWeight: 500, color: '#1c4974', background: '#e1f0fa', border: '1px solid #b6d4fe', padding: '12px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span>{t(`home.reminder_${routine}`)}</span>
                </div>
            </section>

            {/* Missão Diária */}
            <section className="mission-card">
                <div className="mission-icon-container" style={{ backgroundColor: uvStatus.color }}>
                    <Sun size={28} color="#fff" fill="#fff" />
                </div>
                <div className="mission-content">
                    <div className="mission-header-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3>{t('home.daily_mission_title')}</h3>
                        {locationError && (
                            <span title="Localização estimada por IP ativa">
                                <MapPin size={14} color="#f1c40f" />
                            </span>
                        )}
                    </div>
                    <p aria-live="polite">
                        {uvIndex !== null
                            ? `Índice UV ${uvIndex} (${uvStatus.text}) - ${t('home.apply_sunscreen')}`
                            : "🌍 A calcular o Índice UV para a sua localização..."}
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

            {/* Conquistas Dinâmicas */}
            <section className="achievements-card">
                <button
                    type="button"
                    className="achievements-section-header-link"
                    onClick={() => navigate('/profile')}
                    aria-label="Ver todas as conquistas no perfil"
                >
                    <div className="section-title">
                        <Award size={18} color="#f1c40f" />
                        <h3>{t('home.recent_achievements')}</h3>
                    </div>
                    <ChevronRight size={18} color="#5fa79a" />
                </button>

                {loadingBadges ? (
                    <p style={{ padding: '10px', fontSize: '13px', color: '#999', textAlign: 'center' }}>A sincronizar metas...</p>
                ) : badgesVisiveisNaHome.length === 0 ? (
                    <p style={{ padding: '10px', fontSize: '13px', color: '#999', textAlign: 'center' }}>Sem conquistas configuradas no momento.</p>
                ) : (
                    badgesVisiveisNaHome.map((badge: any, index: number) => (
                        <div
                            key={badge.percentage + badge.name}
                            className={`achievement-item ${index === 0 ? 'home-badge-first-item' : ''}`}
                        >
                            <div className="achievement-img-box-icon">
                                <IconRenderer
                                    name={badge.iconType || 'Trophy'}
                                    size={22}
                                    color={badge.isEarned ? '#5fa79a' : '#a4b0be'}
                                />
                            </div>
                            <div className="achievement-info">
                                <h4>{badge.name}</h4>
                                <p>{badge.description}</p>
                            </div>
                            <span className="achievement-count">
                                {badge.visualCurrentValue}/{badge.targetValue}
                            </span>
                        </div>
                    ))
                )}
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