import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
// @ts-expect-error: No type definitions available for lunar-javascript
import { Lunar } from 'lunar-javascript';

interface Holiday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

interface CalendarEvent {
  date: string;
  label: string;
  isRecurring: boolean;
}

interface PaydaySettings {
  type: 'monthly' | 'weekly' | 'bi-weekly';
  dayOfMonth?: number;
  dayOfWeek?: number;
  biWeeklyReferenceDate?: string;
}

interface ChineseHoliday {
  name: string;
  type: 'Chinese';
  isLunar: boolean;
  month: number;
  day: number;
  isFixed: boolean;
  getDate: (year: number) => Date;
}

interface CalendarDisplayProps {
  onOpenSettings: () => void;
}

const chineseHolidays: ChineseHoliday[] = [
  {
    name: "国际劳动妇女节",
    type: 'Chinese',
    isLunar: false,
    month: 3,
    day: 8,
    isFixed: true,
    getDate: (year) => new Date(year, 2, 8)
  },
  {
    name: "植树节",
    type: 'Chinese',
    isLunar: false,
    month: 3,
    day: 12,
    isFixed: true,
    getDate: (year) => new Date(year, 2, 12)
  },
  {
    name: "愚人节",
    type: 'Chinese',
    isLunar: false,
    month: 4,
    day: 1,
    isFixed: true,
    getDate: (year) => new Date(year, 3, 1)
  },
  {
    name: "儿童节",
    type: 'Chinese',
    isLunar: false,
    month: 6,
    day: 1,
    isFixed: true,
    getDate: (year) => new Date(year, 5, 1)
  },
  {
    name: "教师节",
    type: 'Chinese',
    isLunar: false,
    month: 9,
    day: 10,
    isFixed: true,
    getDate: (year) => new Date(year, 8, 10)
  },
  {
    name: "元宵节",
    type: 'Chinese',
    isLunar: true,
    month: 1,
    day: 15,
    isFixed: false,
    getDate: (year) => {
      const lunar = Lunar.fromYmd(year, 1, 15);
      return new Date(lunar.getSolar().getYear(), lunar.getSolar().getMonth() - 1, lunar.getSolar().getDay());
    }
  },
  {
    name: "腊八节",
    type: 'Chinese',
    isLunar: true,
    month: 12,
    day: 8,
    isFixed: false,
    getDate: (year) => {
      const lunar = Lunar.fromYmd(year, 12, 8);
      return new Date(lunar.getSolar().getYear(), lunar.getSolar().getMonth() - 1, lunar.getSolar().getDay());
    }
  },
  {
    name: "中元节",
    type: 'Chinese',
    isLunar: true,
    month: 7,
    day: 15,
    isFixed: false,
    getDate: (year) => {
      const lunar = Lunar.fromYmd(year, 7, 15);
      return new Date(lunar.getSolar().getYear(), lunar.getSolar().getMonth() - 1, lunar.getSolar().getDay());
    }
  },
  {
    name: "重阳节",
    type: 'Chinese',
    isLunar: true,
    month: 9,
    day: 9,
    isFixed: false,
    getDate: (year) => {
      const lunar = Lunar.fromYmd(year, 9, 9);
      return new Date(lunar.getSolar().getYear(), lunar.getSolar().getMonth() - 1, lunar.getSolar().getDay());
    }
  }
];

// 计算母亲节（5月的第二个星期日）
const getMotherDay = (year: number) => {
  const date = new Date(year, 4, 1);
  const day = date.getDay();
  const diff = day === 0 ? 7 : day;
  date.setDate(1 + (7 - diff) + 7);
  return date;
};

// 计算父亲节（6月的第三个星期日）
const getFatherDay = (year: number) => {
  const date = new Date(year, 5, 1);
  const day = date.getDay();
  const diff = day === 0 ? 7 : day;
  date.setDate(1 + (7 - diff) + 14);
  return date;
};

// 计算情人节（2月14日）
const getValentineDay = (year: number) => {
  return new Date(year, 1, 14);
};

// Calculate Easter Sunday using Meeus/Jones/Butcher algorithm
const calculateEasterSunday = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

// Check if it's an inauguration year (every 4 years)
const isInaugurationYear = (year: number): boolean => {
  return year % 4 === 1;
};

const CalendarDisplay: React.FC<CalendarDisplayProps> = ({ onOpenSettings }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [events] = useState<CalendarEvent[]>(() => {
    const savedEvents = localStorage.getItem('events');
    return savedEvents ? JSON.parse(savedEvents) : [
      { date: '2024-06-07', label: '高考纪念日', isRecurring: false },
      { date: '2024-06-05', label: '妈妈生日', isRecurring: true },
    ];
  });
  const [paydaySettings] = useState<PaydaySettings>(() => {
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
  const calendarRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // 只在秒数变化时更新状态
      if (now.getSeconds() !== currentDateTime.getSeconds()) {
        setCurrentDateTime(now);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentDateTime]);

  useEffect(() => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '99999';
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      document.body.removeChild(container);
    };
  }, []);

  // Fetch holidays
  useEffect(() => {
    const year = new Date().getFullYear();
    const fetchHolidays = async () => {
      const [cnRes, usRes] = await Promise.all([
        fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/CN`),
        fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`)
      ]);
      const [cnHolidays, usHolidays] = await Promise.all([cnRes.json(), usRes.json()]);
      // Add countryCode to each for distinction
      const allHolidays = [
        ...cnHolidays.map((h: any) => ({ ...h, countryCode: 'CN' })),
        ...usHolidays.map((h: any) => ({ ...h, countryCode: 'US' }))
      ];
      setHolidays(allHolidays);
    };
    fetchHolidays();
  }, []);

  const calculatePaydayCountdown = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (paydaySettings.type === 'monthly' && paydaySettings.dayOfMonth) {
      const targetDate = new Date(today.getFullYear(), today.getMonth(), paydaySettings.dayOfMonth);
      if (targetDate.getTime() < today.getTime()) {
        targetDate.setMonth(targetDate.getMonth() + 1);
      }
      const diffTime = targetDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    if (paydaySettings.type === 'weekly' && paydaySettings.dayOfWeek !== undefined) {
      const targetDate = new Date(today);
      const daysUntilPayday = (paydaySettings.dayOfWeek - today.getDay() + 7) % 7;
      targetDate.setDate(today.getDate() + daysUntilPayday);
      const diffTime = targetDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    if (paydaySettings.type === 'bi-weekly' && paydaySettings.biWeeklyReferenceDate) {
      const referenceDate = new Date(paydaySettings.biWeeklyReferenceDate);
      referenceDate.setHours(0, 0, 0, 0);

      const diffTime = referenceDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        return diffDays;
      }

      const nextPayday = new Date(referenceDate);
      nextPayday.setDate(referenceDate.getDate() + 14);
      const nextDiffTime = nextPayday.getTime() - today.getTime();
      return Math.ceil(nextDiffTime / (1000 * 60 * 60 * 24));
    }

    return null;
  };

  const paydayCountdown = calculatePaydayCountdown();

  const formatDate = (date: Date) => {
    const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
    return dateFormatter.format(date);
  };

  const formatTime = (date: Date) => {
    const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return timeFormatter.format(date);
  };

  const calculateLunarDate = () => {
    const lunar = Lunar.fromDate(currentDateTime);
    const lunarMonth = lunar.getMonthInChinese();
    const lunarDay = lunar.getDayInChinese();
    return `农历${lunarMonth}月${lunarDay}`;
  };

  const lunarCalendarInfo = calculateLunarDate();
  const gaokaoCountdown = 8;

  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = [];

    for (const event of events) {
      const eventDate = new Date(event.date);
      const targetDate = new Date(eventDate);

      if (event.isRecurring) {
        targetDate.setFullYear(today.getFullYear());
        if (targetDate.getTime() < today.getTime()) {
          targetDate.setFullYear(today.getFullYear() + 1);
        }
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

  const handleDateClick = () => {
    setShowCalendar(!showCalendar);
  };

  const handleDateSelect = (value: Date | Date[] | null) => {
    if (value instanceof Date) {
      setSelectedDate(value);
      // Get lunar info
      const lunar = Lunar.fromDate(value);
      const lunarYear = lunar.getYearInGanZhi();
      const lunarMonth = lunar.getMonthInChinese();
      const lunarDay = lunar.getDayInChinese();
      const lunarStr = `${lunarYear}年-${lunarMonth}月${lunarDay}`;
      
      // Get holidays
      const holidaysForDate = getHolidaysForDate(value);
      const holidayStr = holidaysForDate.length > 0 
        ? holidaysForDate
            .map(h => `${h.name}${h.type === 'US' ? ' (US)' : h.type === 'SolarTerm' ? ' (节气)' : ''}`)
            .join('\n')
        : '无节日';
      
      const tooltip = `${lunarStr}\n${holidayStr}`;

      // Remove any existing tooltips
      const existingTooltips = document.getElementsByClassName('custom-tooltip');
      while (existingTooltips.length > 0) {
        existingTooltips[0].parentNode?.removeChild(existingTooltips[0]);
      }

      // Create new tooltip
      const customTooltip = document.createElement('div');
      customTooltip.className = 'custom-tooltip';
      customTooltip.textContent = tooltip;
      
      // Calculate position
      const padding = 10;
      const tooltipWidth = 180;
      const tooltipHeight = 40 + (holidaysForDate.length > 0 ? (holidaysForDate.length - 1) * 20 : 0);
      
      // Get the clicked element's position
      const clickedElement = document.querySelector('.react-calendar__tile--active');
      if (clickedElement) {
        const rect = clickedElement.getBoundingClientRect();
        let left = rect.left + window.scrollX + padding;
        let top = rect.bottom + window.scrollY + padding;
        
        if (window.innerHeight - rect.bottom < tooltipHeight + padding * 2) {
          top = rect.top + window.scrollY - tooltipHeight - padding;
        }
        if (window.innerWidth - rect.left < tooltipWidth + padding * 2) {
          left = rect.left + window.scrollX - tooltipWidth - padding;
        }
        
        customTooltip.style.left = `${Math.max(left, 0)}px`;
        customTooltip.style.top = `${Math.max(top, 0)}px`;
      }
      
      customTooltip.style.zIndex = '999999';
      customTooltip.style.width = tooltipWidth + 'px';
      customTooltip.style.maxWidth = '90vw';
      customTooltip.style.textAlign = 'center';
      customTooltip.style.whiteSpace = 'pre-line';
      
      document.body.appendChild(customTooltip);
      
      // Remove tooltip after 800ms
      setTimeout(() => {
        if (customTooltip.parentNode) {
          customTooltip.parentNode.removeChild(customTooltip);
        }
      }, 800);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  const renderCalendar = () => {
    if (!showCalendar || !portalContainer) return null;

    const calendarContent = (
      <div 
        className="calendar-popup" 
        ref={calendarRef}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto',
          zIndex: 100000
        }}
      >
        <Calendar
          onChange={handleDateSelect}
          value={selectedDate}
          locale="zh-CN"
          className="react-calendar"
          formatDay={(locale, date) => date.getDate().toString()}
          tileClassName={tileClassName}
          tileContent={tileContent}
          onClickDecade={undefined}
          onClickMonth={undefined}
          onClickYear={undefined}
          onDrillUp={undefined}
          onDrillDown={undefined}
        />
      </div>
    );

    return createPortal(calendarContent, portalContainer);
  };

  const tileClassName = ({ date }: { date: Date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const holidaysForDate = holidays.filter(h => h.date === dateStr);
    let classes = [];
    if (holidaysForDate.some(h => h.countryCode === 'CN')) classes.push('circle-cn');
    if (holidaysForDate.some(h => h.countryCode === 'US')) classes.push('circle-us');
    if (holidaysForDate.length > 0) classes.push('has-holiday-tooltip');
    return classes.length > 0 ? classes.join(' ') : null;
  };

  const getHolidaysForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // 获取农历信息
    const lunar = Lunar.fromDate(date);
    const solarTerm = lunar.getJieQi();
    
    // 检查固定节日
    const fixedHolidays = chineseHolidays.filter(h => 
      h.isFixed && h.month === month && h.day === day
    );

    // 检查农历节日
    const lunarHolidays = chineseHolidays.filter(h => 
      !h.isFixed && h.getDate(year).toISOString().split('T')[0] === dateStr
    );

    // 检查母亲节
    const motherDay = getMotherDay(year);
    const isMotherDay = motherDay.toISOString().split('T')[0] === dateStr;

    // 检查父亲节
    const fatherDay = getFatherDay(year);
    const isFatherDay = fatherDay.toISOString().split('T')[0] === dateStr;

    // 检查情人节
    const valentineDay = getValentineDay(year);
    const isValentineDay = valentineDay.toISOString().split('T')[0] === dateStr;

    // 检查万圣节
    const isHalloween = month === 10 && day === 31;

    // 检查复活节
    const easterSunday = calculateEasterSunday(year);
    const isEasterSunday = easterSunday.toISOString().split('T')[0] === dateStr;

    // 检查就职日
    const isInauguration = isInaugurationYear(year) && month === 1 && day === 20;

    // 获取API节日
    const apiHolidays = holidays.filter(h => h.date === dateStr);

    // 合并所有节日信息
    const allHolidays = [
      ...fixedHolidays.map(h => ({ name: h.name, type: 'Chinese' })),
      ...lunarHolidays.map(h => ({ name: h.name, type: 'Chinese' })),
      ...(isMotherDay ? [{ name: '母亲节', type: 'Chinese' }] : []),
      ...(isFatherDay ? [{ name: '父亲节', type: 'Chinese' }] : []),
      ...(isValentineDay ? [{ name: '情人节', type: 'Chinese' }] : []),
      ...(isHalloween ? [{ name: 'Halloween', type: 'US' }] : []),
      ...(isEasterSunday ? [{ name: 'Easter Sunday', type: 'US' }] : []),
      ...(isInauguration ? [{ name: 'Inauguration Day', type: 'US' }] : []),
      ...(solarTerm ? [{ name: solarTerm, type: 'SolarTerm' }] : []),
      ...apiHolidays.map(h => ({ 
        name: h.localName, 
        type: h.countryCode === 'CN' ? 'Chinese' : 'US' 
      }))
    ];

    return allHolidays;
  };

  const tileContent = ({ date }: { date: Date }) => {
    const holidaysForDate = getHolidaysForDate(date);
    
    return (
      <div className="holiday-circles">
        {holidaysForDate.some(h => h.type === 'Chinese') && <span className="holiday-circle cn"></span>}
        {holidaysForDate.some(h => h.type === 'US') && <span className="holiday-circle us"></span>}
        {holidaysForDate.some(h => h.type === 'SolarTerm') && <span className="holiday-circle solar"></span>}
      </div>
    );
  };

  return (
    <div className="glass-panel date-time-panel">
      <div 
        className="date-display" 
        onClick={handleDateClick} 
        style={{ cursor: 'pointer' }}
      >
        {formatDate(currentDateTime)}
        <br />
        {lunarCalendarInfo}
      </div>
      {renderCalendar()}


      <div className="time-display">
        {formatTime(currentDateTime)}
        <div className="countdown-text">
          距离高考还有<span className="countdown-days">{gaokaoCountdown}天</span>
        </div>
      </div>
            <div className="countdown">
        {paydayCountdown !== null && (
          <div className="payday-countdown-text">
            距离发工资还有
            <span className="payday-countdown-days">{paydayCountdown}天 💸</span>
          </div>
        )}
      </div>
      <div className="anniversary">
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
      <div className="schedule-buttons">
        <button className="edit-button" onClick={onOpenSettings}>
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
    </div>
  );
};

export default CalendarDisplay; 