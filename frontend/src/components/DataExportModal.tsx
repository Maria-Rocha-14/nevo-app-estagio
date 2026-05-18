import { useState, type FormEvent } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type DataExportModalProps = {
  open: boolean;
  onClose: () => void;
  onExport: (password: string) => Promise<void>;
  loading: boolean;
};

const DataExportModal = ({ open, onClose, onExport, loading }: DataExportModalProps) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 4) {
      setError('A palavra-passe deve ter pelo menos 4 caracteres.');
      return;
    }

    setError(null);

    try {
      await onExport(password);
      setPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido ao exportar dados.';
      setError(message);
    }
  };

  return (
    <div className="sync-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
      <div className="sync-modal-card">
        <div className="sync-modal-header">
          <div className="sync-modal-icon">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 id="export-modal-title">{t('profile.export_modal_title')}</h2>
            <p>{t('profile.export_modal_description')}</p>
          </div>
          <button type="button" className="sync-modal-close" onClick={onClose} aria-label={t('profile.export_modal_cancel')}>
            <X size={16} />
          </button>
        </div>

        <form className="sync-modal-form" onSubmit={handleSubmit}>
          <label className="sync-input-group">
            <span>{t('profile.export_modal_password_label')}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t('profile.export_modal_password_placeholder')}
              required
              minLength={4}
              autoComplete="new-password"
            />
          </label>

          {error && <div className="sync-modal-error">{error}</div>}

          <div className="sync-modal-actions">
            <button type="button" className="sync-modal-button sync-modal-button-secondary" onClick={onClose} disabled={loading}>
              {t('profile.export_modal_cancel')}
            </button>
            <button type="submit" className="sync-modal-button sync-modal-button-primary" disabled={loading}>
              {loading ? t('profile.export_modal_loading') : t('profile.export_modal_submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataExportModal;
