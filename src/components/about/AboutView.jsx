import { Link } from 'react-router-dom'
import './AboutView.css'

export default function AboutView() {
  return (
    <div className="about-page" id="about-page">
      <div className="container">
        <div className="about-hero">
          <h1 className="about-title">关于本站</h1>
          <div className="about-quote" style={{
            margin: 'var(--space-2xl) auto var(--space-2xl)',
            padding: 'var(--space-md) clamp(10px, 3vw, var(--space-xl))',
            maxWidth: '680px',
            borderTop: '1px dashed var(--color-border)',
            borderBottom: '1px dashed var(--color-border)',
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', background: 'transparent', padding: '0 16px', fontSize: '2rem', color: 'var(--color-gold-light)', lineHeight: '1', fontFamily: 'var(--font-serif)' }}>
              ❝
            </div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(0.88rem, 4.5vw, 1.25rem)', lineHeight: '2.2', color: 'var(--color-text-primary)', textAlign: 'center', margin: 'var(--space-lg) 0 var(--space-md) 0', whiteSpace: 'nowrap' }}>
              五帝三皇神圣事，骗了无涯过客。<br />
              有多少风流人物？<br />
              盗跖庄蹻流誉后，更陈王奋起挥黄钺。<br />
              歌未竟，东方白。
            </p>
            <div style={{ textAlign: 'right', fontSize: 'clamp(0.75rem, 3.8vw, 1.05rem)', color: 'var(--color-gold)', fontFamily: 'var(--font-serif)', whiteSpace: 'nowrap' }}>
              —— <Link to="/leader/mao_zedong" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationThickness: '0.7px' }}>毛泽东</Link>《贺新郎·读史》
            </div>
          </div>

          <h2 style={{ textAlign: 'center', fontFamily: 'var(--font-serif)', fontWeight: '900', fontSize: '1.3rem', color: '#826445ff', marginBottom: 'var(--space-sm)' }}>
            编者的话
          </h2>
          <div className="about-desc">
            <p>「五帝三皇神圣事」是一个开源的历史人物百科数据库。本站名称取自上方毛泽东词《贺新郎·读史》，这组高度凝炼的句子，以历史唯物主义的视角，客观梳理了华夏几千载的统治更迭。网站图标为一个钟表，抽象自司马光“君者表也，臣者景也，表动则景随矣。” 这里的“表”是指标杆，也就是中国古代的钟——日晷的那根标杆，暗喻统治者应当为天下之表率，最起码要做对得起人民的事情。</p>
            <p>网站建立的最初灵感，来源于互联网上广受欢迎的各类性格测试与人物原型分析。我们最初只是想让用户通过答题寻找“自己最像哪位君主/领袖”。但随着思考的深入，我们的野心开始向更深处扎根：我们不仅想让用户知道自己“像谁”，更想让用户探寻这些执政者究竟“是谁”，于是我们需要一个更亲近读者的数据库去记录这些执政者。在我们之前，中文互联网上也早已存在这些做得很好的网站，例如全历史（<a href="https://www.allhistory.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4a9eff', textDecoration: 'underline' }}>allhistory.com</a>），全历史网页的内容制作精良，不仅收录了国内外重要人物，还记载了丰富的历史事件等。但是我们要做的事情和他们不一样。</p>
            <p>我们想要向大家传递不仅仅是历史知识，更是一个核心观点——<strong>封建帝王与现代领袖都不应是高高在上的。</strong> 与毛泽东诗词所传达的思想一致，历史唯物主义清醒地揭示：<strong>唯有人民，才是创造历史的真正动力。</strong> 哪怕是史册中最耀眼的星辰，也不过是历史大潮激荡起的浪花。即使是传统叙事中所谓“仁政之君”，也往往无法掩盖其虚伪的反动本质；他们的所谓“仁政”并非源于纯粹的仁慈，而是为了巩固自己的统治地位。这些事实不仅体现在古代君主皇帝，也适用于现代所谓的主席书记、民选总统。我们不需要为了所谓的出版物经营许可证和各种各样的备案去审核自己的内容，我们也不会去迎合任何政党、意识形态。我们反对任何宏大叙事的内容，因为我们在此记录人物，并非源于英雄史观的崇拜，而是为了从这些鲜活的个体与剧变的时代中，看到那不以人的意志为转移的历史规律，从而照见我们每一个人自己，<strong>我们坚信历史不是由君主帝王和伟大领袖创造的，而是由你、我这样平凡的民众共同书写的</strong>。</p>
            <p>编者本人是一名双重外行，既不是历史等文学专业的学生，也不是计算机等带电工科专业的学生，只凭热爱建立此站，如有纰误敬请友好指正。随着基础框架的搭建，未来的扩展将聚焦于：数据打磨（重大事件与历史人物）、更多维的资料联动（体制与疆域面积演变）、增强地理历史学、分子人类学等自然学科和理工科的交叉内容。以及构建臣子、藩王等更广泛的网状知识体系图谱。</p>
          </div>
        </div>


        <div className="about-disclaimer" style={{ marginTop: 'var(--space-xl)', marginBottom: 'var(--space-3xl)', padding: 'var(--space-xl)', background: 'color-mix(in srgb, var(--color-vermilion) 8%, transparent)', borderRadius: 'var(--radius-lg)', border: '1px solid color-mix(in srgb, var(--color-vermilion) 30%, transparent)' }}>
          <h4 style={{ color: 'var(--color-vermilion)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.4rem', margin: '0 0 var(--space-md)' }}>
            <span>⚠️</span> 致歉与声明
          </h4>
          <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, fontSize: '1rem' }}>
            <p style={{ marginBottom: 'var(--space-md)' }}>
              我们深知，历史人物的评价往往具有极强的时代局限性与主观色彩。本网站的资料为四方收集而来，并经过数轮 AI 与编者的琢磨，力求有一定程度的客观与中立。
            </p>
            <p style={{ marginBottom: 'var(--space-md)' }}>
              本站持坚定的历史唯物主义观点，这无可避免地会受到现有古籍文献倾向甚至现代史观的干扰。部分历史见解、评分维度、或是特定人物政权的归属认定，可能<strong>不能符合所有访客的观念</strong>（例如两岸各自的正统政治性叙事准则）。
            </p>
            <p style={{ marginBottom: 'var(--space-md)' }}>
              <strong>我们绝对无意、也不对、更坚决反对任何刻意美化或抹黑历史执政者的行为</strong>。不论是千古一帝还是伟大领袖，盖棺定论，他们的历史功过均已成为过往云烟，本项目仅仅作为一份数字化归档。请各位访客<strong>务必辩证看待</strong>，切莫将本站数据作为严格的学术引用或者敏感的政治辩论依据。因教育背景与认知差异带来的冒犯，我们在此提前致以诚挚的歉意。
            </p>
            <p style={{ marginBottom: '0', marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-md)', fontSize: '1rem' }}>
              <strong>错误指正：</strong> 鉴于五千年文明浩如烟海，错漏在所难免（如事件细节错误、单倍群归属错误等）。在此恳请大家发现事实性错误时，移步 GitHub 提交 Issue 友好指出，我们将尽快核实并修正！友好交流，理性读史。
            </p>
          </div>
        </div>

        <div className="about-tech">
          <h3 className="about-tech-title">AI 核心</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)', fontSize: '0.95rem', lineHeight: 1.6 }}></p>
          <div className="tech-stack" style={{ marginBottom: 'var(--space-2xl)' }}>
            <a href="https://www.anthropic.com/claude/opus" target="_blank" rel="noopener noreferrer" className="tech-badge" style={{ padding: '8px 16px', fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
              <img src="https://cdn.simpleicons.org/anthropic/white" width="18" height="18" alt="Claude" style={{ marginRight: '8px', filter: 'invert(53%) sepia(21%) saturate(2333%) hue-rotate(336deg) brightness(96%) contrast(81%)' }} />
              Claude Opus 4.6
            </a>
            <a href="https://deepmind.google/models/gemini/" target="_blank" rel="noopener noreferrer" className="tech-badge" style={{ padding: '8px 16px', fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
              <img src="https://cdn.simpleicons.org/googlegemini/1B73E8" width="18" height="18" alt="Gemini" style={{ marginRight: '8px' }} />
              Gemini 3.1 Pro / 3 Flash
            </a>
            <a href="https://platform.openai.com/docs/models/all" target="_blank" rel="noopener noreferrer" className="tech-badge" style={{ padding: '8px 16px', fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
              <img src="https://images.icon-icons.com/4252/PNG/512/chatgpt_logo_chatgpt_logo_square_green_gpt_ia_openai_icon_264977.png" width="18" height="18" alt="GPT" />
              GPT-5.3 Codex / 5.2
            </a>
          </div>

          <h3 className="about-tech-title">参考资料</h3>
          <div className="tech-stack" style={{ marginBottom: 'var(--space-2xl)' }}>
            <a href="https://www.wikipedia.org/" target="_blank" rel="noopener noreferrer" className="tech-badge" style={{ padding: '8px 16px', fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
              <img src="https://images.icon-icons.com/2699/PNG/512/wikipedia_logo_icon_168863.png" width="16" height="16" alt="维基百科" style={{ marginRight: '8px' }} />
              维基百科
            </a>
            <a href="https://www.shidianguji.com/" target="_blank" rel="noopener noreferrer" className="tech-badge" style={{ padding: '8px 16px', fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
              <img src="https://favicon.im/www.shidianguji.com" width="16" height="16" alt="识典古籍" style={{ marginRight: '8px' }} />
              识典古籍
            </a>
            <a href="https://ctext.org/zhs" target="_blank" rel="noopener noreferrer" className="tech-badge" style={{ padding: '8px 16px', fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
              <img src="https://ctext.org/favicon.ico" width="16" height="16" alt="中国哲学书电子化计划" style={{ marginRight: '8px' }} />
              中国哲学书电子化计划
            </a>
            <a href="https://www.cnki.net/" target="_blank" rel="noopener noreferrer" className="tech-badge" style={{ padding: '8px 16px', fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
              <img src="https://www.cnki.net/favicon.ico" width="16" height="16" alt="中国知网" style={{ marginRight: '8px' }} />
              中国知网
            </a>
            <a href="https://www.23mofang.com/ancestry/library-family?type=gene" target="_blank" rel="noopener noreferrer" className="tech-badge" style={{ padding: '8px 16px', fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
              <img src="https://www.23mofang.com/favicon.ico" width="16" height="16" alt="23mofang" style={{ marginRight: '8px' }} />
              23mofang
            </a>
          </div>

          <h3 className="about-tech-title">技术栈基底</h3>
          <div className="tech-stack">
            <a href="https://vite.dev/" target="_blank" rel="noopener noreferrer" className="tech-badge" style={{ display: 'flex', alignItems: 'center' }}>
              <img src="https://cdn.simpleicons.org/vite" width="16" height="16" alt="Vite" style={{ marginRight: '8px' }} /> Vite
            </a>
            <a href="https://zh-hans.react.dev/" target="_blank" rel="noopener noreferrer" className="tech-badge" style={{ display: 'flex', alignItems: 'center' }}>
              <img src="https://cdn.simpleicons.org/react" width="16" height="16" alt="React" style={{ marginRight: '8px' }} /> React
            </a>
            <a href="https://docs.maptiler.com/sdk-js/" target="_blank" rel="noopener noreferrer" className="tech-badge" style={{ display: 'flex', alignItems: 'center' }}>
              <img src="https://cdn.simpleicons.org/maptiler" width="16" height="16" alt="MapTiler" style={{ marginRight: '8px' }} /> MapTiler SDK
            </a>
            <a href="https://www.chartjs.org/" target="_blank" rel="noopener noreferrer" className="tech-badge" style={{ display: 'flex', alignItems: 'center' }}>
              <img src="https://cdn.simpleicons.org/chartdotjs" width="16" height="16" alt="Chart.js" style={{ marginRight: '8px' }} /> Chart.js
            </a>
            <a href="https://developer.mozilla.org/zh-CN/docs/Web/CSS/Using_CSS_custom_properties" target="_blank" rel="noopener noreferrer" className="tech-badge" style={{ display: 'flex', alignItems: 'center' }}>
              <img src="https://cdn.simpleicons.org/css/1572B6" width="16" height="16" alt="CSS" style={{ marginRight: '8px' }} /> CSS Variables
            </a>
          </div>

          <h3 className="about-tech-title" style={{ marginTop: 'var(--space-2xl)' }}>字体栈</h3>
          <div className="tech-stack">
            <a href="https://www.npmjs.com/package/@fontpkg/oppo-sans-4-0" target="_blank" rel="noopener noreferrer" className="tech-badge">
              <span className="font-stack-icon" style={{ fontFamily: "OPPO Sans" }}>永</span>
              OPPO Sans
            </a>
            <a href="https://fonts.google.com/noto/specimen/Noto+Serif+SC" target="_blank" rel="noopener noreferrer" className="tech-badge">
              <span className="font-stack-icon" style={{ fontFamily: "Noto Serif SC" }}>永</span>
              思源宋体
            </a>
            <a href="https://www.npmjs.com/package/@fontpkg/chill-kai" target="_blank" rel="noopener noreferrer" className="tech-badge">
              <span className="font-stack-icon" style={{ fontFamily: "Han Chan ZhengKai", fontWeight: 700 }}>永</span>
              寒蝉正楷
            </a>
            <a href="https://www.jetbrains.com/lp/mono/" target="_blank" rel="noopener noreferrer" className="tech-badge">
              <span className="font-stack-icon" style={{ fontFamily: "JetBrains Mono" }}>M</span>
              JetBrains Mono
            </a>
            <a href="https://github.com/tonsky/FiraCode" target="_blank" rel="noopener noreferrer" className="tech-badge">
              <span className="font-stack-icon" style={{ fontFamily: "Fira Code" }}>M</span>
              Fira Code
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
