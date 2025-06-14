import './App.css'
import Pomodoro from './components/Pomodoro';

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
        <div className="glass-panel schedule-panel">
          <div className="panel-title">学习程</div>
          <ul className="schedule-list">
            <li><span className="bullet-point"></span>08:00-11:30 数学模拟考</li>
            <li><span className="bullet-point"></span>15:00-15:30 英语听力训练</li>
            <li><span className="bullet-point"></span>19:00-21:00 理综真题练习</li>
          </ul>
          <button className="sync-button">同步系统日历</button>
        </div>
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
