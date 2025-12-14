import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, BellOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
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
  const [user, setUser] = useState<any>(null);

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
      <div className="text-red-500 text-sm flex items-center gap-2">
        <BellOff size={16} />
        Notifications blocked
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="text-green-500 text-sm flex items-center gap-2">
        <Bell size={16} />
        Notifications on
      </div>
    );
  }

  return (
    <button
      onClick={subscribeUser}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm transition-colors"
    >
      <Bell size={16} />
      {loading ? 'Enabling...' : 'Enable Notifications'}
    </button>
  );
}
