export default function RiskMatrix({ likelihood, impact, hasScore }) {
  return <div className="risk-matrix">
    <div className="panel-heading"><h3>เมทริกซ์ความเสี่ยง</h3><span className="meta">สเกล 1–25</span></div>
    <div className="matrix-axis-title">ผลกระทบ</div>
    <div className="matrix-grid" role="img" aria-label={hasScore ? `โอกาสเกิด ${likelihood} จาก 5 ผลกระทบ ${impact} จาก 5 คะแนนเมทริกซ์ ${likelihood * impact} จาก 25` : 'เมทริกซ์ความเสี่ยง รอการประเมิน'}>
      {[5, 4, 3, 2, 1].map(row => <div key={row} className="matrix-row"><span className="matrix-tick">{row}</span>{[1, 2, 3, 4, 5].map(col => {
        const score = row * col;
        const level = score >= 20 ? 'critical' : score >= 12 ? 'high' : score >= 6 ? 'medium' : 'low';
        return <span key={col} className={`matrix-cell ${level} ${hasScore && row === impact && col === likelihood ? 'active' : ''}`}>{score}</span>;
      })}</div>)}
      <div className="matrix-row matrix-ticks"><span/>{[1, 2, 3, 4, 5].map(col => <span key={col}>{col}</span>)}</div>
    </div>
    <div className="matrix-axis-title axis-bottom">โอกาสเกิด</div>
    <div className="matrix-legend"><span><i className="legend-low"/>ต่ำ</span><span><i className="legend-medium"/>ปานกลาง</span><span><i className="legend-high"/>สูง</span><span><i className="legend-critical"/>วิกฤต</span></div>
  </div>;
}
