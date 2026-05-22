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
  ShieldAlert,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { useSessionUser } from '../../services/session';
import type { AssessmentHistoryEntry } from '../../db/db';
import './HistoryPage.css';

const BODY_AREA_IDS = [
  'face',
  'neck',
  'trunk',
  'back',
  'left_arm',
  'right_arm',
  'left_hand',
  'right_hand',
  'left_leg',
  'right_leg',
  'left_foot',
  'right_foot'
] as const;

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

export default function HistoryPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const user = useSessionUser();
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [bodyAreaFilter, setBodyAreaFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return t('history_page.date_unavailable', 'Data indisponível');
    }

    const currentLanguage = i18n.language || 'pt-PT';

    return new Intl.DateTimeFormat(currentLanguage, {
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

  const filteredScans = useMemo(() => {
    let sorted = [...(user?.assessmentHistory || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (timeFilter !== 'all') {
      if (timeFilter === '1d') {
        const today = new Date();
        sorted = sorted.filter((scan) => isSameDay(scan.createdAt, today));
      } else {
        const now = new Date();
        const monthsToSubtract = timeFilter === '1m' ? 1 : timeFilter === '3m' ? 3 : timeFilter === '6m' ? 6 : 12;
        const cutoffDate = new Date();
        cutoffDate.setMonth(now.getMonth() - monthsToSubtract);
        sorted = sorted.filter((scan) => new Date(scan.createdAt) >= cutoffDate);
      }
    }

    if (bodyAreaFilter !== 'all') {
      sorted = sorted.filter((scan) => scan.bodyAreaId === bodyAreaFilter);
    }

    return sorted;
  }, [user?.assessmentHistory, timeFilter, bodyAreaFilter]);

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
        bodyAreaLabel: scan.bodyAreaLabel,
        probability: scan.probability,
        riskLevel: scan.riskLevel,
        isSimulated: scan.simulated,
        createdAt: scan.createdAt,
        returnTo: '/history'
      }
    });
  };

  const handleClearFilters = () => {
    setTimeFilter('all');
    setBodyAreaFilter('all');
  };

  const hasActiveFilters = timeFilter !== 'all' || bodyAreaFilter !== 'all';

  if (user === undefined) {
    return (
      <main className="history-container" aria-busy="true">
        <div style={{ padding: '20px', textAlign: 'center' }}>
          {t('history_page.loading_session', 'A carregar sessão...')}
        </div>
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
          <p className="history-kicker">{t('history_page.kicker', 'Histórico Pessoal')}</p>
          <h1 id="history-title">{t('history_page.title', 'Histórico')}</h1>
        </div>
        <button type="button" className="history-header-action" onClick={() => navigate('/scan')}>
          <Camera size={18} aria-hidden="true" />
          {t('history_page.new_scan', 'Novo Scan')}
        </button>
      </header>

      <div className="history-controls">
        <div className="history-unified-filter-container">
          <button
            type="button"
            className={`history-filter-trigger-btn ${hasActiveFilters ? 'filters-active' : ''}`}
            onClick={() => setIsFilterOpen((prev) => !prev)}
          >
            <SlidersHorizontal size={16} />
            <span>{t('history_page.filters_button', 'Filtros')}</span>
            {hasActiveFilters && <span className="history-filter-badge">!</span>}
          </button>

          {isFilterOpen && (
            <div className="history-filter-dropdown-panel">
              <div className="history-dropdown-field">
                <label htmlFor="time-select"> {t('history_page.filter_time_label', 'Período de Tempo')}</label>
                <select
                  id="time-select"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="history-dropdown-select"
                >
                  <option value="all">{t('history_page.filter_all', 'Todo o histórico')}</option>
                  <option value="1d">{t('history_page.filter_today', 'Hoje')}</option>
                  <option value="1m">{t('history_page.filter_1m', 'Último mês')}</option>
                  <option value="3m">{t('history_page.filter_3m', 'Últimos 3 meses')}</option>
                  <option value="6m">{t('history_page.filter_6m', 'Últimos 6 meses')}</option>
                  <option value="1y">{t('history_page.filter_1y', 'Último ano')}</option>
                </select>
              </div>

              <div className="history-dropdown-field">
                <label htmlFor="body-select"> {t('history_page.filter_body_label', 'Zona do Corpo')}</label>
                <select
                  id="body-select"
                  value={bodyAreaFilter}
                  onChange={(e) => setBodyAreaFilter(e.target.value)}
                  className="history-dropdown-select"
                >
                  <option value="all">{t('history_page.filter_body_all', 'Todas as zonas')}</option>
                  {BODY_AREA_IDS.map((areaId) => (
                    <option key={areaId} value={areaId}>
                      {t(`scan.body_area_${areaId}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="history-dropdown-actions">
                <button
                  type="button"
                  className="history-dropdown-clear-btn"
                  onClick={handleClearFilters}
                  disabled={!hasActiveFilters}
                >
                  {t('history_page.clear_filters_btn', 'Limpar')}
                </button>

                <button
                  type="button"
                  className="history-dropdown-close-btn"
                  onClick={() => setIsFilterOpen(false)}
                >
                  {t('history_page.close_filters', 'Aplicar')}
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className={`history-compare-mode-btn ${compareMode ? 'active' : ''}`}
          onClick={handleToggleCompareMode}
          disabled={filteredScans.length < 2}
          aria-pressed={compareMode}
          aria-label={t('history_page.compare_mode_aria', 'Alternar modo de comparação')}
        >
          {t('history_page.compare_mode', 'Comparar')}
        </button>

        <button
          type="button"
          onClick={handleExportPDF}
          disabled={filteredScans.length === 0}
          className="history-export-btn"
          aria-label={t('history_page.export_pdf_aria', 'Exportar PDF')}
        >
          <Download size={18} />
          {t('history_page.export_pdf', 'Exportar PDF')}
        </button>
      </div>

      {filteredScans.length === 0 ? (
        <section className="history-empty-card" aria-label={t('history_page.empty_title', 'Sem análises')}>
          <div className="history-empty-icon">
            <Calendar size={30} aria-hidden="true" />
          </div>
          <h2>{t('history_page.empty_title', 'Sem análises guardadas')}</h2>
          <p>{t('history_page.empty_desc', 'Efetue o seu primeiro scan para acompanhar a evolução da sua pele.')}</p>
          <button type="button" className="history-primary-btn" onClick={() => navigate('/scan')}>
            <Camera size={18} aria-hidden="true" />
            {t('history_page.first_scan', 'Efetuar primeiro scan')}
          </button>
        </section>
      ) : (
        <>
          {compareMode && (
            <section className="history-compare-card" aria-label={t('history_page.compare_title', 'Comparação de Imagens')}>
              <div className="history-compare-head">
                <h2>{t('history_page.compare_title', 'Comparar Lesões')}</h2>
                <span>
                  {t('history_page.compare_selected', {
                    current: selectedScans.length,
                    total: 2,
                    defaultValue: 'Selecionados: {{current}} de {{total}}'
                  })}
                </span>
              </div>

              {selectedScans.length === 2 ? (
                <div className="history-compare-grid">
                  {selectedScans.map((scan) => {
                    const riskMeta = getRiskMeta(scan.riskLevel, t);

                    return (
                      <figure key={`${scan.createdAt}-${scan.fileName}`} className="history-compare-image-card">
                        <div className="history-compare-image-wrap">
                          {scan.imageUrl ? (
                            <img src={scan.imageUrl} alt={scan.fileName || t('history_page.scan_alt', 'Imagem da lesão')} className="history-compare-image" />
                          ) : (
                            <div className="history-compare-image-fallback">
                              <ImageIcon size={28} aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <figcaption>
                          <strong>{scan.fileName || t('history_page.unnamed_scan', 'Análise sem nome')}</strong>
                          <span>{formatDate(scan.createdAt)}</span>
                          <div className="history-compare-risk-row">
                            <span className={`history-risk-pill ${riskMeta.className}`}>{riskMeta.label}</span>
                            <strong>{scan.probability}%</strong>
                          </div>
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              ) : (
                <p className="history-compare-empty">
                  {t('history_page.compare_empty', 'Selecione duas análises abaixo para as comparar lado a lado.')}
                </p>
              )}
            </section>
          )}

          <section className="history-gallery" aria-label={t('history_page.gallery_aria', 'Galeria do histórico')}>
            {filteredScans.map((scan) => {
              const riskMeta = getRiskMeta(scan.riskLevel, t);
              const scanKey = `${scan.createdAt}-${scan.fileName}`;
              const isSelected = selectedForCompare.includes(scanKey);
              const onCardClick = compareMode ? () => toggleCompareSelection(scan) : () => openScanDetails(scan);

              let jaFoiAoMedico = false;
              if (user?.id) {
                if (scan.createdAt && scan.createdAt !== 'undefined') {
                  jaFoiAoMedico = localStorage.getItem(`doctor_visit_${user.id}_${scan.createdAt}`) === 'true';
                } else if (scan.fileName && scan.fileName !== 'undefined') {
                  jaFoiAoMedico = localStorage.getItem(`doctor_visit_${user.id}_${scan.fileName}`) === 'true';
                }
              }

              return (
                <article
                  key={`${scan.createdAt}-${scan.fileName}`}
                  className={`history-scan-card-wrapper ${compareMode ? 'compare-mode' : ''} ${isSelected ? 'selected' : ''} ${jaFoiAoMedico ? 'evaluated' : ''}`}
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

                    <div className="history-card-right-actions">
                      {jaFoiAoMedico && (
                        <span
                          title={t('history_page.doctor_visited_tooltip', 'Consulta médica realizada')}
                          className="history-doctor-check"
                        >
                          <CheckCircle2 size={22} color="#5fa79a" strokeWidth={2.5} />
                        </span>
                      )}
                      <ChevronRight className="history-chevron" size={18} aria-hidden="true" />
                    </div>
                  </button>
                </article>
              );
            })}
          </section>
        </>
      )}

      <nav className="history-bottom-navbar" aria-label={t('history_page.nav_aria', 'Menu principal de navegação')}>
        <button type="button" className="history-nav-btn" onClick={() => navigate('/homepage')}>
          <Home size={24} />
          <span>{t('nav.home', 'Início')}</span>
        </button>
        <button type="button" className="history-nav-btn" onClick={() => navigate('/scan')}>
          <Camera size={24} />
          <span>{t('nav.scan', 'Scanner')}</span>
        </button>
        <button type="button" className="history-nav-btn active" aria-current="page">
          <History size={24} />
          <span>{t('nav.history', 'Histórico')}</span>
        </button>
        <button type="button" className="history-nav-btn" onClick={() => navigate('/learn')}>
          <BookOpen size={24} />
          <span>{t('nav.learn', 'Aprender')}</span>
        </button>
      </nav>
    </main>
  );
}