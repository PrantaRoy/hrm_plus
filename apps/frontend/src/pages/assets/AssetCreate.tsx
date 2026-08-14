import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AssetCategory } from "@hrm-plus/shared";
import { Button, Card, Checkbox, Field, Input, PageHeader, Select, Textarea } from "@hrm-plus/ui";
import { createAsset } from "../../api/assets";
import { ASSET_CATEGORY_OPTIONS, isToolCategory, isVehicleCategory } from "./categoryFields";

export default function AssetCreate() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState<AssetCategory>("Laptop");
  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [notes, setNotes] = useState("");

  const [registrationNumber, setRegistrationNumber] = useState("");
  const [registrationExpiry, setRegistrationExpiry] = useState("");
  const [wofCofExpiry, setWofCofExpiry] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [vin, setVin] = useState("");

  const [testAndTagExpiry, setTestAndTagExpiry] = useState("");

  const [isFbtRelevant, setIsFbtRelevant] = useState(false);
  const [fbtNotes, setFbtNotes] = useState("");

  const vehicle = isVehicleCategory(category);
  const tool = isToolCategory(category);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await createAsset({
        category,
        name,
        serialNumber: serialNumber || undefined,
        supplier: supplier || undefined,
        purchaseDate: purchaseDate || undefined,
        purchaseCost: purchaseCost ? Number(purchaseCost) : undefined,
        warrantyExpiry: warrantyExpiry || undefined,
        notes: notes || undefined,
        registrationNumber: vehicle ? registrationNumber || undefined : undefined,
        registrationExpiry: vehicle ? registrationExpiry || undefined : undefined,
        wofCofExpiry: vehicle ? wofCofExpiry || undefined : undefined,
        make: vehicle ? make || undefined : undefined,
        model: vehicle ? model || undefined : undefined,
        vin: vehicle ? vin || undefined : undefined,
        testAndTagExpiry: tool ? testAndTagExpiry || undefined : undefined,
        isFbtRelevant,
        fbtNotes: fbtNotes || undefined,
      });
      navigate(`/assets/${created.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create asset");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader title="New Asset" description="Add a piece of equipment, tool, or vehicle to the fleet register." />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" required>
              <Select value={category} onChange={(e) => setCategory(e.target.value as AssetCategory)}>
                {ASSET_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Name" required>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="MacBook Pro 14&quot;" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Serial number">
              <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
            </Field>
            <Field label="Supplier">
              <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Purchase date">
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </Field>
            <Field label="Purchase cost">
              <Input type="number" min={0} value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} />
            </Field>
            <Field label="Warranty expiry">
              <Input type="date" value={warrantyExpiry} onChange={(e) => setWarrantyExpiry(e.target.value)} />
            </Field>
          </div>

          {vehicle && (
            <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-700">Vehicle details</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Make">
                  <Input value={make} onChange={(e) => setMake(e.target.value)} />
                </Field>
                <Field label="Model">
                  <Input value={model} onChange={(e) => setModel(e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Registration number">
                  <Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
                </Field>
                <Field label="VIN">
                  <Input value={vin} onChange={(e) => setVin(e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Registration expiry (AU rego)">
                  <Input type="date" value={registrationExpiry} onChange={(e) => setRegistrationExpiry(e.target.value)} />
                </Field>
                <Field label="WoF/CoF expiry (NZ)">
                  <Input type="date" value={wofCofExpiry} onChange={(e) => setWofCofExpiry(e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {tool && (
            <Field label="Test & tag expiry (AU electrical safety)">
              <Input type="date" value={testAndTagExpiry} onChange={(e) => setTestAndTagExpiry(e.target.value)} />
            </Field>
          )}

          <div className="space-y-2 rounded-md border border-slate-200 p-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <Checkbox checked={isFbtRelevant} onChange={(e) => setIsFbtRelevant(e.target.checked)} />
              Relevant for Fringe Benefit Tax (FBT)
            </label>
            {isFbtRelevant && (
              <Field label="FBT notes" helperText="Notes for the accountant — this does not calculate FBT owed.">
                <Textarea rows={2} value={fbtNotes} onChange={(e) => setFbtNotes(e.target.value)} />
              </Field>
            )}
          </div>

          <Field label="Notes">
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          <Button type="submit" isLoading={submitting}>
            Create Asset
          </Button>
        </form>
      </Card>
    </div>
  );
}
