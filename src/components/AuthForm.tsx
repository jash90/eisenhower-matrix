import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { LogIn, UserPlus, KeyRound } from 'lucide-react';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isResetting) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccess('Check your email for the password reset link');
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-4">
        {isResetting ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
      </h2>
      {isResetting && (
        <p className="text-center text-gray-600 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        {!isResetting && <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full py-2 px-4 rounded-md text-white flex items-center justify-center gap-2',
            loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {loading ? (
            'Processing...'
          ) : isLogin ? (
            isResetting ? (
              <>
                <KeyRound size={18} />
                Send Reset Link
              </>
            ) : (
            <>
              <LogIn size={18} />
              Sign In
            </>
            )
          ) : (
            <>
              <UserPlus size={18} />
              Sign Up
            </>
          )}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600 space-y-2">
        {!isResetting && (
          <p>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccess(null);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        )}
        <p>
          {isResetting ? (
            <>
              Remember your password?{' '}
              <button
                onClick={() => {
                  setIsResetting(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Sign In
              </button>
            </>
          ) : (
            isLogin && (
              <button
                onClick={() => {
                  setIsResetting(true);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Forgot Password?
              </button>
            )
          )}
        </p>
      </div>
    </div>
  );
}