'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Navbar() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        setUser(profile);
      }
      setLoading(false);
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser(profile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo" id="navbar-logo">
          BlogVerse
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ul className="navbar-links">
            <li>
              <Link href="/" id="nav-home">Home</Link>
            </li>
            {!loading && user && (user.role === 'author' || user.role === 'admin') && (
              <li>
                <Link href="/dashboard" id="nav-dashboard">Dashboard</Link>
              </li>
            )}
          </ul>

          {loading ? (
            <div className="spinner" />
          ) : user ? (
            <div className="navbar-user">
              <span className="navbar-role">{user.role}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {user.name}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleSignOut}
                id="btn-signout"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link href="/login" className="btn btn-secondary btn-sm" id="btn-login">
                Sign In
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm" id="btn-register">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
