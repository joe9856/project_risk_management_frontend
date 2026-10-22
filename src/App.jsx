import { useState, useRef, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import UserHistory from "./UserHistory";
import AdminUsers from "./AdminUsers";
import { Dialog, Icon, userMessage } from "./UI";
import RiskMatrix from "./RiskMatrix";
import RiskHome, { SiteHeader } from './RiskHome';
import RiskTreatment from './RiskTreatment';
import RiskDashboard from './RiskDashboard';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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


const categories = [
  { id: 'threatAgent', title: 'ภัยคุกคาม', english: 'Threat Agent', description: 'ประเมินความสามารถและแรงจูงใจของผู้ที่อาจโจมตีระบบ', factors: ['skillLevel', 'motive', 'opportunity', 'size'] },
  { id: 'vulnerability', title: 'ช่องโหว่', english: 'Vulnerability', description: 'พิจารณาว่าช่องโหว่ถูกค้นพบและนำไปใช้โจมตีได้ง่ายเพียงใด', factors: ['easeOfDiscovery', 'easeOfExploit', 'awareness', 'intrusionDetection'] },
  { id: 'technicalImpact', title: 'ผลกระทบทางเทคนิค', shortTitle: 'เทคนิค', english: 'Technical Impact', description: 'พิจารณาผลกระทบต่อข้อมูลและความพร้อมใช้งานของระบบ', factors: ['lossOfConfidentiality', 'lossOfIntegrity', 'lossOfAvailability', 'lossOfAccountability'] },
  { id: 'businessImpact', title: 'ผลกระทบทางธุรกิจ', shortTitle: 'ธุรกิจ', english: 'Business Impact', description: 'ประเมินผลที่อาจเกิดขึ้นต่อองค์กรและผู้ได้รับผลกระทบ', factors: ['financialDamage', 'reputationDamage', 'nonCompliance', 'privacyViolation'] },
];
const factorHints = {
  skillLevel: 'ทักษะและความรู้ของผู้โจมตี',
  motive: 'ประโยชน์หรือแรงจูงใจในการโจมตี',
  opportunity: 'โอกาสและทรัพยากรที่ใช้เข้าถึงระบบ',
  size: 'จำนวนผู้ที่มีโอกาสโจมตีระบบ',
  easeOfDiscovery: 'ความง่ายในการค้นพบช่องโหว่',
  easeOfExploit: 'ความง่ายในการใช้ช่องโหว่เพื่อโจมตี',
  awareness: 'ช่องโหว่นี้เป็นที่รู้จักมากเพียงใด',
  intrusionDetection: 'ความยากในการตรวจพบการโจมตี',
  lossOfConfidentiality: 'ขอบเขตของข้อมูลที่อาจถูกเปิดเผย',
  lossOfIntegrity: 'ผลกระทบเมื่อข้อมูลถูกแก้ไข',
  lossOfAvailability: 'ผลกระทบเมื่อระบบไม่พร้อมใช้งาน',
  lossOfAccountability: 'ความยากในการระบุผู้รับผิดชอบเหตุการณ์',
  financialDamage: 'ความสูญเสียด้านรายได้หรือค่าใช้จ่าย',
  reputationDamage: 'ความเสียหายต่อชื่อเสียงและความเชื่อมั่น',
  nonCompliance: 'ผลกระทบจากการไม่ปฏิบัติตามข้อกำหนด',
  privacyViolation: 'ผลกระทบต่อความเป็นส่วนตัวของบุคคล',
};
const scoreOptions = [[0, 'ไม่มีความเสี่ยง'], [1, 'ต่ำ'], [3, 'ค่อนข้างต่ำ'], [5, 'ปานกลาง'], [7, 'ค่อนข้างสูง'], [9, 'สูง']];

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [currentView, setCurrentView] = useState('home');
  const [toasts, setToasts] = useState([]); // ✅ ระบบแจ้งเตือนหลายรายการ
  const [isExporting, setIsExporting] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [answered, setAnswered] = useState({});
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [clearRequest, setClearRequest] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      try { setUser(JSON.parse(savedUser)); setIsLoggedIn(true); }
      catch { localStorage.removeItem('user'); localStorage.removeItem('token'); }
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
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    setAnswered({});
    setActiveStep(0);
    setAssessmentTitle('');
    setAiResponse(null);
    setScores({
      threatAgent: { skillLevel: 0, motive: 0, opportunity: 0, size: 0 },
      vulnerability: { easeOfDiscovery: 0, easeOfExploit: 0, awareness: 0, intrusionDetection: 0 },
      technicalImpact: { lossOfConfidentiality: 0, lossOfIntegrity: 0, lossOfAvailability: 0, lossOfAccountability: 0 },
      businessImpact: { financialDamage: 0, reputationDamage: 0, nonCompliance: 0, privacyViolation: 0 },
    });
  };

  // ฟังก์ชันรีเซ็ตรายหมวดหมู่
  const resetCategoryScore = (category) => {
    setShowResults(false);
    setAnswered(prev => Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(category + '.'))));
    setAiResponse(null);
    const defaultValues = {
      threatAgent: { skillLevel: 0, motive: 0, opportunity: 0, size: 0 },
      vulnerability: { easeOfDiscovery: 0, easeOfExploit: 0, awareness: 0, intrusionDetection: 0 },
      technicalImpact: { lossOfConfidentiality: 0, lossOfIntegrity: 0, lossOfAvailability: 0, lossOfAccountability: 0 },
      businessImpact: { financialDamage: 0, reputationDamage: 0, nonCompliance: 0, privacyViolation: 0 },
    };
    setScores(prev => ({ ...prev, [category]: defaultValues[category] }));
    addToast("รีเซ็ตแล้ว", `เริ่มคำนวณใหม่เฉพาะส่วนได้เลยครับ`, "info");
  };

  const chartData = {
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
  };

  // ฟังก์ชันส่งออก PDF
  // ฟังก์ชันบันทึกข้อมูลเข้าฐานข้อมูล
  const handleSaveRisk = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const likelihoodRaw = (calculateTotal("threatAgent") + calculateTotal("vulnerability")) / 8;
    const impactRaw = (calculateTotal("technicalImpact") + calculateTotal("businessImpact")) / 8;

    const riskData = {
      title: assessmentTitle.trim() || `OWASP Assessment - ${new Date().toLocaleString('th-TH')}`,
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
        addToast("บันทึกไม่สำเร็จ", userMessage(result.message, "เกิดข้อผิดพลาดในการบันทึก"), "error");
      }
    } catch {
      addToast("เชื่อมต่อไม่ได้", "กรุณาลองบันทึกอีกครั้ง ข้อมูลที่กรอกยังอยู่ครบ", "error");
    } finally { setIsSaving(false); }
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
        addToast("วิเคราะห์ไม่สำเร็จ", userMessage(result.message, "เกิดข้อผิดพลาดในการวิเคราะห์"), "error");
      }
    } catch {
      addToast("Connection Error", "ไม่สามารถเชื่อมต่อกับระบบ AI ได้", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogout = () => {
    if (Object.keys(answered).length && !window.confirm('มีการประเมินที่ยังไม่บันทึก ต้องการออกจากระบบและล้างแบบร่าง?')) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    resetAllScores();
    setCurrentView('home');
    setCurrentPage('home');
    setToasts([]);
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentView(view => view === 'home' ? 'dashboard' : view);
    setIsLoggedIn(true);
  };

  const exportPDF = async () => {
    try {
      setIsExporting(true);

      const [{ default: jsPDF }, { default: autoTable }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('jspdf-autotable'), import('html2canvas')]);
      const doc = new jsPDF('p', 'mm', 'a4');

      // The licensed Thai report font ships with the frontend.
      const fontUrl = '/fonts/Sarabun-Regular.ttf';

      let base64Font = '';
      try {
        const response = await fetch(fontUrl, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('Report font is unavailable');
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
      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#101327' });
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
    setShowResults(false);
    const value = parseInt(event.target.value);
    setAnswered(prev => ({ ...prev, [category + '.' + factor]: true }));
    setAiResponse(null);
    setScores(prev => ({
      ...prev,
      [category]: { ...prev[category], [factor]: value }
    }));
  };

  const riskResult = calculateRisk();

  // คำนวณค่า Likelihood และ Impact สำหรับ Matrix (1-5)
  const matrixLh = Math.min(5, Math.max(1, Math.ceil(((calculateTotal("threatAgent") + calculateTotal("vulnerability")) / 8) / 1.8)));
  const matrixIm = Math.min(5, Math.max(1, Math.ceil(((calculateTotal("technicalImpact") + calculateTotal("businessImpact")) / 8) / 1.8)));

  const completed = Object.keys(answered).length;
  const totalScore = categories.reduce((sum, item) => sum + calculateTotal(item.id), 0);
  const isComplete = completed === 16;
  const resultsVisible = showResults && isComplete;
  const stepCounts = categories.map(category => category.factors.filter(factor => answered[category.id + '.' + factor]).length);
  const currentStepComplete = stepCounts[activeStep] === 4;
  const canOpenStep = (index) => categories.slice(0, index).every((_, step) => stepCounts[step] === 4);
  const requestClear = (scope, category, factor) => {
    setClearRequest({ scope, category, factor });
  };
  const confirmClear = () => {
    const { scope, category, factor } = clearRequest;
    if (scope === 'all') resetAllScores();
    else if (scope === 'category') resetCategoryScore(category);
    else {
      const key = category + '.' + factor;
      setAnswered(prev => Object.fromEntries(Object.entries(prev).filter(([name]) => name !== key)));
      setScores(prev => ({ ...prev, [category]: { ...prev[category], [factor]: 0 } }));
      setShowResults(false);
      setAiResponse(null);
    }
    setClearRequest(null);
  };
  const changeStep = (step) => {
    if (!canOpenStep(step)) return;
    setActiveStep(step);
    document.getElementById('main-content')?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const handleStepKey = (event, index) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const available = categories.map((_, step) => step).filter(canOpenStep);
    const position = available.indexOf(index);
    const next = event.key === 'Home' ? available[0] : event.key === 'End' ? available[available.length - 1] : available[(position + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : available.length - 1)) % available.length];
    setActiveStep(next);
    document.getElementById('tab-' + categories[next].id)?.focus();
  };
  const revealResults = () => {
    if (!isComplete) return;
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const editAssessment = () => {
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const navigate = (view) => {
    if (isLoggedIn) setCurrentView(view);
    else if (view === 'home') setCurrentPage('home');
    else { setCurrentView(view); setCurrentPage('login'); }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const siteHeader = <SiteHeader user={isLoggedIn ? user : null} view={isLoggedIn ? currentView : 'home'} onNavigate={navigate} onLogin={() => { setCurrentView('dashboard'); setCurrentPage('login'); }} onLogout={handleLogout}/>;

  if ((!isLoggedIn && currentPage === 'home') || (isLoggedIn && currentView === 'home')) {
    return <div className="reference-site"><a className="skip-link" href="#main-content">ข้ามไปเนื้อหา</a>{siteHeader}<RiskHome onStart={() => navigate('dashboard')} onHistory={() => navigate('history')}/></div>;
  }
  if (!isLoggedIn) {
    return <div className="reference-auth"><button className="text-button auth-home-return" onClick={() => setCurrentPage('home')}><Icon name="back" size={16}/> กลับหน้าแรก</button>{currentPage === 'login'
      ? <Login onLoginSuccess={handleLoginSuccess} onGoToRegister={() => setCurrentPage('register')} />
      : <Register onBackToLogin={() => setCurrentPage('login')} />}</div>;
  }

  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content">ข้ามไปเนื้อหา</a>
      {siteHeader}
      <div className="workspace-body">
        <main className={currentView === 'dashboard' && !resultsVisible ? "workspace-content assessment-screen" : "workspace-content"} id="main-content">
          {currentView === 'analytics' ? <RiskDashboard user={user} onNewAssessment={() => setCurrentView('dashboard')}/> : currentView === 'history' ? <UserHistory user={user} addToast={addToast} onNewAssessment={() => setCurrentView('dashboard')}/> : currentView === 'admin-users' ? <AdminUsers addToast={addToast}/> : <>
            <div className="page-heading wizard-page-heading">
              <div><span className="eyebrow">OWASP RISK ASSESSMENT</span><h1>{resultsVisible ? 'ผลการประเมินของคุณ' : 'ประเมินความเสี่ยง'}</h1><p>{resultsVisible ? 'ตรวจผลสรุป บันทึก หรือส่งออกรายงานได้จากหน้านี้' : 'เลือกคะแนนให้ครบ แล้วค่อยดูผลสรุป'}</p></div>
              <button className="button button-secondary reset-all" disabled={isSaving || isExporting || (!completed && !assessmentTitle)} onClick={() => requestClear('all')}><Icon name="reset" size={19}/> ล้างทั้งหมด</button>
            </div>
            {resultsVisible && <div className="result-toolbar"><span><Icon name="check"/> ประเมินครบ 16 ปัจจัยแล้ว</span><button className="button button-secondary" disabled={isSaving || isExporting || isAnalyzing} onClick={editAssessment}><Icon name="back" size={18}/> กลับไปแก้ไขคำตอบ</button></div>}
            {resultsVisible && <div className="score-strip" aria-label="ภาพรวมคะแนน">
              <div><span className="score-strip-icon"><Icon name="file"/></span><div><span>ความคืบหน้า</span><strong>{completed}<small> / 16 ปัจจัย</small></strong></div></div>
              <div><span>คะแนนโอกาสเกิด</span><strong>{calculateTotal('threatAgent') + calculateTotal('vulnerability')}<small> / 72</small></strong></div>
              <div><span>คะแนนผลกระทบ</span><strong>{calculateTotal('technicalImpact') + calculateTotal('businessImpact')}<small> / 72</small></strong></div>
              <div className="score-strip-total"><span>คะแนนรวม</span><strong>{totalScore}<small> / 144</small></strong></div>
            </div>
            }
            <div className={`assessment-layout${resultsVisible ? ' results-layout' : ' wizard-layout'}`}>
            {!resultsVisible && <aside className="wizard-progress" id="assessment-progress" aria-label="ขั้นตอนการประเมิน">
              <div className="wizard-progress-heading"><div><span>กำลังทำขั้นตอนที่</span><strong>{activeStep + 1}<small> / 4</small></strong><h2>{categories[activeStep].title}</h2></div><div className="wizard-count" aria-live="polite"><strong>{completed}<small> / 16</small></strong><span>ปัจจัยที่เลือกแล้ว</span></div></div>
              <ol className="wizard-steps" role="tablist" aria-label="หมวดการประเมิน">{categories.map((category, index) => <li role="presentation" key={category.id} className={index === activeStep ? 'current' : stepCounts[index] === 4 ? 'done' : ''}><button className="wizard-step-button" type="button" role="tab" id={'tab-' + category.id} aria-controls={'panel-' + category.id} aria-selected={activeStep === index} disabled={!canOpenStep(index)} tabIndex={activeStep === index ? 0 : -1} onClick={() => changeStep(index)} onKeyDown={event => handleStepKey(event, index)}><span>{stepCounts[index] === 4 && index !== activeStep ? <Icon name="check" size={23}/> : index + 1}</span><div><strong>{category.shortTitle || category.title}</strong><small>{index === activeStep ? 'กำลังทำ · ' : stepCounts[index] === 4 ? 'ครบแล้ว · ' : 'รอทำ · '}{stepCounts[index]}/4 ปัจจัย</small></div></button></li>)}</ol>
              <div className="wizard-total-track" role="progressbar" aria-label="ความคืบหน้าทั้งหมด" aria-valuemin={0} aria-valuemax={16} aria-valuenow={completed}><span style={{ width: (completed / 16 * 100) + '%' }}/></div>
              <p><Icon name="info" size={18}/> {isComplete ? 'เลือกครบแล้ว กด “ดูผลสรุปการประเมิน” เพื่อดูคะแนน กราฟ และคำแนะนำ' : 'ทำให้ครบทีละขั้นตอน คะแนนและผลสรุปจะแสดงหลังคุณกดดูผลเท่านั้น'}</p>
            </aside>}

              <div className="assessment-main">
                {!resultsVisible && <section className="panel assessment-panel" id="assessment-form" aria-labelledby="assessment-heading">
                  <div className="assessment-intro"><div><h2 id="assessment-heading">ขั้นตอนที่ {activeStep + 1}: {categories[activeStep].title}</h2><p>เลือกคะแนนทั้ง 4 ช่องในขั้นตอนนี้ ตั้งแต่ 0 ถึง 9</p></div><span className="step-count">เลือกแล้ว {stepCounts[activeStep]} / 4</span></div>
                  {categories.map(category => <div key={category.id} hidden={categories[activeStep].id !== category.id} className="category-content" role="tabpanel" id={'panel-' + category.id} aria-labelledby={'tab-' + category.id}>
                    <div className="category-heading"><div><p>{category.description}</p></div><button className="button button-secondary clear-category" disabled={!stepCounts[categories.indexOf(category)]} onClick={() => requestClear('category', category.id)} aria-label={'ล้างหมวด' + category.title}><Icon name="reset" size={17}/> ล้างหมวดนี้</button></div>
                    <div className="factor-list">{category.factors.map((factor, index) => {
                      const key = category.id + '.' + factor;
                      return <div className="factor-row" key={factor}><span className="factor-number">{String(index + 1).padStart(2, '0')}</span><div className="factor-description"><label htmlFor={key}>{factorTranslations[factor].split(' (')[0]}</label><small id={key + '-hint'}>{factorHints[factor]}</small></div><div className="factor-controls"><select className={answered[key] ? 'factor-select answered' : 'factor-select'} id={key} aria-describedby={key + '-hint'} value={answered[key] ? scores[category.id][factor] : ''} onChange={event => handleChange(event, category.id, factor)}><option value="" disabled>เลือกคะแนน</option>{scoreOptions.map(([value, label]) => <option value={value} key={value}>{value} — {label}</option>)}</select><button className="clear-factor" disabled={!answered[key]} onClick={() => requestClear('factor', category.id, factor)} aria-label={'ล้างช่อง' + factorTranslations[factor].split(' (')[0]}><Icon name="reset" size={16}/> ล้างช่องนี้</button></div></div>;
                    })}</div>
                  </div>)}
                  <div className="step-actions"><span className="meta" aria-live="polite">{currentStepComplete ? (activeStep === 3 ? 'ครบทั้ง 4 ขั้นตอนแล้ว พร้อมดูผลสรุป' : 'ขั้นตอนนี้ครบแล้ว ไปขั้นตอนถัดไปได้เลย') : 'เลือกอีก ' + (4 - stepCounts[activeStep]) + ' ช่อง เพื่อไปขั้นตอนถัดไป'}</span><div><button className="button button-secondary" disabled={activeStep === 0} onClick={() => changeStep(activeStep - 1)}><Icon name="back" size={18}/> ย้อนกลับ</button>{activeStep < 3 ? <button className="button button-primary" disabled={!currentStepComplete} onClick={() => changeStep(activeStep + 1)}>ไปขั้นตอนที่ {activeStep + 2} <Icon name="arrow" size={18}/></button> : <button className="button button-primary" disabled={!isComplete} onClick={revealResults}>ดูผลสรุปการประเมิน <Icon name="arrow" size={18}/></button>}</div></div>
                </section>}
                {resultsVisible && <>
                <section className="panel chart-panel" aria-labelledby="chart-heading">
                  <div className="panel-heading"><div><h2 id="chart-heading">ภาพรวมทั้ง 4 หมวด</h2><p>เปรียบเทียบคะแนนเพื่อดูว่าควรให้ความสำคัญกับส่วนใด</p></div><span className="meta">สูงสุด 36 / หมวด</span></div>
                  <div className="assessment-chart" ref={chartRef}><Bar data={{...chartData, labels: categories.map(item => item.title), datasets: chartData.datasets.map(dataset => ({ ...dataset, backgroundColor: ['#7378ff', '#9696ff', '#a9b6ff', '#c9d0ff'], borderWidth: 0, barPercentage: .6 }))}} aria-label="กราฟคะแนนความเสี่ยงทั้งสี่หมวด" role="img" options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 36, ticks: { stepSize: 9, color: '#a6afcb' }, grid: { color: '#2b3152' }, border: { display: false } }, x: { grid: { display: false }, ticks: { font: { family: 'Sarabun', size: 11 }, color: '#a6afcb' }, border: { display: false } } } }}/></div>
                </section>
                <section className="panel ai-panel" aria-labelledby="ai-heading">
                  <div className="ai-heading"><span className="ai-symbol"><Icon name="spark"/></span><div><h2 id="ai-heading">อีกมุมมองสำหรับแผนรับมือ</h2><p>ให้ AI ช่วยสรุปคะแนนและเสนอแนวทางจัดการความเสี่ยง</p></div></div>
                  {aiResponse ? <div className="ai-response"><p>{aiResponse.summary}</p><h3>แนวทางที่แนะนำ</h3><ul>{aiResponse.recommendations?.map((rec, index) => <li key={index}>{rec}</li>)}</ul>{aiResponse.insight && <p className="ai-insight">{aiResponse.insight}</p>}<button className="text-button" onClick={() => setAiResponse(null)}>ล้างผลวิเคราะห์ AI</button></div> : <button className="button button-secondary" onClick={handleAIAnalysis} disabled={!isComplete || isAnalyzing}>{isAnalyzing ? <><span className="spinner"/> กำลังวิเคราะห์</> : <><Icon name="spark" size={16}/> วิเคราะห์ด้วย AI</>}</button>}
                  <small className="field-hint">ผลวิเคราะห์เป็นข้อมูลประกอบการตัดสินใจ ควรตรวจสอบกับบริบทของงาน</small>
                </section>
                <RiskTreatment riskClass={riskResult.class} scores={scores} categories={categories} />
                </>}
              </div>
              {resultsVisible && <aside className="assessment-summary" id="assessment-result" aria-label="สรุปผลการประเมิน">
                <section className="panel summary-panel">
                  <div className="panel-heading"><h2>สรุปผลการประเมิน</h2><span className={isComplete ? 'status-label complete' : 'status-label'}>{isComplete ? 'ครบทุกปัจจัย' : 'แบบร่าง'}</span></div>
                  <div className="total-score"><span>คะแนนรวมจาก 16 ปัจจัย</span><strong>{completed ? totalScore : '—'}<small>/ 144</small></strong><span className={completed ? 'risk-status ' + riskResult.class : 'risk-status unassessed'}>{completed ? riskResult.label.split(' (')[0] : 'รอการประเมิน'}</span></div>
                  {!isComplete && <p className="summary-hint">ประเมินแล้ว {completed} จาก 16 ปัจจัย<br/>ตอบให้ครบเพื่อบันทึกผลและส่งออกรายงาน</p>}
                  <RiskMatrix likelihood={matrixLh} impact={matrixIm} hasScore={completed > 0}/>
                  <details className="score-explanation"><summary><Icon name="info" size={15}/> อ่านคะแนนอย่างไร</summary><p>คะแนนรวม 0–144 มาจากทั้ง 16 ปัจจัย ส่วนเมทริกซ์และรายงานที่บันทึกใช้โอกาสเกิด × ผลกระทบในสเกล 1–5 จึงมีคะแนน 1–25 และระดับความเสี่ยงต่างกันได้</p></details>
                  <div className="save-assessment">
                    <label htmlFor="assessment-title">ชื่อการประเมิน <small>(ไม่บังคับ)</small></label><input id="assessment-title" placeholder="เช่น ระบบจัดการข้อมูลลูกค้า" value={assessmentTitle} onChange={event => setAssessmentTitle(event.target.value)} maxLength={200}/>
                    <button className="button button-primary" onClick={handleSaveRisk} disabled={!isComplete || isSaving}>{isSaving ? <><span className="spinner"/> กำลังบันทึก</> : <><Icon name="check" size={18}/> บันทึกและเริ่มใหม่</>}</button>
                    <button className="button button-secondary" onClick={exportPDF} disabled={!isComplete || isExporting}>{isExporting ? <><span className="spinner"/> กำลังเตรียมไฟล์</> : <><Icon name="download" size={18}/> ดาวน์โหลด PDF</>}</button>
                    <small>เมื่อบันทึกแล้ว ดูผลได้ในประวัติการประเมิน</small>
                  </div>
                </section>
              </aside>}
            </div>
            <footer className="workspace-footer"><span>Risk Management Workspace</span><span>ประเมินความเสี่ยงอย่างเป็นขั้นตอน</span></footer>
          </>}
        </main>
      </div>
      {clearRequest && <Dialog titleId="clear-dialog-title" onClose={() => setClearRequest(null)}>
        <div className="clear-dialog"><span className="clear-dialog-icon"><Icon name="reset" size={29}/></span>
          <h2 id="clear-dialog-title">{clearRequest.scope === 'all' ? 'ล้างคำตอบทั้งหมด?' : clearRequest.scope === 'category' ? 'ล้างคำตอบในหมวดนี้?' : 'ล้างคำตอบช่องนี้?'}</h2>
          <p>{clearRequest.scope === 'all' ? 'คำตอบทั้ง 16 ปัจจัย ชื่อการประเมิน และผลวิเคราะห์ในแบบร่างนี้จะถูกล้าง แล้วกลับไปเริ่มขั้นตอนที่ 1' : clearRequest.scope === 'category' ? 'ล้างเฉพาะหมวด “' + categories.find(item => item.id === clearRequest.category).title + '” ทั้ง 4 ช่อง คำตอบหมวดอื่นยังอยู่ครบ' : 'ล้างเฉพาะ “' + factorTranslations[clearRequest.factor].split(' (')[0] + '” คำตอบช่องอื่นยังอยู่ครบ'}</p>
          <small>ผลการประเมินที่บันทึกในประวัติแล้วจะยังอยู่</small>
          <div className="modal-actions"><button className="button button-secondary" onClick={() => setClearRequest(null)}>ยกเลิก</button><button className="button button-danger" onClick={confirmClear}>ยืนยันการล้าง</button></div>
        </div>
      </Dialog>}
      <div className="toast-container" aria-live="polite" aria-atomic="false">{toasts.map(toast => <div key={toast.id} className={'toast-item ' + toast.type} role={toast.type === 'error' ? 'alert' : 'status'}><span className="toast-icon"><Icon name={toast.type === 'success' ? 'check' : 'info'}/></span><div className="toast-content"><strong>{toast.title}</strong><p>{toast.message}</p></div><button className="icon-button" aria-label="ปิดการแจ้งเตือน" onClick={() => setToasts(prev => prev.filter(item => item.id !== toast.id))}><Icon name="close" size={16}/></button></div>)}</div>
    </div>
  );
}
