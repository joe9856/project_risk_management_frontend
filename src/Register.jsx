import { useState } from 'react';
import { register } from './api';
import AuthLayout from './AuthLayout';
import { Icon, PasswordField, userMessage } from './UI';

export default function Register({ onBackToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading || success) return;
    if (password !== confirmPassword) return setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
    if (new TextEncoder().encode(password).length > 72) return setError('รหัสผ่านยาวเกินไป กรุณาใช้ไม่เกิน 72 ไบต์');
    setError('');
    setLoading(true);
    try {
      const response = await register(name.trim(), email.trim(), password);
      if (response.success) setSuccess(true);
      else setError(userMessage(response.message, 'สร้างบัญชีไม่สำเร็จ กรุณาลองอีกครั้ง'));
    } catch { setError('เชื่อมต่อไม่ได้ในขณะนี้ กรุณาลองอีกครั้ง'); }
    finally { setLoading(false); }
  }

  return <AuthLayout>
    <button className="text-button auth-back" onClick={onBackToLogin}><Icon name="back" size={16}/> กลับเข้าสู่ระบบ</button>
    {success ? <div className="auth-success" role="status"><span className="success-symbol"><Icon name="check" size={30}/></span><h2>บัญชีพร้อมใช้งานแล้ว</h2><p>เข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่เพิ่งสร้าง<br/>เพื่อเริ่มการประเมินครั้งแรกของคุณ</p><button className="button button-primary auth-submit" onClick={onBackToLogin}>ไปหน้าเข้าสู่ระบบ <Icon name="arrow" size={18}/></button></div> : <>
      <h2>เริ่มต้นจัดการความเสี่ยง</h2>
      <p className="auth-description">สร้างบัญชีเพื่อเก็บผลการประเมินของคุณ</p>
      {error && <div className="form-notice error" role="alert"><Icon name="info"/><span>{error}</span></div>}
      <form onSubmit={handleSubmit} aria-busy={loading}>
        <div className="form-field"><label htmlFor="register-name">ชื่อ–นามสกุล</label><input id="register-name" name="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required maxLength={100} disabled={loading} placeholder="ชื่อที่ต้องการแสดงในระบบ"/></div>
        <div className="form-field"><label htmlFor="register-email">อีเมล</label><input id="register-email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" value={email} onChange={e => setEmail(e.target.value)} required maxLength={150} disabled={loading} placeholder="you@example.com"/></div>
        <PasswordField id="register-password" autoComplete="new-password" minLength={8} hint="อย่างน้อย 8 ตัวอักษร" value={password} onChange={e => setPassword(e.target.value)} disabled={loading}/>
        <PasswordField id="confirm-password" label="ยืนยันรหัสผ่าน" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading}/>
        <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? <><span className="spinner"/> กำลังสร้างบัญชี</> : <>สร้างบัญชี <Icon name="arrow" size={18}/></>}</button>
      </form>
      <div className="auth-switch">มีบัญชีอยู่แล้ว? <button className="text-button" onClick={onBackToLogin}>เข้าสู่ระบบ</button></div>
    </>}
  </AuthLayout>;
}
