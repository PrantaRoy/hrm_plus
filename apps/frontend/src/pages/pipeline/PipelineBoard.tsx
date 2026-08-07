import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { ApplicationDto, PIPELINE_STAGES, PipelineBoardDto, PipelineStage } from "@hrm-plus/shared";
import { Card, PageHeader, Spinner } from "@hrm-plus/ui";
import { getPipelineBoard, moveApplicationStage } from "../../api/pipeline";
import { ApplicationCard } from "./components/ApplicationCard";
import { CandidateDetailModal } from "./components/CandidateDetailModal";
import { DroppableColumn } from "./components/DroppableColumn";

const STAGE_LABELS: Record<PipelineStage, string> = {
  APPLICATION_RECEIVED: "Application Received",
  AI_ASSESSMENT: "AI Assessment",
  VIRTUAL_INTERVIEW: "Virtual Interview",
  IN_PERSON_INTERVIEW: "In-Person Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

export default function PipelineBoard() {
  const { id } = useParams();
  const jobId = Number(id);

  const [board, setBoard] = useState<PipelineBoardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDto | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setBoard(await getPipelineBoard(jobId));
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to load pipeline board");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleDragEnd(event: DragEndEvent) {
    setError(null);
    const { active, over } = event;
    if (!over) return;

    const applicationId = Number(active.id);
    const toStage = String(over.id) as PipelineStage;

    const current = board?.columns.flatMap((c) => c.applications).find((a) => a.id === applicationId);
    if (!current || current.stage === toStage) return;

    try {
      await moveApplicationStage(applicationId, { toStage });
      await refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to move application");
    }
  }

  async function handleMoveFromModal(toStage: PipelineStage, rejectionReason?: string) {
    if (!selectedApplication) return;
    await moveApplicationStage(selectedApplication.id, { toStage, rejectionReason });
    setSelectedApplication(null);
    await refresh();
  }

  if (loading || !board) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${board.jobTitle} · Pipeline`}
        description={
          <Link to="/jobs" className="text-brand-600 hover:underline">
            Back to jobs
          </Link>
        }
      />

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-3 overflow-x-auto md:grid-cols-4 xl:grid-cols-7">
          {PIPELINE_STAGES.map((stage) => {
            const column = board.columns.find((c) => c.stage === stage);
            return (
              <div key={stage} className="min-w-[220px]">
                <Card noPadding title={`${STAGE_LABELS[stage]} (${column?.applications.length ?? 0})`}>
                  <div className="p-2">
                    <DroppableColumn id={stage}>
                      {(column?.applications ?? []).map((application) => (
                        <ApplicationCard
                          key={application.id}
                          application={application}
                          onClick={() => setSelectedApplication(application)}
                          disabled={stage === "HIRED" || stage === "REJECTED"}
                        />
                      ))}
                    </DroppableColumn>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </DndContext>

      {selectedApplication && (
        <CandidateDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onMoveStage={handleMoveFromModal}
        />
      )}
    </div>
  );
}
