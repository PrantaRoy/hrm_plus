import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CompanyServiceDto } from "@hrm-plus/shared";
import { Button, PageHeader, Spinner } from "@hrm-plus/ui";
import { deleteCompanyService, listCompanyServices, reorderCompanyServices } from "../../api/companyServices";
import { SortableList } from "../../components/SortableList";

export default function CompanyServiceList() {
  const [services, setServices] = useState<CompanyServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listCompanyServices()
      .then(setServices)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load services"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this service?")) return;
    setError(null);
    try {
      await deleteCompanyService(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete service");
    }
  }

  async function handleReorder(orderedIds: number[]) {
    setError(null);
    const previous = services;
    const byId = new Map(services.map((s) => [s.id, s]));
    setServices(orderedIds.map((id) => byId.get(id)!).filter(Boolean));
    try {
      await reorderCompanyServices(orderedIds);
    } catch (err: any) {
      setServices(previous);
      setError(err.response?.data?.error?.message ?? "Failed to reorder services");
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title="Services"
        description="Drag to reorder. Shown in the public website's Overview section."
        actions={
          <Link
            to="/website-cms/services/new"
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            New Service
          </Link>
        }
      />

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : services.length === 0 ? (
        <p className="text-sm text-slate-500">No services yet.</p>
      ) : (
        <SortableList
          items={services}
          onReorder={handleReorder}
          renderItem={(service) => (
            <div className="flex items-center justify-between">
              <div>
                <Link to={`/website-cms/services/${service.id}/edit`} className="font-medium text-brand-600 hover:underline">
                  {service.title}
                </Link>
                <span className="ml-2 text-xs text-slate-400">{service.isActive ? "Active" : "Inactive"}</span>
              </div>
              <Button size="sm" variant="danger" onClick={() => handleDelete(service.id)}>
                Delete
              </Button>
            </div>
          )}
        />
      )}
    </div>
  );
}
