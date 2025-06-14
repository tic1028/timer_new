import React, { useState, useEffect } from 'react';
import notificationSound from '../assets/notification.mp3'; // Import the sound file

const Pomodoro: React.FC = () => {
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

  const [minutes, setMinutes] = useState(() => getInitialState<number>('pomodoroMinutes', 50));
  const [seconds, setSeconds] = useState(() => getInitialState<number>('pomodoroSeconds', 0));
  const [isActive, setIsActive] = useState(() => getInitialState<boolean>('pomodoroIsActive', false));
  const [isBreak, setIsBreak] = useState(() => getInitialState<boolean>('pomodoroIsBreak', false));
  const [customWorkMinutes, setCustomWorkMinutes] = useState(() => getInitialState<number>('pomodoroCustomWorkMinutes', 50));
  const [customBreakMinutes, setCustomBreakMinutes] = useState(() => getInitialState<number>('pomodoroCustomBreakMinutes', 10));
  const [showCustomization, setShowCustomization] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(() => getInitialState<number>('pomodoroSessionsCompleted', 0));

  // Create an Audio object
  const audio = new Audio(notificationSound);

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
            audio.play(); // Play sound when timer ends
            if (isBreak) {
              // Break ends, switch to work
              setIsBreak(false);
              setMinutes(customWorkMinutes);
              setSeconds(0);
            } else {
              // Work ends, switch to break, increment session count
              setSessionsCompleted((prev) => prev + 1);
              setIsBreak(true);
              setMinutes(customBreakMinutes);
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

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsActive(!isActive);
    setTimeout(() => event.currentTarget.blur(), 0); // Remove focus from the button after click
  };

  const reset = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsActive(false);
    setIsBreak(false);
    setMinutes(customWorkMinutes);
    setSeconds(0);
    setTimeout(() => event.currentTarget.blur(), 0); // Remove focus from the button after click
  };

  const applyCustomTimes = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMinutes(customWorkMinutes);
    setSeconds(0);
    setIsActive(false);
    setIsBreak(false);
    setShowCustomization(false);
    setTimeout(() => event.currentTarget.blur(), 0); // Remove focus from the button after click
  };

  const handlePanelClick = () => {
    setIsFlipped(!isFlipped);
  };

  const formatTime = (num: number) => num < 10 ? `0${num}` : num;

  return (
    <div className={`glass-panel timer-panel ${isFlipped ? 'flipped' : ''}`} onClick={handlePanelClick}>
      <div className="panel-inner">
        <div className="panel-front">
          <div className="timer-display">{formatTime(minutes)}:{formatTime(seconds)}</div>
          <div className="timer-controls">
            <button className="timer-button" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); setShowCustomization(!showCustomization); }}>自定义时间</button>
            <button className={`timer-button ${isActive ? 'pause-active' : 'primary'}`} onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); toggle(e); }}>
              {isActive ? '暂停' : '开始'}
            </button>
            <button className="timer-button" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); reset(e); }}>复位</button>
          </div>

          {showCustomization && (
            <div className="customization-inputs" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
              <label>工作时长 (分钟):</label>
              <input
                type="number"
                value={customWorkMinutes}
                onChange={(e) => setCustomWorkMinutes(parseInt(e.target.value) || 0)}
                min="1"
              />
              <label>休息时长 (分钟):</label>
              <input
                type="number"
                value={customBreakMinutes}
                onChange={(e) => setCustomBreakMinutes(parseInt(e.target.value) || 0)}
                min="1"
              />
              <button className="timer-button primary" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); applyCustomTimes(e); }}>应用</button>
            </div>
          )}
        </div>
        <div className="panel-back">
          <div className="sessions-completed">
            <p>今天一共完成了</p>
            <h2>{sessionsCompleted} 个 Session</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pomodoro; 