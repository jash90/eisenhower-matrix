import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { createPortalSession } from '../lib/stripe';
import { cn } from '../lib/utils';
import { KeyRound, Mail, Clock, X, AlertTriangle, CreditCard, Check } from 'lucide-react';
import { SubscriptionPlans } from './SubscriptionPlans';
import { AdUnit } from './AdUnit';

interface UserSettingsProps {
  user: any;
}

export function UserSettings({ user }: UserSettingsProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error('Current password is incorrect');

      // Then update to the new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || newEmail === user.email) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;
      setSuccess('Email update confirmation sent. Please check your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;
      await supabase.auth.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }

  async function handleManageSubscription() {
    if (!user.stripe_customer_id) return;
    
    setLoading(true);
    setError(null);

    try {
      await createPortalSession(user.stripe_customer_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <AdUnit 
        slot="1234567890"
        className="mb-6 bg-white rounded-lg shadow-sm p-4"
      />
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 space-y-6">
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

          {/* Email Update Form */}
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Mail size={18} className="text-gray-500" />
              Email Address
            </h3>
            <div>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || newEmail === user.email}
              className={cn(
                'w-full py-2 px-4 rounded-md text-white flex items-center justify-center gap-2',
                (loading || newEmail === user.email)
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {loading ? (
                <>
                  <Clock className="animate-spin" size={18} />
                  Updating...
                </>
              ) : (
                'Update Email'
              )}
            </button>
          </form>

          {/* Password Update Form */}
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <KeyRound size={18} className="text-gray-500" />
              Change Password
            </h3>
            <div>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current Password"
                className="w-full px-3 py-2 border rounded-md mb-2"
                required
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full px-3 py-2 border rounded-md"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !currentPassword || !newPassword}
              className={cn(
                'w-full py-2 px-4 rounded-md text-white flex items-center justify-center gap-2',
                (loading || !currentPassword || !newPassword)
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {loading ? (
                <>
                  <Clock className="animate-spin" size={18} />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>

          {/* Subscription Section */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-gray-500" />
              Subscription
            </h3>
            
            {user.is_subscribed ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 font-medium">
                    <Check size={18} />
                    Active Subscription
                  </div>
                </div>
                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Manage Subscription
                </button>
              </div>
            ) : (
              <SubscriptionPlans userId={user.id} />
            )}
          </div>

          {/* Delete Account Section */}
          <div className="pt-6 border-t">
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="text-red-500 shrink-0" size={20} />
              <div>
                <h4 className="font-medium text-red-800 mb-1">Delete Account</h4>
                <p className="text-sm text-red-600 mb-3">
                  This action cannot be undone. All your data will be permanently removed.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}