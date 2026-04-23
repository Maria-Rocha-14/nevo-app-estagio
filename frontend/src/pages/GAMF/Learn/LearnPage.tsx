import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Brain, Camera, CheckCircle2, History, Home, ShieldCheck, Sparkles, SunMedium } from 'lucide-react';
import FeedbackMessage from '../../../components/FeedbackMessage';
import { completeChallengeOnce, useSessionUser } from '../../../services/session';
import './LearnPage.css';

type ChallengeType = 'card' | 'quiz';

type Challenge = {
  id: string;
  type: ChallengeType;
  visualTheme: 'teal' | 'blue' | 'orange';
  points: number;
  titleKey: string;
  contentKey: string;
  questionKey?: string;
  optionsKeys?: string[];
  correctIndex?: number;
};

type FeedbackState = {
  tone: 'success' | 'error' | 'warning' | 'info';
  message: string;
};

const CHALLENGES: Challenge[] = [
  {
    id: 'card-abcde',
    type: 'card',
    visualTheme: 'teal',
    points: 12,
    titleKey: 'learn.challenge1_title',
    contentKey: 'learn.challenge1_content'
  },
  {
    id: 'quiz-ugly-duckling',
    type: 'quiz',
    visualTheme: 'blue',
    points: 18,
    titleKey: 'learn.challenge2_title',
    contentKey: 'learn.challenge2_content',
    questionKey: 'learn.challenge2_question',
    optionsKeys: ['learn.challenge2_opt1', 'learn.challenge2_opt2', 'learn.challenge2_opt3'],
    correctIndex: 0
  },
  {
    id: 'card-sunscreen',
    type: 'card',
    visualTheme: 'orange',
    points: 10,
    titleKey: 'learn.challenge3_title',
    contentKey: 'learn.challenge3_content'
  }
];

export default function LearnPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});

  const user = useSessionUser();

  useEffect(() => {
    if (user === null) {
      navigate('/');
    }
  }, [navigate, user]);

  if (user === undefined) return <main className="learn-container" aria-busy="true"><div style={{padding: '20px', textAlign: 'center'}}>A carregar sessão...</div></main>;
  if (!user) {
    return null;
  }

  const completed = new Set(user.completedChallenges || []);
  const totalPoints = user.points;
  const history = user.challengeHistory;

  const challengesById = CHALLENGES.reduce<Record<string, Challenge>>((acc, challenge) => {
    acc[challenge.id] = challenge;
    return acc;
  }, {});

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const completeChallenge = async (challenge: Challenge) => {
    if (completed.has(challenge.id)) {
      setFeedback({ tone: 'info', message: t('learn.already_completed') });
      return;
    }

    await completeChallengeOnce(challenge.id, challenge.points);
    setFeedback({ tone: 'success', message: t('learn.points_awarded', { points: challenge.points }) });
  };

  const handleCardComplete = (challenge: Challenge) => {
    completeChallenge(challenge);
  };

  const handleQuizComplete = (challenge: Challenge) => {
    const selected = selectedOptions[challenge.id];

    if (selected === undefined) {
      setFeedback({ tone: 'warning', message: t('learn.select_answer') });
      return;
    }

    if (selected !== challenge.correctIndex) {
      setFeedback({ tone: 'error', message: t('learn.wrong_answer') });
      return;
    }

    completeChallenge(challenge);
  };

  const getChallengeVisual = (challenge: Challenge) => {
    if (challenge.id === 'card-abcde') {
      return { emoji: '🔎', icon: <Sparkles size={18} aria-hidden="true" /> };
    }

    if (challenge.id === 'quiz-ugly-duckling') {
      return { emoji: '🧠', icon: <Brain size={18} aria-hidden="true" /> };
    }

    return { emoji: '☀️', icon: <SunMedium size={18} aria-hidden="true" /> };
  };

  return (
    <main className="learn-container">
      <header className="learn-header">
        <h1>{t('learn.title')}</h1>
        <p>{t('learn.subtitle')}</p>
      </header>

      {feedback && (
        <FeedbackMessage
          tone={feedback.tone}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      <section className="learn-score-card" aria-label={t('learn.score_section')}>
        <div className="score-icon">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h2>{t('learn.total_points')}</h2>
          <strong>{totalPoints}</strong>
          <p className="learn-score-meta">{t('learn.completed_count', { current: completed.size, total: CHALLENGES.length })}</p>
        </div>
      </section>

      <section className="learn-grid">
        {CHALLENGES.map((challenge) => {
          const isDone = completed.has(challenge.id);
          const challengeVisual = getChallengeVisual(challenge);

          return (
            <article key={challenge.id} className={`learn-card ${isDone ? 'completed' : ''}`}>
              <div className={`challenge-hero challenge-hero-${challenge.visualTheme}`}>
                <div className="challenge-hero-main">
                  <span className="challenge-emoji" aria-hidden="true">{challengeVisual.emoji}</span>
                  <span className="challenge-icon-chip">{challengeVisual.icon}</span>
                </div>
                <span className="challenge-type-chip">
                  {challenge.type === 'card' ? t('learn.type_card') : t('learn.type_quiz')}
                </span>
              </div>

              <div className="learn-card-header">
                <h3>{t(challenge.titleKey)}</h3>
                {isDone && (
                  <span className="completed-badge">
                    <CheckCircle2 size={14} /> {t('learn.completed')}
                  </span>
                )}
              </div>

              <p>{t(challenge.contentKey)}</p>

              {challenge.type === 'quiz' && challenge.optionsKeys && (
                <div className="quiz-block">
                  <h4>{t(challenge.questionKey || '')}</h4>
                  <div className="quiz-options">
                    {challenge.optionsKeys.map((key, index) => (
                      <button
                        key={key}
                        type="button"
                        className={`quiz-option ${selectedOptions[challenge.id] === index ? 'selected' : ''}`}
                        onClick={() => setSelectedOptions((prev) => ({ ...prev, [challenge.id]: index }))}
                        disabled={isDone}
                      >
                        {t(key)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="challenge-footer">
                <span>+{challenge.points} {t('learn.points_unit')}</span>
                {challenge.type === 'card' ? (
                  <button type="button" onClick={() => handleCardComplete(challenge)} disabled={isDone}>
                    {isDone ? t('learn.completed') : t('learn.mark_as_read')}
                  </button>
                ) : (
                  <button type="button" onClick={() => handleQuizComplete(challenge)} disabled={isDone}>
                    {isDone ? t('learn.completed') : t('learn.submit_quiz')}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section className="history-card" aria-label={t('learn.history_section')}>
        <h2>{t('learn.history_title')}</h2>

        {sortedHistory.length === 0 ? (
          <p>{t('learn.history_empty')}</p>
        ) : (
          <ul className="history-list">
            {sortedHistory.map((entry) => {
              const challenge = challengesById[entry.challengeId];
              const challengeTitle = challenge ? t(challenge.titleKey) : entry.challengeId;
              const completedAt = new Intl.DateTimeFormat(i18n.language, {
                dateStyle: 'short',
                timeStyle: 'short'
              }).format(new Date(entry.completedAt));

              return (
                <li key={`${entry.challengeId}-${entry.completedAt}`} className="history-item">
                  <div>
                    <strong>{challengeTitle}</strong>
                    <p>{completedAt}</p>
                  </div>
                  <span>+{entry.pointsAwarded} {t('learn.points_unit')}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <nav className="bottom-navbar" aria-label={t('learn.bottom_nav_label')}>
        <button className="nav-btn" onClick={() => navigate('/homepage')}>
          <Home size={24} />
          <span>{t('nav.home')}</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/scan')}>
          <Camera size={24} />
          <span>{t('nav.scan')}</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/history')}>
          <History size={24} />
          <span>{t('nav.history')}</span>
        </button>
        <button className="nav-btn active" aria-current="page">
          <BookOpen size={24} />
          <span>{t('nav.learn')}</span>
        </button>
      </nav>
    </main>
  );
}
