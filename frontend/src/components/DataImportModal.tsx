import { useState, type FormEvent } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type DataImportModalProps = {
  open: boolean;
  onClose: () => void;
  file: File | null;
  onImport: (password: string) => Promise<void>;
  loading: boolean;
};

const DataImportModal = ({ open, onClose, file, onImport, loading }: DataImportModalProps) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setError('Seleciona um ficheiro de backup para continuar.');
      return;
    }

    if (password.length < 4) {
      setError('A palavra-passe deve ter pelo menos 4 caracteres.');
      return;
    }

    setError(null);

    try {
      await onImport(password);
      setPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido ao importar dados.';
      setError(message);
    }
  };

  return (
    <div className="sync-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
      <div className="sync-modal-card">
        <div className="sync-modal-header">
          <div className="sync-modal-icon">
            <UploadCloud size={20} />
          </div>
          <div>
            <h2 id="import-modal-title">{t('profile.import_modal_title')}</h2>
            <p>{t('profile.import_modal_description')}</p>
          </div>
          <button type="button" className="sync-modal-close" onClick={onClose} aria-label={t('profile.import_modal_cancel')}>
            <X size={16} />
          </button>
        </div>

        <form className="sync-modal-form" onSubmit={handleSubmit}>
          {file && <div className="sync-file-meta">{t('profile.import_modal_selected_file', { fileName: file.name })}</div>}

          <label className="sync-input-group">
            <span>{t('profile.import_modal_password_label')}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t('profile.import_modal_password_placeholder')}
              required
              minLength={4}
              autoComplete="current-password"
              autoFocus
            />
          </label>

          {error && <div className="sync-modal-error">{error}</div>}

          <div className="sync-modal-actions">
            <button type="button" className="sync-modal-button sync-modal-button-secondary" onClick={onClose} disabled={loading}>
              {t('profile.import_modal_cancel')}
            </button>
            <button type="submit" className="sync-modal-button sync-modal-button-primary" disabled={loading}>
              {loading ? t('profile.import_modal_loading') : t('profile.import_modal_submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataImportModal;
