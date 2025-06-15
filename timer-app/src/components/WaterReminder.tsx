import React from 'react';

interface WaterReminderProps {
  reminderInterval: number;
  isActive: boolean;
  onClose: () => void;
}

const WaterReminder: React.FC<WaterReminderProps> = ({
  reminderInterval,
  isActive,
  onClose
}) => {
  return (
    <div className="water-reminder">
      <h3>喝水提醒</h3>
      <p>提醒间隔: {reminderInterval} 分钟</p>
      <p>状态: {isActive ? '开启' : '关闭'}</p>
      <button onClick={onClose}>关闭</button>
    </div>
  );
};

export default WaterReminder; 