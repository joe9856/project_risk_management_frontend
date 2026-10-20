import { useState, useEffect } from 'react';
import { getActivities } from './api';
import { Dialog, Icon } from './UI';

const actionLabels = { CREATE_RISK: 'บันทึกการประเมิน', UPDATE_RISK: 'แก้ไขการประเมิน', DELETE_RISK: 'ลบการประเมิน', LOGIN: 'เข้าสู่ระบบ', REGISTER: 'สร้างบัญชี', CREATE_USER: 'เพิ่มผู้ใช้งาน', UPDATE_USER: 'แก้ไขผู้ใช้งาน', DELETE_USER: 'ลบผู้ใช้งาน' };
const riskLabels = { Low: 'ต่ำ', Medium: 'ปานกลาง', High: 'สูง', Critical: 'วิกฤต' };
const categoryLabels = { threatAgent: 'ภัยคุกคาม', vulnerability: 'ช่องโหว่', technicalImpact: 'ผลกระทบทางเทคนิค', businessImpact: 'ผลกระทบทางธุรกิจ' };
const factorLabels = {
  skillLevel: 'ระดับทักษะ', motive: 'แรงจูงใจ', opportunity: 'โอกาส', size: 'ขนาดของกลุ่ม',
  easeOfDiscovery: 'ความง่ายในการค้นหา', easeOfExploit: 'ความง่ายในการโจมตี', awareness: 'ความตระหนักรู้', intrusionDetection: 'ระบบตรวจจับ',
  lossOfConfidentiality: 'การรักษาความลับ', lossOfIntegrity: 'ความถูกต้องของข้อมูล', lossOfAvailability: 'ความพร้อมใช้งาน', lossOfAccountability: 'ความรับผิดชอบ',
  financialDamage: 'ความเสียหายทางการเงิน', reputationDamage: 'ความเสียหายต่อชื่อเสียง', nonCompliance: 'การไม่เป็นไปตามข้อกำหนด', privacyViolation: 'การละเมิดความเป็นส่วนตัว'
};
function parseDetail(log) {
  if (!log.detail) return null;
  if (typeof log.detail !== 'string') return log.detail;
  try { return JSON.parse(log.detail); } catch { return null; }
}
function parseInputs(detail) {
  if (typeof detail?.inputs !== 'string') return detail?.inputs;
  try { return JSON.parse(detail.inputs); } catch { return null; }
}
function formatDate(value) {
  return new Date(value).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function UserHistory({ user, addToast, onNewAssessment }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getActivities().then(response => {
      if (!active) return;
      if (!response.success) throw new Error(response.message || 'โหลดประวัติไม่สำเร็จ');
      setLogs(response.data);
      setTotal(response.pagination?.total ?? response.data.length);
    }).catch(error => { if (active) setError(error.message || 'เชื่อมต่อไม่ได้ กรุณาลองใหม่'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);

    const exportLogPDF = async (log) => {
        const detail = parseDetail(log);
        if (!detail) return;

        try {
            setIsExporting(true);
            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
            const doc = new jsPDF('p', 'mm', 'a4');
            const fontUrl = '/fonts/Sarabun-Regular.ttf';

            let base64Font = '';
            try {
                const response = await fetch(fontUrl, { signal: AbortSignal.timeout(10000) });
                if (!response.ok) throw new Error('Report font is unavailable');
                const buffer = await response.arrayBuffer();
                const bytes = new Uint8Array(buffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                base64Font = window.btoa(binary);
                doc.addFileToVFS('Sarabun.ttf', base64Font);
                doc.addFont('Sarabun.ttf', 'Sarabun', 'normal');
                doc.setFont('Sarabun');
            } catch (err) { console.warn(err); }

            const hasThai = base64Font.length > 0;
            doc.setFontSize(22);
            if (hasThai) doc.setFont('Sarabun', 'normal');
            doc.text(hasThai ? "รายงานประเมินความเสี่ยง (ย้อนหลัง)" : "Risk Assessment Report (History)", 105, 20, { align: 'center' });

            doc.setFontSize(12);
            doc.text(`Assessor: ${user?.name || 'User'}`, 20, 35);
            doc.text(`Date of Assessment: ${new Date(log.created_at).toLocaleString('th-TH')}`, 20, 42);
            doc.text(`Assessment ID: #${log.id}`, 20, 49);

            let inputs = detail.inputs;
            if (typeof inputs === 'string') try { inputs = JSON.parse(inputs); } catch (e) { }

            const calcSum = (obj) => obj ? Object.values(obj).reduce((a, b) => a + b, 0) : 0;

            autoTable(doc, {
                startY: 60,
                head: [[
                    hasThai ? 'หมวดหมู่การประเมิน' : 'Category',
                    hasThai ? 'คะแนนรวม' : 'Score',
                    hasThai ? 'สถานะ' : 'Status'
                ]],
                body: [
                    [hasThai ? 'ปัจจัยด้านคุกคาม' : 'Threat Agent', calcSum(inputs?.threatAgent), 'Normal'],
                    [hasThai ? 'ปัจจัยด้านช่องโหว่' : 'Vulnerability', calcSum(inputs?.vulnerability), 'Normal'],
                    [hasThai ? 'ผลกระทบด้านเทคนิค' : 'Technical Impact', calcSum(inputs?.technicalImpact), 'Normal'],
                    [hasThai ? 'ผลกระทบด้านธุรกิจ' : 'Business Impact', calcSum(inputs?.businessImpact), 'Normal'],
                ],
                styles: { font: hasThai ? 'Sarabun' : 'helvetica', fontSize: 12, cellPadding: 3 },
                headStyles: { fillColor: [37, 99, 235], fontStyle: 'normal' },
                columnStyles: {
                    1: { halign: 'center' },
                    2: { halign: 'center' }
                },
                theme: 'grid'
            });

            const finalY = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(16);
            doc.text(hasThai ? "สรุปผลระดับความเสี่ยง" : "Risk Level Summary", 20, finalY);

            doc.setFontSize(14);
            const riskLevel = detail.result?.risk_level || 'N/A';
            doc.text(`${hasThai ? 'ระดับความเสี่ยง' : 'Risk Level'}: ${riskLevel}`, 20, finalY + 10);

            doc.save(`Risk_Report_${log.id}.pdf`);
            if (addToast) addToast("สำเร็จ", "ส่งออกรายงาน PDF เรียบร้อยแล้ว", "success");
        } catch (err) {
            if (addToast) addToast("ผิดพลาด", "ไม่สามารถสร้าง PDF ได้", "error");
        } finally {
            setIsExporting(false);
        }
    };


  const filtered = logs.filter(log => ((parseDetail(log)?.title || '') + ' ' + (actionLabels[log.action] || log.action)).toLowerCase().includes(search.toLowerCase()));
  const detail = selectedLog ? parseDetail(selectedLog) : null;
  const inputs = parseInputs(detail);

  return <div className="collection-page">
    <div className="page-heading"><div><span className="eyebrow">ASSESSMENT HISTORY</span><h1>ประวัติการประเมิน</h1><p>ย้อนดูผลการประเมินและกิจกรรมในบัญชีของคุณ</p></div><button className="button button-primary" onClick={onNewAssessment}><Icon name="grid" size={17}/> ประเมินใหม่</button></div>
    {loading ? <div className="loading-state" role="status"><span className="spinner"/><p>กำลังโหลดประวัติของคุณ</p></div> : error ? <div className="empty-state error-state" role="alert"><Icon name="info" size={32}/><h2>ยังโหลดประวัติไม่ได้</h2><p>{error}</p><button className="button button-secondary" onClick={() => setRetry(value => value + 1)}>ลองอีกครั้ง</button></div> : logs.length === 0 ? <div className="empty-state"><Icon name="history" size={38}/><h2>เริ่มต้นการประเมินครั้งแรก</h2><p>เมื่อบันทึกผลแล้ว ประวัติและรายงานของคุณจะแสดงที่นี่</p><button className="button button-primary" onClick={onNewAssessment}>เริ่มประเมิน <Icon name="arrow" size={17}/></button></div> : <>
      <div className="history-controls"><label className="sr-only" htmlFor="history-search">ค้นหาในประวัติที่แสดง</label><input id="history-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาชื่อหรือกิจกรรมในรายการที่แสดง"/><span>แสดงล่าสุด {logs.length} จาก {total} รายการ</span></div>
      {filtered.length === 0 ? <div className="empty-state"><Icon name="file" size={32}/><h2>ไม่พบรายการที่ค้นหา</h2><p>ลองใช้คำค้นอื่น หรือล้างคำค้นเพื่อดูรายการทั้งหมด</p><button className="button button-secondary" onClick={() => setSearch('')}>ล้างคำค้น</button></div> : <div className="table-panel"><table className="data-table history-table"><thead><tr><th scope="col">กิจกรรม</th><th scope="col">รายละเอียด</th><th scope="col">วันที่และเวลา</th><th scope="col">รายงาน</th></tr></thead><tbody>{filtered.map(log => {
        const item = parseDetail(log);
        return <tr key={log.id}><td><span className={'activity-tag ' + (log.action === 'CREATE_RISK' ? 'created' : '')}>{actionLabels[log.action] || log.action}</span></td><td className="history-title"><strong>{item?.title || (log.action === 'LOGIN' ? 'เข้าใช้งานบัญชีของคุณ' : log.action === 'REGISTER' ? 'บัญชีพร้อมใช้งาน' : 'กิจกรรมในบัญชี')}</strong>{item?.result && <small>ความเสี่ยง{riskLabels[item.result.risk_level] || item.result.risk_level} · คะแนนเมทริกซ์ {item.result.score}/25</small>}</td><td className="history-time"><time dateTime={log.created_at}>{formatDate(log.created_at)}</time></td><td className="history-actions">{log.action === 'CREATE_RISK' && item && <div className="table-actions"><button className="button button-secondary" onClick={() => setSelectedLog(log)}>ดูรายละเอียด</button><button className="button button-secondary" disabled={isExporting} onClick={() => exportLogPDF(log)} aria-label={'ดาวน์โหลด PDF ' + (item.title || '')}><Icon name="download" size={14}/>{isExporting ? 'กำลังเตรียม' : 'PDF'}</button></div>}</td></tr>;
      })}</tbody></table></div>}
    </>}
    {selectedLog && detail && <Dialog titleId="history-dialog-title" onClose={() => setSelectedLog(null)}>
      <h2 id="history-dialog-title">รายละเอียดการประเมิน</h2><p>{detail.title || 'ผลการประเมินความเสี่ยง'}</p>
      <div className="modal-stats"><div><small>ระดับตามเมทริกซ์</small><strong>{riskLabels[detail.result?.risk_level] || detail.result?.risk_level || '—'}</strong></div><div><small>คะแนนเมทริกซ์ / 25</small><strong>{detail.result?.score ?? '—'}</strong></div></div>
      <h3>คะแนนปัจจัยที่ประเมิน</h3>
      {inputs ? <div className="modal-factor-grid">{Object.entries(inputs).map(([category, factors]) => <div key={category}><h4>{categoryLabels[category] || category}</h4>{Object.entries(factors).map(([factor, value]) => <p key={factor}><span>{factorLabels[factor] || factor}</span><strong>{value}</strong></p>)}</div>)}</div> : <p>ไม่มีรายละเอียดปัจจัยในรายการนี้</p>}
      <div className="modal-actions"><button className="button button-secondary" disabled={isExporting} onClick={() => exportLogPDF(selectedLog)}><Icon name="download" size={16}/>{isExporting ? 'กำลังเตรียม' : 'ดาวน์โหลด PDF'}</button><button className="button button-primary" onClick={() => setSelectedLog(null)}>ปิดหน้าต่าง</button></div>
    </Dialog>}
  </div>;
}
