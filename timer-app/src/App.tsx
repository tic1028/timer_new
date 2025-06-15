import './App.css'
import React, { useRef, useState, useEffect } from 'react'; // NEW: Added useEffect
import Pomodoro from './components/Pomodoro';
import Schedule from './components/Schedule';
import MealNotes from './components/MealNotes';
import Notes from './components/Notes';
import CalendarDisplay from './components/CalendarDisplay';
import Settings from './components/Settings';
import WaterReminderPanel from './components/WaterReminderPanel';
import WaterReminderService from './components/WaterReminderService';
import WoodenFish from './components/WoodenFish';

interface MealNotesRef {
  openAndPreFillMeals: () => void;
}

// NEW: Define the shared event interface in the parent component.
interface CalendarEvent {
  date: string;
  label: string;
  isRecurring: boolean;
}
// NEW: Define the PaydaySettings interface in the parent component
interface PaydaySettings {
  type: 'monthly' | 'weekly' | 'bi-weekly';
  dayOfMonth?: number;
  dayOfWeek?: number;
  biWeeklyReferenceDate?: string;
}

function App() {
  const mealNotesRef = useRef<MealNotesRef>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showWaterReminder, setShowWaterReminder] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'anniversary' | 'payday' | 'water'>('anniversary');

  // NEW: The 'events' state has been "lifted up" to App.tsx.
  // It now serves as the single source of truth for all child components.
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const savedEvents = localStorage.getItem('events');
    return savedEvents ? JSON.parse(savedEvents) : [];
  });

  // NEW: This effect runs whenever the 'events' state changes,
  // ensuring that any updates are saved to the browser's local storage.
  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);
  // NEW: Add state management for Payday Settings
  const [paydaySettings, setPaydaySettings] = useState<PaydaySettings>(() => {
    const saved = localStorage.getItem('paydaySettings');
    // Provide a default value if nothing is in storage
    return saved ? JSON.parse(saved) : { type: 'monthly', dayOfMonth: 15 };
  });
  // NEW: Save payday settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('paydaySettings', JSON.stringify(paydaySettings));
  }, [paydaySettings]);

  const handleEatWhatClick = () => {
    mealNotesRef.current?.openAndPreFillMeals();
  };

  return (
    <div className="app-container">
      <WaterReminderService />
      {showSettings ? (
        <Settings 
          onClose={() => setShowSettings(false)} 
          activeTab={activeSettingsTab}
          // NEW: Pass the current events and the function to update them to the Settings panel.
          initialEvents={events}
          onEventsChange={setEvents}
          // NEW: Pass payday state and its update function to Settings
          initialPaydaySettings={paydaySettings}
          onPaydaySettingsChange={setPaydaySettings}
        />
      ) : showWaterReminder ? (
        <WaterReminderPanel onClose={() => setShowWaterReminder(false)} />
      ) : (
        <div className="glass-panel main-panel">
          <CalendarDisplay 
            onOpenSettings={() => {
              setActiveSettingsTab('anniversary');
              setShowSettings(true);
            }} 
            // NEW: Pass the events data down to CalendarDisplay as a prop.
            events={events}
             // NEW: Pass the payday state down to CalendarDisplay
             paydaySettings={paydaySettings}
          />
          <Pomodoro />
          <Schedule />
          <div className="glass-panel tools-panel">
            <div className="tool-grid">
              <div className="tool-item water-reminder-tool-item" onClick={() => setShowWaterReminder(true)}>
                <div className="tool-icon"></div>
                <div className="tool-label">喝水提醒</div>
              </div>
              <MealNotes ref={mealNotesRef} onEatWhatClick={handleEatWhatClick} />
              <Notes />
              <WoodenFish />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App