import { CandidatePortalApplicationDto } from "./application";

export interface CandidatePortalRedeemResponse {
  candidateName: string;
  application: CandidatePortalApplicationDto;
}

export interface WithdrawApplicationInput {
  reason?: string;
}
