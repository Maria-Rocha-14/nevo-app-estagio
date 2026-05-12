import type { CSSProperties } from 'react';
import './FeedbackMessage.css';

type FeedbackTone = 'success' | 'error' | 'warning' | 'info';

type FeedbackMessageProps = {
  tone: FeedbackTone;
  message: string;
  onClose?: () => void;
  maxWidth?: string;
};

export default function FeedbackMessage({ tone, message, onClose, maxWidth }: FeedbackMessageProps) {
  if (!message) return null;

  const isUrgent = tone === 'error';
  const style = maxWidth ? ({ '--feedback-popup-max-width': maxWidth } as CSSProperties) : undefined;

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
