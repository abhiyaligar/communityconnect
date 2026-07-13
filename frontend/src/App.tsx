import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { LanguageProvider } from "@/contexts/LanguageContext"
import { Toaster } from "sonner"

// Pages
import Landing from "@/pages/Landing"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import PendingVerification from "@/pages/PendingVerification"
import Dashboard from "@/pages/Dashboard"
import Profile from "@/pages/Profile"
import EditProfile from "@/pages/EditProfile"
import ManageGallery from "@/pages/ManageGallery"
import Settings from "@/pages/Settings"
import Matrimony from "@/pages/Matrimony"
import MatrimonyPreferences from "@/pages/MatrimonyPreferences"
import EditMatrimony from "@/pages/EditMatrimony"
import MatrimonyRequests from "@/pages/MatrimonyRequests"
import Chat from "@/pages/Chat"
import NotFound from "@/pages/NotFound"
import GoogleCallback from "@/pages/GoogleCallback"
import ForgotPassword from "@/pages/ForgotPassword"
import UsernameProfileView from "@/pages/UsernameProfileView"



// Admin Pages
import AdminShell from "@/pages/admin/AdminShell"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import AdminUsers from "@/pages/admin/AdminUsers"
import AdminVerification from "@/pages/admin/AdminVerification"
import AdminMatrimony from "@/pages/admin/AdminMatrimony"
import CreateAdmin from "@/pages/admin/CreateAdmin"
import AdminSuggestions from "@/pages/admin/AdminSuggestions"
import AdminMembership from "@/pages/admin/AdminMembership"
import AdminSettings from "@/pages/admin/AdminSettings"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
})

import { MainLayout } from "@/components/layout/MainLayout"
import Registry from "@/pages/Registry"
import Terms from "@/pages/Terms"
import NDA from "@/pages/NDA"
import LegalAccept from "@/pages/LegalAccept"

function AppRoutes() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={<Landing />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Public Legal Pages */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/nda" element={<NDA />} />

        {/* Legal Acceptance (requires auth) */}
        <Route
          path="/legal/accept"
          element={
            <ProtectedRoute allowedRoles={["unverified", "verified_adult", "minor", "local_admin", "community_admin"]}>
              <LegalAccept />
            </ProtectedRoute>
          }
        />



        {/* Unverified Members */}
        <Route
          path="/pending-verification"
          element={
            <ProtectedRoute allowedRoles={["unverified"]}>
              <PendingVerification />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preferences"
          element={
            <ProtectedRoute allowedRoles={["unverified", "verified_adult"]}>
              <MatrimonyPreferences />
            </ProtectedRoute>
          }
        />

        {/* Verified Member & Admin Routes under MainLayout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["verified_adult", "minor", "local_admin", "community_admin"]}>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/registry"
          element={
            <ProtectedRoute allowedRoles={["verified_adult", "minor", "local_admin", "community_admin"]}>
              <MainLayout>
                <Registry />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["verified_adult", "minor", "unverified", "local_admin", "community_admin"]}>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute allowedRoles={["verified_adult", "minor", "unverified", "local_admin", "community_admin"]}>
              <MainLayout>
                <EditProfile />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["verified_adult", "minor", "unverified", "local_admin", "community_admin"]}>
              <MainLayout>
                <Settings />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/matrimony/gallery"
          element={
            <ProtectedRoute allowedRoles={["verified_adult"]}>
              <MainLayout>
                <ManageGallery />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/verification"
          element={
            <ProtectedRoute allowedRoles={["local_admin", "community_admin"]}>
              <MainLayout>
                <AdminVerification />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/matrimony"
          element={
            <ProtectedRoute allowedRoles={["verified_adult", "local_admin", "community_admin"]}>
              <MainLayout>
                <Matrimony />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/matrimony/edit"
          element={
            <ProtectedRoute allowedRoles={["verified_adult"]}>
              <MainLayout>
                <EditMatrimony />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/matrimony/requests"
          element={
            <ProtectedRoute allowedRoles={["verified_adult"]}>
              <MainLayout>
                <MatrimonyRequests />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/matrimony/chat"
          element={
            <ProtectedRoute allowedRoles={["verified_adult", "local_admin", "community_admin"]}>
              <MainLayout>
                <Chat />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Legacy Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["community_admin", "local_admin"]}>
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="verification" element={<AdminVerification />} />
          <Route path="matrimony" element={<AdminMatrimony />} />
          <Route path="membership" element={<AdminMembership />} />
          <Route
            path="create-admin"
            element={
              <ProtectedRoute allowedRoles={["community_admin", "local_admin"]}>
                <CreateAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="suggestions"
            element={
              <ProtectedRoute allowedRoles={["community_admin"]}>
                <AdminSuggestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute allowedRoles={["community_admin"]}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/:username"
          element={
            <ProtectedRoute allowedRoles={["verified_adult", "minor", "local_admin", "community_admin", "unverified"]}>
              <MainLayout>
                <UsernameProfileView />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
              <Toaster richColors position="top-right" />
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
