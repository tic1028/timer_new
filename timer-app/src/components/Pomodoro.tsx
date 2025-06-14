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
    <div className={`glass-panel timer-panel ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
      <div className="panel-inner">
        <div className="panel-front">
          <div className="timer-display">{formatTime(minutes)}:{formatTime(seconds)}</div>
          <div className="timer-controls">
            <button className="timer-button" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleCustomize(e); }}>自定义时间</button>
            <button className={`timer-button ${isActive ? 'pause-active' : 'primary'}`} onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); isActive ? handlePause(e) : handleStart(e); }}>
              {isActive ? '暂停' : '开始'}
            </button>
            <button className="timer-button" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleReset(e); }}>复位</button>
          </div>

          {showCustomization && (
            <div className="customization-inputs">
              <div>
                <label>工作时长（分钟）:</label>
                <input
                  type="number"
                  value={customWorkMinutes}
                  onChange={(e) => setCustomWorkMinutes(e.target.value === '' ? '' : parseInt(e.target.value))}
                  min="0"
                />
              </div>
              <div>
                <label>休息时长（分钟）:</label>
                <input
                  type="number"
                  value={customBreakMinutes}
                  onChange={(e) => setCustomBreakMinutes(e.target.value === '' ? '' : parseInt(e.target.value))}
                  min="0"
                />
              </div>
              <button className="timer-button primary" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleApplyCustomization(e); }}>应用</button>
            </div>
          )}
        </div>
        <div className="panel-back">
          <div className="sessions-completed">
            <p>已完成番茄钟</p>
            <h2>{sessionsCompleted}</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pomodoro; 