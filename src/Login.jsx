import { useState } from 'react';
import { login } from './api';
import AuthLayout from './AuthLayout';
import { Icon, PasswordField, userMessage } from './UI';

export default function Login({ onLoginSuccess, onGoToRegister, notice }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await login(email.trim(), password);
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onLoginSuccess?.(response.data.user);
      } else setError(userMessage(response.message, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง'));
    } catch {
      setError('เชื่อมต่อไม่ได้ในขณะนี้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง');
    } finally { setLoading(false); }
  };

  return <AuthLayout>
    <span className="eyebrow">ยินดีต้อนรับกลับมา</span>
    <h2>เข้าสู่พื้นที่ทำงานของคุณ</h2>
    <p className="auth-description">พร้อมประเมินและจัดการความเสี่ยงต่อจากเดิม</p>
    {notice && <div className="form-notice" role="status"><Icon name="info"/><span>{notice}</span></div>}
    {error && <div className="form-notice error" role="alert"><Icon name="info"/><span>{error}</span></div>}
    <form onSubmit={handleSubmit} aria-busy={loading}>
      <div className="form-field"><label htmlFor="login-email">อีเมล</label><input id="login-email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} placeholder="you@example.com"/></div>
      <PasswordField id="login-password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading}/>
      <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? <><span className="spinner"/> กำลังเข้าสู่ระบบ</> : <>เข้าสู่ระบบ <Icon name="arrow" size={18}/></>}</button>
    </form>
    <div className="auth-switch">เริ่มใช้งานครั้งแรก? <button className="text-button" onClick={onGoToRegister}>สร้างบัญชีใหม่</button></div>
    <div className="auth-note"><Icon name="info" size={17}/><p>ใช้บัญชีเดียวเพื่อบันทึกผลการประเมิน<br/>และกลับมาตรวจสอบย้อนหลังได้</p></div>
  </AuthLayout>;
}
