import { useState, useEffect } from "react";
import { getActivities } from "./api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const factorTranslations = {
    sl: "ความสามารถในการเข้าถึง (Skill Level)",
    m: "แรงจูงใจ (Motive)",
    o: "โอกาส (Opportunity)",
    s: "ขนาด (Size)",
    ee: "ความง่ายในการค้นพบ (Ease of Discovery)",
    es: "ความง่ายในการโจมตี (Ease of Exploit)",
    a: "ความตระหนักรู้ (Awareness)",
    id: "การตรวจจับ (Intrusion Detection)",
    lc: "การสูญเสียความลับ (Confidentiality)",
    li: "การสูญเสียความถูกต้อง (Integrity)",
    lav: "การสูญเสียความพร้อมใช้ (Availability)",
    lac: "การสูญเสียความรับผิดชอบ (Accountability)",
    fd: "ความเสียหายทางการเงิน (Financial)",
    rd: "ความเสียหายต่อชื่อเสียง (Reputation)",
    nc: "การไม่ปฏิบัติตามกฎระเบียบ (Compliance)",
    pv: "การละเมิดความเป็นส่วนตัว (Privacy)"
};

export default function UserHistory({ user, addToast }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await getActivities();
                if (response.success) {
                    setLogs(response.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const parseDetail = (log) => {
        if (!log.detail) return null;
        let detail = log.detail;
        if (typeof detail === 'string') {
            try { detail = JSON.parse(detail); } catch (e) { return null; }
        }
        return detail;
    };

    const exportLogPDF = async (log) => {
        const detail = parseDetail(log);
        if (!detail) return;

        try {
            setIsExporting(true);
            const doc = new jsPDF('p', 'mm', 'a4');
            const fontUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sarabun/Sarabun-Regular.ttf';

            let base64Font = '';
            try {
                const response = await fetch(fontUrl);
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

    const Modal = ({ log, onClose }) => {
        const detail = parseDetail(log);
        if (!detail) return null;

        const result = detail.result;
        let inputs = detail.inputs;
        if (typeof inputs === 'string') {
            try { inputs = JSON.parse(inputs); } catch (e) { }
        }

        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="modal-close" onClick={onClose}>✕</button>
                    <h2 style={{ marginBottom: '1rem', color: '#1e293b' }}> รายละเอียดการประเมิน</h2>
                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>{detail.title || 'Risk Assessment'}</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>ระดับความเสี่ยง</div>
                            <div style={{
                                fontSize: '1.5rem', fontWeight: 'bold',
                                color: result?.risk_level === 'Critical' ? '#ef4444' : '#2563eb'
                            }}>{result?.risk_level}</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>คะแนนความเสี่ยง</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{result?.score}</div>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#1e293b' }}> ปัจจัยที่เลือก (Scores)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {inputs && Object.entries(inputs).map(([cat, factors]) => (
                            <div key={cat} style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '0.75rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{cat}</div>
                                {Object.entries(factors).map(([f, val]) => (
                                    <div key={f} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                        <span style={{ color: '#475569' }}>{f}:</span>
                                        <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{val}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button
                            onClick={() => exportLogPDF(log)}
                            disabled={isExporting}
                            style={{ flex: 1, padding: '1rem', borderRadius: '1rem', border: '1px solid #3b82f6', background: 'transparent', color: '#2563eb', fontWeight: 'bold', cursor: isExporting ? 'not-allowed' : 'pointer' }}
                        >
                            {isExporting ? 'กำลังเตรียม...' : ' ส่งออก PDF'}
                        </button>
                        <button
                            onClick={onClose}
                            style={{ flex: 1, padding: '1rem', borderRadius: '1rem', border: 'none', background: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>กำลังโหลดประวัติ...</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            <h2 style={{ marginBottom: '2rem', color: '#1e293b' }}>ประวัติการใช้งานของคุณ</h2>
            <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', width: '150px', whiteSpace: 'nowrap' }}>กิจกรรม</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b' }}>รายละเอียดเบื้องต้น</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b', width: '180px' }}>จัดการ</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b', width: '200px', whiteSpace: 'nowrap' }}>เวลา</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => {
                            const detail = parseDetail(log);
                            return (
                                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold',
                                            background: log.action.includes('CREATE') ? '#dcfce7' : log.action.includes('DELETE') ? '#fee2e2' : '#e0f2fe',
                                            color: log.action.includes('CREATE') ? '#10b981' : log.action.includes('DELETE') ? '#ef4444' : '#0369a1'
                                        }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#1e293b' }}>
                                        {detail?.title || '-'}
                                        {detail?.result && (
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                ระดับ: {detail.result.risk_level} | คะแนน: {detail.result.score}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        {log.action === 'CREATE_RISK' && (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    style={{ padding: '0.4rem 0.8rem', borderRadius: '0.5rem', border: '1px solid #3b82f6', background: 'transparent', color: '#2563eb', cursor: 'pointer', fontSize: '0.8rem' }}
                                                >
                                                    ดูข้อมูล
                                                </button>
                                                <button
                                                    onClick={() => exportLogPDF(log)}
                                                    disabled={isExporting}
                                                    style={{ padding: '0.4rem 0.8rem', borderRadius: '0.5rem', border: '1px solid #10b981', background: 'transparent', color: '#059669', cursor: isExporting ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}
                                                >
                                                    {isExporting ? '...' : 'PDF'}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'right' }}>
                                        {new Date(log.created_at).toLocaleString('th-TH')}
                                    </td>
                                </tr>
                            );
                        })}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>ยังไม่มีประวัติการใช้งาน</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedLog && <Modal log={selectedLog} onClose={() => setSelectedLog(null)} />}
        </div>
    );
}
