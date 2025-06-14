import './App.css'
import Pomodoro from './components/Pomodoro';
import Schedule from './components/Schedule';

function App() {
  return (
    <div className="app-container">
      <div className="glass-panel main-panel">
        <div className="glass-panel date-time-panel">
          <div className="date-display">
            2025年5月30日 星期五
            <br />
            农历五月廿五 · 端午节
          </div>
          <div className="time-display">
            20:58
            <span className="countdown-text">
              距离高考还有
              <span className="countdown-days">8天</span>
            </span>
          </div>
        </div>
        <Pomodoro />
        <Schedule />
        <div className="glass-panel tools-panel">
          <div className="tool-grid">
            <div className="tool-item">
              <div className="tool-icon"></div>
              <div className="tool-label">更换壁纸</div>
            </div>
            <div className="tool-item">
              <div className="tool-icon"></div>
              <div className="tool-label">正计时</div>
            </div>
            <div className="tool-item">
              <div className="tool-icon"></div>
              <div className="tool-label">笔记</div>
            </div>
            <div className="tool-item">
              <div className="tool-icon"></div>
              <div className="tool-label">伴摸镜</div>
            </div>
            <div className="tool-item">
              <div className="tool-icon"></div>
              <div className="tool-label">单词本</div>
            </div>
            <div className="tool-item">
              <div className="tool-icon"></div>
              <div className="tool-label">译溯译</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
