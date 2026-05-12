import React from 'react';

type State = {
  hasError: boolean;
  error?: Error | null;
  info?: React.ErrorInfo | null;
};

export default class DevErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('DevErrorBoundary caught error', error, info);
    this.setState({ error, info });
  }

  render() {
    if (!this.state.hasError) return this.props.children as React.ReactElement;

    return (
      <div style={{ padding: 20, fontFamily: 'Inter, sans-serif' }}>
        <h2 style={{ color: '#b91c1c' }}>Erro ao carregar o componente</h2>
        <p>{this.state.error?.message}</p>
        <details style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: 12, borderRadius: 8 }}>
          {this.state.info?.componentStack}
        </details>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      </div>
    );
  }
}
