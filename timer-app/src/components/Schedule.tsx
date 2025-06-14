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
            <button onClick={handleEditClick} className="edit-button">编辑日程</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Schedule; 