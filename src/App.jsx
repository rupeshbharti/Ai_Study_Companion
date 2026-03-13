import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Onboarding from './pages/auth/Onboarding'
import Dashboard from './pages/Dashboard'
import Subjects from './pages/Subjects'
import SubjectDetail from './pages/SubjectDetail'
import AIChat from './pages/AIChat'
import Library from './pages/Library'
import Insights from './pages/Insights'
import Profile from './pages/Profile'
import './App.css'

function ProtectedRoute({ children }) {
  const { user, loading, profile } = useAuth()
  if (loading) return (
    <div className="page-loader">
      <span className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (user && profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />
  return children
}

function AuthRoute({ children }) {
  const { user, loading, profile } = useAuth()
  if (loading) return (
    <div className="page-loader">
      <span className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  )
  if (user && profile?.onboarding_completed) return <Navigate to="/" replace />
  return children
}

// Guards /onboarding — must be logged in but onboarding not yet completed
function OnboardingRoute({ children }) {
  const { user, loading, profile } = useAuth()
  if (loading) return (
    <div className="page-loader">
      <span className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (profile?.onboarding_completed) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

      {/* Protected app routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="subjects/:id" element={<SubjectDetail />} />
        <Route path="chat" element={<AIChat />} />
        <Route path="library" element={<Library />} />
        <Route path="insights" element={<Insights />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
