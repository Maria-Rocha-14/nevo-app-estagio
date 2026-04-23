import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Camera,
  ChevronRight,
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

const getRiskMeta = (riskLevel: AssessmentHistoryEntry['riskLevel']): RiskMeta => {
  if (riskLevel === 'high') {
    return { label: 'Risco Alto', className: 'history-risk-high' };
  }

  if (riskLevel === 'moderate') {
    return { label: 'Risco Moderado', className: 'history-risk-moderate' };
  }

  return { label: 'Risco Baixo', className: 'history-risk-low' };
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

export default function HistoryPage() {
  const navigate = useNavigate();
  const user = useSessionUser();

  const scans = useMemo(() => {
    return [...(user?.assessmentHistory || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [user?.assessmentHistory]);

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

  if (user === undefined) return <main className="history-container" aria-busy="true"><div style={{padding: '20px', textAlign: 'center'}}>A carregar sessão...</div></main>;
  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <main className="history-container" aria-labelledby="history-title">
      <header className="history-header">
        <div>
          <p className="history-kicker">Exames</p>
          <h1 id="history-title">Histórico</h1>
        </div>
        <button type="button" className="history-header-action" onClick={() => navigate('/scan')}>
          <Camera size={18} aria-hidden="true" />
          Novo
        </button>
      </header>

      {scans.length === 0 ? (
        <section className="history-empty-card" aria-label="Sem exames guardados">
          <div className="history-empty-icon">
            <Calendar size={30} aria-hidden="true" />
          </div>
          <h2>Nenhum scan registado</h2>
          <p>Começa a analisar a pele para veres aqui os exames anteriores.</p>
          <button type="button" className="history-primary-btn" onClick={() => navigate('/scan')}>
            <Camera size={18} aria-hidden="true" />
            Fazer primeiro scan
          </button>
        </section>
      ) : (
        <section className="history-gallery" aria-label="Galeria de scans anteriores">
          {scans.map((scan) => {
            const riskMeta = getRiskMeta(scan.riskLevel);

            return (
              <button
                type="button"
                key={`${scan.createdAt}-${scan.fileName}`}
                className="history-scan-card"
                onClick={() => openScanDetails(scan)}
                aria-label={`Abrir detalhes de ${scan.fileName || 'scan'} com ${riskMeta.label}`}
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
                  <h2>{scan.fileName || 'Scan sem nome'}</h2>
                  <p>{formatDate(scan.createdAt)}</p>
                </div>

                <ChevronRight className="history-chevron" size={18} aria-hidden="true" />
              </button>
            );
          })}
        </section>
      )}

      <nav className="history-bottom-navbar" aria-label="Navegação principal">
        <button type="button" className="history-nav-btn" onClick={() => navigate('/homepage')}>
          <Home size={24} />
          <span>Home</span>
        </button>
        <button type="button" className="history-nav-btn" onClick={() => navigate('/scan')}>
          <Camera size={24} />
          <span>Scan</span>
        </button>
        <button type="button" className="history-nav-btn active" aria-current="page">
          <History size={24} />
          <span>Histórico</span>
        </button>
        <button type="button" className="history-nav-btn" onClick={() => navigate('/learn')}>
          <BookOpen size={24} />
          <span>Aprender</span>
        </button>
      </nav>
    </main>
  );
}
