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

เป้าหมายการเผยแพร่คือ Backend Express บน Vercel และฐานข้อมูล PostgreSQL บน Supabase
ซอร์ส Backend อยู่ที่ `joe9856/project_risk_management` ใน branch `main`
รายละเอียด Schema, Server Secrets และข้อจำกัดการย้ายข้อมูลอยู่ใน
`../risk-management-api/README.md`

## ส่วนติดต่อผู้ใช้

- แบบประเมินแบ่งเป็น 4 หมวด เก็บคำตอบเมื่อสลับหมวด และนับคะแนน 0 เป็นคำตอบ
- ตอบครบ 16 ปัจจัยก่อนบันทึก ส่งออก PDF หรือเรียกวิเคราะห์ AI
- สูตรคะแนนเดิมยังคงอยู่: ผลรวม 0–144 และคะแนนเมทริกซ์/ข้อมูลที่บันทึก 1–25
- ประวัติค้นหาในรายการที่โหลดมาได้ พร้อมรายละเอียดและ PDF
- ไลบรารี PDF โหลดเมื่อใช้งาน ฟอนต์รายงานอยู่ใน `public/fonts/` พร้อม OFL license
- หน้าบ้านและหลังบ้าน Deploy แยกกัน การปรับ UI ไม่เปลี่ยนฐานข้อมูลหรือ Server Secrets
