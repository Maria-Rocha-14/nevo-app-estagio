import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Login.css';
import logoImg from '../../../assets/logo.png';
import { db } from '../../../db/db';
import FeedbackMessage from '../../../components/FeedbackMessage';
import { setSessionUser } from '../../../services/session';

export default function Login() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [mostrarPassword, setMostrarPassword] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [erroUI, setErroUI] = useState('');
    const hasError = Boolean(erroUI);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErroUI('');

        // 1. Validação de campos vazios
        if (!email || !password) {
            setErroUI(t('errors.fill_all'));
            return;
        }

        try {
            // 2. Procura o utilizador na base de dados local (Dexie)
            const user = await db.users.where({ email: email }).first();

            if (!user) {
                setErroUI(t('errors.user_not_found'));
                return;
            }

            // 3. Verifica a password
            if (user.password !== password) {
                setErroUI(t('errors.wrong_password'));
                return;
            }

            // 4. Se tudo estiver bem, guarda a sessão e navega para a Home
            setSessionUser(user);
            navigate('/homepage');

        } catch (error) {
            console.error("Login Error:", error);
            setErroUI(t('errors.database_error'));
        }
    };

    const mudarIdioma = () => {
        const novoIdioma = i18n.language === 'pt' ? 'en' : 'pt';
        i18n.changeLanguage(novoIdioma);
    };

    return (
        <main className="login-container" aria-labelledby="login-title-main">
            {/* Botão de Idioma no topo */}
            <button
                type="button"
                className="language-toggle"
                onClick={mudarIdioma}
                aria-label={i18n.language === 'pt' ? 'Mudar idioma para English' : 'Switch language to Portuguese'}
            >
                {i18n.language === 'pt' ?
                    <><span style={{ fontSize: '18px' }}>🇵🇹</span> PT</> :
                    <><span style={{ fontSize: '18px' }}>🇬🇧</span> EN</>
                }
            </button>

            <div className="login-header">
                <div className="logo-title-group">
                    <img src={logoImg} alt="Logo Nevo" className="logo-img" />
                    <h1 id="login-title-main" className="login-brand-name">Nevo</h1>
                </div>
                <p className="login-subtitle">{t('login.subtitle')}</p>
            </div>

            <form className="login-card" onSubmit={handleLogin} noValidate aria-describedby={hasError ? 'login-form-error' : undefined}>
                <h2 className="login-title">{t('login.title')}</h2>

                {/* Mensagem de Erro Dinâmica */}
                {erroUI && (
                    <div id="login-form-error">
                        <FeedbackMessage tone="error" message={erroUI} onClose={() => setErroUI('')} />
                    </div>
                )}

                <div className="login-input-group">
                    <label htmlFor="login-email">{t('login.email')}</label>
                    <div className="input-wrapper">
                        <Mail className="input-icon" size={20} aria-hidden="true" />
                        <input
                            id="login-email"
                            type="email"
                            placeholder="seu@email.com"
                            className="login-input with-icon"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                            aria-invalid={hasError && (!email || erroUI === t('errors.user_not_found'))}
                            aria-describedby={hasError ? 'login-form-error' : undefined}
                        />
                    </div>
                </div>

                <div className="login-input-group">
                    <label htmlFor="login-password">{t('login.password')}</label>
                    <div className="input-wrapper">
                        <Lock className="input-icon" size={20} aria-hidden="true" />
                        <input
                            id="login-password"
                            type={mostrarPassword ? "text" : "password"}
                            placeholder="........."
                            className="login-input with-icon"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            aria-invalid={hasError && (!password || erroUI === t('errors.wrong_password'))}
                            aria-describedby={hasError ? 'login-form-error' : undefined}
                        />
                        <button
                            type="button"
                            className="eye-button"
                            onClick={() => setMostrarPassword(!mostrarPassword)}
                            aria-label={mostrarPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                            aria-pressed={mostrarPassword}
                        >
                            {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <button type="submit" className="login-button">
                    {t('login.enter')}
                </button>

                <div className="login-divider">
                    <span>{t('login.or')}</span>
                </div>

                <button type="button" className="login-social-button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {t('login.google')}
                </button>

                <div className="login-footer">
                    <p className="legal-text">
                        {t('login.terms')}{' '}
                        <strong className="link-clicavel" onClick={() => navigate('/terms')}>
                            {t('terms.title')}
                        </strong>{' '}
                        {t('login.privacy')}{' '}
                        <strong className="link-clicavel" onClick={() => navigate('/privacy')}>
                            {t('privacy.title')}
                        </strong>
                    </p>
                    <p className="register-text">
                        {t('login.no_account')} <Link to="/register" className="login-link">{t('login.register')}</Link>
                    </p>
                </div>
            </form>
        </main>
    );
}