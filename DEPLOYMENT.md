# Risk Management Frontend — Vercel

React + Vite จาก `joe9856/project_risk_management_frontend`
สำเนาสำหรับ Cloud: `D:/portfolio/risk-management-cloud`

## Local Preview

1. เปิด API ใน `../risk-management-api` ด้วย `node scripts/local-preview.js`
2. รัน `npm ci` แล้ว `npm run dev` ในโฟลเดอร์นี้
3. เปิด `http://127.0.0.1:9998` และสมัครบัญชีทดสอบผ่านหน้าเว็บ

Vite Proxy ส่ง `/api` ไป `127.0.0.1:9997` เฉพาะตอนพัฒนาในเครื่อง
ข้อมูลใน Preview API เป็นข้อมูลชั่วคราวและไม่เชื่อม Railway / Supabase

## Deploy

- Import Repository นี้เป็น Vercel Project, Framework = Vite
- Build = `npm run build`, Output = `dist`
- ตั้ง `VITE_API_URL=https://<vercel-backend-domain>/api` ใน Frontend Environment
- ตั้ง `CORS_ORIGIN=https://<vercel-frontend-domain>` ใน Backend Environment
- Redeploy หลังเปลี่ยน Environment
- อย่าใส่ `DATABASE_URL`, JWT secret หรือ Gemini key ในตัวแปรชื่อขึ้นต้น `VITE_`

Backend Express อยู่บน Vercel ส่วนฐานข้อมูล PostgreSQL อยู่บน Supabase
รายละเอียด Schema, Server Secrets และข้อจำกัดการย้ายข้อมูลอยู่ใน
`../risk-management-api/README.md`

การแก้ในสำเนานี้: เปลี่ยน API base URL เป็น Environment, เอาแพ็กเกจที่ไม่ได้ใช้
ซึ่งชนกับ React 19 ออก, ปรับ Admin ไม่แสดงรหัสผ่านใน Toast และต้องระบุรหัสผ่าน
อย่างน้อย 8 ตัวอักษร ยังไม่ Push กลับ GitHub และยังไม่ Deploy Cloud
