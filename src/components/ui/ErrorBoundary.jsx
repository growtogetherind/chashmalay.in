import React from 'react';
import { Link } from 'react-router-dom';

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
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ padding: '0.75rem 1.5rem', background: '#1e3f8a', color: 'white', borderRadius: '999px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', color: '#0f172a', borderRadius: '999px', fontWeight: 700, textDecoration: 'none' }}
            >
              Go Home
            </a>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{ marginTop: '2rem', padding: '1rem', background: '#fee2e2', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#991b1b', textAlign: 'left', maxWidth: '600px', overflow: 'auto' }}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
