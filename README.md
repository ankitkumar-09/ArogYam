[# 🏥 ArogYam - Healthcare Appointment & Consultation Platform

ArogYam is a full-stack telemedicine and appointment management platform that connects patients with doctors for video consultations, voice calls, chat, and in-person appointments. Built with modern web technologies, it provides seamless scheduling, real-time communication, and payment integration.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [Development Workflow](#-development-workflow)
- [API Documentation](#-api-documentation)
- [Real-time Communication](#-real-time-communication)
- [Database Schema](#-database-schema)

---

## 🎯 Overview

ArogYam enables a modern healthcare experience by providing:
- **Appointment Booking**: Patients can browse available doctors and book appointments by time slots
- **Multi-mode Consultations**: Support for video, voice, chat, and in-person consultations
- **Real-time Communication**: Socket.io powered instant messaging and video calls
- **Doctor Profiles**: Detailed doctor profiles with specialization, experience, qualifications, and consultation fees
- **Patient Dashboard**: Appointment history, upcoming bookings, and chat with doctors
- **Doctor Dashboard**: Manage appointments, patient interactions, notes, and case studies

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Doctor Registration & Profile** | Doctors can register, set specialization, qualifications, languages, and consultation fees |
| **Patient Registration & Profile** | Patients create profiles with medical information (blood group, height, weight, medical history) |
| **Appointment Booking** | Dynamic slot booking with multiple consultation types and fee structures |
| **Real-time Video/Voice Calls** | WebRTC-based peer-to-peer communication with Socket.io signaling |
| **Instant Chat** | Real-time messaging between doctors and patients |
| **Payment Integration** | Secure payment processing for consultations and contact reveals |
| **Appointment History** | Track past and upcoming appointments with detailed information |
| **Doctor Discovery** | Search and filter available doctors by specialization, experience, and ratings |
| **Medical Notes** | Doctors can maintain notes and case studies for patient interactions |
| **Email Verification** | Secure user registration with email verification |

---

## 🛠 Tech Stack

### **Backend**
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime for server-side development |
| **Express.js v5.2.1** | Web framework for REST APIs |
| **MongoDB** | NoSQL database for data persistence |
| **Mongoose v9.0.1** | ODM (Object Data Modeling) for MongoDB |
| **Socket.io v4.8.1** | Real-time bidirectional communication |
| **JWT (jsonwebtoken v9.0.3)** | Authentication & authorization tokens |
| **Bcrypt v6.0.0** | Password hashing and encryption |
| **CORS v2.8.5** | Cross-Origin Resource Sharing |
| **Dotenv v17.2.3** | Environment variable management |

### **Frontend**
| Technology | Purpose |
|------------|---------|
| **React v19.2.0** | UI component library |
| **Vite v7.2.4** | Next-gen frontend build tool |
| **React Router v7.10.1** | Client-side routing |
| **Socket.io Client v4.8.1** | Real-time communication client |
| **Axios v1.13.2** | HTTP client for API requests |
| **TailwindCSS v4.1.18** | Utility-first CSS framework |
| **Lucide React v0.561.0** | Icon library |
| **React Icons v5.5.0** | Additional icon set |

---

## 🏗 System Architecture

### **High-Level Application Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                     ArogYam Platform Flow                       │
└─────────────────────────────────────────────────────────────────┘

                          Frontend (React + Vite)
                    ┌──────────────────────────────┐
                    │  Patient UI   │   Doctor UI  │
                    │  • Dashboard  │ • Dashboard  │
                    │  • Booking    │ • Slots Mgmt │
                    │  • Chat       │ • Patients   │
                    │  • Video Call │ • Notes      │
                    └────────┬───────────────┬─────┘
                             │               │
                    ┌────────▼───────────────▼─────┐
                    │   REST API + WebSocket       │
                    │   (Express + Socket.io)      │
                    └────────┬─────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    ┌───▼────────┐    ┌─────▼──────┐    ┌────────▼────────┐
    │  MongoDB   │    │  JWT Token │    │ WebRTC Signaling│
    │  Database  │    │ Management │    │   (Socket.io)   │
    │            │    │            │    │                 │
    │ • Doctors  │    │ • Auth     │    │ • Calls/Video   │
    │ • Patients │    │ • Sessions │    │ • Messaging     │
    │ • Appt     │    │            │    │ • Real-time     │
    │ • Chat     │    │            │    │                 │
    └────────────┘    └────────────┘    └─────────────────┘
```

### **Request/Response Cycle**

```
┌──────────────────────────────────────────────────────────────┐
│                 API Request Flow                             │
└──────────────────────────────────────────────────────────────┘

Client Request
      │
      ▼
┌─────────────────────────────────────────┐
│  CORS Validation & Middleware           │
│  • app.use(cors())                      │
│  • app.use(express.json())              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Route Matching                         │
│  • /doctors → doctorRoutes              │
│  • /patients → patientRoutes            │
│  • /appointments → appointmentRoutes    │
│  • /api/chat → chatRoutes               │
│  • /api/calls → callRoutes              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Authentication Middleware              │
│  • Verify JWT Token                     │
│  • Check User Role (Doctor/Patient)     │
│  • Rate Limiting                        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Controller Logic                       │
│  • Process Request                      │
│  • Business Logic                       │
│  • Database Operations                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Response & Error Handling              │
│  • JSON Response                        │
│  • HTTP Status Codes                    │
│  • Error Messages                       │
└──────────────┬──────────────────────────┘
               │
               ▼
           Response Sent
```

### **Real-time Communication Architecture**

```
┌──────────────────────────────────────────────────────────────┐
│         Socket.io Real-time Communication                    │
└──────────────────────────────────────────────────────────────┘

Frontend (Client)          Backend (Server)       Frontend (Client)
  Patient                 Socket.io Server          Doctor
    │                         │                       │
    │─ "join:chat" ─────────►│                       │
    │                        │──► Store Connection ──│
    │                        │◄─ "join:chat" ────────│
    │                        │                       │
    │─ "send:message" ──────►│                       │
    │                        │──► "receive:message"──│
    │                        │    (broadcast)        │
    │◄─ "receive:message" ───│                       │
    │                        │                       │
    │─ "initiate:call" ─────►│                       │
    │                        │──► "incoming:call" ──│
    │                        │    (with offer)       │
    │◄─ "call:answer" ───────│                       │
    │    (with answer)       │                       │
    │                        │                       │
    ├─ WebRTC P2P ───────────────────────────────────┤
    │ (Audio/Video Stream)                           │
    └────────────────────────────────────────────────┘

Features:
• Connection State Recovery (max 2 min disconnect)
• Automatic Reconnection
• Fallback to Polling
• Heartbeat (Ping/Pong every 25s)
```

---

## 📁 Project Structure

### **Backend Structure**

```
backend/
├── server.js                          # Main server entry point
├── package.json                       # Dependencies
├── .env                               # Environment variables (MONGODB_URI, JWT_SECRET, etc.)
│
├── Config/
│   └── db.js                          # MongoDB connection setup
│
├── Models/                            # Mongoose schemas
│   ├── doctor.model.js                # Doctor schema with slots, fees, specialization
│   ├── patient.model.js               # Patient schema with medical info
│   ├── appointment.model.js           # Appointment booking & tracking
│   ├── ChatRoom.js                    # Chat room references
│   ├── ChatMessage.js                 # Chat message storage
│   ├── CallSchedule.js                # Video call scheduling
│   └── bookingHistoryDoctorModel.js   # Doctor booking history
│
├── Routes/                            # Express route handlers
│   ├── doctorRoutes.js                # GET /doctors, POST /doctors/register, /slots
│   ├── patientRoutes.js               # GET /patients, POST /patients/register
│   ├── appointmentRoutes.js           # GET /appointments, POST /appointments/book
│   ├── chatRoutes.js                  # GET/POST /api/chat
│   ├── callRoutes.js                  # GET/POST /api/calls
│   └── adminRoutes.js                 # (Optional) Admin endpoints
│
├── Controllers/                       # Business logic
│   ├── doctorController.js            # Doctor operations (register, profile, slots)
│   ├── patientController.js           # Patient operations (register, profile, search)
│   ├── appointmentContoller.js        # Appointment operations (book, cancel, history)
│   ├── adminController.js             # Admin operations
│   └── others
│
├── middlewares/                       # Authentication & validation
│   ├── doctorMiddleware.js            # Verify JWT, rate limiting for doctors
│   ├── patientMiddleware.js           # Verify JWT for patients
│   ├── appointmentMiddleware.js       # Appointment validation
│   └── adminMiddleware.js             # Admin auth
│
├── Services/
│   └── socket.js                      # Socket.io event handlers
│                                      # Events: join, message, call, disconnect
│
└── DataSeeder/                        # Development data
    ├── doctor.seeder.js               # Sample doctor data
    └── patient.seeder.js              # Sample patient data
```

### **Frontend Structure**

```
frontend/
├── index.html                         # Entry point
├── package.json                       # Dependencies
├── vite.config.js                     # Vite bundler config
├── eslint.config.js                   # Code linting rules
├── tailwind.config.js                 # TailwindCSS config
│
├── src/
│   ├── main.jsx                       # React app initialization
│   ├── App.jsx                        # Main app component with routes
│   ├── App.css                        # Global styles
│   ├── index.css                      # Global CSS
│   │
│   ├── contexts/                      # React Context for state management
│   │   ├── DoctorContext.jsx          # Doctor auth & data state
│   │   ├── PatientContext.jsx         # Patient auth & data state
│   │   └── SocketContext.jsx          # Socket.io connection state
│   │
│   ├── pages/                         # Full page components
│   │   ├── Home.jsx                   # Landing page
│   │   ├── NotFound.jsx               # 404 page
│   │   │
│   │   ├── Patient/
│   │   │   ├── PatientRegister.jsx    # Patient sign-up
│   │   │   ├── PatientDashboard.jsx   # Patient home dashboard
│   │   │   ├── AppointmentBooking.jsx # Doctor discovery & booking
│   │   │   ├── DoctorBookingProcess.jsx
│   │   │   ├── BookedAppointment.jsx  # View booked appointments
│   │   │   ├── PatientChats.jsx       # Chat with doctors
│   │   │   ├── PatientVideoCall.jsx   # Video call interface
│   │   │   └── PatientReviews.jsx     # Rate & review doctors
│   │   │
│   │   └── Doctor/
│   │       ├── DoctorRegister.jsx     # Doctor sign-up
│   │       ├── DoctorDashboard.jsx    # Doctor home dashboard
│   │       ├── Appointments.jsx       # Manage appointments
│   │       ├── PatientChats.jsx       # Chat with patients
│   │       ├── OnePatientChat.jsx     # Individual chat thread
│   │       ├── VideoSessionManagement.jsx
│   │       ├── Notes.jsx              # Patient notes & records
│   │       ├── CaseStudies.jsx        # Case studies
│   │       ├── Medicines.jsx          # Prescribed medicines
│   │       ├── ShareIdeas.jsx         # Share ideas/articles
│   │       └── Settings.jsx           # Doctor account settings
│   │
│   ├── components/                    # Reusable components
│   │   ├── Navbar.jsx                 # Common navigation
│   │   ├── Footer.jsx                 # Footer
│   │   ├── Payment.jsx                # Payment component
│   │   ├── VerifyEmailPage.jsx        # Email verification
│   │   └── Calender.jsx               # Date/time picker
│   │
│   ├── patientComponent/              # Patient-specific components
│   │   ├── PatientNavbar.jsx          # Patient navbar
│   │   ├── DoctorCard.jsx             # Doctor listing card
│   │   ├── AppointmentCard.jsx        # Appointment card
│   │   ├── AppointmentDeatilsModel.jsx # Modal for details
│   │   └── PatientFooter.jsx          # Patient footer
│   │
│   ├── doctorComponent/               # Doctor-specific components
│   │   ├── DoctorNavbar.jsx           # Doctor navbar
│   │   ├── DoctorRegisterNavbar.jsx   # Registration navbar
│   │   ├── DoctorPreviewModal.jsx     # Profile preview
│   │   ├── UpcomingAppointments.jsx   # Upcoming list
│   │   ├── TodoList.jsx               # Task list
│   │   ├── VideoCall.jsx              # Video call component
│   │   └── Footer.jsx                 # Doctor footer
│   │
│   ├── ProtectWrapper/                # Route protection HOC
│   │   ├── DoctorProtectedWrapper.jsx # Verify doctor is logged in
│   │   └── PatientProtectedWrapper.jsx # Verify patient is logged in
│   │
│   ├── utils/
│   │   └── socket.js                  # Socket.io client setup
│   │
│   └── assets/
│       ├── homeBackground.jpg
│       ├── homeBackground.webp
│       ├── noProfile.webp
│       └── react.svg
│
└── public/                            # Static files
```

---

## 🚀 Setup & Installation

### **Prerequisites**
- Node.js 14+ 
- MongoDB (local or cloud - MongoDB Atlas)
- Git
- npm or yarn

### **Environment Variables**

Create `.env` files in both `backend/` and `frontend/`:

**`backend/.env`**
```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/arogyam?retryWrites=true&w=majority
# or local: MONGODB_URI=mongodb://localhost:27017/arogyam

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Email Service (optional)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### **Backend Setup**

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server
npm start
# or with nodemon for auto-reload
npx nodemon server.js

# Health check
curl http://localhost:3000/api/health
```

### **Frontend Setup**

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Server runs on http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 👨‍💻 Development Workflow

### **Common Development Tasks**

| Task | Command | Notes |
|------|---------|-------|
| **Start Backend** | `cd backend && npm start` | Express server on port 3000 |
| **Start Frontend** | `cd frontend && npm run dev` | Vite dev server on port 5173 |
| **Lint Frontend** | `cd frontend && npm run lint` | ESLint code quality check |
| **Build Frontend** | `cd frontend && npm run build` | Production build in `dist/` |
| **Database Setup** | See MongoDB URI in `.env` | Ensure MongoDB is running |
| **Seed Data** | `node backend/DataSeeder/doctor.seeder.js` | Load sample data for testing |

### **Key Development Patterns**

#### **Authentication Flow**
1. User registers → Password hashed with bcrypt → Stored in MongoDB
2. User logs in → Password verified → JWT token generated
3. Token stored in localStorage (frontend)
4. Every protected request sends token in `Authorization` header
5. Middleware verifies JWT → Request allowed/rejected

#### **Appointment Booking Flow**
```
1. Patient searches doctors → GET /doctors/available
2. Patient selects doctor → GET /doctors/:doctorId/slots
3. Patient chooses slot → POST /appointments/book
4. Payment processed → POST /payments/checkout (if applicable)
5. Appointment confirmed → Email sent + entry in DB
6. Real-time notification via Socket.io
```

#### **Real-time Communication**
```
1. Users open chat → Socket connection established
2. Emit "join:chat" with room ID
3. Send messages → Server broadcasts to all in room
4. Video call initiated → WebRTC offer sent via Socket.io
5. Peer answers → WebRTC connection established
6. Audio/video streams flow directly P2P (not through server)
```

---

## 📡 API Documentation

### **Doctor Endpoints**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/doctors/register` | ❌ | Register new doctor |
| POST | `/doctors/login` | ❌ | Login (returns JWT) |
| GET | `/doctors/available` | ❌ | List available doctors |
| GET | `/doctors/:doctorId` | ❌ | Get doctor public profile |
| GET | `/doctors/profile` | ✅ | Get own profile (doctor) |
| PUT | `/doctors/profile` | ✅ | Update own profile |
| POST | `/doctors/slots` | ✅ | Create availability slots |
| GET | `/doctors/:doctorId/slots` | ❌ | View doctor's slots |

### **Patient Endpoints**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/patients/register` | ❌ | Register new patient |
| POST | `/patients/login` | ❌ | Login (returns JWT) |
| GET | `/patients/profile` | ✅ | Get own profile |
| PUT | `/patients/profile` | ✅ | Update own profile |
| GET | `/patients/appointments` | ✅ | View own appointments |

### **Appointment Endpoints**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/appointments/book` | ✅ | Book new appointment |
| GET | `/appointments` | ✅ | List user's appointments |
| GET | `/appointments/:appointmentId` | ✅ | Get appointment details |
| PUT | `/appointments/:appointmentId/cancel` | ✅ | Cancel appointment |
| GET | `/appointments/doctor/:doctorId` | ✅ | Doctor's appointments |

### **Chat Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/room` | Create/get chat room |
| GET | `/api/chat/messages/:roomId` | Get message history |
| POST | `/api/chat/message` | Save message to DB |

### **WebSocket Events (Socket.io)**

**Client → Server:**
- `join:chat` - Join chat room
- `send:message` - Send message
- `initiate:call` - Start video call with offer
- `call:answer` - Send answer to call
- `ice:candidate` - Send ICE candidate
- `end:call` - End video call
- `disconnect` - Graceful disconnect

**Server → Client:**
- `receive:message` - New message arrives
- `incoming:call` - Incoming call with offer
- `call:answered` - Call accepted with answer
- `ice:candidate` - ICE candidate received
- `user:joined` - User joined room
- `user:left` - User left room

---

## 🔌 Real-time Communication

### **Socket.io Configuration**

Located in `backend/Services/socket.js`:

```javascript
// Key features:
- Bidirectional communication (websocket + polling fallback)
- Connection State Recovery (up to 2 minutes)
- Automatic reconnection with exponential backoff
- Heartbeat: Ping every 25 seconds, timeout 60 seconds
- Room-based messaging (doctor-patient pairs)
```

### **Video Call Implementation**

1. **Signaling**: WebRTC offer/answer exchanged via Socket.io
2. **Media Streams**: Audio/video captured using getUserMedia()
3. **P2P Connection**: Direct peer-to-peer connection (not through server)
4. **ICE Candidates**: Network path negotiation via Socket.io
5. **Fallback**: If P2P fails, can fallback to TURN servers

---

## 💾 Database Schema

### **Doctor Model** (`Models/doctor.model.js`)
```javascript
{
  name: String (required),
  email: String (required, unique),
  phone: String (required),
  password: String (hashed),
  specialization: String,
  experience: Number,
  qualifications: [String],
  languages: [String],
  consultationFee: {
    chat: Number,
    voice: Number,
    video: Number
  },
  contactRevealFee: Number,
  isOnline: Boolean,
  // ... additional fields for slots, ratings, etc.
}
```

### **Patient Model** (`Models/patient.model.js`)
```javascript
{
  name: String (required),
  email: String (required, unique),
  phone: String (required),
  password: String (hashed),
  age: Number,
  gender: enum["male", "female", "other"],
  bloodGroup: String,
  height: Number,
  weight: Number,
  medicalHistory: [String],
  // ... additional fields
}
```

### **Appointment Model** (`Models/appointment.model.js`)
```javascript
{
  patient: ObjectId (ref: Patient),
  doctor: ObjectId (ref: Doctor),
  type: enum["in-person", "video", "chat", "voice"],
  scheduledAt: Date,
  date: String (YYYY-MM-DD),
  startTime: String (HH:mm),
  endTime: String (HH:mm),
  slotId: ObjectId,
  fee: Number,
  status: enum["pending", "confirmed", "completed", "cancelled"],
  // ... timestamps
}
```

### **ChatRoom Model** (`Models/ChatRoom.js`)
```javascript
{
  roomId: String (unique),
  doctorId: String,
  patientId: String,
  lastActiveAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Security Considerations

- ✅ **Password Hashing**: Bcrypt with salt rounds
- ✅ **JWT Tokens**: Secure token-based authentication
- ✅ **CORS**: Restricted to frontend URL only
- ✅ **Rate Limiting**: Login attempts throttled
- ✅ **Environment Variables**: Sensitive data in `.env` only
- ✅ **Input Validation**: Middleware validation before DB operations
- ⚠️ **HTTPS**: Configure in production
- ⚠️ **MongoDB**: Use connection string with authentication

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add feature description"`
3. Push to branch: `git push origin feature/your-feature`
4. Create a Pull Request

---

## 📝 License

This project is part of a hackathon submission.

---

## 👥 Support & Contact

For issues or questions:
- GitHub Issues: [ArogYam Repository](https://github.com/ankitkumar-09/ArogYam)
- Email: [Project Maintainer]

---

## 🎓 Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB & Mongoose](https://mongoosejs.com/)
- [React Documentation](https://react.dev/)
- [Socket.io Guide](https://socket.io/docs/)
- [TailwindCSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

---

**Last Updated**: December 23, 2025
](https://github.com/ankitkumar-09/SoFs-Event-Extractor)
