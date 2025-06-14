import React, { useState, useEffect, useRef } from 'react';
import waterNotificationSound from '../assets/water_notification.mp3';
import './WaterReminderPanel.css';

interface WaterReminderPanelProps {
  onClose: () => void;
}

const WaterReminderPanel: React.FC<WaterReminderPanelProps> = ({ onClose }) => {
  const [reminderInterval, setReminderInterval] = useState<number>(() => {
    const saved = localStorage.getItem('waterReminderInterval');
    return saved ? parseInt(saved, 10) : 60;
  });
  const [isActive, setIsActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('waterReminderActive');
    return saved ? JSON.parse(saved) : true;
  });
  const [nextReminder, setNextReminder] = useState<Date | null>(null);
  const [waterCount, setWaterCount] = useState<number>(() => {
    const saved = localStorage.getItem('waterCount');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [waterGoal, setWaterGoal] = useState<number>(() => {
    const saved = localStorage.getItem('waterGoal');
    return saved ? parseInt(saved, 10) : 8;
  });
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audio.current = new Audio(waterNotificationSound);
  }, []);

  useEffect(() => {
    localStorage.setItem('waterReminderInterval', reminderInterval.toString());
  }, [reminderInterval]);

  useEffect(() => {
    localStorage.setItem('waterReminderActive', JSON.stringify(isActive));
  }, [isActive]);

  useEffect(() => {
    localStorage.setItem('waterCount', waterCount.toString());
  }, [waterCount]);

  useEffect(() => {
    localStorage.setItem('waterGoal', waterGoal.toString());
  }, [waterGoal]);

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
        if (isActive) {
          if (audio.current) {
            audio.current.play().catch(error => {
              console.error('Error playing notification sound:', error);
            });
          }
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('喝水提醒', {
              body: '该喝水啦！保持水分摄入很重要哦 💧',
              icon: '/water-icon.png'
            });
          }
          scheduleNextReminder();
        }
      }, reminderInterval * 60000);
    } else {
      setNextReminder(null);
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

  const handleIncrement = () => {
    setWaterCount(prev => prev + 1);
  };

  const handleDecrement = () => {
    setWaterCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="water-reminder-panel">
      <div className="water-reminder-header">
        <h2>喝水提醒</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="water-stats">
        <div className="water-count">
          <div className="count-controls">
            <button className="count-button" onClick={handleDecrement}>-</button>
            <span className="count-number">{waterCount}</span>
            <button className="count-button" onClick={handleIncrement}>+</button>
          </div>
          <span className="count-label">今日饮水量</span>
          <div className="water-goal">
            <span>目标：</span>
            <div className="goal-controls">
              <button 
                onClick={() => setWaterGoal(prev => Math.max(1, prev - 1))}
                className="goal-button"
              >
                -
              </button>
              <span className="goal-value">{waterGoal}</span>
              <button 
                onClick={() => setWaterGoal(prev => prev + 1)}
                className="goal-button"
              >
                +
              </button>
            </div>
            <span>杯</span>
          </div>
        </div>
        <button className="water-drunk-button" onClick={handleIncrement}>
          赛博喝水 💧
        </button>
      </div>

      <div className="reminder-settings">
        <div className="interval-setting">
          <label>提醒间隔</label>
          <div className="interval-controls">
            <button 
              onClick={() => setReminderInterval(prev => {
                const newValue = Math.max(5, prev - 5);
                return Math.floor(newValue / 5) * 5;
              })}
              className="interval-button"
            >
              -
            </button>
            <span className="interval-value">{reminderInterval} 分钟</span>
            <button 
              onClick={() => setReminderInterval(prev => {
                const newValue = Math.min(180, prev + 5);
                return Math.floor(newValue / 5) * 5;
              })}
              className="interval-button"
            >
              +
            </button>
          </div>
        </div>

        <div className="active-setting">
          <label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            启用提醒
          </label>
        </div>
      </div>

      {nextReminder && (
        <div className="next-reminder">
          下次提醒时间：{nextReminder.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default WaterReminderPanel; 