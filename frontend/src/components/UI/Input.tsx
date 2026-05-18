import { memo, type InputHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled';
}

const Input = memo(function Input({
  label,
  error,
  helperText,
  variant = 'default',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random()}`;
  
  return (
    <div className="input-wrapper">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {props.required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="input-container">
        <input
          id={inputId}
          className={`input input-${variant} ${error ? 'input-error' : ''}`}
          {...props}
        />
        {error && <span className="input-error-msg">{error}</span>}
      </div>
      {helperText && !error && (
        <span className="input-helper-text">{helperText}</span>
      )}
    </div>
  );
});

export default Input;
