import { useEffect, type CSSProperties } from 'react';
import './FeedbackMessage.css';

type FeedbackTone = 'success' | 'error' | 'warning' | 'info';

type FeedbackMessageProps = {
  tone: FeedbackTone;
  message: string;
  onClose?: () => void;
  maxWidth?: string;
  autoCloseMs?: number;
};

export default function FeedbackMessage({ tone, message, onClose, maxWidth, autoCloseMs }: FeedbackMessageProps) {
  const isUrgent = tone === 'error';
  const style = maxWidth ? ({ '--feedback-popup-max-width': maxWidth } as CSSProperties) : undefined;
  const closeDelay = autoCloseMs ?? (isUrgent ? 5000 : 3200);

  useEffect(() => {
    if (!message || !onClose || closeDelay <= 0) return;

    const timeoutId = window.setTimeout(onClose, closeDelay);
    return () => window.clearTimeout(timeoutId);
  }, [closeDelay, message, onClose]);

  if (!message) return null;

  return (
    <div className="feedback-popup-layer">
      <div
        className={`feedback-message feedback-${tone}`}
        role={isUrgent ? 'alert' : 'status'}
        aria-live={isUrgent ? 'assertive' : 'polite'}
        style={style}
      >
        <span className="feedback-text">{message}</span>
        {onClose && (
          <button
            type="button"
            className="feedback-close"
            onClick={onClose}
            aria-label="Fechar mensagem"
          >
            x
          </button>
        )}
      </div>
    </div>
  );
}
