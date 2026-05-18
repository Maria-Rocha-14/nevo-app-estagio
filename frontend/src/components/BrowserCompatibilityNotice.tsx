import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { BrowserSupportCheck } from '../services/browserSupport';
import './BrowserCompatibilityNotice.css';

type BrowserCompatibilityNoticeProps = {
  support: BrowserSupportCheck;
};

const BrowserCompatibilityNotice = memo(function BrowserCompatibilityNotice({ support }: BrowserCompatibilityNoticeProps) {
  return (
    <main className="compat-page" aria-labelledby="compat-title">
      <section className="compat-card">
        <div className="compat-icon" aria-hidden="true">
          <AlertTriangle size={30} />
        </div>
        <h1 id="compat-title">Browser nao suportado</h1>
        <p>
          Esta aplicacao precisa de funcionalidades modernas do browser para guardar dados localmente e carregar imagens
          em seguranca.
        </p>

        <div className="compat-list-block">
          <strong>Em falta:</strong>
          <ul>
            {support.missingRequired.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {support.missingOptional.length > 0 && (
          <div className="compat-list-block compat-muted">
            <strong>Funcionalidades opcionais indisponiveis:</strong>
            <ul>
              {support.missingOptional.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="compat-help">Use uma versao recente do Chrome, Edge, Firefox ou Safari.</p>
      </section>
    </main>
  );
});

export default BrowserCompatibilityNotice;
