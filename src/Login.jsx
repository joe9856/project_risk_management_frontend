import { useState } from 'react';
import { login } from './api';

export default function Login({ onLoginSuccess, onGoToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(email, password);
      if (response.success) {
        // บันทึก Token และข้อมูลผู้ใช้
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // แจ้ง App ว่า Login สำเร็จแล้ว
        if (onLoginSuccess) onLoginSuccess(response.data.user);
      } else {
        setError(response.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper" style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh',
      background: '#f8fafc', color: '#1e293b'
    }}>
      <div className="login-card" style={{
        background: '#ffffff', padding: '3rem', borderRadius: '1.5rem',
        width: '100%', maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ marginBottom: '0.5rem', fontWeight: '800', fontSize: '1.8rem', color: '#1e293b' }}>เข้าสู่ระบบ</h2>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Risk Management System</p>

        {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #fee2e2' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b' }}>อีเมล</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="example@email.com"
              style={{ width: '100%', padding: '0.8rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b' }}>รหัสผ่าน</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{ width: '100%', padding: '0.8rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', border: 'none', background: '#2563eb', color: 'white', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease' }}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
          ยังไม่มีบัญชี? <span onClick={onGoToRegister} style={{ color: '#2563eb', fontWeight: 'bold', cursor: 'pointer' }}>สมัครสมาชิกที่นี่</span>
        </p>
      </div>
    </div>
  );
}
