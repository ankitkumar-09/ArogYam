┌─────────────────────────────────────────────────────────────────────────┐
│                           AROGYAM PLATFORM                              │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐         ┌──────────────────────────────┐
│     CLIENT LAYER             │         │     CLIENT LAYER             │
├──────────────────────────────┤         ├──────────────────────────────┤
│   PATIENT WEB APP            │         │   DOCTOR WEB APP             │
│  (React + Vite)              │         │  (React + Vite)              │
│                              │         │                              │
│ • Search Doctors             │         │ • Manage Appointments        │
│ • Book Appointments          │         │ • Patient Queue              │
│ • Real-time Chat             │         │ • Clinical Notes             │
│ • Video Consultations        │         │ • Prescriptions              │
│ • View Health Records        │         │ • Case Studies               │
│ • Appointment History        │         │ • Video Call Management      │
└──────────────────────────────┘         └──────────────────────────────┘
          │                                        │
          │                                        │
          └────────────────────┬───────────────────┘
                               │
                    (REST API + WebSocket)
                               │
          ┌────────────────────┴───────────────────┐
          │                                        │
          ▼                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                                   │
│                    (Express.js Server)                                   │
│                                                                          │
│  Routes:                                                                │
│  ├─ /doctors (Register, Login, Profile, Dashboard)                     │
│  ├─ /patients (Register, Login, Profile, Dashboard)                    │
│  ├─ /appointments (Book, Update, Cancel, History)                      │
│  ├─ /chat (Message History, Room Management)                           │
│  ├─ /prescriptions (Create, View)                                       │
│  └─ /admin (User Management, Verification)                             │
└─────────────────────────────────────────────────────────────────────────┘
          │
          │
    ┌─────┼─────┐
    │     │     │
    ▼     ▼     ▼
┌───────────────────┐  ┌───────────────────┐  ┌────────────────────┐
│  MIDDLEWARE       │  │  SERVICES         │  │  REAL-TIME         │
├───────────────────┤  ├───────────────────┤  ├────────────────────┤
│                   │  │                   │  │  Socket.IO         │
│ • Authentication  │  │ • User Service    │  │  (WebSocket)       │
│ • Authorization   │  │ • Doctor Service  │  │                    │
│ • Validation      │  │ • Patient Service │  │ • Chat Events      │
│ • Error Handler   │  │ • Appointment Svc │  │ • Video Events     │
│ • CORS            │  │ • Payment Service │  │ • Typing Status    │
└───────────────────┘  │ • Notification Svc│  │ • Call Status      │
                       └───────────────────┘  └────────────────────┘
          │
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌──────────────────────┐  ┌──────────────────────┐
│  DATA LAYER          │  │  EXTERNAL SERVICES   │
├──────────────────────┤  ├──────────────────────┤
│                      │  │                      │
│  MONGODB Database    │  │ • Email Service      │
│                      │  │ • SMS Notifications  │
│  Collections:        │  │ • Video CDN          │
│  ├─ doctors          │  │ • Payment Gateway    │
│  ├─ patients         │  │ • Cloud Storage      │
│  ├─ appointments     │  │ • Analytics          │
│  ├─ chatRooms        │  └──────────────────────┘
│  ├─ chatMessages     │
│  ├─ prescriptions    │
│  ├─ reviews          │
│  └─ case_studies     │
└──────────────────────┘
