import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, ScanLine } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authApi } from '../api/authApi.js';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    try {
      const { data } = await authApi.login(values);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (error) {
      form.setError('root', { message: error.response?.data?.message || 'Unable to sign in.' });
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-visual">
        <img className="auth-photo" src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=85" alt="Produce display in a retail store" />
        <div className="auth-veil" />
        <Link to="/" className="auth-brand"><span className="brand-mark"><ScanLine size={19} strokeWidth={2.2} /></span><span><strong>ShelfSight</strong><small>RETAIL INTELLIGENCE</small></span></Link>
        <div className="auth-story"><p className="landing-kicker">STORE OPERATIONS, IN FOCUS</p><h1>Good decisions<br /><em>start in the aisle.</em></h1><p>See what needs attention. Give every team a clear next step.</p></div>
        <span className="auth-visual-index">SHELFSIGHT / 01</span>
      </aside>
      <main className="auth-panel">
        <div className="auth-panel-inner">
          <p className="auth-eyebrow">YOUR WORKSPACE</p>
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in to continue to your store operations.</p>
          <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
            <label className="auth-field">Email address<input type="email" autoComplete="email" {...form.register('email')} className="auth-input" placeholder="name@company.com" />{form.formState.errors.email && <span className="field-error">{form.formState.errors.email.message}</span>}</label>
            <label className="auth-field">Password<input type="password" autoComplete="current-password" {...form.register('password')} className="auth-input" placeholder="Enter your password" />{form.formState.errors.password && <span className="field-error">{form.formState.errors.password.message}</span>}</label>
            {form.formState.errors.root && <p className="auth-error" role="alert">{form.formState.errors.root.message}</p>}
            <button type="submit" className="auth-submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Signing in...' : 'Sign in'} <ArrowRight size={17} /></button>
          </form>
          <p className="auth-switch">New to ShelfSight? <Link to="/register">Create an account <span aria-hidden="true">→</span></Link></p>
        </div>
      </main>
    </div>
  );
}
