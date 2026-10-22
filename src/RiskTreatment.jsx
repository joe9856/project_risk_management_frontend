/**
 * RiskTreatment.jsx
 * แผนรับมือความเสี่ยง (Risk Treatment Plan)
 * อิงตามมาตรฐาน ISO 31000:2018 Risk Management
 */
import { useState } from 'react';
import { Icon } from './UI';

const treatmentOptions = [
  {
    id: 'mitigate',
    label: 'ลดความเสี่ยง',
    english: 'Mitigate',
    icon: 'shield',
    color: '#84e0b5',
    bg: '#142e2b',
    border: '#326351',
    description: 'ดำเนินการควบคุมเพื่อลดโอกาสเกิดหรือผลกระทบให้อยู่ในระดับที่ยอมรับได้',
    isoRef: 'ISO 31000:2018 §6.5.2',
    examples: [
      'ติดตั้ง WAF / IDS / IPS เพื่อกรองการโจมตี',
      'บังคับใช้ MFA ทุกบัญชีที่มีสิทธิ์สูง',
      'อบรม Security Awareness ให้ทีมงาน',
      'ทำ Penetration Testing สม่ำเสมอ',
    ],
  },
  {
    id: 'avoid',
    label: 'หลีกเลี่ยง',
    english: 'Avoid',
    icon: 'close',
    color: '#ffacb5',
    bg: '#351e32',
    border: '#714050',
    description: 'ยกเลิกหรือปรับเปลี่ยนกิจกรรมที่ทำให้เกิดความเสี่ยงนั้น',
    isoRef: 'ISO 31000:2018 §6.5.2',
    examples: [
      'ปิดฟีเจอร์ที่ไม่จำเป็นและมีความเสี่ยงสูง',
      'ย้ายข้อมูลสำคัญออกจากระบบที่ไม่ปลอดภัย',
      'ยกเลิกการใช้ Library / Dependency ที่มีช่องโหว่',
      'จำกัดการเข้าถึงจากเครือข่ายภายนอก',
    ],
  },
  {
    id: 'transfer',
    label: 'โอนความเสี่ยง',
    english: 'Transfer / Share',
    icon: 'users',
    color: '#f5d27d',
    bg: '#332d1e',
    border: '#7a6830',
    description: 'แบ่งปันหรือโอนความเสี่ยงไปให้บุคคลที่สามที่มีความพร้อมมากกว่า',
    isoRef: 'ISO 31000:2018 §6.5.2',
    examples: [
      'ทำประกัน Cyber Insurance คุ้มครองความเสี่ยงดิจิทัล',
      'จ้าง MSSP (Managed Security Service Provider)',
      'ใช้บริการ Cloud ที่มี SLA และ Compliance รับรอง',
      'ทำสัญญา NDA กับคู่ค้าและผู้ให้บริการ',
    ],
  },
  {
    id: 'accept',
    label: 'ยอมรับ',
    english: 'Accept / Retain',
    icon: 'check',
    color: '#a4a8ff',
    bg: '#1d2149',
    border: '#4a4f8c',
    description: 'รับทราบความเสี่ยงที่มีอยู่ เหมาะกับความเสี่ยงต่ำที่ต้นทุนรับมือสูงเกินไป',
    isoRef: 'ISO 31000:2018 §6.5.2',
    examples: [
      'บันทึกการตัดสินใจ Accept ใน Risk Register อย่างเป็นทางการ',
      'กำหนด Risk Owner รับผิดชอบและติดตามผล',
      'ตั้ง Alert เมื่อคะแนนความเสี่ยงเปลี่ยนแปลง',
      'กำหนดรอบทบทวนใหม่ในไตรมาสถัดไป',
    ],
  },
];

const riskGuidance = {
  'badge-low': {
    recommended: 'accept',
    label: 'ความเสี่ยงต่ำ (0–15)',
    guidance: 'ยอมรับและติดตามผล — ทบทวนรอบถัดไป',
    nistRef: 'NIST CSF: Identify › Risk Assessment (ID.RA)',
  },
  'badge-medium': {
    recommended: 'mitigate',
    label: 'ความเสี่ยงปานกลาง (16–35)',
    guidance: 'วางแผนลดความเสี่ยงภายใน 90 วัน',
    nistRef: 'NIST CSF: Protect › Access Control (PR.AC)',
  },
  'badge-high': {
    recommended: 'mitigate',
    label: 'ความเสี่ยงสูง (36+)',
    guidance: 'ดำเนินการเร่งด่วนภายใน 30 วัน',
    nistRef: 'NIST CSF: Respond › Improvements (RS.IM)',
  },
};

const factorLabels = {
  skillLevel: 'ระดับทักษะ', motive: 'แรงจูงใจ', opportunity: 'โอกาส', size: 'ขนาดของกลุ่ม',
  easeOfDiscovery: 'ค้นหาช่องโหว่', easeOfExploit: 'โจมตีช่องโหว่', awareness: 'ความตระหนักรู้', intrusionDetection: 'ระบบตรวจจับ',
  lossOfConfidentiality: 'ความลับข้อมูล', lossOfIntegrity: 'ความถูกต้องข้อมูล', lossOfAvailability: 'ความพร้อมระบบ', lossOfAccountability: 'ความรับผิดชอบ',
  financialDamage: 'ความเสียหายการเงิน', reputationDamage: 'ความเสียหายชื่อเสียง', nonCompliance: 'ไม่เป็นไปตามข้อกำหนด', privacyViolation: 'ละเมิดความเป็นส่วนตัว',
};

export default function RiskTreatment({ riskClass, scores, categories }) {
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState({});
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState('');

  const guidance = riskGuidance[riskClass] || riskGuidance['badge-medium'];

  // คำนวณ factor สูงสุดในแต่ละ category
  const topFactors = categories.map(cat => {
    const catScores = scores[cat.id];
    const sorted = cat.factors
      .map(f => ({ factor: f, score: catScores[f] }))
      .filter(f => f.score > 0)
      .sort((a, b) => b.score - a.score);
    return { category: cat, top: sorted[0] };
  }).filter(item => item.top && item.top.score >= 5);

  return (
    <section className="panel treatment-panel" aria-labelledby="treatment-heading">
      <div className="treatment-header">
        <div className="treatment-title">
          <span className="treatment-badge">ISO 31000:2018</span>
          <div>
            <h2 id="treatment-heading">แผนรับมือความเสี่ยง</h2>
            <p>เลือกกลยุทธ์ Risk Treatment ที่เหมาะสมกับระดับความเสี่ยงของคุณ</p>
          </div>
        </div>
        <div className="treatment-guidance">
          <div className="guidance-dot-wrapper">
            <span className="guidance-dot" />
          </div>
          <div>
            <strong>{guidance.guidance}</strong>
            <small>{guidance.nistRef}</small>
          </div>
        </div>
      </div>

      {/* Treatment Strategy Cards */}
      <div className="treatment-grid">
        {treatmentOptions.map(option => (
          <button
            key={option.id}
            className={`treatment-card${selected === option.id ? ' selected' : ''}${option.id === guidance.recommended ? ' is-recommended' : ''}`}
            style={selected === option.id ? { borderColor: option.border, background: option.bg + 'cc' } : {}}
            onClick={() => setSelected(selected === option.id ? null : option.id)}
            aria-pressed={selected === option.id}
          >
            <div className="treatment-card-header">
              <span className="treatment-icon" style={{ color: option.color, background: option.bg, border: `1px solid ${option.border}` }}>
                <Icon name={option.icon} size={17} />
              </span>
              <div className="treatment-card-labels">
                <strong style={selected === option.id ? { color: option.color } : {}}>{option.label}</strong>
                <small>{option.english}</small>
              </div>
              {option.id === guidance.recommended && (
                <span className="recommended-tag" style={{ color: option.color, borderColor: option.border, background: option.bg }}>
                  แนะนำ
                </span>
              )}
            </div>
            <p className="treatment-desc">{option.description}</p>
            <span className="iso-ref">{option.isoRef}</span>

            {selected === option.id && (
              <div className="treatment-examples" onClick={e => e.stopPropagation()}>
                <h4>ตัวอย่างการดำเนินการ</h4>
                <ul>
                  {option.examples.map((ex, i) => (
                    <li key={i}><Icon name="check" size={12} />{ex}</li>
                  ))}
                </ul>
                <div className="treatment-form">
                  <div className="treatment-form-row">
                    <div className="treatment-field">
                      <label htmlFor={`owner-${option.id}`}>ผู้รับผิดชอบ (Risk Owner)</label>
                      <input
                        id={`owner-${option.id}`}
                        placeholder="ชื่อหรือหน่วยงาน"
                        value={owner}
                        onChange={e => setOwner(e.target.value)}
                      />
                    </div>
                    <div className="treatment-field">
                      <label htmlFor={`due-${option.id}`}>กำหนดดำเนินการภายใน</label>
                      <input
                        id={`due-${option.id}`}
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <label htmlFor={`notes-${option.id}`}>บันทึกแผนการดำเนินการ</label>
                  <textarea
                    id={`notes-${option.id}`}
                    placeholder="รายละเอียดแผนรับมือ วิธีดำเนินการ และขั้นตอนที่วางไว้..."
                    rows={3}
                    value={notes[option.id] || ''}
                    onChange={e => setNotes(prev => ({ ...prev, [option.id]: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* High-Risk Factors Spotlight */}
      {topFactors.length > 0 && (
        <div className="treatment-factors">
          <h3><Icon name="info" size={14} /> ปัจจัยที่ควรให้ความสำคัญ (คะแนน ≥ 5)</h3>
          <div className="factor-spotlight-grid">
            {topFactors.map(({ category, top }) => (
              <div key={category.id} className={`factor-spotlight ${top.score >= 7 ? 'spotlight-high' : top.score >= 5 ? 'spotlight-medium' : 'spotlight-low'}`}>
                <span className="spotlight-score">{top.score}</span>
                <div>
                  <strong>{category.shortTitle || category.title}</strong>
                  <small>{factorLabels[top.factor] || top.factor}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="treatment-footer">
        <Icon name="info" size={13} />
        <span>แผนรับมือนี้อ้างอิง ISO 31000:2018 และ NIST Cybersecurity Framework v2.0 ใช้ประกอบการตัดสินใจ ควรปรับให้เข้ากับบริบทองค์กร</span>
      </div>
    </section>
  );
}
