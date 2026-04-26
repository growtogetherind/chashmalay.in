import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Eye, EyeOff, ArrowRight, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import toast from 'react-hot-toast';
import './Auth.css';

const Auth = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [resetLoading, setResetLoading] = useState(false);

  const from = location.state?.from || '/';

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { profile: loggedInProfile } = await signIn(form.email, form.password);
        if (loggedInProfile?.is_admin) {
          navigate('/admin');
        } else {
          navigate(from);
        }
      } else {
        if (!form.fullName.trim()) { toast.error('Please enter your full name.'); setLoading(false); return; }
        await signUp(form.email, form.password, form.fullName);
        navigate(from);
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try { 
      const { profile: loggedInProfile } = await signInWithGoogle(); 
      if (loggedInProfile?.is_admin) {
        navigate('/admin');
      } else {
        navigate(from);
      }
    }
    catch (err) { toast.error(err.message); }
  };

  const handleForgotPassword = async () => {
    if (!form.email.trim()) {
      toast.error('Please enter your email address first.');
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, form.email.trim());
      toast.success('Password reset email sent! Check your inbox.');
    } catch (err) {
      // Firebase returns a generic error for non-existent emails to prevent enumeration
      toast.error(err.code === 'auth/user-not-found'
        ? 'No account found with this email.'
        : err.message || 'Failed to send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background */}
      <div className="auth-bg">
        <img src="https://images.unsplash.com/photo-1572635196237-14b3f281501f?auto=format&fit=crop&q=80&w=2000" alt="bg" className="auth-bg-img" />
        <div className="auth-bg-overlay" />
      </div>

      <div className="auth-container">
        {/* Left Panel */}
        <div className="auth-brand-panel">
          <Link to="/" className="auth-logo">Chashmalay<span>.in</span></Link>
          <div className="auth-brand-content">
            <h2>See the world clearly.<br />Look amazing doing it.</h2>
            <p>Join 1M+ happy customers who trust Chashmaly for their eyewear.</p>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="auth-form-panel">
          <div className="auth-card glass-panel">
            {/* Tabs */}
            <div className="auth-tabs">
              <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>LOGIN</button>
              <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>REGISTER</button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'register' && (
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-wrap">
                    <User size={16} className="input-icon" />
                    <input type="text" name="fullName" placeholder="Rahul Kumar" value={form.fullName} onChange={handleChange} required />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrap">
                  <span className="input-icon text-sm">@</span>
                  <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrap">
                  <button type="button" className="input-icon input-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <input type={showPassword ? 'text' : 'password'} name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required minLength={6} />
                </div>
              </div>

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-xs text-primary-blue font-bold hover:underline disabled:opacity-50"
                  >
                    {resetLoading ? 'Sending...' : 'Forgot Password?'}
                  </button>
                </div>
              )}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? <span className="loading-dots">...</span> : (
                  <>{mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'} <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div className="auth-divider"><span>or continue with</span></div>

            <button onClick={handleGoogle} className="google-btn">
              <Globe size={18} />
              <span>Continue with Google</span>
            </button>

            <p className="auth-switch">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="ml-2 text-primary-blue font-black underline">
                {mode === 'login' ? 'Register' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
