import { useState, useEffect, useRef } from 'react';

const paths = {
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8.5 11.5 2.5 2.5 4.5-5"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  history: <><path d="M3 11a9 9 0 1 1 2.5 7"/><path d="M3 4v7h7M12 7v5l3 2"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.9"/><circle cx="9" cy="7" r="4"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  back: <path d="M20 12H4m6-6-6 6 6 6"/>,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/>,
  reset: <path d="M3 10a9 9 0 1 1 2.5 8M3 3v7h7"/>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
  eyeOff: <path d="m3 3 18 18M10.6 5.1 12 5c6.5 0 10 7 10 7a20 20 0 0 1-3 3.8M6.3 6.3A21 21 0 0 0 2 12s3.5 7 10 7a12 12 0 0 0 5.7-1.7"/>,
  logout: <path d="M9 4H4v16h5M13 8l4 4-4 4M8 12h13"/>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  chevron: <path d="m9 5 7 7-7 7"/>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
  spark: <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  file: <path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8M8 16h5"/>,
};

export function userMessage(message, fallback) {
  const messages = {
    'Invalid email or password.': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
    'Email already registered.': 'อีเมลนี้มีบัญชีแล้ว ลองเข้าสู่ระบบด้วยบัญชีเดิม',
    'Service unavailable. Please try again.': 'ระบบยังไม่พร้อมใช้งาน กรุณารอสักครู่แล้วลองอีกครั้ง',
    'Too many requests. Please try again later.': 'ลองหลายครั้งเกินไป กรุณารอสักครู่ก่อนลองใหม่',
    'Authentication is not configured.': 'ระบบเข้าสู่ระบบยังไม่พร้อมใช้งาน กรุณาลองภายหลัง',
    'Invalid or expired token.': 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
    'Access denied. No token provided.': 'กรุณาเข้าสู่ระบบอีกครั้งเพื่อใช้งานต่อ',
    'Account unavailable.': 'ไม่สามารถใช้บัญชีนี้ได้ กรุณาเข้าสู่ระบบอีกครั้ง',
  };
  return messages[message] || message || fallback;
}

export function Icon({ name, size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.shield}</svg>;
}

export function Brand({ light = false }) {
  return <div className={`brand ${light ? 'brand-light' : ''}`}><span className="brand-symbol"><Icon name="shield" size={26}/></span><span><strong>Risk Management</strong><small>พื้นที่ประเมินความเสี่ยง</small></span></div>;
}

export function PasswordField({ id, label = 'รหัสผ่าน', value, onChange, autoComplete = 'current-password', minLength, hint, disabled = false }) {
  const [visible, setVisible] = useState(false);
  return <div className="form-field"><label htmlFor={id}>{label}</label><div className="password-input"><input id={id} name={id} type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} required minLength={minLength} disabled={disabled} aria-describedby={hint ? `${id}-hint` : undefined} placeholder="กรอกรหัสผ่านของคุณ"/><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? `ซ่อน${label}` : `แสดง${label}`} aria-pressed={visible}><Icon name={visible ? 'eyeOff' : 'eye'}/></button></div>{hint && <small id={`${id}-hint`} className="field-hint">{hint}</small>}</div>;
}

export function Dialog({ titleId, onClose, children }) {
  const element = useRef(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.current.querySelector('button')?.focus();
    function handleKey(event) {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const items = Array.from(element.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')).filter(item => item.getClientRects().length);
      if (!items.length) { event.preventDefault(); element.current.focus(); return; }
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus(); }
    }
    document.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', handleKey); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div className="modal-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div className="modal-content" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={element}><button type="button" className="icon-button modal-close" aria-label="ปิดหน้าต่าง" onClick={onClose}><Icon name="close"/></button>{children}</div></div>;
}
