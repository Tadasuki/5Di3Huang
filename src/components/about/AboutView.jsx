import './AboutView.css'

export default function AboutView() {
  return (
    <div className="about-page" id="about-page">
      <div className="container">
        <div className="about-hero">
          <h1 className="about-title">关于本站</h1>
          <p className="about-desc">
            「五帝三皇神圣事」是一个致力于系统整理中国历代中央政权统治者资料的开源项目。
            我们希望通过现代化的交互方式，让历史知识更加生动直观，让每一位对中国历史感兴趣的人都能方便地查阅和学习。
          </p>
        </div>

        <div className="about-sections">
          <div className="about-card">
            <div className="about-card-icon">🎯</div>
            <h3>项目愿景</h3>
            <p>
              构建中国历代统治者数据库，涵盖从夏朝到中华人民共和国的所有中央政权领导人，
              并提供多维度的分析工具和可视化展示。
            </p>
          </div>

          <div className="about-card">
            <div className="about-card-icon">📖</div>
            <h3>数据来源</h3>
            <p>
              本站数据主要参考《二十四史》《资治通鉴》《中国历代帝王年表》等正史文献，
              辅以现代学术研究成果。所有评分和评价为Claude及Gemini AI模型生成，仅供参考讨论。
            </p>
          </div>
        </div>

        <div className="about-tech">
          <h3 className="about-tech-title">技术栈</h3>
          <div className="tech-stack">
            <div className="tech-badge">⚡ Vite</div>
            <div className="tech-badge">⚛️ React</div>
            <div className="tech-badge">🗺️ MapTiler SDK</div>
            <div className="tech-badge">📊 Chart.js</div>
            <div className="tech-badge">🎨 CSS Variables</div>
            <div className="tech-badge">📝 JSON Data</div>
          </div>
        </div>

        <div className="about-disclaimer">
          <h4>⚠️ 免责声明</h4>
          <p>
            本站内容仅供了解历史、科普历史之用。对历史人物的评价和评分基于AI和编者对历史文献的理解，可能存在主观性，不代表任何官方立场。如有疑义，请以正式学术出版物为准。
          </p>
        </div>
      </div>
    </div>
  )
}
