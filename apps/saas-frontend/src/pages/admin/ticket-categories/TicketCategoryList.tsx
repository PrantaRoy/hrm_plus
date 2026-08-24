import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { TicketCategoryDto } from "@hrm-plus/shared";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import {
  createTicketCategory,
  deleteTicketCategory,
  listAdminTicketCategories,
  updateTicketCategory,
} from "../../../api/ticketCategories";

export default function TicketCategoryList() {
  const [categories, setCategories] = useState<TicketCategoryDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    listAdminTicketCategories().then(setCategories).catch(() => setCategories([]));
  }

  useEffect(refresh, []);

  async function handleToggleActive(category: TicketCategoryDto) {
    setError(null);
    try {
      await updateTicketCategory(category.id, { isActive: !category.isActive });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update category");
    }
  }

  async function handleDelete(category: TicketCategoryDto) {
    setError(null);
    try {
      await deleteTicketCategory(category.id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete category");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Ticket Categories"
        description="Categories companies choose from when raising a support ticket."
        actions={
          <Button size="sm" onClick={() => setShowForm((v) => !v)} className="gap-1.5">
            {!showForm && <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "New Category"}
          </Button>
        }
      />

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      {showForm && (
        <CategoryForm
          onCreated={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Default</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium text-slate-900">{category.name}</TableCell>
              <TableCell>{category.isDefault ? "Yes" : "No"}</TableCell>
              <TableCell>
                <Badge color={category.isActive ? "green" : "slate"}>
                  {category.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <Button size="sm" variant="secondary" onClick={() => handleToggleActive(category)} className="mr-2">
                  {category.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(category)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {categories.length === 0 && (
            <tr>
              <td colSpan={4}>
                <EmptyState title="No categories yet" description="Create your first ticket category." />
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

function CategoryForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createTicketCategory({ name });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        <Field label="Name" required>
          <Input required value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        </Field>
        <Button type="submit" isLoading={submitting} className="w-full">
          Create category
        </Button>
      </form>
    </Card>
  );
}
