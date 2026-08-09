import { useState } from "react";
import { Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

// Scopes TanStack Query + toasts to just the public marketing site route tree,
// keeping these new dependencies out of the rest of the (unrelated) admin app.
export default function PublicSiteProviders() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <Outlet />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
