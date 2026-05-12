import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Login.css';
import logoImg from '../../../assets/logo.png';
import { db } from '../../../db/db';
import FeedbackMessage from '../../../components/FeedbackMessage';
import { seedAndLoginDemoUser } from '../../../services/devSeed';
import { setAdminLoggedIn, setLoggedInUserId, validateAdminCredentials } from '../../../services/session';

const DEMO_EMAIL = 'demo@nevo.local';
const DEMO_PASSWORD = 'Demo#1234';

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
            if (validateAdminCredentials(email, password)) {
                setAdminLoggedIn(true);
                navigate('/admin/quizzes');
                return;
            }

            if (import.meta.env.DEV && email === DEMO_EMAIL && password === DEMO_PASSWORD) {
                await seedAndLoginDemoUser();
                navigate('/homepage');
                return;
            }

            // 2. Procura o utilizador na base de dados local (Dexie)
            const user = await db.users.where({ email: email }).first();

            if (!user) {
                setErroUI(t('errors.user_not_found'));
                return;
            }

            if ((user.accountStatus || 'active') === 'suspended') {
                setErroUI('Esta conta está suspensa. Contacte o suporte da plataforma.');
                return;
            }

            // 3. Verifica a password
            if (user.password !== password) {
                setErroUI(t('errors.wrong_password'));
                return;
            }

            // 4. Se tudo estiver bem, guarda a sessão temporária (só ID) e navega para a Home
            if (user.id) {
                setLoggedInUserId(user.id);
            }
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

    const handleDemoLogin = async () => {
        try {
            setErroUI('');
            await seedAndLoginDemoUser();
            navigate('/homepage');
        } catch (error) {
            console.error('Demo seed error:', error);
            setErroUI(t('errors.database_error'));
        }
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

                {import.meta.env.DEV && (
                    <button type="button" className="demo-login-button" onClick={handleDemoLogin}>
                        {t('login.demo_profile')}
                    </button>
                )}

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
