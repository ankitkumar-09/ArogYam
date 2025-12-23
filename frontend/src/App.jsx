// App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import PatientRegister from "./pages/Patient/PatientRegister";
import DoctorRegister from "./pages/Doctor/DoctorRegister";
import PatientDashboard from "./pages/Patient/PatientDashboard";
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import Appointments from "./pages/Doctor/Appointments";
import PatientChats from "./pages/Doctor/PatientChats";
import OnePatientChat from "./pages/Doctor/OnePatientChat";
import VideoSessionManagement from "./pages/Doctor/VideoSessionManagement";
import VideoCall from "./doctorComponent/VideoCall";
import Medicines from "./pages/Doctor/Medicines";
import Notes from "./pages/Doctor/Notes";
import CaseStudies from "./pages/Doctor/CaseStudies";
import ShareIdeas from "./pages/Doctor/ShareIdeas";
import { DoctorProvider } from "./contexts/DoctorContext";
import DoctorProtectedWrapper from "./ProtectWrapper/DoctorProtectedWrapper";
import { PatientProvider } from "./contexts/PatientContext";
import PatientProtectedWrapper from "./ProtectWrapper/PatientProtectedWrapper";
import Settings from "./pages/Doctor/Settings";
import AppointmentBooking from "./pages/Patient/AppointmentBooking";
import DoctorBookingProcess from "./pages/Patient/DoctorBookingProcess"; // added
import VerifyEmailPage from "./component/VerifyEmailPage";
import Payment from "./component/Payment"; // NEW
import BookedAppointment from "./pages/Patient/BookedAppointment";
import PatientChatsPage from "./pages/Patient/PatientChats";
import PatientVideoCall from "./pages/Patient/PatientVideoCall";

const App = () => {
  return (
    <Router>
      {/* provide patient context to the app */}
      <PatientProvider>
        <DoctorProvider>
          <Routes>
            {/* Home */}
            <Route path="/" element={<Home />} />
            <Route path='/verfiy-email' element={<VerifyEmailPage/>} />

            {/* Patient Routes */}
            <Route path='/register/patient' element={<PatientRegister/>} />

            {/* CHANGED: no layout, protect each route directly */}
            <Route
              path='/patient/dashboard'
              element={
                <PatientProtectedWrapper>
                  <PatientDashboard />
                </PatientProtectedWrapper>
              }
            />
            <Route
              path='/patient/appointments'
              element={
                <PatientProtectedWrapper>
                  <AppointmentBooking />
                </PatientProtectedWrapper>
              }
            />
            <Route
              path='/patient/booked-appointment'
              element={
                <PatientProtectedWrapper>
                  <BookedAppointment />
                </PatientProtectedWrapper>
              }
            />
            <Route
              path='/patient/doctor/:doctorId/book'
              element={
                <PatientProtectedWrapper>
                  <DoctorBookingProcess />
                </PatientProtectedWrapper>
              }
            />
            <Route
              path='/patient/payment'
              element={
                <PatientProtectedWrapper>
                  <Payment />
                </PatientProtectedWrapper>
              }
            />

            {/* + Patient Chat + Video Call (prototype) */}
            <Route
              path="/patient/chats"
              element={
                <PatientProtectedWrapper>
                  <PatientChatsPage />
                </PatientProtectedWrapper>
              }
            />
            <Route
              path="/patient/video-sessions"
              element={
                <PatientProtectedWrapper>
                  <PatientVideoCall />
                </PatientProtectedWrapper>
              }
            />
            <Route
              path="/patient/video-call/:sessionId"
              element={
                <PatientProtectedWrapper>
                  <VideoCall />
                </PatientProtectedWrapper>
              }
            />

            {/* Doctor Routes */}
            <Route path='/register/doctor' element={<DoctorRegister/>} />

            {/* protected doctor routes */}
            <Route path='/doctor/dashboard' element={
              <DoctorProtectedWrapper><DoctorDashboard/></DoctorProtectedWrapper>
            } />
            <Route path='/doctor/appointments' element={
              <DoctorProtectedWrapper><Appointments/></DoctorProtectedWrapper>
            } />
            <Route path='/doctor/chats' element={
              <DoctorProtectedWrapper><PatientChats/></DoctorProtectedWrapper>
            } />
            <Route path='/doctor/chat/:patientId' element={
              <DoctorProtectedWrapper><OnePatientChat/></DoctorProtectedWrapper>
            } />
            <Route path='/doctor/video-sessions' element={
              <DoctorProtectedWrapper><VideoSessionManagement/></DoctorProtectedWrapper>
            } />
            <Route path='/doctor/video-call/:sessionId' element={
              <DoctorProtectedWrapper><VideoCall/></DoctorProtectedWrapper>
            } />
            <Route path='/doctor/medicines' element={
              <DoctorProtectedWrapper><Medicines/></DoctorProtectedWrapper>
            } />
            <Route path='/doctor/notes' element={
              <DoctorProtectedWrapper><Notes/></DoctorProtectedWrapper>
            } />
            <Route path='/doctor/case-studies' element={
              <DoctorProtectedWrapper><CaseStudies/></DoctorProtectedWrapper>
            } />
            <Route path='/doctor/share-ideas' element={
              <DoctorProtectedWrapper><ShareIdeas/></DoctorProtectedWrapper>
            } />
            <Route path='/doctor/settings' element={
              <DoctorProtectedWrapper><Settings/></DoctorProtectedWrapper>
            } />

            {/* Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DoctorProvider>
      </PatientProvider>
    </Router>
  );
};

export default App;