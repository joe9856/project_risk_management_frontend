import { Brand, Icon } from './UI';

export default function AuthLayout({ children }) {
  return <main className="auth-layout">
    <section className="auth-story" aria-label="เกี่ยวกับ Risk Management">
      <Brand light/>
      <div className="auth-story-body">
        <span className="eyebrow">เข้าใจความเสี่ยง วางแผนได้ชัดเจน</span>
        <h1>เปลี่ยนความเสี่ยง<br/>ให้เป็นแผนรับมือ</h1>
        <p>ประเมินปัจจัยด้านความปลอดภัย เห็นภาพรวม<br className="desktop-break"/> และติดตามผลได้ในพื้นที่เดียว</p>
        <div className="auth-illustration" aria-hidden="true">
          <div className="illustration-header"><span><Icon name="shield" size={17}/> ภาพรวมการประเมิน</span><span className="illustration-dot"/></div>
          <div className="illustration-chart">{[35, 62, 46, 78].map((height, i) => <div key={i}><span style={{ height: `${height}%` }}/><small>{['ภัยคุกคาม', 'ช่องโหว่', 'เทคนิค', 'ธุรกิจ'][i]}</small></div>)}</div>
          <div className="illustration-caption">ภาพประกอบ · ประเมินจาก 4 หมวด 16 ปัจจัย</div>
        </div>
        <div className="auth-features"><span><Icon name="check" size={16}/> ประเมินอย่างเป็นขั้นตอน</span><span><Icon name="check" size={16}/> บันทึกและส่งออกรายงาน</span></div>
      </div>
      <p className="auth-story-footer">Risk Assessment Workspace</p>
    </section>
    <section className="auth-form-area"><div className="auth-mobile-brand"><Brand/></div><div className="auth-form-card">{children}</div><p className="auth-footer"><Icon name="lock" size={14}/> พื้นที่ทำงานส่วนตัวสำหรับบัญชีของคุณ</p></section>
  </main>;
}
