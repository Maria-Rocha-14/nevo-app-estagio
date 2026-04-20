import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Scale, Stethoscope, UserCheck, AlertTriangle } from 'lucide-react';
import '../PrivacyPolicy/PrivacyPolicy.css'; 

export default function Terms() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="privacy-container">
            <header className="privacy-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1>{t('terms.title')}</h1>
            </header>

            <section className="privacy-content">
                <div className="privacy-intro" style={{ borderLeftColor: '#5fa79a' }}>
                    <Scale size={48} color="#5fa79a" />
                    <p>{t('terms.intro')}</p>
                </div>

                <div className="privacy-topic">
                    <div className="topic-header">
                        <Stethoscope size={20} color="#5fa79a" />
                        <h3>{t('terms.topics.medical_title')}</h3>
                    </div>
                    <p>{t('terms.topics.medical_desc')}</p>
                </div>

                <div className="privacy-topic">
                    <div className="topic-header">
                        <UserCheck size={20} color="#5fa79a" />
                        <h3>{t('terms.topics.usage_title')}</h3>
                    </div>
                    <p>{t('terms.topics.usage_desc')}</p>
                </div>

                <div className="privacy-topic">
                    <div className="topic-header">
                        <AlertTriangle size={20} color="#5fa79a" />
                        <h3>{t('terms.topics.liability_title')}</h3>
                    </div>
                    <p>{t('terms.topics.liability_desc')}</p>
                </div>

                <div className="privacy-footer">
                    <p><strong>{t('home.warning')}:</strong> {t('home.medical_warning_text')}</p>
                </div>
            </section>
        </div>
    );
}