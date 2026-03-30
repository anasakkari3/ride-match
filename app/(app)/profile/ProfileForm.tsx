'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { updateProfile } from './actions';

type Props = {
  userId: string;
  initialDisplayName: string;
  initialAvatarUrl: string;
};

export default function ProfileForm({ userId, initialDisplayName, initialAvatarUrl }: Props) {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      await updateProfile(userId, { displayName, avatarUrl });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed_to_save'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('display_name')}</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setSuccess(false); }}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('avatar_url')}</label>
        <input
          type="url"
          value={avatarUrl}
          onChange={(e) => { setAvatarUrl(e.target.value); setSuccess(false); }}
          placeholder="https://..."
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
        />
      </div>
      {success && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50 p-3">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">{t('profile_updated')}</p>
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 p-3">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-sky-600 dark:bg-sky-500 px-4 py-3 font-medium text-white hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 transition-colors btn-press"
      >
        {loading ? t('saving') : t('save')}
      </button>
    </form>
  );
}
