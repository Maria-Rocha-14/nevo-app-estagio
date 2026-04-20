import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowLeft, UserCircle, Camera, ShieldAlert, Target } from 'lucide-react';
import './PrivacyPolicy.css';

export default function PrivacyPolicy() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="privacy-container">
            <header className="privacy-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1>{t('privacy.title')}</h1>
            </header>

            <section className="privacy-content">
                <div className="privacy-intro">
                    <ShieldCheck size={48} color="#5fa79a" />
                    <p>{t('privacy.intro')}</p>
                </div>

                <div className="privacy-topic">
                    <div className="topic-header">
                        <UserCircle size={20} color="#5fa79a" />
                        <h3>{t('privacy.topics.identity_title')}</h3>
                    </div>
                    <p>{t('privacy.topics.identity_desc')}</p>
                </div>

                <div className="privacy-topic">
                    <div className="topic-header">
                        <Camera size={20} color="#5fa79a" />
                        <h3>{t('privacy.topics.photos_title')}</h3>
                    </div>
                    <p>{t('privacy.topics.photos_desc')}</p>
                </div>

                <div className="privacy-topic">
                    <div className="topic-header">
                        <ShieldAlert size={20} color="#5fa79a" />
                        <h3>{t('privacy.topics.admin_title')}</h3>
                    </div>
                    <p>{t('privacy.topics.admin_desc')}</p>
                </div>

                <div className="privacy-topic">
                    <div className="topic-header">
                        <Target size={20} color="#5fa79a" />
                        <h3>{t('privacy.topics.purpose_title')}</h3>
                    </div>
                    <p>{t('privacy.topics.purpose_desc')}</p>
                </div>

                <div className="privacy-footer">
                    <p><strong>{t('home.warning')}:</strong> {t('home.medical_warning_text')}</p>
                </div>
            </section>
        </div>
    );
}