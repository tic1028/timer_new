// src/lunar-javascript.d.ts

declare module "lunar-javascript" {
	// Describes the object returned by getSolar()
	export interface SolarDate {
		getYear(): number;
		getMonth(): number;
		getDay(): number;
	}

	// Describes the Lunar class and the static methods you use
	export class Lunar {
		static fromDate(date: Date): Lunar;
		static fromYmd(year: number, month: number, day: number): Lunar;

		getSolar(): SolarDate;
		getMonthInChinese(): string;
		getDayInChinese(): string;
		getYearInGanZhi(): string;
		getJieQi(): string;
		getJieQiTable(): { [key: string]: Solar };
	}

	// Describes the Solar class
	export class Solar {
		getYear(): number;
		getMonth(): number;
		getDay(): number;
	}
}
