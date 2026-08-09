import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LegalPageDto } from "@hrm-plus/shared";
import { Button, EmptyState, PageHeader, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import { deleteLegalPage, listLegalPages } from "../../api/legalPages";

export default function LegalPageList() {
  const [pages, setPages] = useState<LegalPageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listLegalPages()
      .then(setPages)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load legal pages"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this legal page?")) return;
    setError(null);
    try {
      await deleteLegalPage(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete legal page");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Legal Pages"
        description="Privacy policy, terms of service, and other static legal pages."
        actions={
          <Link
            to="/website-cms/legal-pages/new"
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            New Page
          </Link>
        }
      />

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      {!loading && pages.length === 0 ? (
        <EmptyState title="No legal pages yet" description="Create your first legal page, e.g. Privacy Policy." />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Slug</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-slate-400 py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <Link to={`/website-cms/legal-pages/${page.id}/edit`} className="font-medium text-brand-600 hover:underline">
                      {page.title}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{page.slug}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="danger" onClick={() => handleDelete(page.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
