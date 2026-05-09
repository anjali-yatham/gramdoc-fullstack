# GramDoc — Rural Telemedicine Platform

Full-stack telemedicine app built for rural India.

## Tech Stack
- **Frontend**: React 18 + Vite + React Router
- **Backend**: Node.js + Express + MongoDB + Mongoose
- **Auth**: JWT + OTP (Phone) / Email-Password

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend
```bash
cd backend
npm install
cp .env.example .env      # Fill in MONGO_URI and JWT_SECRET
npm run dev               # Runs on http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev               # Runs on http://localhost:5173
```

## Screens
1. **Landing** — Hero page with features and CTA
2. **Auth** — Patient (Phone OTP / Email) + Doctor (3-step application)
3. **Dashboard** — Greeting, mood tiles, stats, follow-up
4. **AI Triage Chat** — Symptom checker with quick replies + language toggle
5. **Doctor Selection** — Cards with filters, availability, ratings
6. **Consultation** — Video call UI with chat panel, mute/cam controls
7. **Prescriptions** — Digital Rx with medicines, QR code, WhatsApp share

## API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/send-otp | Send OTP to phone |
| POST | /api/auth/verify-otp | Verify OTP, get token |
| POST | /api/auth/login | Email/password login |
| POST | /api/auth/signup | Register patient |
| POST | /api/auth/doctor-apply | Doctor registration |
| GET  | /api/doctors | List verified doctors |
| GET  | /api/doctors/:id | Doctor details |
| GET  | /api/consultations/queue | Active consultations |
| POST | /api/consultations/start | Start consultation |
| POST | /api/consultations/:id/end | End consultation |
| GET  | /api/prescriptions | Patient prescriptions |
| POST | /api/triage/chat | AI triage response |
| GET  | /api/dashboard/stats | Dashboard stats |

## Design System
- **Primary**: Forest Green `#0f3d2a`
- **Accent**: Mint `#7bcaa4`
- **Warm**: Terracotta `#c4653a`
- **Background**: Cream `#fdf6ec`
- **Display Font**: Fraunces (italic)
- **Body Font**: Mukta (multilingual: Telugu/Hindi)
