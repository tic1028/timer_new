import './App.css'
import React, { useRef } from 'react';
import Pomodoro from './components/Pomodoro';
import Schedule from './components/Schedule';
import MealNotes from './components/MealNotes';
import Notes from './components/Notes';
import CalendarDisplay from './components/CalendarDisplay';
import Settings from './components/Settings';

interface MealNotesRef {
  openAndPreFillMeals: () => void;
}

function App() {
  const mealNotesRef = useRef<MealNotesRef>(null);
  const [showSettings, setShowSettings] = React.useState(false);

  const handleEatWhatClick = () => {
    mealNotesRef.current?.openAndPreFillMeals();
  };

  return (
    <div className="app-container">
      {showSettings ? (
        <Settings onClose={() => setShowSettings(false)} />
      ) : (
        <div className="glass-panel main-panel">
          <CalendarDisplay />
          <Pomodoro />
          <Schedule />
          <div className="glass-panel tools-panel">
            <div className="tool-grid">
              <div className="tool-item wallpaper-tool-item">
                <div className="tool-icon"></div>
                <div className="tool-label">更换壁纸</div>
              </div>
              <MealNotes ref={mealNotesRef} onEatWhatClick={handleEatWhatClick} />
              <Notes />
            </div>
          </div>
          <button className="open-settings" onClick={() => setShowSettings(true)}>
            纪念日/生日设置
          </button>
        </div>
      )}
    </div>
  )
}

export default App
