import React, { useEffect, useRef } from 'react';
import notificationSound from '../assets/notification.mp3';

const WaterReminderService: React.FC = () => {
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audio.current = new Audio(notificationSound);
  }, []);

  useEffect(() => {
    const checkAndSetupReminder = () => {
      const interval = localStorage.getItem('waterReminderInterval');
      const isActive = localStorage.getItem('waterReminderActive');
      
      // If no settings exist, set default values
      if (!interval) {
        localStorage.setItem('waterReminderInterval', '60');
      }
      if (!isActive) {
        localStorage.setItem('waterReminderActive', 'true');
      }
    };

    checkAndSetupReminder();

    const setupReminder = () => {
      const interval = parseInt(localStorage.getItem('waterReminderInterval') || '60', 10);
      const isActive = localStorage.getItem('waterReminderActive') === 'true';

      if (isActive) {
        const reminderInterval = setInterval(() => {
          if (audio.current) {
            audio.current.play();
          }
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('喝水提醒', {
              body: '该喝水啦！保持水分摄入很重要哦 💧',
              icon: '/water-icon.png'
            });
          }
        }, interval * 60000);

        return () => clearInterval(reminderInterval);
      }
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    const cleanup = setupReminder();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return null; // This component doesn't render anything
};

export default WaterReminderService; 