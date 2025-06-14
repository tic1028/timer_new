import './App.css'
import React, { useRef } from 'react';
import Pomodoro from './components/Pomodoro';
import Schedule from './components/Schedule';
import MealNotes from './components/MealNotes';
import Notes from './components/Notes';
import CalendarDisplay from './components/CalendarDisplay';
import Settings from './components/Settings';
import WaterReminder from './components/WaterReminder';

interface MealNotesRef {
  openAndPreFillMeals: () => void;
}

function App() {
  const mealNotesRef = useRef<MealNotesRef>(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showWaterReminder, setShowWaterReminder] = React.useState(false);

  const handleEatWhatClick = () => {
    mealNotesRef.current?.openAndPreFillMeals();
  };

  return (
    <div className="app-container">
      {showSettings ? (
        <Settings onClose={() => setShowSettings(false)} />
      ) : showWaterReminder ? (
        <WaterReminder onClose={() => setShowWaterReminder(false)} />
      ) : (
        <div className="glass-panel main-panel">
          <CalendarDisplay onOpenSettings={() => setShowSettings(true)} />
          <Pomodoro />
          <Schedule />
          <div className="glass-panel tools-panel">
            <div className="tool-grid">
              <div className="tool-item wallpaper-tool-item" onClick={() => setShowWaterReminder(true)}>
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
