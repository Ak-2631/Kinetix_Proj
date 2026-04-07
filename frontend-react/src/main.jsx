import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import PatientProfile from './pages/PatientProfile.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login/:role" element={<Login />} />
        
        <Route element={<ProtectedRoute allowedRole="patient" />}>
          <Route path="/patient" element={<Dashboard />} />
        </Route>
        
        <Route element={<ProtectedRoute allowedRole="doctor" />}>
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/doctor/patient/:patientId" element={<PatientProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
