import { memo, type ReactNode } from 'react';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  isLoading?: boolean;
}

const Button = memo(function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="btn-loader" aria-hidden="true" />
          Carregando...
        </>
      ) : (
        children
      )}
    </button>
  );
});

export default Button;
