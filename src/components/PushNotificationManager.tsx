import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, BellOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState(Notification.permission);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
    });

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  const subscribeUser = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log('User is subscribed:', subscription);

      // Send subscription to backend
      await axios.post('/api/notifications/subscribe', {
        user_id: user.id,
        subscription: subscription
      });

      setIsSubscribed(true);
      setPermission('granted');
      alert('Notifications enabled successfully!');

    } catch (err) {
      console.error('Failed to subscribe the user: ', err);
      alert('Failed to enable notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-red-200/70 bg-red-50/70 px-3 py-1 text-xs font-medium text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
        <BellOff size={14} />
        Notificaciones bloqueadas
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/70 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200">
        <Bell size={14} />
        Notificaciones activas
      </div>
    );
  }

  return (
    <button
      onClick={subscribeUser}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800 disabled:opacity-60"
    >
      <Bell size={14} />
      {loading ? 'Activando...' : 'Activar avisos'}
    </button>
  );
}
