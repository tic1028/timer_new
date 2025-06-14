import React, { useState, useRef } from 'react';
import './WoodenFish.css';

const WoodenFish: React.FC = () => {
  const [merit, setMerit] = useState(0);
  const [showFloatingText, setShowFloatingText] = useState(false);
  const [floatingText, setFloatingText] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const blessings = ['功德+1', '暴富+1', '健康+1', '幸运+1'];

  const handleClick = () => {
    setMerit(prev => prev + 1);
    // 随机选择一个祝福语
    const randomBlessing = blessings[Math.floor(Math.random() * blessings.length)];
    setFloatingText(randomBlessing);
    setShowFloatingText(true);
    
    // 播放音效
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => console.log('Audio play failed:', error));
    }

    setTimeout(() => {
      setShowFloatingText(false);
    }, 500);
  };

  return (
    <div className="wooden-fish-container">
      <audio ref={audioRef} src="/fish.mp3" preload="auto" />
      <div className="wooden-fish" onClick={handleClick}>
        <img src="/fish.png" alt="Wooden Fish" />
        {showFloatingText && <span className="floating-text">{floatingText}</span>}
      </div>
      <div className="merit-counter">功德：{merit}</div>
    </div>
  );
};

export default WoodenFish;