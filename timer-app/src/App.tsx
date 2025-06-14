import './App.css'
import React, { useRef, useState } from 'react';
import Pomodoro from './components/Pomodoro';
import Schedule from './components/Schedule';
import MealNotes from './components/MealNotes';
import Notes from './components/Notes';
import CalendarDisplay from './components/CalendarDisplay';
import Settings from './components/Settings';
import WaterReminderPanel from './components/WaterReminderPanel';
import WaterReminderService from './components/WaterReminderService';

interface MealNotesRef {
  openAndPreFillMeals: () => void;
}

function App() {
  const mealNotesRef = useRef<MealNotesRef>(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showWaterReminder, setShowWaterReminder] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'anniversary' | 'payday' | 'water'>('anniversary');

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
        />
      ) : showWaterReminder ? (
        <WaterReminderPanel onClose={() => setShowWaterReminder(false)} />
      ) : (
        <div className="glass-panel main-panel">
          <CalendarDisplay onOpenSettings={() => {
            setActiveSettingsTab('anniversary');
            setShowSettings(true);
          }} />
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
