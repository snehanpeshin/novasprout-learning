import AdminDashboard from "../components/admin/AdminDashboard";

export const metadata = {
  title: "Admin Dashboard | NovaSprout Learning",
  description: "Private NovaSprout Learning AI tutor usage, demonstration, and payment dashboard.",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminPage() {
  return <AdminDashboard />;
}
