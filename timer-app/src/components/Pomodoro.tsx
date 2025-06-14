import React, { useState, useEffect, useRef } from 'react';
import notificationSound from '../assets/notification.mp3'; // Import the sound file

interface PomodoroProps {}

const Pomodoro: React.FC<PomodoroProps> = () => {
  // Function to get initial state from localStorage or use default
  const getInitialState = <T,>(key: string, defaultValue: T): T => {
    const storedValue = localStorage.getItem(key);
    try {
      return storedValue ? JSON.parse(storedValue) as T : defaultValue;
    } catch (e) {
      console.error("Error parsing stored value for", key, e);
      return defaultValue;
    }
  };

  const [minutes, setMinutes] = useState<number>(() => getInitialState<number>('pomodoroMinutes', 50));
  const [seconds, setSeconds] = useState<number>(() => getInitialState<number>('pomodoroSeconds', 0));
  const [isActive, setIsActive] = useState<boolean>(() => getInitialState<boolean>('pomodoroIsActive', false));
  const [isBreak, setIsBreak] = useState<boolean>(() => getInitialState<boolean>('pomodoroIsBreak', false));
  const [customWorkMinutes, setCustomWorkMinutes] = useState<number | string>(() => getInitialState<number>('pomodoroCustomWorkMinutes', 50));
  const [customBreakMinutes, setCustomBreakMinutes] = useState<number | string>(() => getInitialState<number>('pomodoroCustomBreakMinutes', 10));
  const [showCustomization, setShowCustomization] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(() => getInitialState<number>('pomodoroSessionsCompleted', 0));
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  // Create an Audio object
  useEffect(() => {
    audio.current = new Audio(notificationSound);
  }, []);

  const playNotificationSound = () => {
    if (audio.current) {
      audio.current.play();
    }
  };

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pomodoroMinutes', JSON.stringify(minutes));
  }, [minutes]);

  useEffect(() => {
    localStorage.setItem('pomodoroSeconds', JSON.stringify(seconds));
  }, [seconds]);

  useEffect(() => {
    localStorage.setItem('pomodoroIsActive', JSON.stringify(isActive));
  }, [isActive]);

  useEffect(() => {
    localStorage.setItem('pomodoroIsBreak', JSON.stringify(isBreak));
  }, [isBreak]);

  useEffect(() => {
    localStorage.setItem('pomodoroCustomWorkMinutes', JSON.stringify(customWorkMinutes));
  }, [customWorkMinutes]);

  useEffect(() => {
    localStorage.setItem('pomodoroCustomBreakMinutes', JSON.stringify(customBreakMinutes));
  }, [customBreakMinutes]);

  useEffect(() => {
    localStorage.setItem('pomodoroSessionsCompleted', JSON.stringify(sessionsCompleted));
  }, [sessionsCompleted]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            clearInterval(interval!);
            setIsActive(false);
            playNotificationSound();
            if (isBreak) {
              // Break ends, switch to work
              setIsBreak(false);
              setMinutes(typeof customWorkMinutes === 'string' ? 50 : customWorkMinutes);
              setSeconds(0);
            } else {
              // Work ends, switch to break, increment session count
              setSessionsCompleted((prev) => prev + 1);
              setIsBreak(true);
              setMinutes(typeof customBreakMinutes === 'string' ? 10 : customBreakMinutes);
              setSeconds(0);
            }
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval!);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, minutes, seconds, isBreak, customWorkMinutes, customBreakMinutes, audio, sessionsCompleted]);

  const handleStart = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isActive) {
      setIsActive(true);
      const id = setInterval(() => {
        setSeconds(prev => {
          if (prev === 0) {
            if (minutes === 0) {
              clearInterval(id);
              setIsActive(false);
              playNotificationSound();
              return 0;
            }
            setMinutes(prev => prev - 1);
            return 59;
          }
          return prev - 1;
        });
      }, 1000);
      setIntervalId(id);
    }
    event.currentTarget.blur();
  };

  const handlePause = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isActive && intervalId) {
      clearInterval(intervalId);
      setIsActive(false);
    }
    event.currentTarget.blur();
  };

  const handleReset = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    setIsActive(false);
    setMinutes(typeof customWorkMinutes === 'string' ? 50 : customWorkMinutes);
    setSeconds(0);
    setSessionsCompleted(0);
    event.currentTarget.blur();
  };

  const handleFlip = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsFlipped(!isFlipped);
    event.currentTarget.blur();
  };

  const handleCustomize = (event: React.MouseEvent<HTMLButtonElement>) => {
    setShowCustomization(!showCustomization);
    event.currentTarget.blur();
  };

  const handleApplyCustomization = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCustomWorkMinutes(typeof customWorkMinutes === 'string' ? 50 : customWorkMinutes);
    setCustomBreakMinutes(typeof customBreakMinutes === 'string' ? 10 : customBreakMinutes);
    setIsActive(false);
    setIsBreak(false);
    setShowCustomization(false);
    event.currentTarget.blur();
  };

  const formatTime = (num: number) => num < 10 ? `0${num}` : num;

  return (
    <div 
      className={`pomodoro-container ${isActive ? 'active' : ''}`} 
      onClick={(e) => {
        // 如果设置面板打开，不触发翻页
        if (showCustomization) {
          e.stopPropagation();
          return;
        }
        // 如果计时器正在运行，不触发翻页
        if (isActive) {
          e.stopPropagation();
          return;
        }
        // 其他情况正常触发翻页
        handleFlip(e);
      }}
    >
      <div className="timer-display">{formatTime(minutes)}:{formatTime(seconds)}</div>
      <div className="timer-controls">
        <button 
          className="edit-button" 
          onClick={(e) => { 
            e.stopPropagation(); 
            handleCustomize(e); 
          }}
        >
          <svg 
            viewBox="0 0 24 24" 
            width="20" 
            height="20" 
            fill="currentColor"
          >
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
        </button>
        <button 
          className={`timer-button ${isActive ? 'pause-active' : 'primary'}`} 
          onClick={(e) => { 
            e.stopPropagation(); 
            isActive ? handlePause(e) : handleStart(e); 
          }}
        >
          {isActive ? '暂停' : '开始'}
        </button>
        <button className="timer-button" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleReset(e); }}>复位</button>
      </div>

      {showCustomization && (
        <div className="customization-inputs" onClick={(e) => e.stopPropagation()}>
          <div className="pomodoro-settings">
            <div className="setting-item">
              <label>工作时长（分钟）:</label>
              <input
                type="number"
                value={customWorkMinutes}
                onChange={(e) => setCustomWorkMinutes(e.target.value === '' ? '' : parseInt(e.target.value))}
                min="0"
              />
            </div>
            <div className="setting-item">
              <label>休息时长（分钟）:</label>
              <input
                type="number"
                value={customBreakMinutes}
                onChange={(e) => setCustomBreakMinutes(e.target.value === '' ? '' : parseInt(e.target.value))}
                min="0"
              />
            </div>
          </div>
          <button 
            className="timer-button primary" 
            onClick={(e) => { 
              e.stopPropagation(); 
              handleApplyCustomization(e); 
            }}
          >
            应用
          </button>
        </div>
      )}
    </div>
  );
};

export default Pomodoro; 