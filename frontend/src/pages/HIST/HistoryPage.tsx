import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Calendar,
  Camera,
  ChevronRight,
  Download,
  History,
  Home,
  Image as ImageIcon,
  ShieldAlert
} from 'lucide-react';
import { useSessionUser } from '../../services/session';
import type { AssessmentHistoryEntry } from '../../db/db';
import './HistoryPage.css';

type RiskMeta = {
  label: string;
  className: string;
};

const getRiskMeta = (riskLevel: AssessmentHistoryEntry['riskLevel'], t: (key: string) => string): RiskMeta => {
  if (riskLevel === 'high') {
    return { label: t('history_page.risk_high'), className: 'history-risk-high' };
  }

  if (riskLevel === 'moderate') {
    return { label: t('history_page.risk_moderate'), className: 'history-risk-moderate' };
  }

  return { label: t('history_page.risk_low'), className: 'history-risk-low' };
};

const formatDate = (date: string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Data indisponivel';
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsedDate);
};

const isSameDay = (left: string, right: Date) => {
  const parsedLeft = new Date(left);

  return (
    parsedLeft.getFullYear() === right.getFullYear() &&
    parsedLeft.getMonth() === right.getMonth() &&
    parsedLeft.getDate() === right.getDate()
  );
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useSessionUser();
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');

  const filteredScans = useMemo(() => {
    const sorted = [...(user?.assessmentHistory || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (timeFilter === 'all') return sorted;
    if (timeFilter === '1d') {
      const today = new Date();
      return sorted.filter((scan) => isSameDay(scan.createdAt, today));
    }

    const now = new Date();
    const monthsToSubtract = timeFilter === '1m' ? 1 : timeFilter === '3m' ? 3 : timeFilter === '6m' ? 6 : 12;
    const cutoffDate = new Date();
    cutoffDate.setMonth(now.getMonth() - monthsToSubtract);

    return sorted.filter((scan) => new Date(scan.createdAt) >= cutoffDate);
  }, [user?.assessmentHistory, timeFilter]);

  const selectedScans = useMemo(() => {
    const selected = filteredScans.filter((scan) => selectedForCompare.includes(`${scan.createdAt}-${scan.fileName}`));
    return selected.slice(0, 2);
  }, [filteredScans, selectedForCompare]);

  const handleToggleCompareMode = () => {
    setCompareMode((prev) => {
      const next = !prev;

      if (!next) {
        setSelectedForCompare([]);
      }

      return next;
    });
  };

  const handleExportPDF = async () => {
    if (filteredScans.length === 0) return;

    try {
      // Dynamically import the export function to avoid bundling jsPDF in the main chunk
      const { exportHistoryToPDF } = await import('./exportPDF');
      await exportHistoryToPDF(user || {}, filteredScans, t, getRiskMeta, formatDate);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const toggleCompareSelection = (scan: AssessmentHistoryEntry) => {
    const scanKey = `${scan.createdAt}-${scan.fileName}`;

    setSelectedForCompare((prev) => {
      if (prev.includes(scanKey)) {
        return prev.filter((key) => key !== scanKey);
      }

      if (prev.length >= 2) {
        return [prev[1], scanKey];
      }

      return [...prev, scanKey];
    });
  };

  const openScanDetails = (scan: AssessmentHistoryEntry) => {
    navigate('/assessment-results', {
      state: {
        imageUrl: scan.imageUrl,
        fileName: scan.fileName,
        probability: scan.probability,
        riskLevel: scan.riskLevel,
        isSimulated: scan.simulated
      }
    });
  };

  if (user === undefined) {
    return (
      <main className="history-container" aria-busy="true">
        <div style={{ padding: '20px', textAlign: 'center' }}>A carregar sessão...</div>
      </main>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <main className="history-container" aria-labelledby="history-title">
      <header className="history-header">
        <div>
          <p className="history-kicker">{t('history_page.kicker')}</p>
          <h1 id="history-title">{t('history_page.title')}</h1>
        </div>
        <button type="button" className="history-header-action" onClick={() => navigate('/scan')}>
          <Camera size={18} aria-hidden="true" />
          {t('history_page.new_scan')}
        </button>
      </header>

      <div className="history-controls">
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="history-filter-select"
          aria-label={t('history_page.filter_aria')}
        >
          <option value="all">{t('history_page.filter_all')}</option>
          <option value="1d">{t('history_page.filter_today')}</option>
          <option value="1m">{t('history_page.filter_1m')}</option>
          <option value="3m">{t('history_page.filter_3m')}</option>
          <option value="6m">{t('history_page.filter_6m')}</option>
          <option value="1y">{t('history_page.filter_1y')}</option>
        </select>

        <button
          type="button"
          onClick={handleExportPDF}
          disabled={filteredScans.length === 0}
          className="history-export-btn"
          aria-label={t('history_page.export_pdf_aria')}
        >
          <Download size={18} />
          {t('history_page.export_pdf')}
        </button>

        <button
          type="button"
          className={`history-compare-mode-btn ${compareMode ? 'active' : ''}`}
          onClick={handleToggleCompareMode}
          disabled={filteredScans.length < 2}
          aria-pressed={compareMode}
          aria-label={t('history_page.compare_mode_aria')}
        >
          {t('history_page.compare_mode')}
        </button>
      </div>

      {filteredScans.length === 0 ? (
        <section className="history-empty-card" aria-label={t('history_page.empty_title')}>
          <div className="history-empty-icon">
            <Calendar size={30} aria-hidden="true" />
          </div>
          <h2>{t('history_page.empty_title')}</h2>
          <p>{t('history_page.empty_desc')}</p>
          <button type="button" className="history-primary-btn" onClick={() => navigate('/scan')}>
            <Camera size={18} aria-hidden="true" />
            {t('history_page.first_scan')}
          </button>
        </section>
      ) : (
        <>
          {compareMode && (
            <section className="history-compare-card" aria-label={t('history_page.compare_title')}>
              <div className="history-compare-head">
                <h2>{t('history_page.compare_title')}</h2>
                <span>{t('history_page.compare_selected', { current: selectedScans.length, total: 2 })}</span>
              </div>

              {selectedScans.length === 2 ? (
                <div className="history-compare-grid">
                  {selectedScans.map((scan) => (
                    <figure key={`${scan.createdAt}-${scan.fileName}`} className="history-compare-image-card">
                      <div className="history-compare-image-wrap">
                        {scan.imageUrl ? (
                          <img src={scan.imageUrl} alt={scan.fileName || t('history_page.scan_alt')} className="history-compare-image" />
                        ) : (
                          <div className="history-compare-image-fallback">
                            <ImageIcon size={28} aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <figcaption>
                        <strong>{scan.fileName || t('history_page.unnamed_scan')}</strong>
                        <span>{formatDate(scan.createdAt)}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="history-compare-empty">{t('history_page.compare_empty')}</p>
              )}
            </section>
          )}

          <section className="history-gallery" aria-label={t('history_page.gallery_aria')}>
            {filteredScans.map((scan) => {
              const riskMeta = getRiskMeta(scan.riskLevel, t);
              const scanKey = `${scan.createdAt}-${scan.fileName}`;
              const isSelected = selectedForCompare.includes(scanKey);
              const onCardClick = compareMode ? () => toggleCompareSelection(scan) : () => openScanDetails(scan);

              return (
                <article
                  key={`${scan.createdAt}-${scan.fileName}`}
                  className={`history-scan-card-wrapper ${compareMode ? 'compare-mode' : ''} ${isSelected ? 'selected' : ''}`}
                >
                  <button
                    type="button"
                    className="history-scan-card"
                    onClick={onCardClick}
                    aria-label={compareMode
                      ? t('history_page.select_compare_aria', { name: scan.fileName || t('history_page.unnamed_scan') })
                      : t('history_page.open_details_aria', { name: scan.fileName || t('history_page.unnamed_scan'), risk: riskMeta.label })}
                  >
                    <div className="history-thumbnail">
                      {scan.imageUrl ? (
                        <img src={scan.imageUrl} alt="" />
                      ) : (
                        <ImageIcon size={28} aria-hidden="true" />
                      )}
                    </div>

                    <div className="history-scan-content">
                      <div className="history-scan-topline">
                        <span className={`history-risk-pill ${riskMeta.className}`}>
                          <ShieldAlert size={13} aria-hidden="true" />
                          {riskMeta.label}
                        </span>
                        <strong>{scan.probability}%</strong>
                      </div>
                      <h2>{scan.fileName || t('history_page.unnamed_scan')}</h2>
                      <p>{formatDate(scan.createdAt)}</p>
                    </div>

                    <ChevronRight className="history-chevron" size={18} aria-hidden="true" />
                  </button>
                </article>
              );
            })}
          </section>
        </>
      )}

      <nav className="history-bottom-navbar" aria-label={t('history_page.nav_aria')}>
        <button type="button" className="history-nav-btn" onClick={() => navigate('/homepage')}>
          <Home size={24} />
          <span>{t('nav.home')}</span>
        </button>
        <button type="button" className="history-nav-btn" onClick={() => navigate('/scan')}>
          <Camera size={24} />
          <span>{t('nav.scan')}</span>
        </button>
        <button type="button" className="history-nav-btn active" aria-current="page">
          <History size={24} />
          <span>{t('nav.history')}</span>
        </button>
        <button type="button" className="history-nav-btn" onClick={() => navigate('/learn')}>
          <BookOpen size={24} />
          <span>{t('nav.learn')}</span>
        </button>
      </nav>
    </main>
  );
}