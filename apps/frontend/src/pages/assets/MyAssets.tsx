import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AssetDto, AssetStatus } from "@hrm-plus/shared";
import { Badge, BadgeColor, EmptyState, PageHeader, Spinner, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import { listMyAssets } from "../../api/assets";
import { ASSET_CATEGORY_LABELS } from "./categoryFields";

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

export default function MyAssets() {
  const [assets, setAssets] = useState<AssetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listMyAssets()
      .then(setAssets)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load your assets"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="My Assets" description="Laptops, tools, vehicles, or housing currently assigned to you." />

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : assets.length === 0 ? (
        <EmptyState title="No assets assigned" description="You don't currently have any company assets assigned to you." />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Tag</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Next expiry</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {assets.map((asset) => {
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
                </TableRow>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
