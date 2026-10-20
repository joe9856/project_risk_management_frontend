import { Brand, Icon } from './UI';

export function SiteHeader({ user, view = 'home', onNavigate, onLogin, onLogout }) {
  return <header className="site-header"><div className="site-header-inner">
    <button className="site-brand" onClick={() => onNavigate('home')} aria-label="Risk Management หน้าแรก"><Brand/></button>
    <nav className="site-navigation" aria-label="เมนูหลัก">
      <button aria-current={view === 'home' ? 'page' : undefined} onClick={() => onNavigate('home')}>ภาพรวม</button>
      <button aria-current={view === 'dashboard' ? 'page' : undefined} onClick={() => onNavigate('dashboard')}>ประเมินความเสี่ยง</button>
      {user && <button aria-current={view === 'history' ? 'page' : undefined} onClick={() => onNavigate('history')}>ประวัติ</button>}
      {user?.role === 'admin' && <button aria-current={view === 'admin-users' ? 'page' : undefined} onClick={() => onNavigate('admin-users')}>ผู้ใช้งาน</button>}
    </nav>
    {user ? <div className="site-account"><span title={user.name}>{user.name}</span><button className="icon-button" aria-label="ออกจากระบบ" onClick={onLogout}><Icon name="logout" size={18}/></button></div> : <button className="button button-primary header-login" onClick={onLogin}>เข้าสู่ระบบ <Icon name="arrow" size={16}/></button>}
  </div></header>;
}

function SectionTitle({ first, accent, icon = 'shield', description }) {
  return <div className="reference-heading"><h2>{first}<br/><span>{accent.split('|')[0]} <i><Icon name={icon} size={23}/></i> {accent.split('|')[1]}</span></h2>{description && <p>{description}</p>}</div>;
}

const tools = [
  { name: 'Threat Agent', thai: 'ภัยคุกคาม', icon: 'shield' },
  { name: 'Vulnerability', thai: 'ช่องโหว่', icon: 'lock' },
  { name: 'Technical Impact', thai: 'ผลกระทบทางเทคนิค', icon: 'grid' },
  { name: 'Business Impact', thai: 'ผลกระทบทางธุรกิจ', icon: 'file' },
];

export default function RiskHome({ onStart, onHistory }) {
  return <main className="reference-home" id="main-content">
    <section className="reference-features" aria-labelledby="home-heading">
      <div className="reference-heading"><h1 id="home-heading">มองเห็นความเสี่ยง<br/><span>ก่อนกลายเป็น <i><Icon name="shield" size={25}/></i> ปัญหา</span></h1><p>ประเมิน วิเคราะห์ และวางแผนรับมือ ในพื้นที่เดียว</p></div>
      <div className="reference-bento">
        <article className="glow-card feature-assess">
          <div className="feature-copy"><h2>ประเมินอย่างเป็นระบบ</h2><p>4 หมวด 16 ปัจจัย เพื่อมองความเสี่ยงให้ครบ</p></div>
          <div className="nested-visual" aria-hidden="true"><span/><span/><span/><span/><span/><div><Icon name="shield" size={43}/></div></div>
          <button className="feature-link" onClick={onStart}>เริ่มการประเมิน <Icon name="arrow" size={16}/></button>
        </article>
        <article className="glow-card feature-simple">
          <div className="feature-copy"><h2>ใช้งานได้อย่างลื่นไหล</h2><p>เลือกคะแนนทีละหมวด บนทุกขนาดหน้าจอ</p></div>
          <div className="cursor-visual" aria-hidden="true"><span className="visual-user"><Icon name="users" size={23}/><small>คุณ</small></span><svg className="cursor-path" viewBox="0 0 240 140"><path d="M70 17C-2 72 52 115 126 106" fill="none" stroke="#6467f8" strokeWidth="1" strokeDasharray="4 4"/></svg><span className="floating-action">เลือกคะแนน</span><svg className="visual-pointer" viewBox="0 0 48 48"><path d="M6 4 41 20 25 25 20 41Z" fill="url(#pointer-color)"/><defs><linearGradient id="pointer-color"><stop stopColor="#939aff"/><stop offset="1" stopColor="#3543ff"/></linearGradient></defs></svg></div>
        </article>
        <article className="glow-card feature-ai">
          <div className="chat-visual" aria-hidden="true"><div><i><Icon name="users" size={18}/></i><span>จุดไหนที่ควรจัดการก่อน?</span></div><div><span>ดูคะแนน แล้ววางแผนรับมือ<br/>ให้เหมาะกับบริบทของคุณ</span><i><Icon name="spark" size={18}/></i></div></div>
          <div className="feature-copy"><h2>อีกมุมมองจาก AI</h2><p>ช่วยสรุปผลและเสนอแนวทางจัดการความเสี่ยง</p></div>
        </article>
        <article className="glow-card feature-track">
          <div className="feature-copy"><h2>จากคะแนน สู่แผนรับมือ</h2><p>เห็นระดับความเสี่ยง พร้อมบันทึกและติดตามผล</p></div>
          <div className="tile-visual" aria-hidden="true">{Array.from({length:24},(_,i)=><span key={i} className={i===1 || i===9 ? 'lit' : ''}>{i===1?'ประเมิน':i===9?'รับมือ':''}</span>)}</div>
        </article>
        <article className="glow-card feature-factors">
          <div className="factor-visual" aria-hidden="true">{tools.map(tool=><div key={tool.name}><i><Icon name={tool.icon} size={18}/></i><strong>{tool.name}</strong><small>{tool.thai}</small></div>)}</div>
          <div className="feature-copy"><h2>มองครบทุกมิติ</h2><p>ครอบคลุมทั้งโอกาสเกิดและผลกระทบ</p></div>
        </article>
      </div>
    </section>

    <section className="reference-steps" aria-label="วิธีใช้งาน">
      <SectionTitle first="จากความไม่แน่ใจ" accent="สู่แผน | ที่ชัดเจน" icon="check"/>
      <div className="step-card-grid">
        {[
          ['01','เลือกคะแนนตามจริง','พิจารณาสถานการณ์ของระบบ แล้วเลือกคะแนนทั้ง 16 ปัจจัย เปลี่ยนหมวดได้โดยข้อมูลยังอยู่ครบ','grid','ประเมินความเสี่ยง'],
          ['02','มองภาพรวมให้ชัด','ดูคะแนนรายหมวดและเมทริกซ์ เพื่อเข้าใจโอกาสเกิด ผลกระทบ และส่วนที่ควรให้ความสำคัญ','shield','อ่านผลการประเมิน'],
          ['03','เก็บผลไว้ต่อยอด','ตั้งชื่อและบันทึกการประเมิน กลับมาดูย้อนหลัง หรือดาวน์โหลด PDF สำหรับนำไปใช้ต่อ','file','บันทึกและติดตาม'],
        ].map(([number,title,copy,icon,label])=><article className="glow-card journey-card" key={number}><span className="journey-number">{number}</span><p>{copy}</p><div className="journey-author"><i><Icon name={icon} size={22}/></i><div><h3>{title}</h3><small>{label}</small></div></div></article>)}
      </div>
    </section>

    <section className="reference-actions" aria-label="เครื่องมือจัดการความเสี่ยง">
      <SectionTitle first="เลือกสิ่งที่คุณต้องการ" accent="แล้วเริ่ม | ลงมือทำ" icon="arrow"/>
      <div className="action-card-grid">
        {[
          { title:'เริ่มประเมิน', english:'Risk Assessment', description:'เข้าใจสถานการณ์ของระบบคุณ', icon:'shield', action:'เริ่มการประเมิน', onClick:onStart, points:['ประเมิน 4 หมวด 16 ปัจจัย','เลือกคะแนนตามสถานการณ์จริง','ดูความคืบหน้าระหว่างกรอก','สรุปคะแนนแต่ละหมวด','แสดงเมทริกซ์ความเสี่ยง'] },
          { title:'วิเคราะห์ภาพรวม', english:'Risk Insights', description:'เปลี่ยนคะแนนให้เป็นแนวทางรับมือ', icon:'spark', action:'ประเมินเพื่อวิเคราะห์', onClick:onStart, points:['เปรียบเทียบคะแนนทั้ง 4 หมวด','ดูโอกาสเกิดและผลกระทบ','ระบุส่วนที่ควรให้ความสำคัญ','ขอคำแนะนำประกอบจาก AI','ทบทวนผลตามบริบทของงาน'] },
          { title:'ติดตามและส่งออก', english:'History & Reports', description:'เก็บทุกการประเมินไว้ใช้งานต่อ', icon:'file', action:'ดูประวัติการประเมิน', onClick:onHistory, points:['ตั้งชื่อการประเมิน','บันทึกผลไว้ในบัญชีของคุณ','ค้นหาประวัติที่แสดง','เปิดดูคะแนนรายปัจจัย','ดาวน์โหลดรายงาน PDF'] },
        ].map((item,index)=><article className={'glow-card action-card '+(index===1?'featured':'')} key={item.title}><h3>{item.title}</h3><p>{item.description}</p><div className="action-symbol"><Icon name={item.icon} size={38}/><span>{item.english}</span></div><button className="button button-primary" onClick={item.onClick}>{item.action}<Icon name="arrow" size={16}/></button><ul>{item.points.map(point=><li key={point}><Icon name="check" size={13}/>{point}</li>)}</ul></article>)}
      </div>
    </section>

    <section className="glow-card reference-cta"><h2>อย่าปล่อยให้ความเสี่ยง<br/><span>กลายเป็นเรื่องที่รับมือไม่ทัน</span></h2><p>เริ่มจากการประเมิน เพื่อเห็นภาพและวางแผนขั้นต่อไป</p><button className="button button-primary" onClick={onStart}>เริ่มประเมินความเสี่ยง <Icon name="arrow" size={18}/></button></section>
    <footer className="reference-footer"><Brand/><span>ประเมินอย่างเป็นขั้นตอน · วางแผนอย่างเข้าใจ</span><small>Risk Management Workspace</small></footer>
  </main>;
}
