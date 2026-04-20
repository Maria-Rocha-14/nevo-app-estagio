import './FeedbackMessage.css';

type FeedbackTone = 'success' | 'error' | 'warning' | 'info';

type FeedbackMessageProps = {
  tone: FeedbackTone;
  message: string;
  onClose?: () => void;
};

export default function FeedbackMessage({ tone, message, onClose }: FeedbackMessageProps) {
  if (!message) return null;

  const isUrgent = tone === 'error';

  return (
    <div
      className={`feedback-message feedback-${tone}`}
      role={isUrgent ? 'alert' : 'status'}
      aria-live={isUrgent ? 'assertive' : 'polite'}
    >
      <span className="feedback-text">{message}</span>
      {onClose && (
        <button
          type="button"
          className="feedback-close"
          onClick={onClose}
          aria-label="Fechar mensagem"
        >
          ×
        </button>
      )}
    </div>
  );
}
