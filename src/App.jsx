import { useState, useMemo, useRef, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import UserHistory from "./UserHistory";
import AdminUsers from "./AdminUsers";
import { saveRisk, getAIAnalysis } from "./api";
// import { thaiFontBase64 } from "./thaiFont"; // ❌ ไม่ต้องใช้แบบยาวๆ แล้ว
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// SVG Icons
const Icons = {
  Threat: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Vulnerability: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Technical: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  Business: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Download: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
};

const factorTranslations = {
  skillLevel: "ระดับทักษะ (Skill Level)",
  motive: "แรงจูงใจ (Motive)",
  opportunity: "โอกาส (Opportunity)",
  size: "ขนาดของกลุ่ม (Size)",
  easeOfDiscovery: "ความง่ายในการค้นหา (Ease of Discovery)",
  easeOfExploit: "ความง่ายในการโจมตี (Ease of Exploit)",
  awareness: "ความตระหนักรู้ (Awareness)",
  intrusionDetection: "ระบบตรวจจับ (Intrusion Detection)",
  lossOfConfidentiality: "การรักษาความลับ (Loss of Confidentiality)",
  lossOfIntegrity: "ความถูกต้องของข้อมูล (Loss of Integrity)",
  lossOfAvailability: "ความพร้อมใช้งาน (Loss of Availability)",
  lossOfAccountability: "ความรับผิดชอบ (Loss of Accountability)",
  financialDamage: "ความเสียหายทางการเงิน (Financial Damage)",
  reputationDamage: "ความเสียหายต่อชื่อเสียง (Reputation Damage)",
  nonCompliance: "การไม่เป็นไปตามข้อกำหนด (Non-Compliance)",
  privacyViolation: "การละเมิดความเป็นส่วนตัว (Privacy Violation)"
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'history'
  const [toasts, setToasts] = useState([]); // ✅ ระบบแจ้งเตือนหลายรายการ
  const [isExporting, setIsExporting] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  // ฟังก์ชันเพิ่ม Toast
  const addToast = (title, message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000); // หายไปหลังจาก 4 วินาที
  };

  const [scores, setScores] = useState({
    threatAgent: { skillLevel: 0, motive: 0, opportunity: 0, size: 0 },
    vulnerability: { easeOfDiscovery: 0, easeOfExploit: 0, awareness: 0, intrusionDetection: 0 },
    technicalImpact: { lossOfConfidentiality: 0, lossOfIntegrity: 0, lossOfAvailability: 0, lossOfAccountability: 0 },
    businessImpact: { financialDamage: 0, reputationDamage: 0, nonCompliance: 0, privacyViolation: 0 },
  });

  const chartRef = useRef();

  const calculateTotal = (category) => Object.values(scores[category]).reduce((sum, value) => sum + value, 0);

  const calculateRisk = () => {
    const total = calculateTotal("threatAgent") + calculateTotal("vulnerability") +
      calculateTotal("technicalImpact") + calculateTotal("businessImpact");
    if (total <= 15) return { label: "ความเสี่ยงต่ำ (Low Risk)", class: "badge-low" };
    if (total <= 35) return { label: "ความเสี่ยงปานกลาง (Medium Risk)", class: "badge-medium" };
    return { label: "ความเสี่ยงสูง (High Risk)", class: "badge-high" };
  };

  // ฟังก์ชันรีเซ็ตค่าทั้งหมด
  const resetAllScores = () => {
    setScores({
      threatAgent: { skillLevel: 0, motive: 0, opportunity: 0, size: 0 },
      vulnerability: { easeOfDiscovery: 0, easeOfExploit: 0, awareness: 0, intrusionDetection: 0 },
      technicalImpact: { lossOfConfidentiality: 0, lossOfIntegrity: 0, lossOfAvailability: 0, lossOfAccountability: 0 },
      businessImpact: { financialDamage: 0, reputationDamage: 0, nonCompliance: 0, privacyViolation: 0 },
    });
  };

  // ฟังก์ชันรีเซ็ตรายหมวดหมู่
  const resetCategoryScore = (category) => {
    const defaultValues = {
      threatAgent: { skillLevel: 0, motive: 0, opportunity: 0, size: 0 },
      vulnerability: { easeOfDiscovery: 0, easeOfExploit: 0, awareness: 0, intrusionDetection: 0 },
      technicalImpact: { lossOfConfidentiality: 0, lossOfIntegrity: 0, lossOfAvailability: 0, lossOfAccountability: 0 },
      businessImpact: { financialDamage: 0, reputationDamage: 0, nonCompliance: 0, privacyViolation: 0 },
    };
    setScores(prev => ({ ...prev, [category]: defaultValues[category] }));
    addToast("รีเซ็ตแล้ว", `เริ่มคำนวณใหม่เฉพาะส่วนได้เลยครับ`, "info");
  };

  const chartData = useMemo(() => ({
    labels: [
      "ปัจจัยจากคุกคาม (Threat Agent)",
      "ช่องโหว่ (Vulnerability)",
      "ผลกระทบทางเทคนิค (Technical Impact)",
      "ผลกระทบทางธุรกิจ (Business Impact)"
    ],
    datasets: [
      {
        label: "คะแนนความเสี่ยง (Risk Score)",
        data: [
          calculateTotal("threatAgent"),
          calculateTotal("vulnerability"),
          calculateTotal("technicalImpact"),
          calculateTotal("businessImpact"),
        ],
        backgroundColor: [
          "rgba(59, 130, 246, 0.4)",
          "rgba(16, 185, 129, 0.4)",
          "rgba(245, 158, 11, 0.4)",
          "rgba(239, 68, 68, 0.4)",
        ],
        borderColor: [
          "#3b82f6",
          "#10b981",
          "#f59e0b",
          "#ef4444",
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }), [scores]);

  // ฟังก์ชันส่งออก PDF
  // ฟังก์ชันบันทึกข้อมูลเข้าฐานข้อมูล
  const handleSaveRisk = async () => {
    const riskLevelLabel = calculateRisk().label.split(' ')[0]; // ดึงคำว่า 'ความเสี่ยงต่ำ'

    const likelihoodRaw = (calculateTotal("threatAgent") + calculateTotal("vulnerability")) / 8;
    const impactRaw = (calculateTotal("technicalImpact") + calculateTotal("businessImpact")) / 8;

    const riskData = {
      title: `OWASP Assessment - ${new Date().toLocaleString()}`,
      description: JSON.stringify(scores),
      likelihood: Math.min(5, Math.max(1, Math.ceil(likelihoodRaw / 1.8))),
      impact: Math.min(5, Math.max(1, Math.ceil(impactRaw / 1.8))),
      category: "OWASP",
      mitigation: "แนะนำให้ดำเนินการตรวจสอบและแก้ไขตามระดับความเสี่ยงที่พบ"
    };

    try {
      const result = await saveRisk(riskData);
      if (result.success) {
        addToast("บันทึกสำเร็จ", "ข้อมูลความเสี่ยงของคุณถูกบันทึกลงฐานข้อมูลแล้ว", "success");
        resetAllScores(); // ✅ รีเซ็ตค่าทั้งหมดหลังจากบันทึกสำเร็จ
      } else {
        addToast("บันทึกไม่สำเร็จ", result.message || "เกิดข้อผิดพลาดในการบันทึก", "error");
      }
    } catch (error) {
      addToast("Error", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    }
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAiResponse(null);

    const totals = {
      threatAgent: calculateTotal("threatAgent"),
      vulnerability: calculateTotal("vulnerability"),
      technicalImpact: calculateTotal("technicalImpact"),
      businessImpact: calculateTotal("businessImpact")
    };

    const riskLabel = calculateRisk().label;

    try {
      const result = await getAIAnalysis({ totals, riskLabel, scores });
      if (result.success) {
        setAiResponse(result.data);
        addToast("AI Analysis Complete", "ระบบ AI วิเคราะห์ข้อมูลเสร็จสมบูรณ์แล้ว", "success");
      } else {
        addToast("AI Error", result.message || "เกิดข้อผิดพลาดในการวิเคราะห์", "error");
      }
    } catch (error) {
      addToast("Connection Error", "ไม่สามารถเชื่อมต่อกับระบบ AI ได้", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const exportPDF = async () => {
    try {
      setIsExporting(true);

      const doc = new jsPDF('p', 'mm', 'a4');

      // 1. โหลดฟอนต์ไทยจาก Cloud แบบ Dynamic
      const fontUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sarabun/Sarabun-Regular.ttf';

      let base64Font = '';
      try {
        const response = await fetch(fontUrl);
        const buffer = await response.arrayBuffer();

        // แปลง Buffer เป็น Base64 แบบปลอดภัย (รองรับไฟล์ขนาดใหญ่)
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64Font = window.btoa(binary);

        doc.addFileToVFS('Sarabun.ttf', base64Font);
        doc.addFont('Sarabun.ttf', 'Sarabun', 'normal');
        doc.setFont('Sarabun');
      } catch (err) {
        console.warn('โหลดฟอนต์ไม่สำเร็จ:', err);
      }

      const hasThai = base64Font.length > 0;

      // 2. หัวข้อรายงาน
      doc.setFontSize(22);
      if (hasThai) doc.setFont('Sarabun', 'normal');
      const reportTitle = hasThai ? "รายงานประเมินความเสี่ยง OWASP" : "OWASP Risk Report";
      doc.text(reportTitle, 105, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.text(`Assessor: ${user?.name || 'Anonymous'}`, 20, 35);
      doc.text(`Date: ${new Date().toLocaleString('th-TH')}`, 20, 42);
      doc.text(`Category: OWASP Risk Assessment`, 20, 49);

      // 3. ตารางสรุปคะแนน (ระบุ Font ให้ครบทุกจุด)
      autoTable(doc, {
        startY: 60,
        head: [[
          hasThai ? 'หมวดหมู่การประเมิน' : 'Category',
          hasThai ? 'คะแนนรวม' : 'Total Score',
          hasThai ? 'สถานะ' : 'Status'
        ]],
        body: [
          [hasThai ? 'ปัจจัยด้านคุกคาม (Threat Agent)' : 'Threat Agent', calculateTotal("threatAgent"), 'Normal'],
          [hasThai ? 'ปัจจัยด้านช่องโหว่ (Vulnerability)' : 'Vulnerability', calculateTotal("vulnerability"), 'Normal'],
          [hasThai ? 'ผลกระทบด้านเทคนิค (Technical Impact)' : 'Technical Impact', calculateTotal("technicalImpact"), 'Normal'],
          [hasThai ? 'ผลกระทบด้านธุรกิจ (Business Impact)' : 'Business Impact', calculateTotal("businessImpact"), 'Normal'],
        ],
        styles: {
          font: hasThai ? 'Sarabun' : 'helvetica',
          fontSize: 12,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [37, 99, 235],
          font: hasThai ? 'Sarabun' : 'helvetica',
          fontStyle: 'normal'
        },
        bodyStyles: {
          font: hasThai ? 'Sarabun' : 'helvetica'
        },
        theme: 'grid'
      });

      // 4. สรุปผลลัพธ์
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(16);
      doc.text(hasThai ? "บทสรุปผู้บริหาร" : "Executive Summary", 20, finalY);

      doc.setFontSize(14);
      doc.setTextColor(riskResult.class === 'critical' ? 239 : 37, riskResult.class === 'critical' ? 68 : 99, riskResult.class === 'critical' ? 68 : 235);
      doc.text(`${hasThai ? 'ระดับความเสี่ยง' : 'Risk Level'}: ${riskResult.label}`, 20, finalY + 10);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(hasThai ? "แนะนำ: ควรตรวจสอบค่าความเสี่ยงที่สูงและดำเนินการแก้ไขตามความสำคัญ" : "Note: Address high risk factors by priority.", 20, finalY + 22);

      // 5. ใส่กราฟ
      const canvas = await html2canvas(chartRef.current);
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 20, finalY + 32, 170, 85);

      const dateString = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      doc.save(`Risk_Assessment_${dateString}.pdf`);

      if (!hasThai) {
        addToast("ส่งออกแล้ว (EN)", "เป็นภาษาอังกฤษชั่วคราวเนื่องจากยังไม่พบฟอนต์ไทย", "info");
      } else {
        addToast("สำเร็จ", "ดาวน์โหลดรายงานเรียบร้อยแล้ว", "success");
      }
    } catch (err) {
      console.error(err);
      addToast("Error", "เกิดข้อผิดพลาดในการสร้าง PDF: " + err.message, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleChange = (event, category, factor) => {
    const value = parseInt(event.target.value);
    setScores(prev => ({
      ...prev,
      [category]: { ...prev[category], [factor]: value }
    }));
  };

  const RiskFactorDropdown = ({ category, factor }) => (
    <div className="factor-group">
      <label className="factor-label">{factorTranslations[factor] || factor}</label>
      <select
        className="styled-select"
        onChange={(e) => handleChange(e, category, factor)}
        value={scores[category][factor]}
      >
        <option value={0}>0 - ไม่มีความเสี่ยง (No Risk)</option>
        <option value={1}>1 - ต่ำ (Low)</option>
        <option value={3}>3 - ปานกลางค่อนข้างต่ำ (Medium-Low)</option>
        <option value={5}>5 - ปานกลาง (Medium)</option>
        <option value={7}>7 - ปานกลางค่อนข้างสูง (Medium-High)</option>
        <option value={9}>9 - สูง (High)</option>
      </select>
    </div>
  );

  const riskResult = calculateRisk();

  // คำนวณค่า Likelihood และ Impact สำหรับ Matrix (1-5)
  const matrixLh = Math.min(5, Math.max(1, Math.ceil(((calculateTotal("threatAgent") + calculateTotal("vulnerability")) / 8) / 1.8)));
  const matrixIm = Math.min(5, Math.max(1, Math.ceil(((calculateTotal("technicalImpact") + calculateTotal("businessImpact")) / 8) / 1.8)));

  const getRecommendation = (level, currentScores) => {
    const totals = {
      "Threat": calculateTotal("threatAgent"),
      "Vulnerability": calculateTotal("vulnerability"),
      "Technical": calculateTotal("technicalImpact"),
      "Business": calculateTotal("businessImpact")
    };

    const maxCat = Object.keys(totals).reduce((a, b) => totals[a] > totals[b] ? a : b);
    const catAdvice = {
      "Threat": "เน้นการเฝ้าระวังตัวตนผู้เข้าใช้งาน แนะนำให้ใช้ MFA หรือระบบจำกัดสิทธิ์ (Privileged Access Management)",
      "Vulnerability": "เน้นการอัปเดตช่องโหว่ทางเทคนิค แนะนำให้จัดทำ Vulnerability Assessment และ Patch Management โดยด่วน",
      "Technical": "เน้นการป้องกันความถูกต้องและความลับของข้อมูล แนะนำให้ใช้ระบบเข้ารหัส (Encryption) และ Backup ข้อมูลแบบออฟไลน์",
      "Business": "เน้นความเสียหายด้านชื่อเสียงและค่าปรับ แนะนำให้เตรียมแผนตอบสนองต่อเหตุการณ์ (Incident Response Plan) และประกันภัยไซเบอร์"
    };

    const baseAdvice = {
      'Critical': {
        title: "🆘 AI ระบบวิเคราะห์: พบความเสี่ยงระดับวิกฤต!",
        action: "ต้องปิดกั้นเส้นทางการโจมตีทันที และทำการแก้ไขช่องโหว่ภายใน 24 ชม.",
        icon: "🚨"
      },
      'High': {
        title: "⚠️ AI ระบบวิเคราะห์: พบความเสี่ยงระดับสูง",
        action: "ให้จัดลำดับความสำคัญของช่องโหว่นี้เป็นระดับสูงสุดในแผนปฏิบัติงานถัดไป",
        icon: "⚠️"
      },
      'Medium': {
        title: "🔔 AI ระบบวิเคราะห์: ความเสี่ยงระดับปานกลาง",
        action: "ควรติดตามและเฝ้าระวังอย่างใกล้ชิดในรอบการตรวจสอบระบบประจำเดือน",
        icon: "ℹ️"
      },
      'Low': {
        title: "✅ AI ระบบวิเคราะห์: ความเสี่ยงระดับต่ำ",
        action: "รักษามาตรการความปลอดภัยเดิมและหมั่นตรวจสอบระบบตามมาตรฐาน",
        icon: "✅"
      }
    };

    const core = baseAdvice[level] || baseAdvice['Low'];
    return {
      ...core,
      analysis: `จากการวิเคราะห์ด้วย AI พบว่าปัจจัยหลักที่ขับเคลื่อนความเสี่ยงคือ **${maxCat}** (${totals[maxCat]} คะแนน)`,
      tip: catAdvice[maxCat]
    };
  };

  const reco = getRecommendation(riskResult.label.split(' ')[1] || 'Low', scores);

  const RiskMatrix = () => {
    return (
      <div className="matrix-container">
        <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: '#1e293b' }}>แผนภูมิความร้อน (Risk Heatmap)</h4>
        <div className="matrix-grid">
          {[5, 4, 3, 2, 1].map(row => (
            <div key={row} className="matrix-row">
              <div className="matrix-label-y">{row}</div>
              {[1, 2, 3, 4, 5].map(col => {
                const score = row * col;
                const isCurrent = row === matrixIm && col === matrixLh;
                let bgColor = '#dcfce7'; // Low
                if (score >= 20) bgColor = '#fee2e2'; // Critical/High
                else if (score >= 12) bgColor = '#ffedd5'; // Medium-High
                else if (score >= 6) bgColor = '#fef9c3'; // Medium

                return (
                  <div
                    key={col}
                    className={`matrix-cell ${isCurrent ? 'active' : ''}`}
                    style={{ background: bgColor }}
                  >
                    {isCurrent && <div className="matrix-pulsar" />}
                  </div>
                );
              })}
            </div>
          ))}
          <div className="matrix-row label-row">
            <div className="matrix-label-corner"></div>
            {[1, 2, 3, 4, 5].map(col => <div key={col} className="matrix-label-x">{col}</div>)}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '1.2rem' }}>
          <span>แกนนอน (L): โอกาสเกิด</span>
          <span>แกนตั้ง (I): ผลกระทบ</span>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return currentPage === 'login'
      ? <Login onLoginSuccess={handleLoginSuccess} onGoToRegister={() => setCurrentPage('register')} />
      : <Register onBackToLogin={() => setCurrentPage('login')} />;
  }

  return (
    <div className="dashboard-container" style={{ paddingTop: '5rem' }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '4rem',
        background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem', zIndex: 100
      }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <h3 style={{ color: '#2563eb', margin: 0 }}>Risk Assessment</h3>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setCurrentView('dashboard')}
              style={{ background: 'none', border: 'none', color: currentView === 'dashboard' ? '#2563eb' : '#64748b', fontWeight: currentView === 'dashboard' ? 'bold' : 'normal', cursor: 'pointer' }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('history')}
              style={{ background: 'none', border: 'none', color: currentView === 'history' ? '#2563eb' : '#64748b', fontWeight: currentView === 'history' ? 'bold' : 'normal', cursor: 'pointer' }}
            >
              My History
            </button>
            {/* ✅ แสดงเมนู Admin เฉพาะคนที่เป็น admin */}
            {user?.role === 'admin' && (
              <button
                onClick={() => setCurrentView('admin-users')}
                style={{ background: 'none', border: 'none', color: currentView === 'admin-users' ? '#2563eb' : '#64748b', fontWeight: currentView === 'admin-users' ? 'bold' : 'normal', cursor: 'pointer' }}
              >
                User Management
              </button>
            )}
          </nav>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
            สวัสดี, <strong style={{ color: '#1e293b' }}>{user?.name}</strong>
            <span style={{ marginLeft: '10px', padding: '2px 8px', borderRadius: '12px', background: user?.role === 'admin' ? '#fee2e2' : '#e0f2fe', color: user?.role === 'admin' ? '#ef4444' : '#0369a1', fontSize: '0.75rem', fontWeight: 'bold' }}>{user?.role?.toUpperCase()}</span>
          </span>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1.25rem', borderRadius: '0.75rem', background: 'transparent', color: '#ef4444', border: '1px solid #fee2e2', cursor: 'pointer', fontSize: '0.9rem' }}>Logout</button>
        </div>
      </div>

      {currentView === 'history' ? (
        <UserHistory user={user} addToast={addToast} />
      ) : currentView === 'admin-users' ? (
        <AdminUsers addToast={addToast} />
      ) : (
        <>
          <header className="header-section">
            <div className="premium-badge">มาตรฐาน OWASP Framework 2024</div>
            <h1>การประเมินความเสี่ยงด้านความปลอดภัยขั้นสูง</h1>
            <p>เครื่องมือวิเคราะห์และจัดการความเสี่ยงระดับองค์กร (Enterprise Edition)</p>
          </header>


          <div className="grid-layout">
            <div className="risk-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}><Icons.Threat /> ปัจจัยจากคุกคาม (Threat Agent)</h3>
                <button onClick={() => resetCategoryScore("threatAgent")} className="btn-reset-small">รีเซ็ต</button>
              </div>
              {["skillLevel", "motive", "opportunity", "size"].map(f => (
                <RiskFactorDropdown key={f} category="threatAgent" factor={f} />
              ))}
            </div>

            <div className="risk-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}><Icons.Vulnerability /> ช่องโหว่ (Vulnerability)</h3>
                <button onClick={() => resetCategoryScore("vulnerability")} className="btn-reset-small">รีเซ็ต</button>
              </div>
              {["easeOfDiscovery", "easeOfExploit", "awareness", "intrusionDetection"].map(f => (
                <RiskFactorDropdown key={f} category="vulnerability" factor={f} />
              ))}
            </div>

            <div className="risk-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}><Icons.Technical /> ผลกระทบทางเทคนิค (Technical Impact)</h3>
                <button onClick={() => resetCategoryScore("technicalImpact")} className="btn-reset-small">รีเซ็ต</button>
              </div>
              {["lossOfConfidentiality", "lossOfIntegrity", "lossOfAvailability", "lossOfAccountability"].map(f => (
                <RiskFactorDropdown key={f} category="technicalImpact" factor={f} />
              ))}
            </div>

            <div className="risk-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}><Icons.Business /> ผลกระทบทางธุรกิจ (Business Impact)</h3>
                <button onClick={() => resetCategoryScore("businessImpact")} className="btn-reset-small">รีเซ็ต</button>
              </div>
              {["financialDamage", "reputationDamage", "nonCompliance", "privacyViolation"].map(f => (
                <RiskFactorDropdown key={f} category="businessImpact" factor={f} />
              ))}
            </div>
          </div>

          <div className="result-section">
            <div className={`risk-level-badge ${riskResult.class}`}>
              {riskResult.label}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 350px', gap: '2rem', width: '100%', maxWidth: '1100px', alignItems: 'start' }}>
              <div className="chart-container" style={{ height: '400px' }} ref={chartRef}>
                <Bar
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      title: {
                        display: true,
                        text: 'การกระจายคะแนนตามปัจจัยความเสี่ยง (Factor Breakdown)',
                        color: '#1e293b',
                        font: { size: 14, weight: 'bold', family: 'Sarabun' }
                      }
                    },
                    scales: {
                      y: { beginAtZero: true, max: 40, grid: { color: 'rgba(0,0,0,0.05)' } },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              </div>
              <RiskMatrix />
            </div>

            <div className="ai-section" style={{ marginTop: '2.5rem', width: '100%', maxWidth: '1100px' }}>
              {!aiResponse ? (
                <button
                  className="btn-premium"
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing}
                  style={{
                    width: '100%', background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    color: 'white', border: 'none', padding: '1.25rem', fontSize: '1.1rem'
                  }}
                >
                  {isAnalyzing ? '🤖 AI กำลังประมวลผลข้อมูลความเสี่ยงของคุณ...' : '🤖 ส่งข้อมูลผลการประเมินให้ระบบ AI วิเคราะห์ขั้นสูง'}
                </button>
              ) : (
                <div className={`reco-board ${riskResult.class}`}>
                  <div className="reco-header">
                    <span className="reco-icon">🤖</span>
                    <strong>ผลการวิเคราะห์เจาะลึกโดย AI</strong>
                  </div>
                  <div className="reco-body">
                    <p>{aiResponse.summary}</p>

                    <div className="reco-plan">
                      <strong>📋 แนวทางปฏิบัติที่แนะนำ:</strong>
                      {aiResponse.recommendations.map((rec, i) => (
                        <p key={i} style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                          <span>•</span> {rec}
                        </p>
                      ))}
                    </div>

                    <div className="reco-tip">
                      <span>💡</span>
                      <small>AI Insight: {aiResponse.insight}</small>
                    </div>

                    <button className="reco-footer-btn" onClick={() => setAiResponse(null)}>
                      ต้องการวิเคราะห์ใหม่ (Clear AI Analysis)
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="stats-row" style={{ marginTop: '2rem' }}>
              <div className="stat-card">
                <div className="stat-value">{calculateTotal("threatAgent") + calculateTotal("vulnerability")}</div>
                <div className="stat-label">คะแนนโอกาสเกิด (Likelihood)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{calculateTotal("technicalImpact") + calculateTotal("businessImpact")}</div>
                <div className="stat-label">คะแนนผลกระทบ (Impact)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{(calculateTotal("threatAgent") + calculateTotal("vulnerability") + calculateTotal("technicalImpact") + calculateTotal("businessImpact")).toFixed(1)}</div>
                <div className="stat-label">ความรุนแรงโดยรวม (Severity)</div>
              </div>
            </div>

            <div className="action-buttons" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn-premium btn-primary-premium" onClick={handleSaveRisk}>
                <Icons.Threat /> บันทึกและล้างค่า (Save & Reset)
              </button>
              <button
                className="btn-premium"
                style={{ border: '1px solid #64748b', color: '#64748b', background: 'transparent' }}
                onClick={resetAllScores}
              >
                ล้างค่าทั้งหมด (Clear All)
              </button>
              <button
                className="btn-premium"
                style={{ border: '1px solid #3b82f6', background: isExporting ? '#f1f5f9' : 'transparent', cursor: isExporting ? 'not-allowed' : 'pointer' }}
                onClick={exportPDF}
                disabled={isExporting}
              >
                <Icons.Download /> {isExporting ? 'กำลังเตรียมไฟล์...' : 'ส่งออกรายงาน PDF (Export PDF Report)'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 🚀 New Premium Toast Notification System */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast-item ${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </div>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-message">{toast.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
