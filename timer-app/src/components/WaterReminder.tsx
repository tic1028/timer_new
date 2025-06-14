import React, { useState, useEffect, useRef } from 'react';
import notificationSound from '../assets/notification.mp3';

interface WaterReminderProps {
  onOpenSettings: () => void;
}

const WaterReminder: React.FC<WaterReminderProps> = ({ onOpenSettings }) => {
  const [reminderInterval, setReminderInterval] = useState<number>(() => {
    const saved = localStorage.getItem('waterReminderInterval');
    return saved ? parseInt(saved, 10) : 60; // Default to 60 minutes
  });
  const [isActive, setIsActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('waterReminderActive');
    return saved ? JSON.parse(saved) : true; // Default to active
  });
  const [nextReminder, setNextReminder] = useState<Date | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audio.current = new Audio(notificationSound);
  }, []);

  useEffect(() => {
    localStorage.setItem('waterReminderInterval', reminderInterval.toString());
  }, [reminderInterval]);

  useEffect(() => {
    localStorage.setItem('waterReminderActive', JSON.stringify(isActive));
  }, [isActive]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isActive) {
      const scheduleNextReminder = () => {
        const now = new Date();
        const next = new Date(now.getTime() + reminderInterval * 60000);
        setNextReminder(next);
      };

      scheduleNextReminder();
      intervalId = setInterval(() => {
        if (audio.current) {
          audio.current.play();
        }
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('喝水提醒', {
            body: '该喝水啦！保持水分摄入很重要哦 💧',
            icon: '/water-icon.png'
          });
        }
        scheduleNextReminder();
      }, reminderInterval * 60000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isActive, reminderInterval]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="water-reminder">
      <div className="water-reminder-content">
        <div className="water-reminder-status">
          <span className="water-reminder-label">喝水提醒</span>
          <span className="water-reminder-interval">
            {reminderInterval} 分钟
          </span>
        </div>
        <button 
          className="water-reminder-settings-button"
          onClick={onOpenSettings}
        >
          设置
        </button>
      </div>
      {nextReminder && (
        <div className="next-reminder">
          下次提醒: {nextReminder.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default WaterReminder; 