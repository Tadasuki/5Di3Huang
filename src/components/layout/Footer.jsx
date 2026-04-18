import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-brand-icon">🕰️</span>
          <span className="footer-brand-name">五帝三皇神圣事</span>
        </div>
        <div className="footer-copy" style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 6px 0' }}>© {new Date().getFullYear()} 五帝三皇神圣事 · 仅供娱乐参考 · 切勿用作专业学术研究</p>
          <p style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hans" target="_blank" rel="noopener noreferrer" style={{ display: 'flex' }}>
              <img alt="知识共享许可协议" style={{ borderWidth: 0, height: '22px', width: 'auto' }} src="https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by-sa.svg" />
            </a>
            <span>本站内容采用 <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hans" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>CC BY-SA 4.0</a> 协议开放版权</span>
          </p>
        </div>
        <div className="footer-links">
          <Link to="/about">关于本站</Link>
          <a href="https://github.com/Tadasuki/5Di3Huang" target="_blank" rel="noopener noreferrer">源代码</a>
        </div>
      </div>
    </footer>
  )
}
