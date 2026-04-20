import { useMemo, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, ShieldAlert, Phone, ArrowLeft, Camera } from 'lucide-react';
import './AssessmentResults.css';
import { getSessionUser } from '../../services/session';

type RiskLevel = 'low' | 'moderate' | 'high';

type AssessmentState = {
  imageUrl?: string;
  fileName?: string;
  probability?: number;
  riskLevel?: RiskLevel;
  isSimulated?: boolean;
};

type RiskMeta = {
  icon: ReactElement;
  className: string;
  title: string;
  description: string;
};

export default function AssessmentResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const state = (location.state || {}) as AssessmentState;
  const currentUser = getSessionUser();
  const recentAssessments = [...(currentUser?.assessmentHistory || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3);

  const normalizedProbability = Math.min(99, Math.max(1, Math.round(state.probability ?? 0)));
  const riskLevel: RiskLevel = state.riskLevel ?? 'low';

  const riskMeta: RiskMeta = useMemo(() => {
    if (riskLevel === 'high') {
      return {
        icon: <ShieldAlert size={20} aria-hidden="true" />,
        className: 'risk-high',
        title: t('assessment.risk_high_title'),
        description: t('assessment.risk_high_desc')
      };
    }

    if (riskLevel === 'moderate') {
      return {
        icon: <AlertTriangle size={20} aria-hidden="true" />,
        className: 'risk-moderate',
        title: t('assessment.risk_moderate_title'),
        description: t('assessment.risk_moderate_desc')
      };
    }

    return {
      icon: <CheckCircle2 size={20} aria-hidden="true" />,
      className: 'risk-low',
      title: t('assessment.risk_low_title'),
      description: t('assessment.risk_low_desc')
    };
  }, [riskLevel, t]);

  if (!state.imageUrl) {
    return (
      <main className="assessment-container">
        <section className="assessment-card">
          <h1>{t('assessment.missing_data_title')}</h1>
          <p>{t('assessment.missing_data_desc')}</p>
          <button type="button" className="primary-action" onClick={() => navigate('/scan')}>
            <Camera size={18} aria-hidden="true" />
            {t('assessment.back_to_scan')}
          </button>
        </section>
      </main>
    );
  }

  const showContactAction = riskLevel === 'moderate' || riskLevel === 'high';

  return (
    <main className="assessment-container" aria-labelledby="assessment-title">
      <header className="assessment-header">
        <button type="button" className="ghost-action" onClick={() => navigate('/scan')}>
          <ArrowLeft size={18} aria-hidden="true" />
          {t('assessment.back_to_scan')}
        </button>
        <h1 id="assessment-title">{t('assessment.title')}</h1>
      </header>

      <section className="assessment-card" aria-label={t('assessment.summary_section')}>
        <div className={`risk-indicator ${riskMeta.className}`}>
          <div className="risk-heading">
            {riskMeta.icon}
            <h2>{riskMeta.title}</h2>
          </div>
          <p>{riskMeta.description}</p>

          <div className="risk-meter" aria-label={t('assessment.probability_label')}>
            <div className="risk-meter-labels">
              <span>{t('assessment.probability_label')}</span>
              <strong>{normalizedProbability}%</strong>
            </div>
            <div className="risk-meter-track">
              <div className="risk-meter-fill" style={{ width: `${normalizedProbability}%` }} />
            </div>
          </div>
        </div>

        <div className="analysis-summary">
          <h3>{t('assessment.analysis_summary')}</h3>
          <img src={state.imageUrl} alt={t('assessment.submitted_image_alt')} className="submitted-image" />
          <p>
            {t('assessment.file_label')}: <strong>{state.fileName || t('assessment.unknown_file')}</strong>
          </p>
          {state.isSimulated && <p className="simulated-tag">{t('assessment.simulated_notice')}</p>}

          {recentAssessments.length > 0 && (
            <div className="assessment-history-mini" aria-label={t('assessment.recent_history_title')}>
              <h4>{t('assessment.recent_history_title')}</h4>
              <ul>
                {recentAssessments.map((entry) => (
                  <li key={`${entry.createdAt}-${entry.fileName}`}>
                    <span>{entry.fileName || t('assessment.unknown_file')}</span>
                    <strong>{entry.probability}%</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {showContactAction && (
          <a className="primary-action" href="tel:808242424" aria-label={t('assessment.call_help_label')}>
            <Phone size={18} aria-hidden="true" />
            {t('assessment.call_help_button')}
          </a>
        )}

        <button type="button" className="secondary-action" onClick={() => navigate('/homepage')}>
          {t('assessment.back_home')}
        </button>
      </section>
    </main>
  );
}
