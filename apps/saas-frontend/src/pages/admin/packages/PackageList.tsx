import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PackageDto } from "@hrm-plus/shared";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { createPackage, deletePackage, listAdminPackages, updatePackage } from "../../../api/packages";

export default function PackageList() {
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    listAdminPackages().then(setPackages).catch(() => setPackages([]));
  }

  useEffect(refresh, []);

  async function handleToggleActive(pkg: PackageDto) {
    await updatePackage(pkg.id, { isActive: !pkg.isActive });
    refresh();
  }

  async function handleDelete(pkg: PackageDto) {
    setError(null);
    try {
      await deletePackage(pkg.id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete package");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Packages"
        description="Plans that companies can subscribe to."
        actions={
          <Button size="sm" onClick={() => setShowForm((v) => !v)} className="gap-1.5">
            {!showForm && <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "New Package"}
          </Button>
        }
      />

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      {showForm && (
        <PackageForm
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
            <TableHeaderCell>Price</TableHeaderCell>
            <TableHeaderCell>Validity</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {packages.map((pkg) => (
            <TableRow key={pkg.id}>
              <TableCell className="font-medium text-slate-900">{pkg.name}</TableCell>
              <TableCell>{pkg.price === 0 ? "Free" : `$${pkg.price.toFixed(2)}`}</TableCell>
              <TableCell>{pkg.validityDays ? `${pkg.validityDays} days` : "Unlimited"}</TableCell>
              <TableCell>
                <Badge color={pkg.isActive ? "green" : "slate"}>{pkg.isActive ? "Active" : "Inactive"}</Badge>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <Button size="sm" variant="secondary" onClick={() => handleToggleActive(pkg)} className="mr-2">
                  {pkg.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(pkg)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {packages.length === 0 && (
            <tr>
              <td colSpan={5}>
                <EmptyState title="No packages yet" description="Create your first plan to get started." />
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

function PackageForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [unlimited, setUnlimited] = useState(true);
  const [validityDays, setValidityDays] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createPackage({
        name,
        price: Number(price),
        validityDays: unlimited ? null : Number(validityDays),
      });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create package");
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
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Price (0 = free)" required>
          <Input
            type="number"
            min="0"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} />
          <span className="text-slate-700 font-medium">Unlimited validity</span>
        </label>
        {!unlimited && (
          <Field label="Validity (days)">
            <Select value={validityDays} onChange={(e) => setValidityDays(e.target.value)}>
              {[7, 15, 30, 180, 365].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Button type="submit" isLoading={submitting} className="w-full">
          Create package
        </Button>
      </form>
    </Card>
  );
}
