import React, { useState, useEffect } from 'react';

interface ScheduleItem {
  id: string;
  text: string;
}

const Schedule: React.FC = () => {
  const getInitialSchedule = (): ScheduleItem[] => {
    const storedSchedule = localStorage.getItem('dailySchedule');
    try {
      return storedSchedule ? JSON.parse(storedSchedule) : [
        { id: '1', text: '08:00-11:30 数学模拟考' },
        { id: '2', text: '15:00-15:30 英语听力训练' },
        { id: '3', text: '19:00-21:00 理综真题练习' },
      ];
    } catch (e) {
      console.error("Error parsing stored schedule:", e);
      return [
        { id: '1', text: '08:00-11:30 数学模拟考' },
        { id: '2', text: '15:00-15:30 英语听力训练' },
        { id: '3', text: '19:00-21:00 理综真题练习' },
      ];
    }
  };

  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(getInitialSchedule);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    localStorage.setItem('dailySchedule', JSON.stringify(scheduleItems));
  }, [scheduleItems]);

  const handleEditClick = () => {
    setEditText(scheduleItems.map(item => item.text).join('\n'));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const newItems = editText
      .split('\n')
      .filter(line => line.trim() !== '')
      .map((text, index) => ({
        id: Date.now().toString() + index,
        text: text.trim()
      }));
    setScheduleItems(newItems);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <div className="glass-panel schedule-panel">
      <div className="panel-title">今日安排</div>
      {isEditing ? (
        <div className="schedule-edit-mode">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="schedule-textarea"
            placeholder="每行输入一个日程"
          />
          <div className="schedule-edit-buttons">
            <button onClick={handleSaveEdit} className="save-button">保存</button>
            <button onClick={handleCancelEdit} className="cancel-button">取消</button>
          </div>
        </div>
      ) : (
        <>
          <ul className="schedule-list">
            {scheduleItems.map((item) => (
              <li key={item.id} className="schedule-item">
                <span className="schedule-text">{item.text}</span>
              </li>
            ))}
          </ul>
          <div className="schedule-buttons">
            <button onClick={handleEditClick} className="edit-button">
              <svg 
                viewBox="0 0 24 24" 
                width="20" 
                height="20" 
                fill="currentColor"
              >
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Schedule; 