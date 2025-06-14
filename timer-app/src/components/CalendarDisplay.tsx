import React, { useEffect, useState } from 'react';
// @ts-expect-error: No type definitions available for lunar-javascript
import { Lunar } from 'lunar-javascript';

interface CalendarEvent {
  date: string;
  label: string;
  isRecurring: boolean;
}

interface PaydaySettings {
  type: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  biWeeklyReferenceDate?: string;
}

interface CalendarDisplayProps {
  onOpenSettings: () => void;
}

const CalendarDisplay: React.FC<CalendarDisplayProps> = ({ onOpenSettings }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [events] = useState<CalendarEvent[]>(() => {
    const savedEvents = localStorage.getItem('events');
    return savedEvents ? JSON.parse(savedEvents) : [
      { date: '2024-06-07', label: '高考纪念日', isRecurring: false },
      { date: '2024-06-05', label: '妈妈生日', isRecurring: true },
    ];
  });
  const [paydaySettings, setPaydaySettings] = useState<PaydaySettings>(() => {
    const savedSettings = localStorage.getItem('paydaySettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      console.log('Loading payday settings from localStorage:', parsed);
      return {
        type: parsed.type || 'monthly',
        dayOfMonth: typeof parsed.dayOfMonth === 'number' && !isNaN(parsed.dayOfMonth) ? parsed.dayOfMonth : undefined,
        dayOfWeek: typeof parsed.dayOfWeek === 'number' && !isNaN(parsed.dayOfWeek) ? parsed.dayOfWeek : undefined,
        biWeeklyReferenceDate: parsed.biWeeklyReferenceDate || undefined,
      };
    }
    console.log('No saved payday settings found, using defaults');
    return {
      type: 'monthly',
      dayOfMonth: undefined,
      dayOfWeek: undefined,
      biWeeklyReferenceDate: undefined,
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load settings when component mounts or when localStorage changes (though not reactively monitored here)
    const savedSettings = localStorage.getItem('paydaySettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setPaydaySettings({
        type: parsed.type || 'monthly',
        dayOfMonth: typeof parsed.dayOfMonth === 'number' && !isNaN(parsed.dayOfMonth) ? parsed.dayOfMonth : undefined,
        dayOfWeek: typeof parsed.dayOfWeek === 'number' && !isNaN(parsed.dayOfWeek) ? parsed.dayOfWeek : undefined,
      });
    }
  }, []);

  const calculatePaydayCountdown = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nextPayday = null;

    if (paydaySettings.type === 'monthly') {
      if (paydaySettings.dayOfMonth === undefined) return null; // No day set

      const desiredDay = paydaySettings.dayOfMonth;
      let currentYear = today.getFullYear();
      let currentMonth = today.getMonth(); // 0-indexed

      // Try current month
      let candidatePayday = new Date(currentYear, currentMonth, desiredDay);
      // If setting the day rolled over to the next month, it means desiredDay was too large for currentMonth
      if (candidatePayday.getMonth() !== currentMonth) {
        candidatePayday = new Date(currentYear, currentMonth + 1, 0); // Last day of currentMonth
      }

      if (candidatePayday.getTime() < today.getTime()) {
        // If candidate is in the past, try next month
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        candidatePayday = new Date(currentYear, currentMonth, desiredDay);
        // Again, check for month rollover
        if (candidatePayday.getMonth() !== currentMonth) {
          candidatePayday = new Date(currentYear, currentMonth + 1, 0); // Last day of currentMonth (which is now next month's index)
        }
      }
      nextPayday = candidatePayday;

    } else if (paydaySettings.type === 'weekly' || paydaySettings.type === 'bi-weekly') {
      if (paydaySettings.dayOfWeek === undefined) return null; // No day of week set

      const currentDayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday...
      let daysToAdd = paydaySettings.dayOfWeek - currentDayOfWeek;

      if (daysToAdd < 0) {
        daysToAdd += 7; // Wrap around to next week
      }
      nextPayday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysToAdd);

      if (paydaySettings.type === 'bi-weekly') {
        // For bi-weekly, use a fixed reference date to ensure correct cycle
        // Example: Jan 1, 2024 was a Monday (dayOfWeek 1). If your bi-weekly cycle started on a different day/week, adjust referenceDate.
        const referenceDate = new Date('2024-01-01'); // Adjust this to a known start date of your bi-weekly cycle
        referenceDate.setHours(0,0,0,0);

        const diffDaysFromReference = Math.floor((nextPayday.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
        const weeksFromReference = Math.floor(diffDaysFromReference / 7);

        // If the calculated week is an odd week relative to the start of the cycle, add another 7 days
        if (weeksFromReference % 2 !== 0) {
          nextPayday.setDate(nextPayday.getDate() + 7);
        }
      }

      if (nextPayday.getTime() < today.getTime()) {
          // If the calculated payday for the current cycle is in the past, push to next cycle
          nextPayday.setDate(nextPayday.getDate() + 7); // Move to next week
          if (paydaySettings.type === 'bi-weekly') {
              nextPayday.setDate(nextPayday.getDate() + 7); // Move to next bi-week
          }
      }
    }

    if (nextPayday === null) return null; // If no valid payday calculated

    nextPayday.setHours(0, 0, 0, 0);
    const diffTime = nextPayday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const paydayCountdown = calculatePaydayCountdown();

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // Months are 0-indexed
    const day = date.getDate();
    const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    return `${year}年${month}月${day}日 星期${dayOfWeek}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    // const seconds = String(date.getSeconds()).padStart(2, '0'); // Removed seconds for cleaner display
    return `${hours}:${minutes}`;
  };

  // Function to calculate lunar date based on current date
  const calculateLunarDate = () => {
    const lunar = Lunar.fromDate(currentDateTime);
    const lunarMonth = lunar.getMonthInChinese();
    const lunarDay = lunar.getDayInChinese();
    return `农历${lunarMonth}月${lunarDay}`;
  };

  const lunarCalendarInfo = calculateLunarDate();
  const gaokaoCountdown = 8; // This will also need to be dynamically calculated if the user wants it.

  // Find all events within the next 7 days
  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = [];

    for (const event of events) {
      const eventDate = new Date(event.date);
      const targetDate = new Date(eventDate);

      if (event.isRecurring) {
        // For recurring events, set the year to current year
        targetDate.setFullYear(today.getFullYear());

        // If the event has already passed this year, set it to next year
        if (targetDate.getTime() < today.getTime()) {
          targetDate.setFullYear(today.getFullYear() + 1);
        }
      } else {
        // For non-recurring events, use the exact date from storage
        // No change needed, targetDate is already set from event.date
      }
      targetDate.setHours(0, 0, 0, 0);

      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 7) {
        result.push(
          <span key={event.label + event.date}>
            距离{event.label}还有
            <span className="event-countdown-days">{diffDays}天</span>
          </span>
        );
      }
    }
    return result;
  };

  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="glass-panel date-time-panel">
      <div className="date-display">
        {formatDate(currentDateTime)}
        <br />
        {lunarCalendarInfo}
      </div>
      <div className="time-display">
        {formatTime(currentDateTime)}
        <div className="countdown-text">
          距离高考还有<span className="countdown-days">{gaokaoCountdown}天</span>
        </div>
        {upcomingEvents.length > 0 && (
          <div className="event-reminder">
            {upcomingEvents.map((item, idx) => (
              <React.Fragment key={idx}>
                {item}
                {(idx % 2 === 1 && idx !== upcomingEvents.length - 1) ? <br /> : (idx !== upcomingEvents.length - 1 ? '，' : '')}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      {paydayCountdown !== null && (
        <div className="payday-countdown-text">
          距离发工资还有
          <span className="payday-countdown-days">{paydayCountdown}天 💸</span>
        </div>
      )}
      <div className="schedule-buttons" style={{ justifyContent: 'flex-start' }}>
        <div className="calendar-header">
          <button className="edit-button" onClick={onOpenSettings}>
            编辑日历
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarDisplay; 