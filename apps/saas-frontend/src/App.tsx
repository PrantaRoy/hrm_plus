import { Navigate, Route, Routes } from "react-router-dom";
import { RequireSaasAuth } from "./auth/RequireSaasAuth";
import Landing from "./pages/public/Landing";
import SignupForm from "./pages/public/SignupForm";
import SignupPending from "./pages/public/SignupPending";
import Login from "./pages/admin/Login";
import DashboardShell from "./pages/admin/DashboardShell";
import Overview from "./pages/admin/Overview";
import PackageList from "./pages/admin/packages/PackageList";
import ApplicationList from "./pages/admin/applications/ApplicationList";
import ApplicationDetail from "./pages/admin/applications/ApplicationDetail";
import TenantList from "./pages/admin/tenants/TenantList";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<SignupForm />} />
      <Route path="/signup/pending" element={<SignupPending />} />

      <Route path="/admin/login" element={<Login />} />

      <Route element={<RequireSaasAuth />}>
        <Route path="/admin" element={<DashboardShell />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="packages" element={<PackageList />} />
          <Route path="applications" element={<ApplicationList />} />
          <Route path="applications/:id" element={<ApplicationDetail />} />
          <Route path="tenants" element={<TenantList />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
