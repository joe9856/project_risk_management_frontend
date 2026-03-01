import { useState } from 'react';
import { register } from './api';

export default function Register({ onBackToLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('รหัสผ่านไม่ตรงกัน');
        }

        setLoading(true);
        setError('');

        try {
            const response = await register(name, email, password);
            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    onBackToLogin();
                }, 2000);
            } else {
                setError(response.message || 'การสมัครสมาชิกล้มเหลว');
            }
        } catch (err) {
            setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper" style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
            background: '#f8fafc', color: '#1e293b'
        }}>
            <div className="login-card" style={{
                background: '#ffffff', padding: '3rem', borderRadius: '1.5rem',
                width: '100%', maxWidth: '450px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
            }}>
                <h2 style={{ marginBottom: '0.5rem', fontWeight: '800', fontSize: '1.8rem', color: '#1e293b' }}>สมัครสมาชิก</h2>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>Risk Management System</p>

                {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #fee2e2' }}>{error}</div>}
                {success && <div style={{ background: '#f0fdf4', color: '#10b981', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #dcfce7' }}>สมัครสมาชิกสำเร็จ! กำลังไปหน้าล็อกอิน...</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b' }}>ชื่อ-นามสกุล</label>
                        <input
                            type="text" value={name} onChange={(e) => setName(e.target.value)} required
                            placeholder="สมชาย ใจดี"
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b' }}>อีเมล</label>
                        <input
                            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                            placeholder="example@email.com"
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b' }}>รหัสผ่าน</label>
                        <input
                            type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                            placeholder="••••••••"
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b' }}>ยืนยันรหัสผ่าน</label>
                        <input
                            type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                            placeholder="••••••••"
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button
                        type="submit" disabled={loading || success}
                        style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', border: 'none', background: '#2563eb', color: 'white', fontWeight: 'bold', cursor: (loading || success) ? 'not-allowed' : 'pointer' }}
                    >
                        {loading ? 'กำลังสมัครสมาชิก...' : 'สร้างบัญชี'}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                    เป็นสมาชิกอยู่แล้ว? <span onClick={onBackToLogin} style={{ color: '#2563eb', fontWeight: 'bold', cursor: 'pointer' }}>เข้าสู่ระบบที่นี่</span>
                </p>
            </div>
        </div>
    );
}
