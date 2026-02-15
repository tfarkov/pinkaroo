import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { RealtorTeamMember } from '../lib/types';
import { useAuth } from '../lib/hooks/useAuth';
import { API } from '../lib/constants';

interface ContactRealtorCardProps {
  realtor: RealtorTeamMember | null;
  isLoading?: boolean;
}

export default function ContactRealtorCard({ realtor, isLoading }: ContactRealtorCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const signInUrl = `/signin?callbackUrl=${encodeURIComponent(router.asPath)}`;
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  if (isLoading) {
    return <p className="text-slate-500 text-sm py-4">Loading…</p>;
  }
  if (!realtor) {
    return <p className="text-slate-500 text-sm py-2">No realtor available.</p>;
  }

  const displayName = realtor.name ?? '—';
  const initial =
    displayName !== '—' ? displayName.trim().charAt(0).toUpperCase() : '?';
  const firstName = realtor.name?.split(' ')[0] ?? 'Realtor';

  const handleSendMessage = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setMessageError(null);
    if (!realtor.id) return;
    if (!message.trim()) {
      setMessageError('Message is required.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(API.NOTIFICATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: realtor.id, message: message.trim() }),
        credentials: 'include',
      });
      if (res.ok) {
        setMessage('');
        setSent(true);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center mb-3">
        {realtor.image ? (
          <img
            src={realtor.image}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl font-bold text-slate-500" aria-hidden>
            {initial}
          </span>
        )}
      </div>
      <h3 className="font-bold text-slate-900">{displayName}</h3>
      <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">
        Realtor
      </p>
      {realtor.bio && (
        <p className="text-sm text-slate-600 mt-2 line-clamp-3">{realtor.bio}</p>
      )}
      <dl className="mt-3 w-full text-left space-y-1.5 text-sm">
        {realtor.email && (
          <div>
            <dt className="text-slate-500 font-medium">Email</dt>
            <dd>
              <a
                href={'mailto:' + realtor.email}
                className="text-accent-600 hover:underline break-all"
              >
                {realtor.email}
              </a>
            </dd>
          </div>
        )}
        {realtor.phone && (
          <div>
            <dt className="text-slate-500 font-medium">Phone</dt>
            <dd>
              <a
                href={'tel:' + realtor.phone.replace(/\D/g, '')}
                className="text-accent-600 hover:underline"
              >
                {realtor.phone}
              </a>
            </dd>
          </div>
        )}
        {realtor.availableHours && (
          <div>
            <dt className="text-slate-500 font-medium">Available</dt>
            <dd className="text-slate-700">{realtor.availableHours}</dd>
          </div>
        )}
      </dl>
      {isAuthenticated ? (
        <form onSubmit={handleSendMessage} className="mt-3 w-full text-left">
          <p className="text-xs text-slate-600 mb-2">Message in-app (they’ll see it in Notifications)</p>
          <label htmlFor="contact-realtor-message" className="sr-only">Message</label>
          <textarea
            id="contact-realtor-message"
            value={message}
            onChange={(e) => { setMessage(e.target.value); setMessageError(null); }}
            placeholder="Type your message..."
            rows={3}
            required
            aria-required="true"
            aria-invalid={!!messageError}
            aria-describedby={messageError ? 'contact-realtor-message-error' : undefined}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm mb-2"
          />
          {messageError && <p id="contact-realtor-message-error" className="text-red-600 text-sm mb-2" role="alert">{messageError}</p>}
          <button
            type="submit"
            disabled={sending}
            className="w-full py-2 rounded-md bg-accent-500 hover:bg-accent-600 text-white font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {sending ? 'Sending…' : sent ? 'Sent' : `Message ${firstName}`}
          </button>
        </form>
      ) : (
        <Link
          href={signInUrl}
          className="mt-3 inline-block w-full py-2 rounded-md bg-accent-500 hover:bg-accent-600 text-white font-semibold text-sm transition-colors text-center"
        >
          Contact {firstName}
        </Link>
      )}
    </div>
  );
}
