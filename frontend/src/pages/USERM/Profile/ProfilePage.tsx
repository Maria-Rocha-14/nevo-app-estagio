import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, Save, ShieldCheck, User as UserIcon } from 'lucide-react';
import FeedbackMessage from '../../../components/FeedbackMessage';
import { db } from '../../../db/db';
import { useSessionUser } from '../../../services/session';
import type { User } from '../../../db/db';
import './ProfilePage.css';

type FeedbackState = {
  tone: 'success' | 'error' | 'warning' | 'info';
  message: string;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const sessionUser = useSessionUser();
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (sessionUser) {
      setName(sessionUser.name);
    }
  }, [sessionUser]);

  const updateStoredUser = async (updatedUser: User) => {
    if (updatedUser.id) {
      await db.users.update(updatedUser.id, {
        name: updatedUser.name,
        password: updatedUser.password
      });
      return;
    }

    await db.users.where({ email: updatedUser.email }).modify({
      name: updatedUser.name,
      password: updatedUser.password
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!sessionUser) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setFeedback({ tone: 'error', message: 'Introduz um nome para o perfil.' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setFeedback({ tone: 'error', message: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ tone: 'error', message: 'As palavras-passe não coincidem.' });
      return;
    }

    const updatedUser = {
      ...sessionUser,
      name: trimmedName,
      password: newPassword || sessionUser.password
    };

    try {
      setIsSaving(true);
      await updateStoredUser(updatedUser);
      setNewPassword('');
      setConfirmPassword('');
      setFeedback({ tone: 'success', message: 'Perfil atualizado com sucesso.' });
    } catch (error) {
      console.error('Profile update error:', error);
      setFeedback({ tone: 'error', message: 'Não foi possível atualizar o perfil.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (sessionUser === undefined) return <main className="profile-container" aria-busy="true"><div style={{padding: '20px', textAlign: 'center'}}>A carregar sessão...</div></main>;
  if (!sessionUser) { navigate('/'); return null; }

  return (
    <main className="profile-container" aria-labelledby="profile-title">
      <header className="profile-header">
        <button type="button" className="profile-icon-btn" onClick={() => navigate('/homepage')} aria-label="Voltar">
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <div>
          <p className="profile-kicker">Perfil</p>
          <h1 id="profile-title">Personalização</h1>
        </div>
      </header>

      <section className="profile-summary" aria-label="Resumo do utilizador">
        <div className="profile-avatar" aria-hidden="true">
          <UserIcon size={34} />
        </div>
        <div className="profile-summary-text">
          <strong>{sessionUser.name}</strong>
          <span>{sessionUser.email}</span>
        </div>
      </section>

      {feedback && (
        <FeedbackMessage
          tone={feedback.tone}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <section className="profile-card" aria-labelledby="profile-data-title">
          <div className="profile-section-heading">
            <div className="profile-section-icon">
              <UserIcon size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 id="profile-data-title">Dados do perfil</h2>
              <p>Atualiza apenas o nome visível na aplicação.</p>
            </div>
          </div>

          <label className="profile-field" htmlFor="profile-name">
            <span>Nome</span>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </label>

          <label className="profile-field" htmlFor="profile-email">
            <span>Email</span>
            <input id="profile-email" type="email" value={sessionUser.email} disabled />
          </label>
        </section>

        <section className="profile-card" aria-labelledby="profile-password-title">
          <div className="profile-section-heading">
            <div className="profile-section-icon profile-section-icon-blue">
              <ShieldCheck size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 id="profile-password-title">Palavra-passe</h2>
              <p>Deixa em branco se quiseres manter a atual.</p>
            </div>
          </div>

          <label className="profile-field" htmlFor="profile-password">
            <span>Nova palavra-passe</span>
            <div className="profile-password-wrapper">
              <Lock size={18} aria-hidden="true" />
              <input
                id="profile-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="profile-field" htmlFor="profile-confirm-password">
            <span>Confirmar palavra-passe</span>
            <div className="profile-password-wrapper">
              <Lock size={18} aria-hidden="true" />
              <input
                id="profile-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Repetir palavra-passe"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={showConfirmPassword ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
        </section>

        <button type="submit" className="profile-save-btn" disabled={isSaving}>
          <Save size={20} aria-hidden="true" />
          {isSaving ? 'A guardar...' : 'Guardar alterações'}
        </button>
      </form>
    </main>
  );
}
