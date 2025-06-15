import "./App.css";
import { useRef, useState, useEffect } from "react"; // NEW: Added useEffect
import Pomodoro from "./components/Pomodoro";
import Schedule from "./components/Schedule";
import MealNotes from "./components/MealNotes";
import Notes from "./components/Notes";
import CalendarDisplay from "./components/CalendarDisplay";
import Settings from "./components/Settings";
import WaterReminderPanel from "./components/WaterReminderPanel";
import WaterReminderService from "./components/WaterReminderService";
import WoodenFish from "./components/WoodenFish";
import { HOLIDAY_DEFINITIONS } from "./holidayUtils";
import type { HolidayDefinition } from "./holidayUtils";
import type { EventItem, PaydaySettings, HolidaySetting } from "./types"; // CORRECTED IMPORT

interface MealNotesRef {
	openAndPreFillMeals: () => void;
}

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
	const saved = localStorage.getItem(key);
	if (saved) {
		try {
			return JSON.parse(saved);
		} catch (e) {
			console.error(`Failed to parse ${key} from localStorage`, e);
			return defaultValue;
		}
	}
	return defaultValue;
};

// Function to create default holiday settings
const createDefaultHolidaySettings = (): HolidaySetting[] => {
	const defaultDaysOff = [
		// US Holidays
		"new-years-day",
		"mlk-day",
		"memorial-day",
		"independence-day",
		"labor-day",
		"thanksgiving-day",
		"christmas-day",
		// Chinese Holidays
		"chinese-new-year",
		"qingming-festival",
		"dragon-boat-festival",
		"mid-autumn-festival",
	];
	return HOLIDAY_DEFINITIONS.map((def: HolidayDefinition) => ({
		id: def.id,
		localName: def.localName,
		type: def.type,
		showInCalendar: true, // Show all holidays in calendar by default
		// Only show major holidays in the countdown by default
		showInCountdown: [
			"chinese-new-year",
			"mid-autumn-festival",
			"thanksgiving-day",
			"christmas-day",
			"lantern-festival",
			"qingming-festival",
			"dragon-boat-festival",
			"international-womens-day",
			"childrens-day-cn",
			"teachers-day-cn",
			"new-years-day",
			"mlk-day",
			"mothers-day",
			"memorial-day",
			"fathers-day",
			"independence-day",
			"labor-day",
			"halloween",
		].includes(def.id),
		isDayOff: defaultDaysOff.includes(def.id), // Nothing is a day off by default
	}));
};

function App() {
	const mealNotesRef = useRef<MealNotesRef>(null);
	const [showSettings, setShowSettings] = useState(false);
	const [showWaterReminder, setShowWaterReminder] = useState(false);
	const [activeSettingsTab, setActiveSettingsTab] = useState<
		"anniversary" | "payday"
	>("anniversary");

	const [events, setEvents] = useState<EventItem[]>(() => {
		const savedEvents = localStorage.getItem("events");
		return savedEvents ? JSON.parse(savedEvents) : [];
	});
	const [paydaySettings, setPaydaySettings] = useState<PaydaySettings>(() =>
		getFromStorage<PaydaySettings>("paydaySettings", {
			type: "monthly",
			dayOfMonth: 15,
		})
	);

	const [holidaySettings, setHolidaySettings] = useState<HolidaySetting[]>(
		() => {
			const savedSettings = getFromStorage<HolidaySetting[]>(
				"holidaySettings",
				[]
			);
			// If saved settings don't cover all defined holidays (e.g., app update), regenerate
			if (savedSettings.length !== HOLIDAY_DEFINITIONS.length) {
				return createDefaultHolidaySettings();
			}
			return savedSettings;
		}
	);

	useEffect(() => {
		localStorage.setItem("events", JSON.stringify(events));
	}, [events]);

	useEffect(() => {
		localStorage.setItem("paydaySettings", JSON.stringify(paydaySettings));
	}, [paydaySettings]);

	useEffect(() => {
		localStorage.setItem(
			"holidaySettings",
			JSON.stringify(holidaySettings)
		);
	}, [holidaySettings]);

	const handleEatWhatClick = () => {
		mealNotesRef.current?.openAndPreFillMeals();
	};

	//Idea: list the state of local storage up to app, parent
	return (
		<div className="app-container">
			<WaterReminderService />
			{showSettings ? (
				<Settings
					onClose={() => setShowSettings(false)}
					activeTab={activeSettingsTab}
					initialEvents={events}
					onEventsChange={setEvents}
					initialPaydaySettings={paydaySettings}
					onPaydaySettingsChange={setPaydaySettings}
					initialHolidaySettings={holidaySettings}
					onHolidaySettingsChange={setHolidaySettings}
				/>
			) : showWaterReminder ? (
				<WaterReminderPanel
					onClose={() => setShowWaterReminder(false)}
				/>
			) : (
				<div className="glass-panel main-panel">
					<CalendarDisplay
						onOpenSettings={() => {
							setActiveSettingsTab("anniversary");
							setShowSettings(true);
						}}
						events={events}
						paydaySettings={paydaySettings}
						holidaySettings={holidaySettings}
					/>
					<Pomodoro />
					<Schedule />
					<div className="glass-panel tools-panel">
						<div className="tool-grid">
							<div
								className="tool-item water-reminder-tool-item"
								onClick={() => setShowWaterReminder(true)}
							>
								<div className="tool-icon"></div>
								<div className="tool-label">喝水提醒</div>
							</div>
							<MealNotes
								ref={mealNotesRef}
								onEatWhatClick={handleEatWhatClick}
							/>
							<Notes />
							<WoodenFish />
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
