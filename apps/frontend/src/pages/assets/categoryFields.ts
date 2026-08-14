import { ASSET_CATEGORIES, AssetCategory, VEHICLE_ASSET_CATEGORIES } from "@hrm-plus/shared";

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  Laptop: "Laptop",
  Mobile: "Mobile Phone",
  Tool: "Tool",
  OfficeEquipment: "Office Equipment",
  VehicleCar: "Vehicle — Car",
  VehicleVan: "Vehicle — Van",
  EmployerHousing: "Employer-Provided Housing",
  Other: "Other",
};

export const ASSET_CATEGORY_OPTIONS = ASSET_CATEGORIES.map((value) => ({
  value,
  label: ASSET_CATEGORY_LABELS[value],
}));

export function isVehicleCategory(category: AssetCategory): boolean {
  return (VEHICLE_ASSET_CATEGORIES as string[]).includes(category);
}

export function isToolCategory(category: AssetCategory): boolean {
  return category === "Tool" || category === "OfficeEquipment";
}
