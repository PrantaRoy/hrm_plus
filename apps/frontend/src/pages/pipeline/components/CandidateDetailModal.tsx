import { useState } from "react";
import { ApplicationDto, PIPELINE_STAGES, PipelineStage } from "@hrm-plus/shared";
import { Badge, Button, Modal, Select } from "@hrm-plus/ui";
import { resolveFileUrl } from "../../../utils/fileUrl";

interface CandidateDetailModalProps {
  application: ApplicationDto;
  onClose: () => void;
  onMoveStage: (toStage: PipelineStage, rejectionReason?: string) => Promise<void>;
}

export function CandidateDetailModal({ application, onClose, onMoveStage }: CandidateDetailModalProps) {
  const [targetStage, setTargetStage] = useState<PipelineStage>(application.stage);
  const [rejectionReason, setRejectionReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resumeUrl = resolveFileUrl(application.resumeFileUrl);
  const isTerminal = application.stage === "HIRED" || application.stage === "REJECTED";

  async function handleMove() {
    if (targetStage === application.stage) return;
    if (targetStage === "REJECTED" && !rejectionReason.trim()) {
      setError("A rejection reason is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onMoveStage(targetStage, targetStage === "REJECTED" ? rejectionReason : undefined);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to move application");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={application.candidateName} description={application.jobTitle} size="lg">
      <div className="space-y-4">
        {application.withdrawnAt && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Withdrawn by candidate on {new Date(application.withdrawnAt).toLocaleDateString()}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-400">Email</p>
            <p className="text-slate-800">{application.candidateEmail}</p>
          </div>
          <div>
            <p className="text-slate-400">Phone</p>
            <p className="text-slate-800">{application.candidatePhoneNumber ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Resume</p>
            {resumeUrl ? (
              <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                View CV
              </a>
            ) : (
              <p className="text-slate-500">Not provided</p>
            )}
          </div>
          {application.assessmentOutcome && (
            <div>
              <p className="text-slate-400">Assessment outcome</p>
              <Badge
                color={
                  application.assessmentOutcome === "PASSED"
                    ? "green"
                    : application.assessmentOutcome === "PASSED_PENDING_REVIEW"
                      ? "amber"
                      : "red"
                }
              >
                {application.assessmentOutcome.replace(/_/g, " ")}
              </Badge>
            </div>
          )}
        </div>

        {application.coverLetter && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Cover letter</p>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{application.coverLetter}</p>
          </div>
        )}

        {application.answers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Screening answers</p>
            {application.answers.map((answer) => (
              <div key={answer.jobScreeningQuestionId} className="text-sm">
                <p className="text-slate-500">{answer.questionText}</p>
                <p className="text-slate-800">{answer.answerOptions?.join(", ") ?? answer.answerText ?? "—"}</p>
              </div>
            ))}
          </div>
        )}

        {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

        {!isTerminal && !application.withdrawnAt && (
          <div className="flex items-end gap-3 border-t border-slate-100 pt-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Move to stage</label>
              <Select value={targetStage} onChange={(e) => setTargetStage(e.target.value as PipelineStage)}>
                {PIPELINE_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </div>
            <Button isLoading={busy} onClick={handleMove} disabled={targetStage === application.stage}>
              Move
            </Button>
          </div>
        )}
        {!isTerminal && targetStage === "REJECTED" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Rejection reason</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
