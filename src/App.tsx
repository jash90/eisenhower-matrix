import React from 'react';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { AuthForm } from './components/AuthForm';
import { ResetPassword } from './components/ResetPassword';
import { Matrix } from './components/Matrix';
import { LogOut, Settings, ArrowLeft } from 'lucide-react';
import { UserSettings } from './components/UserSettings';
import { useAnalytics } from './hooks/useAnalytics';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const handlePathChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  function navigate(path: string) {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    trackEvent('navigation', 'user_action', path);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {user ? (
        <>
          <header className="bg-white shadow sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentPath === '/settings' && (
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft size={20} />
                    Back
                  </button>
                )}
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentPath === '/settings' ? 'Settings' : 'Eisenhower Matrix'}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {currentPath !== '/settings' && (
                  <button
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <Settings size={18} />
                    Settings
                  </button>
                )}
                <button
                  onClick={() => {
                    trackEvent('auth', 'user_action', 'sign_out');
                    supabase.auth.signOut();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>
          </header>
          {currentPath === '/settings' ? (
            <UserSettings user={user} />
          ) : (
            <Matrix />
          )}
        </>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          {currentPath === '/reset-password' ? (
            <ResetPassword />
          ) : (
            <AuthForm />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
