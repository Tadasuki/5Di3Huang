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
        <p className="footer-copy">© {new Date().getFullYear()} 五帝三皇神圣事 · 仅供参考 · 切勿用作学术研究</p>
        <div className="footer-links">
          <Link to="/about">关于本站</Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">源代码</a>
        </div>
      </div>
    </footer>
  )
}
