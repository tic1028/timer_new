export interface EventItem {
	date: string;
	label: string;
	isRecurring: boolean;
}

/** Settings that define the user's payday schedule. */
export interface PaydaySettings {
	type: "monthly" | "weekly" | "bi-weekly";
	dayOfMonth?: number;
	dayOfWeek?: number;
	biWeeklyReferenceDate?: string;
}

/** User-configurable settings for a single holiday. */
export interface HolidaySetting {
	id: string;
	localName: string;
	type: ("US" | "Chinese")[];
	showInCalendar: boolean;
	showInCountdown: boolean;
	isDayOff: boolean;
}
