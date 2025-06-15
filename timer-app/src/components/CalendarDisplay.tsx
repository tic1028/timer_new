
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
// @ts-ignore
import { Lunar } from 'lunar-javascript';
// @ts-ignore
import type { Value } from 'react-calendar/dist/cjs/shared/types';

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

// MODIFIED: This interface now also needs to be defined here
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
  events: CalendarEvent[];
  paydaySettings: PaydaySettings;
}

const usHolidayTranslations: { [key: string]: string } = {
  "New Year's Day": "元旦",
  "Martin Luther King, Jr. Day": "马丁路德金纪念日",
  "Washington's Birthday": "总统日",
  "Good Friday": "耶稣受难日",
  "Memorial Day": "阵亡将士纪念日",
  "Juneteenth": "六月节",
  "Independence Day": "独立日",
  "Labor Day": "劳动节",
  "Columbus Day": "哥伦布日",
  "Veterans Day": "退伍军人节",
  "Thanksgiving Day": "感恩节",
  "Christmas Day": "圣诞节",
  "Halloween": "万圣节",
  "Easter Sunday": "复活节",
  "Inauguration Day": "总统就职日",
};

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

// 获取用户时区
const getUserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const CalendarDisplay: React.FC<CalendarDisplayProps> = ({ onOpenSettings, events, paydaySettings }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  
  // Fixed: Initialize events state properly (removed localStorage since it's not available in artifacts)
  // const [events] = useState<CalendarEvent[]>([
  //   { date: '2024-06-07', label: '高考纪念日', isRecurring: false },
  //   { date: '2024-06-05', label: '妈妈生日', isRecurring: true },
  // ]);
  // const [events, setEvents] = useState<CalendarEvent[]>(() => {
  //   const savedEvents = localStorage.getItem('events');
  //   // If there are saved events, parse them. Otherwise, start with an empty array.
  //   return savedEvents ? JSON.parse(savedEvents) : [];
  // });

  // Fixed: Initialize payday settings properly (removed localStorage)
  // const [paydaySettings] = useState<PaydaySettings>({
  //   type: 'monthly',
  //   dayOfMonth: 15, // Default to 15th of month
  //   dayOfWeek: undefined,
  //   biWeeklyReferenceDate: undefined,
  // });

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showCalendar) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCalendar]);

  // Fetch holidays
  useEffect(() => {
    const year = new Date().getFullYear();
    const fetchHolidays = async () => {
      try {
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
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
      }
    };
    fetchHolidays();
  }, []);

  const calculatePaydayCountdown = () => {
    const userTimezone = getUserTimezone();
    const today = new Date();
    const startOfToday = new Date(today.toLocaleString('en-US', { timeZone: userTimezone }));
    startOfToday.setHours(0, 0, 0, 0);
    const msInDay = 1000 * 60 * 60 * 24;

    if (paydaySettings.type === 'monthly' && paydaySettings.dayOfMonth) {
      let paydayThisMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), paydaySettings.dayOfMonth);
      if (paydayThisMonth.getTime() < startOfToday.getTime()) {
        paydayThisMonth.setMonth(paydayThisMonth.getMonth() + 1);
      }
      return Math.round((paydayThisMonth.getTime() - startOfToday.getTime()) / msInDay);
    }

    if (paydaySettings.type === 'weekly' && paydaySettings.dayOfWeek !== undefined) {
      const daysUntilPayday = (paydaySettings.dayOfWeek - startOfToday.getDay() + 7) % 7;
      return daysUntilPayday;
    }

    if (paydaySettings.type === 'bi-weekly' && paydaySettings.biWeeklyReferenceDate) {
      const refDateParts = paydaySettings.biWeeklyReferenceDate.split('-').map(p => parseInt(p, 10));
      const referenceDate = new Date(refDateParts[0], refDateParts[1] - 1, refDateParts[2]);
      referenceDate.setHours(0, 0, 0, 0);

      if (referenceDate.getTime() >= startOfToday.getTime()) {
        return Math.round((referenceDate.getTime() - startOfToday.getTime()) / msInDay);
      }

      const msInCycle = 14 * msInDay;
      const timeDiffFromRef = startOfToday.getTime() - referenceDate.getTime();
      const remainder = timeDiffFromRef % msInCycle;
      const timeUntilNextPayday = (msInCycle - remainder) % msInCycle;
      return Math.round(timeUntilNextPayday / msInDay);
    }
    return null;
  };

  const paydayCountdown = calculatePaydayCountdown();

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日星期${weekday}`;
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

  const getNextHolidayCountdown = () => {
    const userTimezone = getUserTimezone();
    const today = new Date();
    
    // 使用用户时区创建今天的日期
    const todayInUserTZ = new Date(today.toLocaleString('en-US', { timeZone: userTimezone }));
    todayInUserTZ.setHours(0, 0, 0, 0);
    
    let nearestHoliday = null;
    
    // 检查未来365天内的节日
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(todayInUserTZ);
      checkDate.setDate(todayInUserTZ.getDate() + i);
      
      // 确保检查的日期也在用户时区
      const checkDateInUserTZ = new Date(checkDate.toLocaleString('en-US', { timeZone: userTimezone }));
      const holidaysForDate = getHolidaysForDate(checkDateInUserTZ);
      
      if (holidaysForDate.length > 0) {
        nearestHoliday = {
          name: holidaysForDate[0].localName,
          days: i
        };
        break;
      }
    }
    
    return nearestHoliday;
  };

  const getUpcomingEvents = () => {
    const userTimezone = getUserTimezone();
    const today = new Date();
    const todayInUserTZ = new Date(today.toLocaleString('en-US', { timeZone: userTimezone }));
    todayInUserTZ.setHours(0, 0, 0, 0);
  
    const upcoming = events.map(event => {
      // FIX: Robustly parse the 'YYYY-MM-DD' string to avoid timezone issues.
      const dateParts = event.date.split('-').map(p => parseInt(p, 10));
      const eventDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  
      const targetDate = new Date(eventDate); // Create a mutable copy
  
      if (event.isRecurring) {
        targetDate.setFullYear(todayInUserTZ.getFullYear());
        // If the recurring event for this year has already passed, set it to next year.
        if (targetDate.getTime() < todayInUserTZ.getTime()) {
          targetDate.setFullYear(todayInUserTZ.getFullYear() + 1);
        }
      } else {
        // If a non-recurring event is in the past, filter it out.
        if (targetDate.getTime() < todayInUserTZ.getTime()) {
          return null;
        }
      }
  
      targetDate.setHours(0, 0, 0, 0);
      const diffTime = targetDate.getTime() - todayInUserTZ.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
      return {
        event,
        diffDays
      };
    })
    .filter((item): item is { event: CalendarEvent; diffDays: number } => item !== null) // Filter out past non-recurring events
    .sort((a, b) => a.diffDays - b.diffDays);
  
    // Filter for events in the next 7 days and create the JSX elements
    const result: JSX.Element[] = [];
    for (const { event, diffDays } of upcoming) {
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

  const handleDateSelect = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
      const lunar = Lunar.fromDate(value);
      const lunarYear = lunar.getYearInGanZhi();
      const lunarMonth = lunar.getMonthInChinese();
      const lunarDay = lunar.getDayInChinese();
      const lunarStr = `${lunarYear}年-${lunarMonth}月${lunarDay}`;

      const holidaysForDate = getHolidaysForDate(value);

      const holidayStr = holidaysForDate.length > 0
        ? holidaysForDate.map(h => {
            // This new logic is safe for TypeScript.
            // 1. Start with localName, which always exists.
            let displayName = h.localName;
            
            // 2. If it's a US holiday AND englishName is available, use it.
            if (h.type === 'US' && h.englishName) {
              displayName = h.englishName;
            }

            const typeLabel = h.type === 'US' ? ' (US)' : h.type === 'SolarTerm' ? ' (节气)' : '';
            return `${displayName}${typeLabel}`;
          }).join('\n')
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
          className="calendar"
          tileContent={tileContent}
          locale="zh-CN"
          formatDay={(locale, date) => date.getDate().toString()}
        />
      </div>
    );

    return createPortal(calendarContent, portalContainer);
  };

  // Fixed: Removed unused tileClassName function since it's not being used

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
      ...fixedHolidays.map(h => ({ localName: h.name, englishName: undefined, type: 'Chinese' })),
      ...lunarHolidays.map(h => ({ localName: h.name, englishName: undefined, type: 'Chinese' })),
      ...(isMotherDay ? [{ localName: '母亲节', englishName: undefined, type: 'Chinese' }] : []),
      ...(isFatherDay ? [{ localName: '父亲节', englishName: undefined, type: 'Chinese' }] : []),
      ...(isValentineDay ? [{ localName: '情人节', englishName: undefined, type: 'Chinese' }] : []),
      
      // US holidays already have both properties, which is correct.
      ...(isHalloween ? [{ localName: usHolidayTranslations['Halloween'], englishName: 'Halloween', type: 'US' }] : []),
      ...(isEasterSunday ? [{ localName: usHolidayTranslations['Easter Sunday'], englishName: 'Easter Sunday', type: 'US' }] : []),
      ...(isInauguration ? [{ localName: usHolidayTranslations['Inauguration Day'], englishName: 'Inauguration Day', type: 'US' }] : []),
      
      // Also fix Solar Terms to have a consistent shape.
      // ...(solarTerm ? [{ localName: solarTerm, englishName: undefined, type: 'SolarTerm' }] : []),
      ...apiHolidays.map(h => {
        const translatedName = h.countryCode === 'US' && usHolidayTranslations[h.name]
          ? usHolidayTranslations[h.name]
          : h.localName;
        return { 
          localName: translatedName, 
          englishName: h.name, 
          type: h.countryCode === 'CN' ? 'Chinese' : 'US' 
        };
      })
    ];

    console.log(allHolidays)
    return allHolidays;
  };



  const tileContent = ({ date, view }: { date: Date, view: string }) => {
    if (view !== 'month') {
      return null;
    }
    const holidaysForDate = getHolidaysForDate(date);
    
    return (
      <div className="holiday-circles">
        {holidaysForDate.some(h => h.type === 'Chinese') && <span className="holiday-circle cn"></span>}
        {holidaysForDate.some(h => h.type === 'US') && <span className="holiday-circle us"></span>}
        {holidaysForDate.some(h => h.type === 'SolarTerm') && <span className="holiday-circle solar"></span>}
      </div>
    );
  };

  // Fixed: Handle potential null return from getNextHolidayCountdown
  const nextHoliday = getNextHolidayCountdown();

  return (
    <div className="glass-panel date-time-panel">
      <div className="date-time-panel">
        <div 
          className="date-display" 
          onClick={handleDateClick} 
          style={{ cursor: 'pointer' }}
        >
          <div style={{ fontWeight: 'bold' }}>
            {formatDate(currentDateTime)}
          </div>
          <div className="lunar-date" style={{ fontWeight: 'bold' }}>
            {lunarCalendarInfo}
          </div>
        </div>
        {renderCalendar()}

        <div className="time-display">
          {formatTime(currentDateTime)}
          <div className="countdown-text">
            {nextHoliday ? (
              <>
                距离{nextHoliday.name}还有<span className="countdown-days">{nextHoliday.days}天</span>
              </>
            ) : (
              '暂无即将到来的节日'
            )}
          </div>
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