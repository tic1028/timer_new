import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

interface NotesRef {
  // openAndPreFillMeals: () => void; // No longer exposing this via ref
}

interface MealNotesProps {
  onEatWhatClick: () => void; // New prop to handle click from App.tsx
}

const MealNotes = forwardRef<NotesRef, MealNotesProps>((props, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dailyNotes, setDailyNotes] = useState<Map<string, string>>(() => {
    const savedNotes = localStorage.getItem('dailyMeals');
    const initialNotes = savedNotes ? new Map(JSON.parse(savedNotes)) : new Map();

    // // Temporary: Add a test entry for 2025-01-01
    // const testDate = '2025-01-01';
    // if (!initialNotes.has(testDate)) {
    //   initialNotes.set(testDate, `${testDate} 今日三餐：\n早餐：鸡蛋\n午餐：面条\n晚餐：米饭`);
    // }

    return initialNotes;
  });
  const [currentDate, setCurrentDate] = useState<string>('');

  // New internal function to handle opening and pre-filling
  const handleOpenAndPreFill = () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const mealTemplate = `\n${dateString} 今日三餐：\n早餐：\n午餐：\n晚餐：\n`;

      setDailyNotes((prevDailyNotes) => {
        const newDailyNotes = new Map(prevDailyNotes);
        if (!newDailyNotes.has(dateString)) {
          newDailyNotes.set(dateString, mealTemplate);
        } else if (newDailyNotes.get(dateString) === '') {
          // If an empty entry exists for today, pre-fill it
          newDailyNotes.set(dateString, mealTemplate);
        }
        return newDailyNotes;
      });
      setCurrentDate(dateString);
      setIsExpanded(true);
  };

  // Expose this internal function via ref, if needed, or remove useImperativeHandle if not needed anymore
  useImperativeHandle(ref, () => ({
    openAndPreFillMeals: handleOpenAndPreFill, // Still exposing for external click
  }));

  useEffect(() => {
    localStorage.setItem('dailyMeals', JSON.stringify(Array.from(dailyNotes.entries())));
  }, [dailyNotes]);

  useEffect(() => {
    // Initialize currentDate to today's date when component mounts
    setCurrentDate(getTodayDateString());
  }, []);

  useEffect(() => {
    if (isExpanded) {
      setCurrentDate(getTodayDateString());
    }
  }, [isExpanded]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotesContent = e.target.value;
    setDailyNotes((prevDailyNotes) => {
      const newDailyNotes = new Map(prevDailyNotes);
      newDailyNotes.set(currentDate, newNotesContent);
      return newDailyNotes;
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const [yearStr, monthStr, dayStr] = currentDate.split('-');
    const current = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));

    if (direction === 'prev') {
      current.setDate(current.getDate() - 1);
    } else {
      current.setDate(current.getDate() + 1);
    }
    const year = current.getFullYear();
    const month = (current.getMonth() + 1).toString().padStart(2, '0');
    const day = current.getDate().toString().padStart(2, '0');
    const newDateString = `${year}-${month}-${day}`;

    setCurrentDate(newDateString);
  };

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const canNavigatePrev = () => {
    const [yearStr, monthStr, dayStr] = currentDate.split('-');
    const current = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
    const earliestDate = new Date(2000, 0, 1); // Arbitrary early date to prevent going indefinitely back
    return current.getTime() > earliestDate.getTime();
  };

  const canNavigateNext = () => {
    const [yearStr, monthStr, dayStr] = currentDate.split('-');
    const current = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to start of day
    return current.getTime() < today.getTime();
  };

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isExpanded]);

  return (
    <div className="notes-container">
      {/* This tool-item will now handle the click from App.tsx */} 
      <div className="tool-item meal-notes-tool-item" onClick={props.onEatWhatClick}>
        <div className="tool-icon"></div>
        <div className="tool-label">三餐记录</div>
      </div>
      {isExpanded && (
        <div className="notes-panel">
          <div className="notes-header">
            <button className="nav-arrow" onClick={() => navigateDate('prev')} disabled={!canNavigatePrev()}>←</button>
            <span className="notes-date">{currentDate}</span>
            <button className="nav-arrow" onClick={() => navigateDate('next')} disabled={!canNavigateNext()}>→</button>
          </div>
          <textarea
            className="notes-textarea"
            value={dailyNotes.get(currentDate) || ''}
            onChange={handleNotesChange}
            placeholder="在这里输入笔记..."
          />
        </div>
      )}
    </div>
  );
});

export default MealNotes; 