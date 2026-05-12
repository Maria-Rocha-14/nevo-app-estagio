import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, Brain, Camera, History, Home, ShieldCheck, Sparkles, SunMedium } from 'lucide-react';
import { completeDailyChallengesOnce, useSessionUser } from '../../../services/session';
import { db } from '../../../db/db';
import type { AdminQuiz } from '../../../db/db';
import './LearnPage.css';

type ChallengeType = 'card' | 'quiz';

type Challenge = {
  id: string;
  type: ChallengeType;
  visualTheme: 'teal' | 'blue' | 'orange';
  points: number;
  titleKey?: string;
  titleText?: string;
  contentKey?: string;
  contentText?: string;
  sourceLabelKey?: string;
  sourceLabel?: string;
  sourceUrl: string;
  questionKey?: string;
  questionText?: string;
  optionsKeys?: string[];
  optionsText?: string[];
  correctIndex?: number;
  correctAnswer?: boolean;
  imageOptions?: Array<{ src: string; alt: string }>;
  featuredDaily?: boolean;
};

type FeedbackTone = 'success' | 'error' | 'warning' | 'info';

const DAILY_CHALLENGES_COUNT = 4;

const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const hashText = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getDailyChallenges = (allChallenges: Challenge[], dateKey: string): Challenge[] => {
  const ranked = [...allChallenges].sort((a, b) => {
    const rankA = hashText(`${dateKey}-${a.id}`);
    const rankB = hashText(`${dateKey}-${b.id}`);
    return rankA - rankB;
  });

  const featured = allChallenges.filter((challenge) => challenge.featuredDaily);
  const nonFeatured = ranked.filter((challenge) => !challenge.featuredDaily);
  const dailySet = [...featured, ...nonFeatured].slice(0, Math.min(DAILY_CHALLENGES_COUNT, allChallenges.length));

  return dailySet;
};

const getAdminQuizTypeTitle = (quiz: AdminQuiz): string => {
  if (quiz.questionType === 'true_false') return 'Admin: Verdadeiro/Falso';
  if (quiz.questionType === 'image_choice') return 'Admin: Escolha por imagem';
  return 'Admin: Escolha múltipla';
};

const mapAdminQuizToChallenge = (quiz: AdminQuiz): Challenge | null => {
  if (!quiz.id) return null;

  const correctIndex = quiz.options.findIndex((option) => option.id === quiz.correctOptionId);
  if (correctIndex < 0) return null;

  if (quiz.questionType === 'image_choice') {
    return {
      id: `admin-quiz-${quiz.id}`,
      type: 'card',
      visualTheme: 'teal',
      points: quiz.xpValue,
      titleText: getAdminQuizTypeTitle(quiz),
      contentText: quiz.questionText,
      sourceLabel: 'Fundamento médico indicado pelo administrador',
      sourceUrl: quiz.medicalSourceUrl,
      imageOptions: quiz.options.map((option) => ({
        src: option.imageUrl || '',
        alt: option.text
      })),
      correctIndex,
      featuredDaily: true
    };
  }

  if (quiz.questionType === 'true_false') {
    return {
      id: `admin-quiz-${quiz.id}`,
      type: 'card',
      visualTheme: 'orange',
      points: quiz.xpValue,
      titleText: getAdminQuizTypeTitle(quiz),
      contentText: quiz.questionText,
      sourceLabel: 'Fundamento médico indicado pelo administrador',
      sourceUrl: quiz.medicalSourceUrl,
      correctAnswer: quiz.correctOptionId === 'true',
      featuredDaily: true
    };
  }

  return {
    id: `admin-quiz-${quiz.id}`,
    type: 'quiz',
    visualTheme: 'blue',
    points: quiz.xpValue,
    titleText: getAdminQuizTypeTitle(quiz),
    contentText: 'Pergunta criada pelo administrador.',
    sourceLabel: 'Fundamento médico indicado pelo administrador',
    sourceUrl: quiz.medicalSourceUrl,
    questionText: quiz.questionText,
    optionsText: quiz.options.map((option) => option.text),
    correctIndex,
    featuredDaily: true
  };
};

const CHALLENGES: Challenge[] = [
  {
    id: 'card-abcde',
    type: 'card',
    visualTheme: 'teal',
    points: 12,
    titleKey: 'learn.challenge1_title',
    contentKey: 'learn.challenge1_content',
    sourceLabelKey: 'learn.challenge1_source',
    sourceUrl: 'https://www.aad.org/public/diseases/skin-cancer/find/at-risk/abcdes',
    correctAnswer: true
  },
  {
    id: 'quiz-ugly-duckling',
    type: 'quiz',
    visualTheme: 'blue',
    points: 18,
    titleKey: 'learn.challenge2_title',
    contentKey: 'learn.challenge2_content',
    sourceLabelKey: 'learn.challenge2_source',
    sourceUrl: 'https://www.aimatmelanoma.org/melanoma-101/how-melanoma-is-diagnosed/' ,
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
    contentKey: 'learn.challenge3_image_content',
    sourceLabelKey: 'learn.challenge3_source',
    sourceUrl: 'https://api.isic-archive.com/images/ISIC_0000004/',
    imageOptions: [
      {
        src: 'https://isic-archive.s3.amazonaws.com/images/ISIC_0000000.jpg',
        alt: 'ISIC_0000000'
      },
      {
        src: 'https://isic-archive.s3.amazonaws.com/images/ISIC_0000004.jpg',
        alt: 'ISIC_0000004'
      }
    ],
    correctIndex: 1,
    featuredDaily: true
  },
  {
    id: 'card-uv-index',
    type: 'card',
    visualTheme: 'blue',
    points: 10,
    titleKey: 'learn.challenge4_title',
    contentKey: 'learn.challenge4_content',
    sourceLabelKey: 'learn.challenge4_source',
    sourceUrl: 'https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-(uv)-index',
    correctAnswer: false
  },
  {
    id: 'quiz-sun-hours',
    type: 'quiz',
    visualTheme: 'orange',
    points: 16,
    titleKey: 'learn.challenge5_title',
    contentKey: 'learn.challenge5_content',
    sourceLabelKey: 'learn.challenge5_source',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/ultraviolet-(uv)-radiation',
    questionKey: 'learn.challenge5_question',
    optionsKeys: ['learn.challenge5_opt1', 'learn.challenge5_opt2', 'learn.challenge5_opt3'],
    correctIndex: 0
  },
  {
    id: 'card-self-check',
    type: 'card',
    visualTheme: 'teal',
    points: 12,
    titleKey: 'learn.challenge6_title',
    contentKey: 'learn.challenge6_content',
    sourceLabelKey: 'learn.challenge6_source',
    sourceUrl: 'https://www.aad.org/public/diseases/skin-cancer/find/check-skin',
    correctAnswer: false
  },
  {
    id: 'quiz-spf',
    type: 'quiz',
    visualTheme: 'blue',
    points: 16,
    titleKey: 'learn.challenge7_title',
    contentKey: 'learn.challenge7_content',
    sourceLabelKey: 'learn.challenge7_source',
    sourceUrl: 'https://www.fda.gov/drugs/resources-you-drugs/sun-protection-factor-spf',
    questionKey: 'learn.challenge7_question',
    optionsKeys: ['learn.challenge7_opt1', 'learn.challenge7_opt2', 'learn.challenge7_opt3'],
    correctIndex: 0
  },
  {
    id: 'card-protective-barriers',
    type: 'card',
    visualTheme: 'orange',
    points: 10,
    titleKey: 'learn.challenge8_title',
    contentKey: 'learn.challenge8_content',
    sourceLabelKey: 'learn.challenge8_source',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/ultraviolet-(uv)-radiation',
    correctAnswer: true
  },
  {
    id: 'quiz-warning-sign',
    type: 'quiz',
    visualTheme: 'teal',
    points: 18,
    titleKey: 'learn.challenge9_title',
    contentKey: 'learn.challenge9_content',
    sourceLabelKey: 'learn.challenge9_source',
    sourceUrl: 'https://www.cdc.gov/skin-cancer/signs-symptoms/index.html',
    questionKey: 'learn.challenge9_question',
    optionsKeys: ['learn.challenge9_opt1', 'learn.challenge9_opt2', 'learn.challenge9_opt3'],
    correctIndex: 0
  },
  {
    id: 'card-non-healing',
    type: 'card',
    visualTheme: 'blue',
    points: 12,
    titleKey: 'learn.challenge10_title',
    contentKey: 'learn.challenge10_content',
    sourceLabelKey: 'learn.challenge10_source',
    sourceUrl: 'https://www.aad.org/public/diseases/skin-cancer/find/common-types/signs',
    correctAnswer: true
  },
  {
    id: 'quiz-reapply',
    type: 'quiz',
    visualTheme: 'orange',
    points: 16,
    titleKey: 'learn.challenge11_title',
    contentKey: 'learn.challenge11_content',
    sourceLabelKey: 'learn.challenge11_source',
    sourceUrl: 'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-apply-sunscreen',
    questionKey: 'learn.challenge11_question',
    optionsKeys: ['learn.challenge11_opt1', 'learn.challenge11_opt2', 'learn.challenge11_opt3'],
    correctIndex: 0
  },
  {
    id: 'card-photo-follow-up',
    type: 'card',
    visualTheme: 'teal',
    points: 14,
    titleKey: 'learn.challenge12_title',
    contentKey: 'learn.challenge12_content',
    sourceLabelKey: 'learn.challenge12_source',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/27517313/',
    correctAnswer: false
  },
  {
    id: 'card-melanoma-risk-factors',
    type: 'card',
    visualTheme: 'blue',
    points: 12,
    titleKey: 'learn.challenge13_title',
    contentKey: 'learn.challenge13_content',
    sourceLabelKey: 'learn.challenge13_source',
    sourceUrl: 'https://www.cdc.gov/skin-cancer/risk-factors/index.html',
    correctAnswer: true
  },
  {
    id: 'quiz-indoor-tanning',
    type: 'quiz',
    visualTheme: 'orange',
    points: 16,
    titleKey: 'learn.challenge14_title',
    contentKey: 'learn.challenge14_content',
    sourceLabelKey: 'learn.challenge14_source',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/ultraviolet-(uv)-radiation',
    questionKey: 'learn.challenge14_question',
    optionsKeys: ['learn.challenge14_opt1', 'learn.challenge14_opt2', 'learn.challenge14_opt3'],
    correctIndex: 0
  },
  {
    id: 'card-sunscreen-amount',
    type: 'card',
    visualTheme: 'teal',
    points: 12,
    titleKey: 'learn.challenge15_title',
    contentKey: 'learn.challenge15_content',
    sourceLabelKey: 'learn.challenge15_source',
    sourceUrl: 'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-apply-sunscreen',
    correctAnswer: true
  },
  {
    id: 'quiz-broad-spectrum',
    type: 'quiz',
    visualTheme: 'blue',
    points: 18,
    titleKey: 'learn.challenge16_title',
    contentKey: 'learn.challenge16_content',
    sourceLabelKey: 'learn.challenge16_source',
    sourceUrl: 'https://www.fda.gov/drugs/resources-you-drugs/sun-protection-factor-spf',
    questionKey: 'learn.challenge16_question',
    optionsKeys: ['learn.challenge16_opt1', 'learn.challenge16_opt2', 'learn.challenge16_opt3'],
    correctIndex: 0
  },
  {
    id: 'card-children-sun-protection',
    type: 'card',
    visualTheme: 'orange',
    points: 10,
    titleKey: 'learn.challenge17_title',
    contentKey: 'learn.challenge17_content',
    sourceLabelKey: 'learn.challenge17_source',
    sourceUrl: 'https://www.aad.org/public/everyday-care/sun-protection/children',
    correctAnswer: true
  },
  {
    id: 'quiz-lesion-asymmetry',
    type: 'quiz',
    visualTheme: 'teal',
    points: 16,
    titleKey: 'learn.challenge18_title',
    contentKey: 'learn.challenge18_content',
    sourceLabelKey: 'learn.challenge18_source',
    sourceUrl: 'https://www.cancer.org/cancer/types/melanoma-skin-cancer/detection-diagnosis-staging/signs-and-symptoms.html',
    questionKey: 'learn.challenge18_question',
    optionsKeys: ['learn.challenge18_opt1', 'learn.challenge18_opt2', 'learn.challenge18_opt3'],
    correctIndex: 0
  },
  {
    id: 'card-dermatology-followup',
    type: 'card',
    visualTheme: 'blue',
    points: 14,
    titleKey: 'learn.challenge19_title',
    contentKey: 'learn.challenge19_content',
    sourceLabelKey: 'learn.challenge19_source',
    sourceUrl: 'https://www.bad.org.uk/pils/skin-cancer/',
    correctAnswer: false
  },
  {
    id: 'quiz-when-to-see-doctor',
    type: 'quiz',
    visualTheme: 'orange',
    points: 18,
    titleKey: 'learn.challenge20_title',
    contentKey: 'learn.challenge20_content',
    sourceLabelKey: 'learn.challenge20_source',
    sourceUrl: 'https://www.nhs.uk/conditions/melanoma-skin-cancer/',
    questionKey: 'learn.challenge20_question',
    optionsKeys: ['learn.challenge20_opt1', 'learn.challenge20_opt2', 'learn.challenge20_opt3'],
    correctIndex: 0
  }
];

export default function LearnPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [quizErrors, setQuizErrors] = useState<Record<string, string>>({});
  const [challengeNotice, setChallengeNotice] = useState<{ challengeId: string; tone: FeedbackTone; message: string } | null>(null);
  const [celebratingChallengeId, setCelebratingChallengeId] = useState<string | null>(null);
  const [activeDailyIndex, setActiveDailyIndex] = useState(0);
  const [isSubmittingDailyQuiz, setIsSubmittingDailyQuiz] = useState(false);
  const adminQuizzes = useLiveQuery(() => db.adminQuizzes.orderBy('createdAt').reverse().toArray(), []);

  const todayKey = getLocalDateKey(new Date());
  const allChallenges = useMemo(() => {
    const adminChallenges = (adminQuizzes || [])
      .map(mapAdminQuizToChallenge)
      .filter((challenge): challenge is Challenge => challenge !== null);

    return [...adminChallenges, ...CHALLENGES];
  }, [adminQuizzes]);
  const dailyChallenges = useMemo(() => {
    try {
      return getDailyChallenges(allChallenges, todayKey);
    } catch (err) {
      console.error('Error computing dailyChallenges', err);
      return [] as Challenge[];
    }
  }, [allChallenges, todayKey]);
  const activeDailyChallenge = dailyChallenges[activeDailyIndex] || null;
  const activeDailyChallengeId = activeDailyChallenge?.id;

  const user = useSessionUser();
  const getChallengeText = (key?: string, text?: string) => {
    if (text) return text;
    return key ? t(key) : '';
  };

  useEffect(() => {
    if (user === null) {
      navigate('/');
    }
  }, [navigate, user]);

  useEffect(() => {
    if (!activeDailyChallengeId) {
      return;
    }

    setCelebratingChallengeId((current) => (current === activeDailyChallengeId ? null : current));
  }, [activeDailyChallengeId]);

  if (user === undefined) return <main className="learn-container" aria-busy="true"><div style={{padding: '20px', textAlign: 'center'}}>A carregar sessão...</div></main>;
  if (!user) {
    return null;
  }

  const completed = new Set(user.completedChallenges || []);
  const completedToday = (user.challengeHistory || []).filter((entry) => entry.completedAt.startsWith(todayKey)).length;
  const completedDailyChallenges = dailyChallenges.filter((challenge) => completed.has(challenge.id)).length;
  const allDailyChallengesCompleted = dailyChallenges.length > 0 && dailyChallenges.every((challenge) => completed.has(challenge.id));
  const pointsEarnedToday = (user.challengeHistory || [])
    .filter((entry) => entry.completedAt.startsWith(todayKey))
    .reduce((sum, entry) => sum + (entry.pointsAwarded || 0), 0);

  const activeChallengeProgress = Math.min(activeDailyIndex + 1, dailyChallenges.length);
  const canGoPrevious = activeDailyIndex > 0;
  const canGoNext = activeDailyIndex < dailyChallenges.length - 1;
  const isLastDailyChallenge = activeDailyIndex === dailyChallenges.length - 1;

  const moveDailyIndex = (direction: -1 | 1) => {
    setActiveDailyIndex((current) => {
      const nextIndex = current + direction;
      if (nextIndex < 0 || nextIndex >= dailyChallenges.length) {
        return current;
      }

      return nextIndex;
    });
  };

  const isChallengeAnswerCorrect = (challenge: Challenge, selected: number) => {
    if (challenge.type === 'quiz') {
      return selected === challenge.correctIndex;
    }

    if (challenge.imageOptions) {
      return selected === challenge.correctIndex;
    }

    return (selected === 0) === (challenge.correctAnswer ?? true);
  };

  const handleSelectOption = (challenge: Challenge, selected: number) => {
    setSelectedOptions((prev) => ({ ...prev, [challenge.id]: selected }));
    setChallengeNotice((current) => (current?.challengeId === challenge.id ? null : current));

    setQuizErrors((prev) => {
      const next = { ...prev };

      if (isChallengeAnswerCorrect(challenge, selected)) {
        delete next[challenge.id];
      } else {
        next[challenge.id] = t('learn.wrong_answer');
      }

      return next;
    });
  };

  const handleDailyQuizSubmit = async () => {
    if (isSubmittingDailyQuiz) {
      return;
    }

    const pendingChallenges = dailyChallenges.filter((challenge) => !completed.has(challenge.id));
    const noticeChallengeId = activeDailyChallenge?.id ?? pendingChallenges[0]?.id ?? dailyChallenges[0]?.id;

    if (!noticeChallengeId) {
      return;
    }

    if (pendingChallenges.length === 0) {
      if (noticeChallengeId) {
        setChallengeNotice({ challengeId: noticeChallengeId, tone: 'info', message: t('learn.already_completed') });
      }
      return;
    }

    if (completedToday >= DAILY_CHALLENGES_COUNT) {
      setChallengeNotice({ challengeId: noticeChallengeId, tone: 'warning', message: t('learn.daily_limit_reached', { count: DAILY_CHALLENGES_COUNT }) });
      return;
    }

    const firstUnanswered = pendingChallenges.find((challenge) => selectedOptions[challenge.id] === undefined);
    if (firstUnanswered) {
      setActiveDailyIndex(dailyChallenges.findIndex((challenge) => challenge.id === firstUnanswered.id));
      setChallengeNotice({ challengeId: firstUnanswered.id, tone: 'warning', message: t('learn.select_answer') });
      return;
    }

    const nextErrors = pendingChallenges.reduce<Record<string, string>>((errors, challenge) => {
      const selected = selectedOptions[challenge.id];
      if (selected !== undefined && !isChallengeAnswerCorrect(challenge, selected)) {
        errors[challenge.id] = t('learn.wrong_answer');
      }

      return errors;
    }, {});

    if (Object.keys(nextErrors).length > 0) {
      const firstWrongId = Object.keys(nextErrors)[0];
      setQuizErrors((prev) => ({ ...prev, ...nextErrors }));
      setActiveDailyIndex(dailyChallenges.findIndex((challenge) => challenge.id === firstWrongId));
      setChallengeNotice({ challengeId: firstWrongId, tone: 'warning', message: t('learn.try_again') });
      return;
    }

    setQuizErrors((prev) => {
      const next = { ...prev };
      pendingChallenges.forEach((challenge) => {
        delete next[challenge.id];
      });
      return next;
    });

    setIsSubmittingDailyQuiz(true);

    try {
      const result = await completeDailyChallengesOnce(
        pendingChallenges.map((challenge) => ({
          id: challenge.id,
          points: challenge.points
        }))
      );

      if (result.status === 'daily-limit') {
        setChallengeNotice({ challengeId: noticeChallengeId, tone: 'warning', message: t('learn.daily_limit_reached', { count: DAILY_CHALLENGES_COUNT }) });
        return;
      }

      if (result.status !== 'awarded' && result.status !== 'already-completed') {
        setChallengeNotice({ challengeId: noticeChallengeId, tone: 'error', message: t('errors.database_error') });
        return;
      }

      setChallengeNotice({
        challengeId: noticeChallengeId,
        tone: result.completedCount > 0 ? 'success' : 'info',
        message: result.completedCount > 0 ? t('learn.points_awarded', { points: result.pointsAwarded }) : t('learn.already_completed')
      });
      setCelebratingChallengeId(noticeChallengeId);

      window.setTimeout(() => {
        setCelebratingChallengeId((current) => (current === noticeChallengeId ? null : current));
      }, 900);
    } catch (err) {
      console.error('Error submitting daily quiz', err);
      setChallengeNotice({ challengeId: noticeChallengeId, tone: 'error', message: t('errors.database_error') });
    } finally {
      setIsSubmittingDailyQuiz(false);
    }
  };

  const getChallengeVisual = (challenge: Challenge) => {
    if (challenge.type === 'quiz') {
      return { emoji: '🧠', icon: <Brain size={18} aria-hidden="true" /> };
    }

    if (challenge.visualTheme === 'orange') {
      return { emoji: '☀️', icon: <SunMedium size={18} aria-hidden="true" /> };
    }

    if (challenge.id === 'card-abcde' || challenge.id === 'card-self-check') {
      return { emoji: '🔎', icon: <Sparkles size={18} aria-hidden="true" /> };
    }

    return { emoji: '🛡️', icon: <ShieldCheck size={18} aria-hidden="true" /> };
  };

  return (
    <main className="learn-container">
      <header className="learn-header">
        <h1>{t('learn.title')}</h1>
        <p>{t('learn.subtitle')}</p>
      </header>

      <section className="learn-score-card" aria-label={t('learn.score_section')}>
        <div className="score-icon">
          <ShieldCheck size={20} />
        </div>
        <div className="learn-score-content">
          <p className="learn-score-today">{t('learn.today_points', { current: pointsEarnedToday })}</p>
          <p className="learn-score-meta">{t('learn.daily_challenges_count', { current: completedDailyChallenges })}</p>
        </div>
      </section>

      <section className="learn-grid">
        {activeDailyChallenge ? (
          (() => {
            const challenge = activeDailyChallenge;
            const isDone = completed.has(challenge.id);
            const challengeVisual = getChallengeVisual(challenge);
            const notice = challengeNotice?.challengeId === challenge.id ? challengeNotice : null;

            return (
              <article key={challenge.id} className={`learn-card learn-card-transition ${isDone ? 'completed' : ''} ${celebratingChallengeId === challenge.id ? 'celebrating' : ''}`}>
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
                  <h3>{getChallengeText(challenge.titleKey, challenge.titleText)}</h3>
                  <span className="completed-badge">{`${activeChallengeProgress}/${DAILY_CHALLENGES_COUNT}`}</span>
                </div>

                <p>{getChallengeText(challenge.contentKey, challenge.contentText)}</p>

                <p className="challenge-source">
                  <strong>{t('learn.source_label')}</strong>{' '}
                  <a href={challenge.sourceUrl} target="_blank" rel="noreferrer noopener" className="challenge-source-link">
                    {getChallengeText(challenge.sourceLabelKey, challenge.sourceLabel)}
                  </a>
                </p>

                {challenge.type === 'quiz' && (challenge.optionsKeys || challenge.optionsText) && (
                  <div className="quiz-block">
                    <h4>{getChallengeText(challenge.questionKey, challenge.questionText)}</h4>
                    <div className="quiz-options">
                      {(challenge.optionsKeys || challenge.optionsText || []).map((option, index) => (
                        <button
                          key={`${challenge.id}-option-${index}`}
                          type="button"
                          className={`quiz-option ${selectedOptions[challenge.id] === index ? 'selected' : ''}`}
                          onClick={() => handleSelectOption(challenge, index)}
                          disabled={isDone}
                        >
                          {challenge.optionsKeys ? t(option) : option}
                        </button>
                      ))}
                    </div>
                    {quizErrors[challenge.id] && (
                      <p className="quiz-error-message" role="alert" aria-live="assertive">
                        {quizErrors[challenge.id]}
                      </p>
                    )}
                  </div>
                )}

                {challenge.type === 'card' && (
                  <div className="quiz-block">
                    <h4>{challenge.imageOptions ? t('learn.image_question_prompt') : t('learn.true_false_prompt')}</h4>
                    {challenge.imageOptions ? (
                      <div className="image-choice-grid">
                        {challenge.imageOptions.map((option, index) => (
                          <button
                            key={option.alt}
                            type="button"
                            className={`image-choice-card ${selectedOptions[challenge.id] === index ? 'selected' : ''}`}
                            onClick={() => handleSelectOption(challenge, index)}
                            disabled={isDone}
                          >
                            <img src={option.src} alt={t('learn.isic_image_alt', { id: option.alt })} />
                            <span>{t('learn.image_option', { index: index + 1 })}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="quiz-options">
                        <button
                          type="button"
                          className={`quiz-option ${selectedOptions[challenge.id] === 0 ? 'selected' : ''}`}
                          onClick={() => handleSelectOption(challenge, 0)}
                          disabled={isDone}
                        >
                          {t('learn.true_label')}
                        </button>
                        <button
                          type="button"
                          className={`quiz-option ${selectedOptions[challenge.id] === 1 ? 'selected' : ''}`}
                          onClick={() => handleSelectOption(challenge, 1)}
                          disabled={isDone}
                        >
                          {t('learn.false_label')}
                        </button>
                      </div>
                    )}
                    {quizErrors[challenge.id] && (
                      <p className="quiz-error-message" role="alert" aria-live="assertive">
                        {quizErrors[challenge.id]}
                      </p>
                    )}
                  </div>
                )}

                {notice && (
                  <div className={`challenge-inline-notice challenge-inline-${notice.tone}`} role={notice.tone === 'error' ? 'alert' : 'status'} aria-live={notice.tone === 'error' ? 'assertive' : 'polite'}>
                    <strong>{notice.tone === 'success' ? t('learn.correct_answer') : notice.tone === 'warning' ? t('learn.try_again') : t('learn.notice')}</strong>
                    <span>{notice.message}</span>
                  </div>
                )}

                <div className="challenge-footer">
                  <span>+{challenge.points} {t('learn.points_unit')}</span>
                  <div className="challenge-footer-actions">
                    <button type="button" className="nav-step-button" onClick={() => moveDailyIndex(-1)} disabled={!canGoPrevious}>
                      {t('learn.previous')}
                    </button>
                    {isLastDailyChallenge && (
                      <button
                        type="button"
                        onClick={() => {
                          void handleDailyQuizSubmit();
                        }}
                        disabled={allDailyChallengesCompleted || isSubmittingDailyQuiz}
                      >
                        {allDailyChallengesCompleted ? t('learn.completed') : isSubmittingDailyQuiz ? t('learn.submitting_quiz') : t('learn.submit_quiz')}
                      </button>
                    )}
                    {canGoNext && (
                      <button type="button" className="nav-step-button" onClick={() => moveDailyIndex(1)}>
                        {t('learn.next')}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })()
        ) : (
          <article className="learn-card completed">
            <div className="learn-card-header">
              <h3>{t('learn.daily_rotation_title')}</h3>
              <span className="completed-badge">{t('learn.completed')}</span>
            </div>
            <p>{t('learn.daily_limit_reached', { count: DAILY_CHALLENGES_COUNT })}</p>
          </article>
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
