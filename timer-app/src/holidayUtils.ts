import { Lunar } from "lunar-javascript";

/**
 * Defines the standard structure for all holiday definitions in the application.
 */
export interface HolidayDefinition {
	id: string;
	localName: string;
	englishName: string;
	type: ("US" | "Chinese")[];
	getDate: (year: number) => Date | null;
}

// --- Helper Functions for Date Calculations ---

/**
 * Converts a Lunar calendar date to a Gregorian (Solar) Date object.
 * Handles the case where the Laba festival (12/8) of a given lunar year
 * might fall in the next Gregorian year.
 * @param year The Gregorian year to calculate for.
 * @param lunarMonth The lunar month (1-12).
 * @param lunarDay The lunar day (1-30).
 * @returns A Date object.
 */
const lunarToSolar = (
	year: number,
	lunarMonth: number,
	lunarDay: number
): Date => {
	// The Laba festival (12th month) of a lunar year often falls in the next solar year.
	// We need to check the solar year of the lunar date to be accurate.
	const lunarDate = Lunar.fromYmd(year, lunarMonth, lunarDay);
	const solarDate = lunarDate.getSolar();
	return new Date(
		solarDate.getYear(),
		solarDate.getMonth() - 1,
		solarDate.getDay()
	);
};

/**
 * Finds the date of the Nth occurrence of a specific weekday in a given month and year.
 * @param year The year.
 * @param month The month (0-11).
 * @param weekday The day of the week (0=Sun, 1=Mon, ..., 6=Sat).
 * @param n The occurrence (e.g., 1 for 1st, 2 for 2nd, -1 for last).
 * @returns A Date object.
 */
const getNthWeekdayOfMonth = (
	year: number,
	month: number,
	weekday: number,
	n: number
): Date => {
	const date = new Date(year, month, 1);
	if (n > 0) {
		let count = 0;
		while (count < n) {
			if (date.getDay() === weekday) {
				count++;
			}
			if (count < n) {
				date.setDate(date.getDate() + 1);
			}
		}
	} else {
		// Handle finding the *last* weekday
		date.setMonth(date.getMonth() + 1);
		date.setDate(0); // Go to the last day of the target month
		while (date.getDay() !== weekday) {
			date.setDate(date.getDate() - 1);
		}
	}
	return date;
};

/**
 * Calculates the date of Easter Sunday for a given year using the Meeus/Jones/Butcher algorithm.
 * @param year The year.
 * @returns A Date object for Easter Sunday.
 */
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

/**
 * Calculates the date of the Qingming Festival (Tomb-Sweeping Day).
 * It is based on the solar term, falling on the 15th day after the Spring Equinox.
 * The lunar-javascript library can calculate this directly.
 * @param year The year.
 * @returns A Date object for Qingming Festival.
 */
const getQingmingDate = (year: number): Date => {
	const solarTerms = Lunar.fromYmd(year, 1, 1).getJieQiTable();
	const qingmingSolar = solarTerms["清明"];
	return new Date(
		qingmingSolar.getYear(),
		qingmingSolar.getMonth() - 1,
		qingmingSolar.getDay()
	);
};

// --- Master Holiday Definitions List ---

export const HOLIDAY_DEFINITIONS: HolidayDefinition[] = [
	// --- Chinese Holidays ---
	{
		id: "chinese-new-year",
		localName: "春节",
		englishName: "Chinese New Year",
		type: ["Chinese"],
		getDate: (year) => lunarToSolar(year, 1, 1),
	},
	{
		id: "lantern-festival",
		localName: "元宵节",
		englishName: "Lantern Festival",
		type: ["Chinese"],
		getDate: (year) => lunarToSolar(year, 1, 15),
	},
	{
		id: "international-womens-day",
		localName: "妇女节",
		englishName: "International Women's Day",
		type: ["Chinese"],
		getDate: (year) => new Date(year, 2, 8), // March 8
	},
	{
		id: "arbor-day-cn",
		localName: "植树节",
		englishName: "Arbor Day (China)",
		type: ["Chinese"],
		getDate: (year) => new Date(year, 2, 12), // March 12
	},
	{
		id: "qingming-festival",
		localName: "清明节",
		englishName: "Qingming Festival",
		type: ["Chinese"],
		getDate: getQingmingDate,
	},
	{
		id: "dragon-boat-festival",
		localName: "端午节",
		englishName: "Dragon Boat Festival",
		type: ["Chinese"],
		getDate: (year) => lunarToSolar(year, 5, 5),
	},
	{
		id: "childrens-day-cn",
		localName: "儿童节",
		englishName: "Children's Day",
		type: ["Chinese"],
		getDate: (year) => new Date(year, 5, 1), // June 1
	},
	{
		id: "qixi-festival",
		localName: "七夕节",
		englishName: "Qixi Festival",
		type: ["Chinese"],
		getDate: (year) => lunarToSolar(year, 7, 7),
	},

	{
		id: "teachers-day-cn",
		localName: "教师节",
		englishName: "Teachers' Day (China)",
		type: ["Chinese"],
		getDate: (year) => new Date(year, 8, 10), // September 10
	},
	{
		id: "mid-autumn-festival",
		localName: "中秋节",
		englishName: "Mid-Autumn Festival",
		type: ["Chinese"],
		getDate: (year) => lunarToSolar(year, 8, 15),
	},
	{
		id: "double-ninth-festival",
		localName: "重阳节",
		englishName: "Double Ninth Festival",
		type: ["Chinese"],
		getDate: (year) => lunarToSolar(year, 9, 9),
	},
	{
		id: "laba-festival",
		localName: "腊八节",
		englishName: "Laba Festival",
		type: ["Chinese"],
		getDate: (year) => lunarToSolar(year, 12, 8),
	},

	// --- US Holidays ---
	{
		id: "new-years-day",
		localName: "元旦",
		englishName: "New Year's Day",
		type: ["US", "Chinese"],
		getDate: (year) => new Date(year, 0, 1),
	},
	{
		id: "inauguration-day",
		localName: "总统就职日",
		englishName: "Inauguration Day",
		type: ["US"],
		getDate: (year) => (year % 4 === 1 ? new Date(year, 0, 20) : null), // Only on specific years
	},
	{
		id: "mlk-day",
		localName: "MLK",
		englishName: "Martin Luther King, Jr. Day",
		type: ["US"],
		getDate: (year) => getNthWeekdayOfMonth(year, 0, 1, 3), // 3rd Monday in Jan
	},
	{
		id: "valentines-day",
		localName: "情人节",
		englishName: "Valentine's Day",
		type: ["US"],
		getDate: (year) => new Date(year, 1, 14),
	},
	{
		id: "presidents-day",
		localName: "总统日",
		englishName: "Washington's Birthday",
		type: ["US"],
		getDate: (year) => getNthWeekdayOfMonth(year, 1, 1, 3), // 3rd Monday in Feb
	},
	{
		id: "good-friday",
		localName: "耶稣受难日",
		englishName: "Good Friday",
		type: ["US"],
		getDate: (year) => {
			const easter = calculateEasterSunday(year);
			easter.setDate(easter.getDate() - 2);
			return easter;
		},
	},
	{
		id: "easter-sunday",
		localName: "复活节",
		englishName: "Easter Sunday",
		type: ["US"],
		getDate: calculateEasterSunday,
	},
	{
		id: "mothers-day",
		localName: "母亲节",
		englishName: "Mother's Day",
		type: ["US"],
		getDate: (year) => getNthWeekdayOfMonth(year, 4, 0, 2), // 2nd Sunday in May
	},
	{
		id: "memorial-day",
		localName: "纪念日",
		englishName: "Memorial Day",
		type: ["US"],
		getDate: (year) => getNthWeekdayOfMonth(year, 4, 1, -1), // Last Monday in May
	},
	{
		id: "fathers-day",
		localName: "父亲节",
		englishName: "Father's Day",
		type: ["US"],
		getDate: (year) => getNthWeekdayOfMonth(year, 5, 0, 3), // 3rd Sunday in June
	},
	{
		id: "juneteenth",
		localName: "六月节",
		englishName: "Juneteenth",
		type: ["US"],
		getDate: (year) => new Date(year, 5, 19),
	},
	{
		id: "independence-day",
		localName: "独立日",
		englishName: "Independence Day",
		type: ["US"],
		getDate: (year) => new Date(year, 6, 4),
	},
	{
		id: "labor-day",
		localName: "劳动节",
		englishName: "Labor Day",
		type: ["US"],
		getDate: (year) => getNthWeekdayOfMonth(year, 8, 1, 1), // 1st Monday in Sep
	},
	{
		id: "columbus-day",
		localName: "哥伦布日",
		englishName: "Columbus Day",
		type: ["US"],
		getDate: (year) => getNthWeekdayOfMonth(year, 9, 1, 2), // 2nd Monday in Oct
	},
	{
		id: "halloween",
		localName: "万圣节",
		englishName: "Halloween",
		type: ["US"],
		getDate: (year) => new Date(year, 9, 31),
	},
	{
		id: "veterans-day",
		localName: "退伍军人节",
		englishName: "Veterans Day",
		type: ["US"],
		getDate: (year) => new Date(year, 10, 11),
	},
	{
		id: "thanksgiving-day",
		localName: "感恩节",
		englishName: "Thanksgiving Day",
		type: ["US"],
		getDate: (year) => getNthWeekdayOfMonth(year, 10, 4, 4), // 4th Thursday in Nov
	},
	{
		id: "christmas-day",
		localName: "圣诞节",
		englishName: "Christmas Day",
		type: ["US"],
		getDate: (year) => new Date(year, 11, 25),
	},
];
