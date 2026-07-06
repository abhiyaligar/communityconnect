import { Outlet } from "react-router-dom"
import { MainLayout } from "@/components/layout/MainLayout"

export default function AdminShell() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  )
}
