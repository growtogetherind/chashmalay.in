import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <p style={{ fontSize: '6rem', fontWeight: 900, color: '#e2e8f0', lineHeight: 1 }}>404</p>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>Page Not Found</h1>
      <p style={{ color: '#64748b', maxWidth: '380px', lineHeight: 1.7 }}>
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/"
          style={{ padding: '0.875rem 2rem', background: '#1e3f8a', color: 'white', borderRadius: '999px', fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem' }}
        >
          Go to Homepage
        </Link>
        <Link
          to="/category/eyeglasses"
          style={{ padding: '0.875rem 2rem', background: '#f1f5f9', color: '#0f172a', borderRadius: '999px', fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem' }}
        >
          Shop Eyeglasses
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
