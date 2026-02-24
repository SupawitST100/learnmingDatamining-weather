# 🚀 Deploy Guide — Railway (Backend) + Vercel (Frontend)

---

## STEP 1 — Deploy Backend บน Railway

### 1.1 สมัคร Railway
- ไปที่ https://railway.app
- กด **Login with GitHub**

### 1.2 สร้าง Project ใหม่
1. กด **New Project**
2. เลือก **Deploy from GitHub repo**
3. เลือก repo ของคุณ (ต้อง push โค้ดขึ้น GitHub ก่อน)
4. Railway จะถามว่าจะ deploy folder ไหน → เลือก **backend/**

> ถ้ายังไม่มี GitHub repo ให้ทำก่อน:
> ```bash
> git init
> git add .
> git commit -m "first commit"
> git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
> git push -u origin main
> ```

### 1.3 ตั้งค่า Root Directory
ใน Railway dashboard:
- Settings → **Root Directory** → พิมพ์ `backend`

### 1.4 รอ Deploy เสร็จ
Railway จะ:
1. ติดตั้ง requirements.txt อัตโนมัติ
2. รัน uvicorn

### 1.5 คัดลอก URL
- ไปที่ Settings → **Domains** → กด **Generate Domain**
- จะได้ URL เช่น `https://weather-backend-xxxx.railway.app`
- **เก็บ URL นี้ไว้ใช้ใน STEP 2**

---

## STEP 2 — แก้ Frontend ให้ชี้ไป Railway

### 2.1 แก้ไฟล์ .env
เปิดไฟล์ `.env` ในโปรเจกต์ root แล้วแก้:
```
VITE_API_URL=https://your-app.railway.app
```
เปลี่ยน `your-app.railway.app` เป็น URL จริงจาก Step 1.5

### 2.2 แก้ใน Vercel Dashboard (สำคัญมาก!)
ถ้า deploy บน Vercel อยู่แล้ว ต้องไปตั้งค่า Environment Variable ใน Vercel ด้วย:
1. ไปที่ Vercel Dashboard → เลือก Project
2. **Settings** → **Environment Variables**
3. เพิ่ม:
   - Name: `VITE_API_URL`
   - Value: `https://your-app.railway.app`
4. กด **Save**
5. กด **Redeploy** (ใน Deployments tab)

---

## STEP 3 — ทดสอบ

เปิด URL ของ Railway ตรงๆ ในเบราว์เซอร์:
```
https://your-app.railway.app/docs
```
ถ้าเห็นหน้า API docs = Backend พร้อมใช้งาน ✅

---

## สรุป Architecture

```
ผู้ใช้
  ↓
Vercel (Frontend React)
  ↓ fetch API
Railway (Backend Python FastAPI)
  ↓ load
seattle-weather.csv (อยู่ใน repo)
```
