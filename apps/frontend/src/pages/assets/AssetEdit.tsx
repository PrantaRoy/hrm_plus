import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AssetDto } from "@hrm-plus/shared";
import { Button, Card, Checkbox, Field, Input, PageHeader, Textarea } from "@hrm-plus/ui";
import { getAsset, updateAsset } from "../../api/assets";
import { ASSET_CATEGORY_LABELS, isToolCategory, isVehicleCategory } from "./categoryFields";

export default function AssetEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<AssetDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (!id) return;
    getAsset(Number(id))
      .then((a) => {
        setAsset(a);
        setName(a.name);
        setSerialNumber(a.serialNumber ?? "");
        setSupplier(a.supplier ?? "");
        setPurchaseDate(a.purchaseDate?.slice(0, 10) ?? "");
        setPurchaseCost(a.purchaseCost != null ? String(a.purchaseCost) : "");
        setWarrantyExpiry(a.warrantyExpiry?.slice(0, 10) ?? "");
        setNotes(a.notes ?? "");
        setRegistrationNumber(a.registrationNumber ?? "");
        setRegistrationExpiry(a.registrationExpiry?.slice(0, 10) ?? "");
        setWofCofExpiry(a.wofCofExpiry?.slice(0, 10) ?? "");
        setMake(a.make ?? "");
        setModel(a.model ?? "");
        setVin(a.vin ?? "");
        setTestAndTagExpiry(a.testAndTagExpiry?.slice(0, 10) ?? "");
        setIsFbtRelevant(a.isFbtRelevant);
        setFbtNotes(a.fbtNotes ?? "");
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load asset"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!asset) return;
    setSubmitting(true);
    setError(null);
    const vehicle = isVehicleCategory(asset.category);
    const tool = isToolCategory(asset.category);
    try {
      await updateAsset(asset.id, {
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
      navigate(`/assets/${asset.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update asset");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-slate-400">Loading...</p>;
  if (error || !asset) return <p className="text-red-600">{error ?? "Asset not found"}</p>;

  const vehicle = isVehicleCategory(asset.category);
  const tool = isToolCategory(asset.category);

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title={`Edit ${asset.assetTag}`}
        description={`Category: ${ASSET_CATEGORY_LABELS[asset.category]} (fixed at creation)`}
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          <Field label="Name" required>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>

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
              <Field label="FBT notes">
                <Textarea rows={2} value={fbtNotes} onChange={(e) => setFbtNotes(e.target.value)} />
              </Field>
            )}
          </div>

          <Field label="Notes">
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          <Button type="submit" isLoading={submitting}>
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
