import React, { useState, useEffect } from 'react';

const Notes: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem('generalNotes');
    return savedNotes || '';
  });

  useEffect(() => {
    localStorage.setItem('generalNotes', notes);
  }, [notes]);

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
      <div className="tool-item general-notes-tool-item" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="tool-icon"></div>
        <div className="tool-label">笔记</div>
      </div>

      {isExpanded && (
        <div className="notes-panel">
          <button className="close-button" onClick={() => setIsExpanded(false)}>
            &times;
          </button>
          <textarea
            className="notes-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="在这里输入通用笔记..."
          />
        </div>
      )}
    </div>
  );
};

export default Notes;
