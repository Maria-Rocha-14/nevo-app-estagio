import { useMemo, useState, type ReactElement, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, ShieldAlert, Phone, ArrowLeft, Camera, Image as ImageIcon, Stethoscope } from 'lucide-react';
import './AssessmentResults.css';
import { useSessionUser } from '../../services/session';
import { db } from '../../db/db';
import FeedbackMessage from '../../components/FeedbackMessage';

type RiskLevel = 'low' | 'moderate' | 'high';

type AssessmentState = {
  imageUrl?: string;
  fileName?: string;
  bodyAreaLabel?: string;
  probability?: number;
  riskLevel?: RiskLevel;
  isSimulated?: boolean;
  returnTo?: '/scan' | '/history';
  createdAt?: string;
};

type RiskMeta = {
  icon: ReactElement;
  className: string;
  title: string;
  description: string;
};

type FeedbackState = {
  tone: 'success' | 'error' | 'warning' | 'info';
  message: string;
};

export default function AssessmentResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const state = (location.state || {}) as AssessmentState;
  const currentUser = useSessionUser();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isMedicallyEvaluated, setIsMedicallyEvaluated] = useState(false);

  const recentAssessments = [...(currentUser?.assessmentHistory || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3);

  const normalizedProbability = Math.min(99, Math.max(1, Math.round(state.probability ?? 0)));
  const riskLevel: RiskLevel = state.riskLevel ?? 'low';
  const returnTo = state.returnTo ?? '/scan';
  const backLabel = returnTo === '/history' ? t('assessment.back_to_history', 'Voltar ao Histórico') : t('assessment.back_to_scan', 'Voltar ao Scanner');

  const veioDoHistorico = returnTo === '/history';

  useEffect(() => {
    if (currentUser?.id && veioDoHistorico) {
      const scanKeyId = state.createdAt || state.fileName || 'default_scan';
      const isDone = localStorage.getItem(`doctor_visit_${currentUser.id}_${scanKeyId}`) === 'true';
      setIsMedicallyEvaluated(isDone);
    }
  }, [currentUser, state, veioDoHistorico]);

  const riskMeta: RiskMeta = useMemo(() => {
    if (riskLevel === 'high') {
      return {
        icon: <ShieldAlert size={20} aria-hidden="true" />,
        className: 'risk-high',
        title: t('assessment.risk_high_title', 'Risco Elevado detetado'),
        description: t('assessment.risk_high_desc', 'A inteligência artificial identificou padrões com forte probabilidade de risco. É altamente recomendável agendar uma consulta com um dermatologista com brevidade.')
      };
    }

    if (riskLevel === 'moderate') {
      return {
        icon: <AlertTriangle size={20} aria-hidden="true" />,
        className: 'risk-moderate',
        title: t('assessment.risk_moderate_title', 'Risco Moderado detetado'),
        description: t('assessment.risk_moderate_desc', 'Padrões atípicos encontrados. Mantenha a vigilância contínua e, por prevenção, partilhe este resultado com um profissional de saúde qualificado.')
      };
    }

    return {
      icon: <CheckCircle2 size={20} aria-hidden="true" />,
      className: 'risk-low',
      title: t('assessment.risk_low_title', 'Risco Reduzido detetado'),
      description: t('assessment.risk_low_desc', 'Até ao momento não foram detetados sinais graves de alerta. Contudo, este teste é meramente informativo e não substitui de forma alguma o rastreio clínico regular.')
    };
  }, [riskLevel, t]);

  if (state.probability === undefined && !state.fileName) {
    return (
      <main className="assessment-container">
        <section className="assessment-card">
          <h1>{t('assessment.missing_data_title', 'Dados Incompletos')}</h1>
          <p>{t('assessment.missing_data_desc', 'Não foi possível ler as métricas da análise. Por favor, tente submeter a imagem novamente através do scanner.')}</p>
          <button type="button" className="primary-action" onClick={() => navigate('/scan')}>
            <Camera size={18} aria-hidden="true" />
            {t('assessment.back_to_scan', 'Voltar ao Scanner')}
          </button>
        </section>
      </main>
    );
  }

  const handleDoctorVisitConfirm = async () => {
    if (!currentUser?.id || isMedicallyEvaluated) return;

    try {
      const localUser = await db.users.get(currentUser.id);
      if (localUser) {
        const novosPontos = (localUser.points || 0) + 50;

        await db.users.update(currentUser.id, { points: novosPontos });

        const sessionData = sessionStorage.getItem('app_session_user');
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          parsed.points = novosPontos;
          sessionStorage.setItem('app_session_user', JSON.stringify(parsed));
        }

        const scanKeyId = state.createdAt || state.fileName || 'default_scan';
        localStorage.setItem(`doctor_visit_${currentUser.id}_${scanKeyId}`, 'true');

        setIsMedicallyEvaluated(true);

        setFeedback({
          tone: 'success',
          message: t('feedback.assessment_doctor_visit_reward', 'Obrigado por cuidares da tua saúde! Ganhaste +50 Pontos!')
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar visita médica:', error);
    }
  };

  const showDoctorVerifyBtn = (riskLevel === 'moderate' || riskLevel === 'high') && veioDoHistorico;

  return (
    <main className="assessment-container" aria-labelledby="assessment-title">
      {feedback && (
        <FeedbackMessage
          tone={feedback.tone}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      <header className="assessment-header">
        <button type="button" className="ghost-action" onClick={() => navigate(returnTo)}>
          <ArrowLeft size={18} aria-hidden="true" />
          {backLabel}
        </button>
        <h1 id="assessment-title">{t('assessment.title', 'Resultados da Análise')}</h1>
      </header>

      <section className="assessment-card" aria-label={t('assessment.summary_section', 'Resumo da avaliação')}>
        <div className={`risk-indicator ${riskMeta.className}`}>
          <div className="risk-heading">
            {riskMeta.icon}
            <h2>{riskMeta.title}</h2>
          </div>
          <p>{riskMeta.description}</p>

          <div className="risk-meter" aria-label={t('assessment.probability_label', 'Grau de Probabilidade')}>
            <div className="risk-meter-labels">
              <span>{t('assessment.probability_label', 'Grau de Probabilidade')}</span>
              <strong>{normalizedProbability}%</strong>
            </div>
            <div className="risk-meter-track">
              <div className="risk-meter-fill" style={{ width: `${normalizedProbability}%` }} />
            </div>
          </div>
        </div>

        <div className="analysis-summary">
          <h3>{t('assessment.analysis_summary', 'Métricas do Ficheiro')}</h3>
          {state.imageUrl ? (
            <img src={state.imageUrl} alt={t('assessment.submitted_image_alt', 'Fotografia cutânea submetida')} className="submitted-image" />
          ) : (
            <div className="submitted-image-placeholder" aria-label={t('assessment.image_unavailable', 'Imagem não disponível')}>
              <ImageIcon size={34} aria-hidden="true" />
            </div>
          )}
          <p>
            {t('assessment.file_label', 'Ficheiro')}: <strong>{state.fileName || t('assessment.unknown_file', 'Origem desconhecida')}</strong>
          </p>
          {state.bodyAreaLabel && (
            <p>
              {t('assessment.body_area_label', 'Zona Corporal')}: <strong>{state.bodyAreaLabel}</strong>
            </p>
          )}
          {state.isSimulated && <p className="simulated-tag">{t('assessment.simulated_notice', 'Modo de simulação ativo para testes')}</p>}

          {recentAssessments.length > 0 && (
            <div className="assessment-history-mini" aria-label={t('assessment.recent_history_title', 'Últimas análises efetuadas')}>
              <h4>{t('assessment.recent_history_title', 'Últimas análises efetuadas')}</h4>
              <ul>
                {recentAssessments.map((entry) => (
                  <li key={`${entry.createdAt}-${entry.fileName}`}>
                    <span>{entry.fileName || t('assessment.unknown_file', 'Origem desconhecida')}</span>
                    <strong>{entry.probability}%</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {showDoctorVerifyBtn && (
          <button
            type="button"
            className={`doctor-verification-btn ${isMedicallyEvaluated ? 'confirmed' : ''}`}
            onClick={handleDoctorVisitConfirm}
            disabled={isMedicallyEvaluated}
            style={{
              width: '100%',
              minHeight: '48px',
              borderRadius: '12px',
              border: isMedicallyEvaluated ? '2px solid #5fa79a' : 'none',
              background: isMedicallyEvaluated ? '#ffffff' : 'linear-gradient(135deg, #16a085 0%, #1abc9c 100%)',
              color: isMedicallyEvaluated ? '#5fa79a' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: isMedicallyEvaluated ? 'default' : 'pointer',
              marginTop: '12px',
              boxShadow: isMedicallyEvaluated ? 'none' : '0 4px 12px rgba(22, 160, 133, 0.2)'
            }}
          >
            {isMedicallyEvaluated ? (
              <>
                <CheckCircle2 size={18} color="#5fa79a" />
                <span>{t('assessment.doctor_evaluated_status', 'Avaliado por um Especialista')}</span>
              </>
            ) : (
              <>
                <Stethoscope size={18} />
                <span>{t('assessment.doctor_confirm_button', 'Já fui a uma consulta médica (+50 Pontos)')}</span>
              </>
            )}
          </button>
        )}

        <a className="phone-action" href="tel:808242424" aria-label={t('assessment.call_help_label', 'Ligar para a Linha Saúde 24')}>
          <Phone size={18} aria-hidden="true" />
          {t('assessment.call_help_button', 'Contactar SNS 24 (808 24 24 24)')}
        </a>

        <button type="button" className="secondary-action" onClick={() => navigate('/homepage')}>
          {t('assessment.back_home', 'Voltar ao Ecrã Inicial')}
        </button>
      </section>
    </main>
  );
}