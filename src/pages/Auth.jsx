import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Eye, EyeOff, ArrowRight, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import toast from 'react-hot-toast';
import './Auth.css';

const Auth = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
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

  const handleForgotPassword = async (e) => {
    if (e) e.preventDefault();
    if (!form.email.trim()) {
      toast.error('Please enter your email address first.');
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword(form.email.trim());
      setMode('login'); // Go back to login after sending
    } catch {
      // Error is handled in AuthContext toast
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background */}
      <div className="auth-bg">
        <img
          src="https://res.cloudinary.com/dpv40ou2c/image/upload/f_auto,q_auto,c_fill,w_1600/banners/sunglasses_banner.png"
          alt=""
          className="auth-bg-img"
        />
        <div className="auth-bg-overlay" />
      </div>

      <div className="auth-container">
        {/* Left Panel */}
        <div className="auth-brand-panel">
          <Link to="/" className="auth-logo flex flex-col items-center">
            <Logo className="h-20 w-auto mb-4" />
            <span>Chashmalay.in</span>
          </Link>
          <div className="auth-brand-content">
            <h2>See the world clearly.<br />Look amazing doing it.</h2>
            <p>Join 1M+ happy customers who trust Chashmalay for their eyewear.</p>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="auth-form-panel">
          <div className="auth-card glass-panel">
            {/* Tabs */}
            {mode !== 'forgot' && (
              <div className="auth-tabs">
                <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>LOGIN</button>
                <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>REGISTER</button>
              </div>
            )}

            {mode === 'forgot' ? (
              <div className="animate-fade-in">
                <h3 className="text-xl font-black text-gray-900 mb-2">Reset Password</h3>
                <p className="text-sm text-gray-500 mb-6">Enter your email address and we’ll send you a link to reset your password.</p>
                
                <form onSubmit={handleForgotPassword} className="auth-form">
                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-wrap">
                      <span className="input-icon text-sm">@</span>
                      <input 
                        type="email" 
                        name="email" 
                        placeholder="you@example.com" 
                        value={form.email} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={resetLoading}>
                    {resetLoading ? <span className="loading-dots">...</span> : (
                      <>SEND RESET LINK <ArrowRight size={16} /></>
                    )}
                  </button>

                  <button type="button" onClick={() => setMode('login')} className="w-full text-center text-xs font-bold text-gray-500 hover:text-primary-blue mt-4">
                    Back to Login
                  </button>
                </form>
              </div>
            ) : (
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

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!form.email.trim()) {
                        toast.error('Please enter your email address first.');
                        return;
                      }
                      setMode('forgot');
                    }}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? <span className="loading-dots">...</span> : (
                  <>{mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'} <ArrowRight size={16} /></>
                )}
              </button>
              </form>
            )}

            {mode !== 'forgot' && (
              <>
                <div className="auth-divider"><span>or continue with</span></div>

                <button onClick={handleGoogle} className="google-btn">
                  <Globe size={18} />
                  <span>Continue with Google</span>
                </button>

                <p className="auth-switch">
                  {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                  <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="ml-2 text-primary font-black underline">
                    {mode === 'login' ? 'Register' : 'Login'}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
