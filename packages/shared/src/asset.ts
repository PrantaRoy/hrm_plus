export const ASSET_CATEGORIES = [
  "Laptop",
  "Mobile",
  "Tool",
  "OfficeEquipment",
  "VehicleCar",
  "VehicleVan",
  "EmployerHousing",
  "Other",
] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const VEHICLE_ASSET_CATEGORIES: AssetCategory[] = ["VehicleCar", "VehicleVan"];
export const FBT_DEFAULT_CATEGORIES: AssetCategory[] = ["VehicleCar", "VehicleVan", "EmployerHousing"];

export const ASSET_STATUSES = ["Available", "Assigned", "InRepair", "Retired", "Disposed"] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export interface AssetAssignmentDto {
  id: number;
  assetId: number;
  employeeId: number;
  employeeName: string;
  assignedAt: string;
  assignedById: number;
  assignedByName: string;
  expectedReturnDate: string | null;
  returnedAt: string | null;
  returnedToId: number | null;
  returnedToName: string | null;
  conditionOnAssign: string | null;
  conditionOnReturn: string | null;
  assignReceiptRequestId: number | null;
  returnReceiptRequestId: number | null;
}

export interface AssetDto {
  id: number;
  assetTag: string;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchaseCost: number | null;
  supplier: string | null;
  notes: string | null;
  registrationNumber: string | null;
  registrationExpiry: string | null;
  wofCofExpiry: string | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  testAndTagExpiry: string | null;
  warrantyExpiry: string | null;
  isFbtRelevant: boolean;
  fbtNotes: string | null;
  photoUrl: string | null;
  currentAssignment: AssetAssignmentDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetInput {
  name: string;
  category: AssetCategory;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  supplier?: string;
  notes?: string;
  registrationNumber?: string;
  registrationExpiry?: string;
  wofCofExpiry?: string;
  make?: string;
  model?: string;
  vin?: string;
  testAndTagExpiry?: string;
  warrantyExpiry?: string;
  isFbtRelevant?: boolean;
  fbtNotes?: string;
}

export interface UpdateAssetInput {
  name?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  supplier?: string;
  notes?: string;
  registrationNumber?: string;
  registrationExpiry?: string;
  wofCofExpiry?: string;
  make?: string;
  model?: string;
  vin?: string;
  testAndTagExpiry?: string;
  warrantyExpiry?: string;
  isFbtRelevant?: boolean;
  fbtNotes?: string;
}

export interface AssignAssetInput {
  employeeId: number;
  expectedReturnDate?: string;
  conditionOnAssign?: string;
}

export interface ReturnAssetInput {
  conditionOnReturn?: string;
}

export interface ListAssetsQuery {
  category?: AssetCategory;
  status?: AssetStatus;
  isFbtRelevant?: boolean;
  employeeId?: number;
  page?: number;
  pageSize?: number;
}
