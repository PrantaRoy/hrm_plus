import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { CreatePackageInput, PackageDto } from "@hrm-plus/shared";
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
} from "@hrm-plus/ui";
import { createPackage, deletePackage, listAdminPackages, updatePackage } from "../../../api/packages";

export default function PackageList() {
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [editing, setEditing] = useState<PackageDto | "new" | null>(null);
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
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
          ?.message ?? "Failed to delete package"
      );
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Packages"
        description="Plans companies subscribe to — also rendered on the marketing page pricing section."
        actions={
          <Button size="sm" onClick={() => setEditing("new")} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Package
          </Button>
        }
      />

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
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
              <TableCell className="font-medium text-slate-900">
                {pkg.name}
                {pkg.isPopular && (
                  <Badge color="brand" className="ml-2">
                    Popular
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {pkg.price === 0 ? "Free" : `$${pkg.price.toFixed(2)}`}
                {pkg.billingPeriod ? ` ${pkg.billingPeriod}` : ""}
              </TableCell>
              <TableCell>{pkg.validityDays ? `${pkg.validityDays} days` : "Unlimited"}</TableCell>
              <TableCell>
                <Badge color={pkg.isActive ? "green" : "slate"}>{pkg.isActive ? "Active" : "Inactive"}</Badge>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <Button size="sm" variant="secondary" onClick={() => setEditing(pkg)} className="mr-2">
                  Edit
                </Button>
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

      {editing && (
        <PackageFormModal
          pkg={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function PackageFormModal({
  pkg,
  onClose,
  onSaved,
}: {
  pkg: PackageDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(pkg?.name ?? "");
  const [price, setPrice] = useState(String(pkg?.price ?? 0));
  const [unlimited, setUnlimited] = useState(pkg ? pkg.validityDays == null : true);
  const [validityDays, setValidityDays] = useState(String(pkg?.validityDays ?? 30));
  const [description, setDescription] = useState(pkg?.description ?? "");
  const [billingPeriod, setBillingPeriod] = useState(pkg?.billingPeriod ?? "");
  const [ctaLabel, setCtaLabel] = useState(pkg?.ctaLabel ?? "");
  const [features, setFeatures] = useState((pkg?.features ?? []).join("\n"));
  const [isPopular, setIsPopular] = useState(pkg?.isPopular ?? false);
  const [sortOrder, setSortOrder] = useState(String(pkg?.sortOrder ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload: CreatePackageInput = {
      name,
      price: Number(price),
      validityDays: unlimited ? null : Number(validityDays),
      description: description.trim() || null,
      billingPeriod: billingPeriod.trim() || null,
      ctaLabel: ctaLabel.trim() || null,
      features: features
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      isPopular,
      sortOrder: Number(sortOrder) || 0,
    };
    try {
      if (pkg) await updatePackage(pkg.id, payload);
      else await createPackage(payload);
      onSaved();
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
          ?.message ?? "Failed to save package"
      );
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={pkg ? "Edit package" : "New package"}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" isLoading={submitting} onClick={handleSubmit}>
            Save
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
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
          <Field label="Billing period label" helperText='e.g. "per month"'>
            <Input value={billingPeriod} onChange={(e) => setBillingPeriod(e.target.value)} />
          </Field>
          <Field label="CTA button label" helperText='Defaults to "Get started"'>
            <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
          </Field>
          <Field label="Sort order">
            <Input
              type="number"
              min="0"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} />
          <span className="font-medium text-slate-700">Unlimited validity</span>
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

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} />
          <span className="font-medium text-slate-700">Highlight as “Most popular”</span>
        </label>

        <Field label="Description">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Features" helperText="One per line — shown as a checklist on the pricing card">
          <Textarea rows={5} value={features} onChange={(e) => setFeatures(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
