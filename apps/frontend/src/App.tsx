import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import DashboardShell from "./pages/DashboardShell";
import EmployeeList from "./pages/employees/EmployeeList";
import EmployeeCreate from "./pages/employees/EmployeeCreate";
import EmployeeDetail from "./pages/employees/EmployeeDetail";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route path="/change-password" element={<ChangePassword />} />

        <Route element={<DashboardShell />}>
          <Route path="/" element={<Navigate to="/employees" replace />} />
          <Route path="/employees" element={<EmployeeList />} />
          <Route
            path="/employees/new"
            element={
              <RequireAuth roles={["Admin", "HR"]} />
            }
          >
            <Route index element={<EmployeeCreate />} />
          </Route>
          <Route path="/employees/:id" element={<EmployeeDetail />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
