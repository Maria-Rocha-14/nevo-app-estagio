import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../Login/Login.css';
import logoImg from '../../../assets/logo.png';
import { db } from '../../../db/db';
import FeedbackMessage from '../../../components/FeedbackMessage';

export default function Register() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [mostrarPassword, setMostrarPassword] = useState(false);

    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [dataNasc, setDataNasc] = useState('');
    const [password, setPassword] = useState('');
    const [aceitouTermos, setAceitouTermos] = useState(false);
    const [erroUI, setErroUI] = useState('');
    const hasError = Boolean(erroUI);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErroUI('');

        if (!nome || !email || !dataNasc || !password) {
            setErroUI(t('errors.fill_all'));
            return;
        }

        if (!aceitouTermos) {
            setErroUI(t('errors.accept_terms'));
            return;
        }

        try {
            await db.users.add({ name: nome, email, dob: dataNasc, password });
            navigate('/');
        } catch {
            setErroUI(t('errors.email_exists'));
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

            <form className="login-card" onSubmit={handleRegister} noValidate aria-describedby={hasError ? 'register-form-error' : undefined}>
                <h2 className="login-title">{t('register.title')}</h2>

                {erroUI && (
                    <div id="register-form-error">
                        <FeedbackMessage tone="error" message={erroUI} onClose={() => setErroUI('')} />
                    </div>
                )}

                <div className="login-input-group">
                    <label htmlFor="register-name">{t('register.name')}</label>
                    <div className="input-wrapper">
                        <User className="input-icon" size={20} aria-hidden="true" />
                        <input id="register-name" type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder={t('register.name_placeholder')} className="login-input with-icon" autoComplete="name" required aria-invalid={hasError && !nome} aria-describedby={hasError ? 'register-form-error' : undefined} />
                    </div>
                </div>

                <div className="login-input-group">
                    <label htmlFor="register-email">{t('register.email')}</label>
                    <div className="input-wrapper">
                        <Mail className="input-icon" size={20} aria-hidden="true" />
                        <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="login-input with-icon" autoComplete="email" required aria-invalid={hasError && !email} aria-describedby={hasError ? 'register-form-error' : undefined} />
                    </div>
                </div>

                <div className="login-input-group">
                    <label htmlFor="register-dob">{t('register.dob')}</label>
                    <div className="input-wrapper">
                        <Calendar className="input-icon" size={20} aria-hidden="true" />
                        <input id="register-dob" type="date" value={dataNasc} onChange={(e) => setDataNasc(e.target.value)} className="login-input with-icon" required aria-invalid={hasError && !dataNasc} aria-describedby={hasError ? 'register-form-error' : undefined} />
                    </div>
                </div>

                <div className="login-input-group">
                    <label htmlFor="register-password">{t('register.password')}</label>
                    <div className="input-wrapper">
                        <Lock className="input-icon" size={20} aria-hidden="true" />
                        <input id="register-password" type={mostrarPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="........." className="login-input with-icon" autoComplete="new-password" required aria-invalid={hasError && !password} aria-describedby={hasError ? 'register-form-error' : undefined} />
                        <button type="button" className="eye-button" onClick={() => setMostrarPassword(!mostrarPassword)} aria-label={mostrarPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'} aria-pressed={mostrarPassword}>
                            {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <div className="login-input-group" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '10px' }}>
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
                        {t('register.consent_and')}{' '}
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