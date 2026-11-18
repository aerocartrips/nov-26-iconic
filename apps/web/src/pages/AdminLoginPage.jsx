import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const field =
  'w-full bg-[hsl(var(--background))] border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-gold transition-colors';

const AdminLoginPage = () => {
  const { login, isAdminAuthed, loading: authLoading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (isAdminAuthed) {
    return <Navigate to={from} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Sign In — Iconic Handicraft</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <section className="pt-32 md:pt-40 pb-20 bg-[hsl(var(--background))] min-h-[80vh]">
        <div className="mx-auto max-w-md px-6">
          <span className="text-gold tracking-[0.35em] uppercase text-xs block">Administration</span>
          <h1 className="font-display text-primary text-4xl md:text-5xl mt-4 mb-8">Admin Sign In</h1>

          <form onSubmit={submit} className="bg-white border border-border rounded-2xl p-7 space-y-4">
            <input
              required
              type="email"
              autoComplete="username"
              className={field}
              placeholder="Admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              required
              type="password"
              autoComplete="current-password"
              className={field}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="text-destructive text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-3.5 text-sm tracking-wide hover:bg-[hsl(133_23%_33%)] transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <ShieldCheck className="h-4 w-4" />
              Sign in
            </button>
          </form>
        </div>
      </section>
    </>
  );
};

export default AdminLoginPage;
