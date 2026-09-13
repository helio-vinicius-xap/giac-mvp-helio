import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'

// Pages
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Index from '@/pages/Index'
import Procedures from '@/pages/Procedures'
import ProcedureDetail from '@/pages/ProcedureDetail'
import Records from '@/pages/Records'
import Audits from '@/pages/Audits'
import AuditDetail from '@/pages/AuditDetail'
import Traceability from '@/pages/Traceability'
import NonConformities from '@/pages/NonConformities'
import NonConformityDetail from '@/pages/NonConformityDetail'
import Trainings from '@/pages/Trainings'
import Documents from '@/pages/Documents'
import CompanySettings from '@/pages/CompanySettings'
import NotFound from '@/pages/NotFound'
import { Toaster } from '@/components/ui/toaster'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes wrapped in Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Index />} />
            <Route path="/procedimentos" element={<Procedures />} />
            <Route path="/procedimentos/:id" element={<ProcedureDetail />} />
            <Route path="/registros" element={<Records />} />
            <Route path="/auditorias" element={<Audits />} />
            <Route path="/auditorias/:id" element={<AuditDetail />} />
            <Route path="/rastreabilidade" element={<Traceability />} />
            <Route path="/nao-conformidades" element={<NonConformities />} />
            <Route path="/nao-conformidades/:id" element={<NonConformityDetail />} />
            <Route path="/treinamentos" element={<Trainings />} />
            <Route path="/documentos" element={<Documents />} />
            <Route path="/empresa" element={<CompanySettings />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  )
}
