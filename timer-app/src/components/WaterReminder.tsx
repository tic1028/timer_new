import React, { useState, useEffect } from 'react';
import './WaterReminder.css';

interface WaterReminderProps {
  onClose: () => void;
}

const WaterReminder: React.FC<WaterReminderProps> = ({ onClose }) => {
  const [interval, setInterval] = useState(60); // Default 60 minutes
  const [isEnabled, setIsEnabled] = useState(true);
  const [nextReminder, setNextReminder] = useState<Date | null>(null);

  useEffect(() => {
    // Request notification permission on component mount
    if ('Notification' in window) {
      Notification.requestPermission();
    }

    // Set up the reminder interval
    let timer: number | undefined;
    if (isEnabled) {
      const scheduleNextReminder = () => {
        const now = new Date();
        const next = new Date(now.getTime() + interval * 60000);
        setNextReminder(next);
      };

      scheduleNextReminder();
      timer = window.setInterval(() => {
        showNotification();
        scheduleNextReminder();
      }, interval * 60000);
    }

    return () => {
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [interval, isEnabled]);

  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('喝水提醒 💧', {
        body: '该喝水啦！保持水分摄入对身体很重要哦～',
        icon: '/water-icon.png',
      });

      // Play sound
      const audio = new Audio('/water_notification.mp3');
      audio.play().catch(error => console.log('Error playing sound:', error));
    }
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 0) { // Allow any non-negative value
      setInterval(value);
    }
  };

  return (
    <div className="water-reminder-panel glass-panel">
      <div className="water-reminder-header">
        <h2>喝水提醒设置</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="water-reminder-content">
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
            />
            启用提醒
          </label>
        </div>

        <div className="setting-item">
          <label>提醒间隔（分钟）</label>
          <input
            type="number"
            min="0"
            value={interval}
            onChange={handleIntervalChange}
            disabled={!isEnabled}
          />
        </div>

        {nextReminder && (
          <div className="next-reminder">
            下次提醒时间：{nextReminder.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default WaterReminder; 