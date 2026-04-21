'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const [email, setEmail] = useState(process.env.NEXT_PUBLIC_DEFAULT_USER_EMAIL || '');
  const [password, setPassword] = useState(process.env.NEXT_PUBLIC_DEFAULT_USER_PASSWORD || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-container animate-fade-in-up">
        <div className="auth-card">
          <h1 className="auth-title" id="login-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your BlogVerse account</p>

          {error && <div className="alert alert-error" id="login-error">{error}</div>}

          <form onSubmit={handleSubmit} id="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
              id="btn-login-submit"
            >
              {loading ? (
                <><div className="spinner" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account?{' '}
            <Link href="/register">Create one</Link>
          </p>
        </div>
      </div>
    </>
  );
}
