import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../Login/Login.css';
import logoImg from '../../../assets/logo.png';
import { db } from '../../../db/db';
import FeedbackMessage from '../../../components/FeedbackMessage';
import { DEFAULT_AVATAR } from '../../../services/avatar';
import { validatePassword } from '../../../services/session';
import { api } from '../../../services/api';

export default function Register() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [mostrarPassword, setMostrarPassword] = useState(false);

    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [anoNasc, setAnoNasc] = useState('');
    const [password, setPassword] = useState('');
    const [historicoPele, setHistoricoPele] = useState('');
    const [aceitouTermos, setAceitouTermos] = useState(false);
    const [erroUI, setErroUI] = useState('');
    const [sucessoUI, setSucessoUI] = useState('');

    useEffect(() => {
        if (erroUI || sucessoUI) {
            const timer = setTimeout(() => {
                setErroUI('');
                setSucessoUI('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [erroUI, sucessoUI]);

    const listaAnos = Array.from(
        { length: 100 },
        (_, i) => (new Date().getFullYear() - i).toString()
    );

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErroUI('');
        setSucessoUI('');

        if (!nome || !email || !anoNasc || !password || !historicoPele) {
            setErroUI(t('errors.fill_all'));
            return;
        }

        if (!aceitouTermos) {
            setErroUI(t('errors.accept_terms'));
            return;
        }

        if (!validatePassword(password)) {
            setErroUI(t('register.password_policy_error'));
            return;
        }

        try {
            const mappedHistory = historicoPele === 'sim' ? 'yes' : 'no';

            const response = await api.registerExternal({
                name: nome,
                email: email,
                dob: anoNasc, 
                skinHistory: mappedHistory,
                xp: 0,
                points: 0,
                accountStatus: 'active'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro no servidor');
            }

            await db.users.add({
                name: nome,
                email,
                dob: anoNasc, 
                password,
                skinHistory: historicoPele,
                createdAt: new Date().toISOString(),
                accountStatus: 'active',
                xp: 0,
                points: 0,
                weeksStreak: 0,
                scansCount: 0,
                earnedBadges: [],
                avatar: DEFAULT_AVATAR,
                completedChallenges: [],
                challengeHistory: [],
                assessmentHistory: []
            });

            setSucessoUI('Conta criada com sucesso!');
            setTimeout(() => navigate('/'), 2000);

        } catch (err: any) {
            console.error("Erro no registo:", err);
            setErroUI(err.message || t('errors.email_exists'));
        }
    };

    const mudarIdioma = () => {
        const novoIdioma = i18n.language === 'pt' ? 'en' : 'pt';
        i18n.changeLanguage(novoIdioma);
    };

    return (
        <main className="login-container" aria-labelledby="register-title-main">
            <button
                type="button"
                className="language-toggle"
                onClick={mudarIdioma}
                aria-label={i18n.language === 'pt' ? 'Mudar idioma para English' : 'Switch language to Portuguese'}
            >
                {i18n.language === 'pt' ? <><span style={{ fontSize: '18px' }}>🇵🇹</span> PT</> : <><span style={{ fontSize: '18px' }}>🇬🇧</span> EN</>}
            </button>

            <div className="login-header">
                <div className="logo-title-group">
                    <img src={logoImg} alt="Logo Nevo" className="logo-img" />
                    <h1 id="register-title-main" className="login-brand-name">Nevo</h1>
                </div>
                <p className="login-subtitle">{t('login.subtitle')}</p>
            </div>

            <form className="login-card" onSubmit={handleRegister} noValidate>
                <h2 className="login-title">{t('register.title')}</h2>

                {erroUI && (
                    <FeedbackMessage tone="error" message={erroUI} onClose={() => setErroUI('')} />
                )}

                {sucessoUI && (
                    <FeedbackMessage tone="success" message={sucessoUI} onClose={() => setSucessoUI('')} />
                )}

                <div className="login-input-group">
                    <label htmlFor="register-name">{t('register.name')} *</label>
                    <div className="input-wrapper">
                        <User className="input-icon" size={20} />
                        <input id="register-name" type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder={t('register.name_placeholder')} className="login-input with-icon" required />
                    </div>
                </div>

                <div className="login-input-group">
                    <label htmlFor="register-email">{t('register.email')} *</label>
                    <div className="input-wrapper">
                        <Mail className="input-icon" size={20} />
                        <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="login-input with-icon" required />
                    </div>
                </div>

                {/* 🔥 SELEÇÃO APENAS DO ANO DE NASCIMENTO (Substitui o calendário completo) */}
                <div className="login-input-group">
                    <label htmlFor="register-dob">{t('register.dob', 'Ano de Nascimento')} *</label>
                    <div className="input-wrapper">
                        <Calendar className="input-icon" size={20} />
                        <select
                            id="register-dob"
                            value={anoNasc}
                            onChange={(e) => setAnoNasc(e.target.value)}
                            className="login-input with-icon"
                            style={{ appearance: 'none', WebkitAppearance: 'none' }}
                            required
                        >
                            <option value="" disabled hidden>{t('register.select_year', 'Selecione o ano')}</option>
                            {listaAnos.map(ano => (
                                <option key={ano} value={ano}>{ano}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="login-input-group">
                    <label htmlFor="register-password">{t('register.password')} *</label>
                    <div className="input-wrapper">
                        <Lock className="input-icon" size={20} />
                        <input id="register-password" type={mostrarPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="........." className="login-input with-icon" required />
                        <button type="button" className="eye-button" onClick={() => setMostrarPassword(!mostrarPassword)}>
                            {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <div className="login-input-group skin-history-group">
                    <label>{t('register.skin_history_question')} *</label>
                    <div className="radio-options">
                        <label className="radio-card">
                            <input type="radio" name="skinHistory" value="sim" checked={historicoPele === 'sim'} onChange={(e) => setHistoricoPele(e.target.value)} />
                            <span>{t('register.yes')}</span>
                        </label>
                        <label className="radio-card">
                            <input type="radio" name="skinHistory" value="nao" checked={historicoPele === 'nao'} onChange={(e) => setHistoricoPele(e.target.value)} />
                            <span>{t('register.no')}</span>
                        </label>
                        <label className="radio-card">
                            <input type="radio" name="skinHistory" value="pnr" checked={historicoPele === 'pnr'} onChange={(e) => setHistoricoPele(e.target.value)} />
                            <span>{t('register.pnr')}</span>
                        </label>
                    </div>
                </div>

                <div className="login-input-group" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '10px', marginTop: '20px' }}>
                    <input
                        type="checkbox"
                        id="privacy"
                        checked={aceitouTermos}
                        onChange={(e) => setAceitouTermos(e.target.checked)}
                        style={{ marginTop: '3px' }}
                        required
                    />
                    <label htmlFor="privacy" style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', lineHeight: '1.4' }}>
                        {t('register.consent_read')}{' '}
                        <strong className="link-clicavel" onClick={() => navigate('/terms')}>
                            {t('terms.title')}
                        </strong>
                        {' '}{t('register.consent_and')}{' '}
                        <strong className="link-clicavel" onClick={() => navigate('/privacy')}>
                            {t('privacy.title')}
                        </strong>{' '}
                        {t('register.consent_processing')}
                    </label>
                </div>

                <button type="submit" className="login-button">{t('register.button')}</button>

                <div className="login-footer" style={{ marginTop: '20px' }}>
                    <p className="register-text">
                        {t('register.already_account')} <Link to="/" className="login-link">{t('register.sign_in')}</Link>
                    </p>
                </div>
            </form>
        </main>
    );
}