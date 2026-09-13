import { Toaster } from 'react-hot-toast'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginLanding from './pages/LoginLanding'
import Layout from './pages/Layout'
import Settings from './pages/Settings'
import Dashboard from './pages/Dashboard'
import Attendance from './pages/Attendance'
import Employees from './pages/Employees'
import Leave from './pages/Leave'
import Payslips from './pages/Payslips'
import PrintPayslip from './pages/PrintPayslip'
import LoginForm from './components/LoginForm'
import KpaDashboard from './pages/KpaDashboard'
import KpaScorecard from './pages/KpaScorecard'

const App = () => {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginLanding />} />

        <Route path="/login/admin" element={<LoginForm role="admin" title="Admin Portal" subtitle="Sign in to manage the organization" />} />
        <Route path="/login/employee" element={<LoginForm role="employee" title="Employee Portal" subtitle="Sign in to access your profile and records" />} />

        <Route element = {<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leave" element={<Leave />} />
          <Route path="/payslips" element={<Payslips />} />
          <Route path="/kpa" element={<KpaDashboard />} />
          <Route path="/kpa/scorecard" element={<KpaScorecard />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/print/payslips/:id" element={<PrintPayslip />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

export default App