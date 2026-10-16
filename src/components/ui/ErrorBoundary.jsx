import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ fontSize: '4rem' }}>🔧</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Something went wrong</h1>
          <p style={{ color: '#64748b', maxWidth: '400px' }}>
            We encountered an unexpected error. Our team has been notified.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '0.75rem 1.5rem', background: '#1e3f8a', color: 'white', borderRadius: '999px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            >
              Refresh Page
            </button>
            <a
              href="/"
              style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', color: '#0f172a', borderRadius: '999px', fontWeight: 700, textDecoration: 'none' }}
            >
              Go Home
            </a>
          </div>
          {this.state.error && (
            <details style={{ marginTop: '1.5rem', maxWidth: '500px', textAlign: 'left', fontSize: '0.8rem', color: '#64748b' }}>
              <summary style={{ cursor: 'pointer', textAlign: 'center', textDecoration: 'underline' }}>Error Details</summary>
              <pre style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fee2e2', borderRadius: '0.5rem', color: '#991b1b', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
