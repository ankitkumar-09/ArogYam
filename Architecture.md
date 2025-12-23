# ArogYam

## Project Overview
**ArogYam** is a full-stack telemedicine platform connecting patients with doctors via video/voice/chat consultations and appointment booking. The architecture separates **Patient** and **Doctor** roles with distinct authentication, dashboards, and real-time communication flows.

---

## 🏗 Architecture Quick Reference

### **Layered Stack**
- **Frontend**: React 19 + Vite + TailwindCSS (SPA, port 5173)
- **Backend**: Node.js + Express 5 + Socket.io (REST + WebSocket, port 3000)
- **Database**: MongoDB + Mongoose ODM
- **Auth**: JWT tokens + Bcrypt hashing
- **Real-time**: Socket.io with 2-min connection state recovery

### **Key Service Boundaries**
1. **Doctor Routes** (`/doctors`) - Registration, profile, availability slots
2. **Patient Routes** (`/patients`) - Registration, profile, search doctors
3. **Appointment Routes** (`/appointments`) - Booking, cancellation, history
4. **Chat/Call Routes** (`/api/chat`, `/api/calls`) - Messaging and call signaling

---

## 🔑 Critical Patterns to Know

### **Authentication & Authorization**
- **Login Response**: Returns JWT token (stored in localStorage on frontend)
- **Protected Routes**: Middleware checks `Authorization: Bearer <token>` header
- **Dual Auth**: Separate `doctorMiddleware` and `patientMiddleware` verify different user types
- **Rate Limiting**: Login attempts throttled on doctor routes (`doctorLoginLimiter`)
- **Example**: `GET /doctors/profile` requires valid doctor JWT; patients get 401

### **Appointment Booking Flow (Critical)**
```
Patient GET /doctors/available (discover)
  → Patient GET /doctors/:doctorId/slots (see time slots)
  → Patient POST /appointments/book (create appointment)
    └─ Payload: { doctorId, patientId, type, scheduledAt, slotId, fee }
    └─ Returns: Appointment document with status="pending"/"confirmed"
  → Appointment stored in DB with `slotId` reference
  → Socket.io notification sent to doctor (real-time update)
```

### **Real-time Communication (Socket.io)**
- **Initialization**: Backend loads `Services/socket.js` which handles events
- **Room-based Messaging**: Doctor-patient pairs use room ID like `doctor_${doctorId}_patient_${patientId}`
- **WebRTC Signaling**: Video call offer/answer/ICE candidates sent via Socket.io
- **P2P Streams**: Audio/video flows directly between clients; server doesn't relay media
- **Auto-reconnect**: Clients reconnect within 2 minutes without losing state
- **Key Events**: `join:chat`, `send:message`, `initiate:call`, `call:answer`, `ice:candidate`

### **Context State Management (Frontend)**
- **DoctorContext**: Stores logged-in doctor data, slots, appointments
- **PatientContext**: Stores logged-in patient data, bookings, searches
- **SocketContext**: Manages Socket.io connection instance
- **Patterns**: Use `useContext(DoctorContext)` to access auth state; persist tokens in localStorage

### **Slot Management**
- **Doctor Creates Slots**: `POST /doctors/slots` with date range and times
- **Slot Storage**: Legacy slots in `Doctor.slots` array; new approach uses `DoctorDaySchedule.slots`
- **Booking**: When patient books, corresponding slot is marked "booked" or removed
- **Time Zones**: Slots stored as YYYY-MM-DD + HH:mm strings to avoid TZ issues

---

## 🛠 Developer Workflows

### **Starting Development (First Time)**
```bash
# Backend
cd backend && npm install
# Create .env with MONGODB_URI, JWT_SECRET, FRONTEND_URL
npm start  # port 3000

# Frontend (new terminal)
cd frontend && npm install
npm run dev  # port 5173

# Verify health
curl http://localhost:3000/api/health
```

### **Adding a New Feature**
1. **Define Data Model**: Add/modify schema in `backend/Models/`
2. **Create Controller Logic**: Implement in `backend/Controllers/`
3. **Add Route**: Define endpoint in `backend/Routes/`
4. **Add Middleware**: Create validation/auth in `backend/middlewares/` if needed
5. **Frontend Integration**: Call API via Axios in component, handle response with state
6. **Real-time Updates** (if needed): Emit Socket.io event from controller, listen in frontend

### **Common Commands**
| Task | Command |
|------|---------|
| Backend health | `curl http://localhost:3000/api/health` |
| Lint frontend | `cd frontend && npm run lint` |
| Build production | `cd frontend && npm run build && cd ../backend && npm start` |
| Seed test data | `node backend/DataSeeder/doctor.seeder.js` |

---

## ⚠️ Project-Specific Conventions

### **File Naming**
- Controllers: `{resource}Controller.js` (e.g., `doctorController.js`)
- Models: `{model}.model.js` or `{Model}.js` (inconsistently mixed—watch for both)
- Routes: `{resource}Routes.js`
- Middleware: `{resource}Middleware.js`

### **Error Handling**
- Express handlers return `res.status(code).json({ success: false, message: "..." })`
- No global error handler in current codebase; ensure try/catch in each controller
- Mongoose validation errors automatically caught—wrap with try/catch

### **Database Queries**
- Always use Mongoose methods (`.findById()`, `.find()`, `.updateOne()`, `.deleteOne()`)
- Populate references: `.populate('doctor').populate('patient')` on appointment queries
- Indexes: Email fields are unique; add `.index: true` for frequently queried fields

### **API Response Format**
```json
{
  "success": true,
  "data": { /* payload */ },
  "message": "Operation completed"
}
```

### **Frontend Component Structure**
- Pages live in `src/pages/Patient/` or `src/pages/Doctor/`
- Patient components in `src/patientComponent/`; Doctor components in `src/doctorComponent/`
- Protected routes wrapped with `<DoctorProtectedWrapper>` or `<PatientProtectedWrapper>`
- Always check `typeof localStorage.getItem('token')` before API calls (not in context yet)

---

## 🔗 Integration Touchpoints

### **Cross-Component Data Flow**
- **Token Passing**: Axios interceptor should add `Authorization` header (check utils/socket.js pattern)
- **Socket.io in React**: Frontend imports socket from `utils/socket.js`; events bound in `useEffect` with cleanup
- **Form Submission**: Use Axios to POST; handle errors by checking `response.success` flag

### **Common Gotchas**
1. **Slot Time Zones**: Always use UTC or fixed timezone strings (YYYY-MM-DD, HH:mm)
2. **Doctor vs Patient Auth**: Two separate JWT secrets/middleware—don't mix tokens
3. **Socket.io Rooms**: Room ID must be identical on client and server (spelling matters!)
4. **Modal Components**: Check for prop drilling (e.g., `AppointmentDeatilsModel` expects specific props)
5. **Email Verification**: `VerifyEmailPage` exists but email service not fully configured

---

## 📚 File Reference for Common Tasks

| Task | File(s) |
|------|---------|
| Add doctor API endpoint | `Routes/doctorRoutes.js` + `Controllers/doctorController.js` |
| Add appointment logic | `Routes/appointmentRoutes.js` + `Controllers/appointmentContoller.js` + `Models/appointment.model.js` |
| Handle Socket.io events | `Services/socket.js` |
| Patient login flow | `Pages/Patient/PatientRegister.jsx` + `contexts/PatientContext.jsx` |
| Create booking UI | `Pages/Patient/AppointmentBooking.jsx` + `patientComponent/DoctorCard.jsx` |
| Add rate limiting | `middlewares/doctorMiddleware.js` (see `doctorLoginLimiter`) |

---

## 🧪 Testing Notes
- No dedicated test framework configured (`"test": "echo \"Error: no test specified\"`)
- Manual testing: Start both servers, use Postman/Thunder Client for API
- Socket.io testing: Open two browser windows with different user roles
- Clear localStorage between tests if auth state persists

---

## 📦 Dependencies to Know
- **bcrypt**: Password hashing (sync operations only in production code)
- **jsonwebtoken**: Always verify `exp` claim; tokens stored in localStorage (security: use httpOnly in production)
- **mongoose**: Connection pooling handled automatically; ensure `.env` has valid URI
- **socket.io**: CORS already configured in `server.js`; reconnection enabled
- **tailwindcss**: Utility-first; check `tailwind.config.js` for custom colors

---

## 🎯 Immediate Productivity Tips
1. **Before coding**: Check if patient/doctor routes follow the same pattern (they usually do)
2. **Schema changes**: Always test with MongoDB shell or Mongoose REPL before controller logic
3. **Socket debugging**: Check `socket.id` and `socket.rooms` in browser DevTools
4. **API contracts**: Match request/response shape in both backend controller and frontend caller
5. **Context updates**: Call context setters immediately after API success to avoid UI lag

---

**Last Updated**: December 23, 2025
