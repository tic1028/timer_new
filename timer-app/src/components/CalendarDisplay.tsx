import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
// @ts-ignore
import { Lunar } from "lunar-javascript";
// @ts-ignore
import type { Value } from "react-calendar/dist/cjs/shared/types";
import { HOLIDAY_DEFINITIONS } from "../holidayUtils";
import type { EventItem, PaydaySettings, HolidaySetting } from "../types";

//实际上不需要fetch

interface CalendarDisplayProps {
	onOpenSettings: () => void;
	events: EventItem[];
	paydaySettings: PaydaySettings;
	holidaySettings: HolidaySetting[]; // NEW PROP
}

interface HolidayInfo {
	localName: string;
	englishName: string;
	type: ("US" | "Chinese")[];
	isDayOff: boolean;
}

// 获取用户时区
const getUserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const CalendarDisplay: React.FC<CalendarDisplayProps> = ({
	onOpenSettings,
	events,
	paydaySettings,
	holidaySettings,
}) => {
	const [currentDateTime, setCurrentDateTime] = useState(new Date());
	const [showCalendar, setShowCalendar] = useState(false);
	const [selectedDate, setSelectedDate] = useState(new Date());

	const calendarRef = useRef<HTMLDivElement>(null);
	const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
		null
	);

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
		const container = document.createElement("div");
		container.style.position = "fixed";
		container.style.top = "0";
		container.style.left = "0";
		container.style.width = "100%";
		container.style.height = "100%";
		container.style.pointerEvents = "none";
		container.style.zIndex = "99999";
		document.body.appendChild(container);
		setPortalContainer(container);

		return () => {
			document.body.removeChild(container);
		};
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && showCalendar) {
				setShowCalendar(false);
			}
		};

		if (showCalendar) {
			document.addEventListener("keydown", handleKeyDown);
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [showCalendar]);

	const year = currentDateTime.getFullYear();
	const holidaysByDate = useMemo(() => {
		const holidayMap = new Map<string, HolidayInfo[]>();
		const settingsMap = new Map(holidaySettings.map((s) => [s.id, s]));

		HOLIDAY_DEFINITIONS.forEach((def) => {
			const setting = settingsMap.get(def.id);
			if (!setting || !setting.showInCalendar) {
				return;
			}

			const date = def.getDate(year);
			if (date) {
				const dateStr = date.toISOString().split("T")[0];
				const holidayForDate = holidayMap.get(dateStr) || [];
				holidayForDate.push({
					localName: def.localName,
					type: def.type,
					isDayOff: setting.isDayOff,
					englishName: def.englishName,
				});
				holidayMap.set(dateStr, holidayForDate);
			}
		});
		return holidayMap;
	}, [year, holidaySettings]);

	const calculatePaydayCountdown = () => {
		const userTimezone = getUserTimezone();
		const today = new Date();
		const startOfToday = new Date(
			today.toLocaleString("en-US", { timeZone: userTimezone })
		);
		startOfToday.setHours(0, 0, 0, 0);
		const msInDay = 1000 * 60 * 60 * 24;

		if (paydaySettings.type === "monthly" && paydaySettings.dayOfMonth) {
			let paydayThisMonth = new Date(
				startOfToday.getFullYear(),
				startOfToday.getMonth(),
				paydaySettings.dayOfMonth
			);
			if (paydayThisMonth.getTime() < startOfToday.getTime()) {
				paydayThisMonth.setMonth(paydayThisMonth.getMonth() + 1);
			}
			return Math.round(
				(paydayThisMonth.getTime() - startOfToday.getTime()) / msInDay
			);
		}

		if (
			paydaySettings.type === "weekly" &&
			paydaySettings.dayOfWeek !== undefined
		) {
			const daysUntilPayday =
				(paydaySettings.dayOfWeek - startOfToday.getDay() + 7) % 7;
			return daysUntilPayday;
		}

		if (
			paydaySettings.type === "bi-weekly" &&
			paydaySettings.biWeeklyReferenceDate
		) {
			const refDateParts = paydaySettings.biWeeklyReferenceDate
				.split("-")
				.map((p) => parseInt(p, 10));
			const referenceDate = new Date(
				refDateParts[0],
				refDateParts[1] - 1,
				refDateParts[2]
			);
			referenceDate.setHours(0, 0, 0, 0);

			if (referenceDate.getTime() >= startOfToday.getTime()) {
				return Math.round(
					(referenceDate.getTime() - startOfToday.getTime()) / msInDay
				);
			}

			const msInCycle = 14 * msInDay;
			const timeDiffFromRef =
				startOfToday.getTime() - referenceDate.getTime();
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
		const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
		const weekday = weekdays[date.getDay()];
		return `${year}年${month}月${day}日星期${weekday}`;
	};

	const formatTime = (date: Date) => {
		const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
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

	const nextHoliday = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		let nearestHoliday: { name: string; days: number } | null = null;

		const settingsMap = new Map(holidaySettings.map((s) => [s.id, s]));

		HOLIDAY_DEFINITIONS.forEach((def) => {
			const setting = settingsMap.get(def.id);
			if (!setting || !setting.showInCountdown) return;

			// Check this year and next year for the closest date
			for (const targetYear of [
				today.getFullYear(),
				today.getFullYear() + 1,
			]) {
				const date = def.getDate(targetYear);
				if (date && date.getTime() >= today.getTime()) {
					const diffDays = Math.ceil(
						(date.getTime() - today.getTime()) /
							(1000 * 60 * 60 * 24)
					);
					if (!nearestHoliday || diffDays < nearestHoliday.days) {
						nearestHoliday = {
							name: def.localName,
							days: diffDays,
						};
					}
					break; // Found the next occurrence for this holiday, move to the next definition
				}
			}
		});

		return nearestHoliday;
	}, [holidaySettings]);

	const getUpcomingEvents = () => {
		const userTimezone = getUserTimezone();
		const today = new Date();
		const todayInUserTZ = new Date(
			today.toLocaleString("en-US", { timeZone: userTimezone })
		);
		todayInUserTZ.setHours(0, 0, 0, 0);

		const upcoming = events
			.map((event) => {
				// FIX: Robustly parse the 'YYYY-MM-DD' string to avoid timezone issues.
				const dateParts = event.date
					.split("-")
					.map((p) => parseInt(p, 10));
				const eventDate = new Date(
					dateParts[0],
					dateParts[1] - 1,
					dateParts[2]
				);

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
					diffDays,
				};
			})
			.filter(
				(item): item is { event: EventItem; diffDays: number } =>
					item !== null
			) // Filter out past non-recurring events
			.sort((a, b) => a.diffDays - b.diffDays);

		// Filter for events in the next 7 days and create the JSX elements
		const result: JSX.Element[] = [];
		for (const { event, diffDays } of upcoming) {
			if (diffDays > 0 && diffDays <= 7) {
				result.push(
					<span key={event.label + event.date}>
						距离{event.label}还有
						<span className="event-countdown-days">
							{diffDays}天
						</span>
					</span>
				);
			} else if (diffDays === 0) {
				result.push(
					<span key={event.label + event.date}>
						{event.label}就是
						<span className="event-countdown-days">今天</span>
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

			const dateStr = value.toISOString().split("T")[0];
			const holidaysForDate = holidaysByDate.get(dateStr) || [];

			const solarTerm = lunar.getJieQi();
			const holidayDisplayItems = holidaysForDate.map((h) => {
				const isChinese = h.type.includes("Chinese");
				const isUS = h.type.includes("US");
				if (isChinese && isUS) return h.localName;
				if (isUS) return h.englishName;
				return h.localName;
			});
			if (solarTerm) {
				holidayDisplayItems.push(`${solarTerm} (节气)`);
			}
			const holidayStr =
				holidayDisplayItems.length > 0
					? holidayDisplayItems.join("\n")
					: "无节日";

			const tooltip = `${lunarStr}\n${holidayStr}`;
			// const tooltip = `<span class="math-inline">\{lunarStr\}\\n</span>{holidayStr}`;

			// Remove any existing tooltips
			const existingTooltips =
				document.getElementsByClassName("custom-tooltip");
			while (existingTooltips.length > 0) {
				existingTooltips[0].parentNode?.removeChild(
					existingTooltips[0]
				);
			}

			// Create new tooltip
			const customTooltip = document.createElement("div");
			customTooltip.className = "custom-tooltip";
			customTooltip.textContent = tooltip;

			// Calculate position
			const padding = 10;
			const tooltipWidth = 180;
			const tooltipHeight =
				40 +
				(holidaysForDate.length > 0
					? (holidaysForDate.length - 1) * 20
					: 0);

			// Get the clicked element's position
			const clickedElement = document.querySelector(
				".react-calendar__tile--active"
			);
			if (clickedElement) {
				const rect = clickedElement.getBoundingClientRect();
				let left = rect.left + window.scrollX + padding;
				let top = rect.bottom + window.scrollY + padding;

				if (
					window.innerHeight - rect.bottom <
					tooltipHeight + padding * 2
				) {
					top = rect.top + window.scrollY - tooltipHeight - padding;
				}
				if (
					window.innerWidth - rect.left <
					tooltipWidth + padding * 2
				) {
					left = rect.left + window.scrollX - tooltipWidth - padding;
				}

				customTooltip.style.left = `${Math.max(left, 0)}px`;
				customTooltip.style.top = `${Math.max(top, 0)}px`;
			}

			customTooltip.style.zIndex = "999999";
			customTooltip.style.width = tooltipWidth + "px";
			customTooltip.style.maxWidth = "90vw";
			customTooltip.style.textAlign = "center";
			customTooltip.style.whiteSpace = "pre-line";

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
			if (
				calendarRef.current &&
				!calendarRef.current.contains(event.target as Node)
			) {
				setShowCalendar(false);
			}
		};

		if (showCalendar) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showCalendar]);

	const renderCalendar = () => {
		if (!showCalendar || !portalContainer) return null;

		const calendarContent = (
			<div
				className="calendar-popup"
				ref={calendarRef}
				style={{
					position: "fixed",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					pointerEvents: "auto",
					zIndex: 100000,
				}}
			>
				<Calendar
					onChange={handleDateSelect}
					value={selectedDate}
					className="calendar"
					tileContent={tileContent}
					tileClassName={tileClassName}
					locale="zh-CN"
					formatDay={(locale, date) => date.getDate().toString()}
				/>
			</div>
		);

		return createPortal(calendarContent, portalContainer);
	};

	// Fixed: Removed unused tileClassName function since it's not being used
	const tileClassName = ({ date, view }: { date: Date; view: string }) => {
		if (view === "month") {
			const dateStr = date.toISOString().split("T")[0];
			const holidays = holidaysByDate.get(dateStr);
			if (holidays && holidays.some((h) => h.isDayOff)) {
				return "day-off";
			}
		}
		return null;
	};

	const tileContent = ({ date, view }: { date: Date; view: string }) => {
		if (view !== "month") return null;

		const dateStr = date.toISOString().split("T")[0];
		const holidays = holidaysByDate.get(dateStr);
		const solarTerm = Lunar.fromDate(date).getJieQi(); // Calculate Solar Term

		if ((holidays && holidays.length > 0) || solarTerm) {
			const hasChinese = holidays?.some((h) =>
				h.type.includes("Chinese")
			);
			const hasUS = holidays?.some((h) => h.type.includes("US"));
			return (
				<div className="holiday-circles">
					{hasChinese && <span className="holiday-circle cn"></span>}
					{hasUS && <span className="holiday-circle us"></span>}
					{solarTerm && (
						<span className="holiday-circle solar"></span>
					)}
				</div>
			);
		}
		return null;
	};

	return (
		<div className="glass-panel date-time-panel">
			<div className="date-time-panel">
				<div
					className="date-display"
					onClick={handleDateClick}
					style={{ cursor: "pointer" }}
				>
					<div style={{ fontWeight: "bold" }}>
						{formatDate(currentDateTime)}
					</div>
					<div className="lunar-date" style={{ fontWeight: "bold" }}>
						{lunarCalendarInfo}
					</div>
				</div>
				{renderCalendar()}

				<div className="time-display">
					{formatTime(currentDateTime)}
					<div className="countdown-text">
						{nextHoliday ? (
							// Check if the holiday is today (countdown is 0 days)
							nextHoliday.days === 0 ? (
								<span className="holiday-today-text">
									{nextHoliday.name} 就是
									<span className="countdown-days">
										今天!
									</span>
								</span>
							) : (
								// Otherwise, show the regular countdown
								<>
									距离{nextHoliday.name}还有
									<span className="countdown-days">
										{nextHoliday.days}天
									</span>
								</>
							)
						) : (
							"暂无即将到来的节日"
						)}
					</div>
				</div>
			</div>
			<div className="countdown">
				{paydayCountdown !== null &&
					(paydayCountdown === 0 ? (
						// This is the new message for the actual payday
						<div className="payday-countdown-text">
							发工资啦！数钱啦！ 🤑
						</div>
					) : (
						// This is the original countdown for other days
						<div className="payday-countdown-text">
							距离发工资还有
							<span className="payday-countdown-days">
								{paydayCountdown}天 💸
							</span>
						</div>
					))}
			</div>
			<div className="anniversary">
				{upcomingEvents.length > 0 && (
					<div className="event-reminder">
						{upcomingEvents.map((item, idx) => (
							<React.Fragment key={idx}>
								{item}
								{idx % 2 === 1 &&
								idx !== upcomingEvents.length - 1 ? (
									<br />
								) : idx !== upcomingEvents.length - 1 ? (
									"，"
								) : (
									""
								)}
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
						<path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
					</svg>
				</button>
			</div>
		</div>
	);
};

export default CalendarDisplay;
