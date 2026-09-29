import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, ScanLine } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.').max(100),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8).regex(/[A-Z]/, 'Include an uppercase letter').regex(/[a-z]/, 'Include a lowercase letter').regex(/\d/, 'Include a number'),
  confirmPassword: z.string(),
  role: z.enum(['ADMIN', 'MANAGER', 'AUDITOR']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match.',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm({ resolver: zodResolver(registerSchema), defaultValues: { role: 'AUDITOR' } });

  const onSubmit = async (values) => {
    try {
      const payload = {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
      };

      const { data } = await authApi.register(payload);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (error) {
      form.setError('root', { message: error.response?.data?.message || 'Unable to create account.' });
    }
  };

  return (
    <div className="auth-shell auth-shell-register">
      <aside className="auth-visual">
        <img className="auth-photo" src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=85" alt="Produce display in a retail store" />
        <div className="auth-veil" />
        <Link to="/" className="auth-brand"><span className="brand-mark"><ScanLine size={19} strokeWidth={2.2} /></span><span><strong>ShelfSight</strong><small>RETAIL INTELLIGENCE</small></span></Link>
        <div className="auth-story"><p className="landing-kicker">A CLEARER STORE ROUTINE</p><h1>From shelf<br /><em>to next step.</em></h1><p>Bring store teams and shelf insights into one focused workspace.</p></div>
        <span className="auth-visual-index">SHELFSIGHT / 02</span>
      </aside>
      <main className="auth-panel">
        <div className="auth-panel-inner auth-panel-wide">
          <p className="auth-eyebrow">GET STARTED</p>
          <h2>Create your account</h2>
          <p className="auth-subtitle">Set up your ShelfSight workspace.</p>
          <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form register-form">
            <label className="auth-field auth-field-span">Full name<input autoComplete="name" {...form.register('fullName')} className="auth-input" />{form.formState.errors.fullName && <span className="field-error">{form.formState.errors.fullName.message}</span>}</label>
            <label className="auth-field auth-field-span">Email address<input type="email" autoComplete="email" {...form.register('email')} className="auth-input" />{form.formState.errors.email && <span className="field-error">{form.formState.errors.email.message}</span>}</label>
            <label className="auth-field">Password<input type="password" autoComplete="new-password" {...form.register('password')} className="auth-input" />{form.formState.errors.password && <span className="field-error">{form.formState.errors.password.message}</span>}</label>
            <label className="auth-field">Confirm password<input type="password" autoComplete="new-password" {...form.register('confirmPassword')} className="auth-input" />{form.formState.errors.confirmPassword && <span className="field-error">{form.formState.errors.confirmPassword.message}</span>}</label>
            <label className="auth-field auth-field-span">Role<select {...form.register('role')} className="auth-input auth-select"><option value="ADMIN">ADMIN</option><option value="MANAGER">MANAGER</option><option value="AUDITOR">AUDITOR</option></select></label>
            {form.formState.errors.root && <p className="auth-error auth-field-span" role="alert">{form.formState.errors.root.message}</p>}
            <button type="submit" className="auth-submit auth-field-span" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Creating account...' : 'Create account'} <ArrowRight size={17} /></button>
          </form>
          <p className="auth-switch">Already registered? <Link to="/login">Sign in <span aria-hidden="true">→</span></Link></p>
        </div>
      </main>
    </div>
  );
}
