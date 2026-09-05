import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import {
  SAAS_LANDING_BLOCK_TYPES,
  SaasLandingBlockDto,
  SaasLandingBlockType,
} from "@hrm-plus/shared";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Spinner,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import {
  deleteLandingBlock,
  listLandingBlocks,
  reorderLandingBlocks,
  updateLandingBlock,
} from "../../../api/landing";
import { BlockFormModal } from "./BlockForm";

const TYPE_LABELS: Record<SaasLandingBlockType, string> = {
  FEATURE_HIGHLIGHT: "Highlights",
  FEATURE: "Features",
  PROCESS_STEP: "Steps",
  STAT: "Stats",
  TESTIMONIAL: "Testimonials",
};

export default function LandingBlockList() {
  const [activeType, setActiveType] = useState<SaasLandingBlockType>("FEATURE_HIGHLIGHT");
  const [blocks, setBlocks] = useState<SaasLandingBlockDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SaasLandingBlockDto | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listLandingBlocks(activeType)
      .then(setBlocks)
      .catch(() => setBlocks([]))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [activeType]);

  const rows = useMemo(
    () => [...blocks].sort((a, b) => a.sortOrder - b.sortOrder),
    [blocks]
  );

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const ordered = [...rows];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    setBlocks(ordered.map((b, i) => ({ ...b, sortOrder: i })));
    try {
      await reorderLandingBlocks({ blockType: activeType, orderedIds: ordered.map((b) => b.id) });
    } catch {
      refresh();
    }
  }

  async function toggle(block: SaasLandingBlockDto) {
    await updateLandingBlock(block.id, { isActive: !block.isActive });
    refresh();
  }

  async function remove(block: SaasLandingBlockDto) {
    setError(null);
    try {
      await deleteLandingBlock(block.id);
      refresh();
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
          ?.message ?? "Failed to delete"
      );
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Landing Sections"
        description="Manage the repeatable content blocks shown on the marketing page."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" />
            New {TYPE_LABELS[activeType].replace(/s$/, "")}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {SAAS_LANDING_BLOCK_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveType(type)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeType === type
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Order</TableHeaderCell>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {rows.map((block, index) => (
              <TableRow key={block.id}>
                <TableCell className="whitespace-nowrap">
                  <span className="mr-2 text-slate-400">{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === rows.length - 1}
                    className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </TableCell>
                <TableCell className="font-medium text-slate-900">{block.title}</TableCell>
                <TableCell>
                  <Badge color={block.isActive ? "green" : "slate"}>
                    {block.isActive ? "Active" : "Hidden"}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mr-2"
                    onClick={() => toggle(block)}
                  >
                    {block.isActive ? "Hide" : "Show"}
                  </Button>
                  <Button size="sm" variant="secondary" className="mr-2" onClick={() => setEditing(block)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(block)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState
                    title={`No ${TYPE_LABELS[activeType].toLowerCase()} yet`}
                    description="Add one to show it on the landing page."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {editing && (
        <BlockFormModal
          blockType={activeType}
          block={editing === "new" ? null : editing}
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
