import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Navbar } from "@/components/layout/Navbar"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { Toaster } from "sonner"

// Pages
import Landing from "@/pages/Landing"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import PendingVerification from "@/pages/PendingVerification"
import Dashboard from "@/pages/Dashboard"
import Profile from "@/pages/Profile"
import Matrimony from "@/pages/Matrimony"
import EditMatrimony from "@/pages/EditMatrimony"
import MatrimonyRequests from "@/pages/MatrimonyRequests"
import NotFound from "@/pages/NotFound"

// Admin Pages
import AdminShell from "@/pages/admin/AdminShell"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import AdminUsers from "@/pages/admin/AdminUsers"
import AdminVerification from "@/pages/admin/AdminVerification"
import AdminMatrimony from "@/pages/admin/AdminMatrimony"
import CreateAdmin from "@/pages/admin/CreateAdmin"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
})

function AppRoutes() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Landing />
            </>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Unverified Members */}
        <Route
          path="/pending-verification"
          element={
            <ProtectedRoute allowedRoles={["unverified"]}>
              <PendingVerification />
            </ProtectedRoute>
          }
        />

        {/* Verified Member Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["verified_adult", "minor"]}>
              <Navbar />
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["verified_adult", "minor", "unverified"]}>
              <Navbar />
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matrimony"
          element={
            <ProtectedRoute allowedRoles={["verified_adult"]}>
              <Navbar />
              <Matrimony />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matrimony/edit"
          element={
            <ProtectedRoute allowedRoles={["verified_adult"]}>
              <Navbar />
              <EditMatrimony />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matrimony/requests"
          element={
            <ProtectedRoute allowedRoles={["verified_adult"]}>
              <Navbar />
              <MatrimonyRequests />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
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
          <Route
            path="create-admin"
            element={
              <ProtectedRoute allowedRoles={["community_admin"]}>
                <CreateAdmin />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster richColors position="top-right" />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
