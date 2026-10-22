/**
 * RiskDashboard.jsx
 * Analytics Dashboard — แสดงภาพรวมสถิติและแนวโน้มความเสี่ยง
 * ดึงข้อมูลจาก History (getActivities) และแสดงเป็น Charts
 */
import { useState, useEffect, useRef } from 'react';
import { getActivities } from './api';
import { Icon } from './UI';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, RadialLinearScale, ArcElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Radar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, RadialLinearScale, ArcElement,
  Title, Tooltip, Legend, Filler,
);

const riskColors = {
  Low: { label: 'ต่ำ', color: '#84e0b5', bg: '#142e2b', border: '#326351' },
  Medium: { label: 'ปานกลาง', color: '#f5d27d', bg: '#332d1e', border: '#7a6830' },
  High: { label: 'สูง', color: '#ffacb5', bg: '#351e32', border: '#714050' },
  Critical: { label: 'วิกฤต', color: '#ff6b8a', bg: '#3a1220', border: '#8a2040' },
};

function StatCard({ label, value, sub, icon, color, bg, border, trend }) {
  return (
    <div className="dash-stat" style={{ borderColor: border || 'var(--border)', background: bg || 'var(--panel-background)' }}>
      <div className="dash-stat-icon" style={{ color: color || 'var(--primary)', background: (bg || 'var(--primary-soft)') }}>
        <Icon name={icon} size={20} />
      </div>
      <div className="dash-stat-content">
        <span>{label}</span>
        <strong style={{ color: color || 'var(--text)' }}>{value}</strong>
        {sub && <small>{sub}</small>}
      </div>
      {trend !== undefined && (
        <div className={`dash-stat-trend ${trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-flat'}`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

function parseScores(description) {
  if (!description) return null;
  try {
    const data = JSON.parse(description);
    if (data.threatAgent && data.vulnerability) return data;
    return null;
  } catch { return null; }
}

function calcCatTotal(scores, catId) {
  if (!scores || !scores[catId]) return 0;
  return Object.values(scores[catId]).reduce((s, v) => s + (v || 0), 0);
}

export default function RiskDashboard({ user, onNewAssessment }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getActivities()
      .then(res => {
        if (!active) return;
        if (!res.success) throw new Error(res.message || 'โหลดข้อมูลไม่สำเร็จ');
        // กรองเฉพาะ CREATE_RISK
        setLogs(res.data.filter(l => l.action === 'CREATE_RISK'));
      })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return (
    <div className="dash-loading">
      <span className="spinner" />
      <p>กำลังโหลดข้อมูล Dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="dash-error">
      <Icon name="info" size={22} />
      <p>{error}</p>
    </div>
  );

  if (!logs.length) return (
    <div className="dash-empty">
      <Icon name="grid" size={40} />
      <h3>ยังไม่มีข้อมูลสถิติ</h3>
      <p>บันทึกการประเมินอย่างน้อย 1 ครั้งเพื่อดู Dashboard</p>
      <button className="button button-primary" onClick={onNewAssessment}>
        เริ่มประเมินครั้งแรก <Icon name="arrow" size={16} />
      </button>
    </div>
  );

  // --- คำนวณสถิติ ---
  const total = logs.length;
  const riskDist = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  logs.forEach(l => { if (riskDist[l.risk_level] !== undefined) riskDist[l.risk_level]++; });

  const highestRisk = logs.reduce((max, l) => {
    const score = (l.likelihood || 1) * (l.impact || 1);
    const maxScore = (max.likelihood || 1) * (max.impact || 1);
    return score > maxScore ? l : max;
  }, logs[0]);

  // Radar Chart — ค่าเฉลี่ยแต่ละ Category
  const parsed = logs.map(l => {
    let detail;
    try { detail = typeof l.detail === 'string' ? JSON.parse(l.detail) : l.detail; } catch { detail = null; }
    const inputs = detail?.inputs;
    let inputsParsed;
    try { inputsParsed = typeof inputs === 'string' ? JSON.parse(inputs) : inputs; } catch { inputsParsed = inputs; }
    return inputsParsed;
  }).filter(Boolean);

  const avgCat = {
    threatAgent: parsed.length ? parsed.reduce((s, p) => s + calcCatTotal(p, 'threatAgent'), 0) / parsed.length : 0,
    vulnerability: parsed.length ? parsed.reduce((s, p) => s + calcCatTotal(p, 'vulnerability'), 0) / parsed.length : 0,
    technicalImpact: parsed.length ? parsed.reduce((s, p) => s + calcCatTotal(p, 'technicalImpact'), 0) / parsed.length : 0,
    businessImpact: parsed.length ? parsed.reduce((s, p) => s + calcCatTotal(p, 'businessImpact'), 0) / parsed.length : 0,
  };

  const radarData = {
    labels: ['ภัยคุกคาม', 'ช่องโหว่', 'ผลกระทบเทคนิค', 'ผลกระทบธุรกิจ'],
    datasets: [{
      label: 'คะแนนเฉลี่ย',
      data: [avgCat.threatAgent, avgCat.vulnerability, avgCat.technicalImpact, avgCat.businessImpact],
      backgroundColor: 'rgba(164, 168, 255, 0.15)',
      borderColor: '#a4a8ff',
      borderWidth: 2,
      pointBackgroundColor: '#a4a8ff',
      pointRadius: 4,
      fill: true,
    }],
  };

  // Line Chart — Trend คะแนนล่าสุด 10 รายการ
  const recent = [...logs].reverse().slice(0, 10).reverse();
  const lineData = {
    labels: recent.map((_, i) => `#${i + 1}`),
    datasets: [{
      label: 'คะแนนรวม',
      data: recent.map(l => {
        let detail, inputsParsed;
        try { detail = typeof l.detail === 'string' ? JSON.parse(l.detail) : l.detail; } catch { detail = null; }
        const inputs = detail?.inputs;
        try { inputsParsed = typeof inputs === 'string' ? JSON.parse(inputs) : inputs; } catch { inputsParsed = inputs; }
        if (!inputsParsed) return null;
        return ['threatAgent', 'vulnerability', 'technicalImpact', 'businessImpact']
          .reduce((s, k) => s + calcCatTotal(inputsParsed, k), 0);
      }),
      borderColor: '#a4a8ff',
      backgroundColor: 'rgba(164,168,255,0.08)',
      borderWidth: 2,
      pointBackgroundColor: '#a4a8ff',
      pointRadius: 4,
      tension: 0.4,
      fill: true,
    }],
  };

  // Doughnut — Risk Distribution
  const doughnutData = {
    labels: ['ต่ำ', 'ปานกลาง', 'สูง', 'วิกฤต'],
    datasets: [{
      data: [riskDist.Low, riskDist.Medium, riskDist.High, riskDist.Critical],
      backgroundColor: ['#142e2b', '#332d1e', '#351e32', '#3a1220'],
      borderColor: ['#326351', '#7a6830', '#714050', '#8a2040'],
      borderWidth: 2,
    }],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  const radarOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        min: 0,
        max: 36,
        ticks: { stepSize: 9, color: '#a6afcb', font: { size: 10 } },
        grid: { color: '#2b3152' },
        pointLabels: { color: '#a6afcb', font: { size: 11 } },
        angleLines: { color: '#2b3152' },
      },
    },
  };

  const lineOpts = {
    ...chartOpts,
    scales: {
      y: { min: 0, max: 144, ticks: { color: '#a6afcb', font: { size: 10 } }, grid: { color: '#2b3152' }, border: { display: false } },
      x: { ticks: { color: '#a6afcb', font: { size: 10 } }, grid: { display: false }, border: { display: false } },
    },
  };

  const doughnutOpts = {
    ...chartOpts,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { color: '#a6afcb', font: { size: 10 }, padding: 12 } },
    },
    cutout: '68%',
  };

  return (
    <div className="risk-dashboard" id="main-content">
      {/* Header */}
      <div className="dash-header">
        <div>
          <span className="eyebrow">ANALYTICS OVERVIEW</span>
          <h1>Risk Dashboard</h1>
          <p>สรุปสถิติและแนวโน้มความเสี่ยงจากการประเมินทั้งหมด</p>
        </div>
        <button className="button button-primary" onClick={onNewAssessment}>
          <Icon name="shield" size={16} /> ประเมินใหม่
        </button>
      </div>

      {/* Stat Cards */}
      <div className="dash-stats-grid">
        <StatCard
          label="การประเมินทั้งหมด"
          value={total}
          sub="รายการ"
          icon="file"
          color="var(--primary)"
          bg="var(--primary-soft)"
          border="var(--border)"
        />
        <StatCard
          label="ความเสี่ยงสูง / วิกฤต"
          value={riskDist.High + riskDist.Critical}
          sub={`จาก ${total} รายการ`}
          icon="shield"
          color="#ffacb5"
          bg="#351e32"
          border="#714050"
        />
        <StatCard
          label="ความเสี่ยงต่ำ"
          value={riskDist.Low}
          sub={`${total ? Math.round(riskDist.Low / total * 100) : 0}% ของทั้งหมด`}
          icon="check"
          color="#84e0b5"
          bg="#142e2b"
          border="#326351"
        />
        <StatCard
          label="คะแนน Matrix สูงสุด"
          value={`${(highestRisk.likelihood || 1) * (highestRisk.impact || 1)}/25`}
          sub={highestRisk.title?.slice(0, 30) || 'N/A'}
          icon="grid"
          color="#f5d27d"
          bg="#332d1e"
          border="#7a6830"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="dash-charts-row">
        {/* Radar Chart */}
        <div className="panel dash-chart-card">
          <div className="panel-heading">
            <div>
              <h2>คะแนนเฉลี่ยแต่ละมิติ</h2>
              <p>Radar Chart เปรียบเทียบ 4 หมวด (สเกล 0–36)</p>
            </div>
          </div>
          <div className="dash-radar-wrap">
            <Radar data={radarData} options={radarOpts} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="panel dash-chart-card">
          <div className="panel-heading">
            <div>
              <h2>การกระจายระดับความเสี่ยง</h2>
              <p>สัดส่วนแต่ละระดับจากการประเมินทั้งหมด</p>
            </div>
          </div>
          <div className="dash-doughnut-wrap">
            <Doughnut data={doughnutData} options={doughnutOpts} />
          </div>
          <div className="dash-risk-dist">
            {Object.entries(riskDist).map(([level, count]) => {
              const info = riskColors[level];
              return (
                <div key={level} className="dist-item">
                  <span style={{ background: info.border, width: 8, height: 8, borderRadius: 2, display: 'inline-block' }} />
                  <span style={{ color: info.color }}>{info.label}</span>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Line Chart — Trend */}
      <div className="panel dash-trend-card">
        <div className="panel-heading">
          <div>
            <h2>แนวโน้มคะแนนรวม</h2>
            <p>คะแนนรวม (0–144) ของการประเมิน {recent.length} รายการล่าสุด</p>
          </div>
          <span className="meta">สเกล 0–144</span>
        </div>
        <div className="dash-trend-wrap">
          <Line data={lineData} options={lineOpts} />
        </div>
      </div>

      {/* ISO Framework Compliance Panel */}
      <div className="panel dash-framework-card">
        <div className="panel-heading">
          <div>
            <h2>Framework Coverage</h2>
            <p>มาตรฐานที่ระบบนี้อ้างอิง</p>
          </div>
          <span className="iso-ref">v2.0</span>
        </div>
        <div className="framework-grid">
          {[
            {
              name: 'OWASP Risk Rating',
              version: 'Methodology v2',
              icon: 'shield',
              color: '#a4a8ff',
              bg: '#1d2149',
              items: ['Threat Agent Factors', 'Vulnerability Factors', 'Technical Impact', 'Business Impact'],
            },
            {
              name: 'ISO 31000',
              version: '2018 Edition',
              icon: 'check',
              color: '#84e0b5',
              bg: '#142e2b',
              items: ['Risk Treatment Plan', 'Avoid / Mitigate / Transfer / Accept', 'Risk Register', 'Risk Owner Assignment'],
            },
            {
              name: 'NIST CSF',
              version: 'v2.0 (2024)',
              icon: 'lock',
              color: '#f5d27d',
              bg: '#332d1e',
              items: ['Identify (ID.RA)', 'Protect (PR.AC)', 'Detect (DE.AE)', 'Respond (RS.IM)'],
            },
          ].map(fw => (
            <div key={fw.name} className="framework-card" style={{ borderColor: fw.bg, background: fw.bg + '88' }}>
              <div className="framework-card-header">
                <span style={{ color: fw.color, background: fw.bg, border: `1px solid ${fw.color}33`, padding: '6px 8px', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                  <Icon name={fw.icon} size={16} />
                </span>
                <div>
                  <strong style={{ color: fw.color }}>{fw.name}</strong>
                  <small>{fw.version}</small>
                </div>
              </div>
              <ul className="framework-items">
                {fw.items.map(item => (
                  <li key={item}><Icon name="check" size={11} style={{ color: fw.color }} />{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
