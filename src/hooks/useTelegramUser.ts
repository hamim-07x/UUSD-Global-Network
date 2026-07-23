import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

export interface TelegramUser {
  telegramId: string | null;
  firstName: string | null;
  username: string | null;
  photoUrl: string | null;
  startParam: string | null;
}

export function useTelegramUser() {
  const [user, setUser] = useState<TelegramUser>({
    telegramId: 'web_demo_user',
    firstName: 'Demo User',
    username: 'demo_user',
    photoUrl: null,
    startParam: null,
  });

  useEffect(() => {
    if (WebApp.initDataUnsafe?.user) {
      const tUser = WebApp.initDataUnsafe.user;
      setUser({
        telegramId: tUser.id.toString(),
        firstName: tUser.first_name || null,
        username: tUser.username || null,
        photoUrl: tUser.photo_url || null,
        startParam: WebApp.initDataUnsafe.start_param || null,
      });
    } else {
      // Mock start param for web testing
      const urlParams = new URLSearchParams(window.location.search);
      const start = urlParams.get('start');
      if (start) {
        setUser(prev => ({ ...prev, startParam: start }));
      }
    }
  }, []);

  return user;
}

