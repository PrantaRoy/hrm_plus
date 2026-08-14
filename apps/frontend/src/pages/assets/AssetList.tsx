import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AssetCategory, AssetDto, AssetStatus } from "@hrm-plus/shared";
import {
  Badge,
  BadgeColor,
  Checkbox,
  EmptyState,
  Field,
  PageHeader,
  Select,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { listAssets } from "../../api/assets";
import { ASSET_CATEGORY_LABELS, ASSET_CATEGORY_OPTIONS } from "./categoryFields";

const ASSET_STATUS_OPTIONS: AssetStatus[] = ["Available", "Assigned", "InRepair", "Retired", "Disposed"];

const statusColor: Record<AssetStatus, BadgeColor> = {
  Available: "green",
  Assigned: "brand",
  InRepair: "amber",
  Retired: "slate",
  Disposed: "red",
};

function isExpiringSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const days = (new Date(dateStr).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
  return days <= 30;
}

function nearestExpiry(asset: AssetDto): { label: string; date: string } | null {
  const candidates: Array<{ label: string; date: string | null }> = [
    { label: "Rego", date: asset.registrationExpiry },
    { label: "WoF/CoF", date: asset.wofCofExpiry },
    { label: "Test & tag", date: asset.testAndTagExpiry },
    { label: "Warranty", date: asset.warrantyExpiry },
  ];
  const withDates = candidates.filter((c): c is { label: string; date: string } => Boolean(c.date));
  if (withDates.length === 0) return null;
  withDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return withDates[0];
}

export default function AssetList() {
  const [assets, setAssets] = useState<AssetDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<AssetCategory | "">("");
  const [status, setStatus] = useState<AssetStatus | "">("");
  const [fbtOnly, setFbtOnly] = useState(false);

  function refresh() {
    setLoading(true);
    listAssets({
      category: category || undefined,
      status: status || undefined,
      isFbtRelevant: fbtOnly ? true : undefined,
      pageSize: 100,
    })
      .then((res) => {
        setAssets(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load assets"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [category, status, fbtOnly]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assets & Fleet"
        description="Track laptops, tools, vehicles, and employer-provided housing assigned to staff."
        actions={
          <Link
            to="/assets/new"
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Add Asset
          </Link>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Category" className="w-48">
          <Select value={category} onChange={(e) => setCategory(e.target.value as AssetCategory | "")}>
            <option value="">All categories</option>
            {ASSET_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" className="w-40">
          <Select value={status} onChange={(e) => setStatus(e.target.value as AssetStatus | "")}>
            <option value="">All statuses</option>
            {ASSET_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
          <Checkbox checked={fbtOnly} onChange={(e) => setFbtOnly(e.target.checked)} />
          FBT-relevant only
        </label>
        <span className="text-sm text-slate-500">{total} asset{total === 1 ? "" : "s"}</span>
      </div>

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      {!loading && assets.length === 0 ? (
        <EmptyState title="No assets found" description="Add your first asset to start tracking the fleet register." />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Tag</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Assigned to</TableHeaderCell>
              <TableHeaderCell>Next expiry</TableHeaderCell>
              <TableHeaderCell>FBT</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-400 py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              assets.map((asset) => {
                const expiry = nearestExpiry(asset);
                return (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Link to={`/assets/${asset.id}`} className="font-medium text-brand-600 hover:underline">
                        {asset.assetTag}
                      </Link>
                    </TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{ASSET_CATEGORY_LABELS[asset.category]}</TableCell>
                    <TableCell>
                      <Badge color={statusColor[asset.status]}>{asset.status}</Badge>
                    </TableCell>
                    <TableCell>{asset.currentAssignment?.employeeName ?? "—"}</TableCell>
                    <TableCell>
                      {expiry ? (
                        <span className={isExpiringSoon(expiry.date) ? "text-amber-700 font-medium" : undefined}>
                          {expiry.label}: {expiry.date}
                          {isExpiringSoon(expiry.date) ? " ⚠" : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{asset.isFbtRelevant ? <Badge color="amber">FBT</Badge> : "—"}</TableCell>
                  </TableRow>
                );
              })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
