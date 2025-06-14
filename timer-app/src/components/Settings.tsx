import React, { useState, useEffect } from 'react';
import './Settings.css';

interface EventItem {
  date: string;
  label: string;
  isRecurring: boolean;
}

interface PaydaySettings {
  type: 'monthly' | 'weekly' | 'bi-weekly';
  dayOfMonth?: number; // Optional number property
  dayOfWeek?: number;   // Optional number property
  biWeeklyReferenceDate?: string; // New: Reference date for bi-weekly pay
}

interface SettingsProps {
  onClose: () => void;
  activeTab?: 'anniversary' | 'payday' | 'water';
}

const Settings: React.FC<SettingsProps> = ({ onClose, activeTab = 'anniversary' }) => {
  const [events, setEvents] = useState<EventItem[]>(() => {
    const savedEvents = localStorage.getItem('events');
    return savedEvents ? JSON.parse(savedEvents) : [
      { date: '2024-06-07', label: '高考纪念日', isRecurring: false },
      { date: '2024-06-05', label: '妈妈生日', isRecurring: true },
    ];
  });
  const [newEvent, setNewEvent] = useState<EventItem>({ date: '', label: '', isRecurring: true });
  const [newDate, setNewDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [paydaySettings, setPaydaySettings] = useState<PaydaySettings>(() => {
    const savedSettings = localStorage.getItem('paydaySettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      return {
        type: parsed.type || 'monthly',
        dayOfMonth: typeof parsed.dayOfMonth === 'number' && !isNaN(parsed.dayOfMonth) ? parsed.dayOfMonth : undefined,
        dayOfWeek: typeof parsed.dayOfWeek === 'number' && !isNaN(parsed.dayOfWeek) ? parsed.dayOfWeek : undefined,
        biWeeklyReferenceDate: parsed.biWeeklyReferenceDate || undefined,
      };
    }
    return {
      type: 'monthly',
      dayOfMonth: undefined,
      dayOfWeek: undefined,
      biWeeklyReferenceDate: undefined,
    };
  });
  const [currentTab, setCurrentTab] = useState<'anniversary' | 'payday' | 'water'>(activeTab);
  const [waterReminderInterval, setWaterReminderInterval] = useState<number>(() => {
    const saved = localStorage.getItem('waterReminderInterval');
    return saved ? parseInt(saved, 10) : 60;
  });
  const [waterReminderActive, setWaterReminderActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('waterReminderActive');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  // Add ESC key handler
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const validateDate = (dateString: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      setDateError('日期格式不正确，请使用 YYYY-MM-DD 格式。');
      return false;
    }

    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    const date = new Date(year, month - 1, day); // Month is 0-indexed in Date object

    // Check if the date components match the original input after Date object creation
    // This correctly handles invalid days (e.g., Feb 30th) which would roll over to the next month
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
      setDateError('日期无效，请检查月份和天数。');
      return false;
    }

    setDateError('');
    return true;
  };

  const addEvent = () => {
    if (!newEvent.label.trim() || !newDate.trim()) {
      alert('纪念日名称和日期都不能为空！');
      return;
    }
    if (!validateDate(newDate)) {
      return;
    }

    const updatedEvents = [...events];
    if (editingIndex !== null) {
      updatedEvents[editingIndex] = { date: newDate, label: newEvent.label, isRecurring: newEvent.isRecurring };
      setEditingIndex(null);
    } else {
      updatedEvents.push({ date: newDate, label: newEvent.label, isRecurring: newEvent.isRecurring });
    }

    setEvents(updatedEvents);
    localStorage.setItem('events', JSON.stringify(updatedEvents));
    setNewEvent({ date: '', label: '', isRecurring: true });
    setNewDate('');
  };

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    const eventToEdit = events[index];
    setNewEvent({ label: eventToEdit.label, date: eventToEdit.date, isRecurring: eventToEdit.isRecurring });
    setNewDate(eventToEdit.date);
    setDateError('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setNewEvent({ date: '', label: '', isRecurring: true });
    setNewDate('');
    setDateError('');
  };

  const savePaydaySettings = () => {
    if (paydaySettings.type === 'monthly') {
      if (paydaySettings.dayOfMonth === undefined || isNaN(paydaySettings.dayOfMonth) || paydaySettings.dayOfMonth < 1 || paydaySettings.dayOfMonth > 31) {
        alert('请设置有效的每月发工资日期 (1-31)。');
        return;
      }
    } else if (paydaySettings.type === 'weekly') {
      if (paydaySettings.dayOfWeek === undefined || isNaN(paydaySettings.dayOfWeek) || paydaySettings.dayOfWeek < 0 || paydaySettings.dayOfWeek > 6) {
        alert('请设置有效的每周发工资日 (星期日为0，星期一为1)。');
        return;
      }
    } else if (paydaySettings.type === 'bi-weekly') {
      if (!paydaySettings.biWeeklyReferenceDate || !validateDate(paydaySettings.biWeeklyReferenceDate)) {
        alert('请设置有效的每两周发工资基准日期 (YYYY-MM-DD)。');
        return;
      }
      if (paydaySettings.dayOfWeek === undefined || isNaN(paydaySettings.dayOfWeek) || paydaySettings.dayOfWeek < 0 || paydaySettings.dayOfWeek > 6) {
        alert('请设置有效的每两周发工资日 (星期日为0，星期一为1)。');
        return;
      }
    }
    console.log('Saving payday settings:', paydaySettings);
    localStorage.setItem('paydaySettings', JSON.stringify(paydaySettings));
    alert('发工资设置已保存！');
  };

  return (
    <div className="settings-panel glass-panel">
      <div className="settings-layout">
        <div className="settings-tabs">
          <button
            className={`settings-tab ${currentTab === 'anniversary' ? 'active' : ''}`}
            onClick={() => setCurrentTab('anniversary')}
          >
            纪念日
          </button>
          <button
            className={`settings-tab ${currentTab === 'payday' ? 'active' : ''}`}
            onClick={() => setCurrentTab('payday')}
          >
            工资设置
          </button>
        </div>
        <div className="settings-content">
          {currentTab === 'anniversary' && (
            <>
              <h2 className="panel-title">纪念日设置</h2>
              <div className="event-list">
                {events.map((event, idx) => (
                  <div className="event-item" key={idx}>
                    <span>{event.label} ({event.date}) {event.isRecurring ? '(每年)' : '(单次)'}</span>
                    <div className="event-actions">
                      <button className="edit-event-btn" onClick={() => startEdit(idx)} title="编辑">编辑</button>
                      <button className="delete-event" onClick={() => removeEvent(idx)} title="删除" aria-label="删除">
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="add-event-section">
                <input
                  type="text"
                  placeholder="纪念日名称"
                  value={newEvent.label}
                  onChange={e => setNewEvent({ ...newEvent, label: e.target.value })}
                  className="add-event-input"
                />
                <input
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={newDate}
                  onChange={e => {
                    setNewDate(e.target.value);
                    validateDate(e.target.value);
                  }}
                  className="add-event-input"
                />
                <label className="recurring-option">
                  <input
                    type="checkbox"
                    checked={newEvent.isRecurring}
                    onChange={e => setNewEvent({ ...newEvent, isRecurring: e.target.checked })}
                  />
                  每年重复
                </label>
                {editingIndex !== null && (
                  <button onClick={cancelEdit} className="cancel-edit-button">取消</button>
                )}
                <button onClick={addEvent} className="add-event-button">
                  {editingIndex !== null ? '保存' : '+'}
                </button>
              </div>
              {dateError && <p style={{ color: '#ff4d4f', fontSize: '0.8em', marginTop: '5px' }}>{dateError}</p>}
            </>
          )}
          {currentTab === 'payday' && (
            <>
              <h2 className="panel-title">发工资设置</h2>
              <div className="payday-settings-section">
                <div className="payday-frequency">
                  <label>
                    <input
                      type="radio"
                      name="paydayType"
                      value="monthly"
                      checked={paydaySettings.type === 'monthly'}
                      onChange={e => setPaydaySettings({ ...paydaySettings, type: e.target.value as 'monthly' | 'weekly' | 'bi-weekly', dayOfWeek: undefined, biWeeklyReferenceDate: undefined })}
                    />
                    每月
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="paydayType"
                      value="weekly"
                      checked={paydaySettings.type === 'weekly'}
                      onChange={e => setPaydaySettings({ ...paydaySettings, type: e.target.value as 'monthly' | 'weekly' | 'bi-weekly', dayOfMonth: undefined, biWeeklyReferenceDate: undefined })}
                    />
                    每周
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="paydayType"
                      value="bi-weekly"
                      checked={paydaySettings.type === 'bi-weekly'}
                      onChange={e => setPaydaySettings({ ...paydaySettings, type: e.target.value as 'monthly' | 'weekly' | 'bi-weekly', dayOfMonth: undefined })}
                    />
                    每两周
                  </label>
                </div>

                {paydaySettings.type === 'monthly' && (
                  <div className="payday-monthly-setting">
                    <label>每月：</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={paydaySettings.dayOfMonth !== undefined ? String(paydaySettings.dayOfMonth) : ''}
                      onChange={e => setPaydaySettings({ ...paydaySettings, dayOfMonth: parseInt(e.target.value, 10) || undefined })}
                    />
                    日
                    <button onClick={savePaydaySettings} className="save-payday-settings-button">✓</button>
                  </div>
                )}

                {(paydaySettings.type === 'weekly' || paydaySettings.type === 'bi-weekly') && (
                  <div className="payday-weekly-setting">
                    <label>{paydaySettings.type === 'weekly' ? '每周：' : '每两周：'}</label>
                    <select
                      value={paydaySettings.dayOfWeek !== undefined ? String(paydaySettings.dayOfWeek) : ''}
                      onChange={e => setPaydaySettings({ ...paydaySettings, dayOfWeek: parseInt(e.target.value, 10) || undefined })}
                    >
                      <option value="">选择星期</option>
                      <option value="1">星期一</option>
                      <option value="2">星期二</option>
                      <option value="3">星期三</option>
                      <option value="4">星期四</option>
                      <option value="5">星期五</option>
                      <option value="6">星期六</option>
                      <option value="0">星期日</option>
                    </select>
                    {paydaySettings.type === 'weekly' && (
                      <button onClick={savePaydaySettings} className="save-payday-settings-button">✓</button>
                    )}
                  </div>
                )}

                {paydaySettings.type === 'bi-weekly' && (
                  <div className="payday-bi-weekly-ref-date-setting">
                    <label>下次发工资：</label>
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={paydaySettings.biWeeklyReferenceDate || ''}
                      onChange={e => setPaydaySettings({ ...paydaySettings, biWeeklyReferenceDate: e.target.value })}
                      className="add-event-input"
                    />
                    <button onClick={savePaydaySettings} className="save-payday-settings-button">✓</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <button className="back-button" onClick={onClose}>返回</button>
    </div>
  );
};

export default Settings;
 