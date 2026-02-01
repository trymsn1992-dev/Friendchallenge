import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { AuthProvider, useAuth } from './contexts/AuthContext'

import { Dashboard } from './pages/Dashboard'
import { CreateChallenge } from './pages/CreateChallenge'
// const ChallengeDetails = () => <div className="text-center py-10">Utfordringsdetaljer kommer snart...</div>
import { ChallengeDetails } from './pages/ChallengeDetails'
import { Profile } from './pages/Profile'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex justify-center py-20 animate-pulse text-indigo-600">Laster...</div>
  if (!user) return <Navigate to="/login" />

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="login" element={<Login />} />
            <Route path="create" element={
              <ProtectedRoute>
                <CreateChallenge />
              </ProtectedRoute>
            } />
            <Route path="challenge/:id" element={<ChallengeDetails />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
