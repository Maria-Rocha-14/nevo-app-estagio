import { memo, type ReactNode } from 'react';
import './Card.css';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

const Card = memo(function Card({
  children,
  className = '',
  onClick,
  interactive = false
}: CardProps) {
  return (
    <div
      className={`card ${interactive ? 'card-interactive' : ''} ${className}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      } : undefined}
    >
      {children}
    </div>
  );
});

export default Card;
