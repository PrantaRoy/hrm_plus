import { ReactNode, useState } from "react";
import { Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

// Scopes TanStack Query + toasts to just the public marketing site route tree,
// keeping these new dependencies out of the rest of the (unrelated) admin app.
// Accepts an optional `children` override for use outside the nested route tree
// (e.g. as the RequireAuth publicFallback for the subdomain-based landing page).
export default function PublicSiteProviders({ children }: { children?: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      {children ?? <Outlet />}
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
