import { Navigate, Route, Routes } from "react-router-dom";
import { RequireSaasAuth } from "./auth/RequireSaasAuth";
import Landing from "./pages/public/Landing";
import SignupForm from "./pages/public/SignupForm";
import SignupPending from "./pages/public/SignupPending";
import BlogList from "./pages/public/BlogList";
import BlogPost from "./pages/public/BlogPost";
import Login from "./pages/admin/Login";
import DashboardShell from "./pages/admin/DashboardShell";
import Overview from "./pages/admin/Overview";
import PackageList from "./pages/admin/packages/PackageList";
import ApplicationList from "./pages/admin/applications/ApplicationList";
import ApplicationDetail from "./pages/admin/applications/ApplicationDetail";
import TenantList from "./pages/admin/tenants/TenantList";
import TenantCreate from "./pages/admin/tenants/TenantCreate";
import TicketList from "./pages/admin/support-tickets/TicketList";
import TicketDetail from "./pages/admin/support-tickets/TicketDetail";
import TicketCategoryList from "./pages/admin/ticket-categories/TicketCategoryList";
import LandingSettings from "./pages/admin/landing/LandingSettings";
import LandingBlockList from "./pages/admin/landing/LandingBlockList";
import BlogPostList from "./pages/admin/blog/BlogPostList";
import BlogPostForm from "./pages/admin/blog/BlogPostForm";
import ContactInboxList from "./pages/admin/contact/ContactInboxList";
import ContactInboxDetail from "./pages/admin/contact/ContactInboxDetail";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<SignupForm />} />
      <Route path="/signup/pending" element={<SignupPending />} />
      <Route path="/blog" element={<BlogList />} />
      <Route path="/blog/:slug" element={<BlogPost />} />

      <Route path="/admin/login" element={<Login />} />

      <Route element={<RequireSaasAuth />}>
        <Route path="/admin" element={<DashboardShell />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="packages" element={<PackageList />} />
          <Route path="applications" element={<ApplicationList />} />
          <Route path="applications/:id" element={<ApplicationDetail />} />
          <Route path="tenants" element={<TenantList />} />
          <Route path="tenants/new" element={<TenantCreate />} />
          <Route path="landing" element={<LandingSettings />} />
          <Route path="landing/blocks" element={<LandingBlockList />} />
          <Route path="blog" element={<BlogPostList />} />
          <Route path="blog/new" element={<BlogPostForm />} />
          <Route path="blog/:id" element={<BlogPostForm />} />
          <Route path="contact" element={<ContactInboxList />} />
          <Route path="contact/:id" element={<ContactInboxDetail />} />
          <Route path="support-tickets" element={<TicketList />} />
          <Route path="support-tickets/:id" element={<TicketDetail />} />
          <Route path="ticket-categories" element={<TicketCategoryList />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
