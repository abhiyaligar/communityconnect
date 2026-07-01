import { Outlet } from "react-router-dom"
import { AdminSidebar } from "@/components/layout/AdminSidebar"

export default function AdminShell() {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  )
}
