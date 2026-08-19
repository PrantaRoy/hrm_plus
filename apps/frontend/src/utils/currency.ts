export function formatCurrency(amount: number, currencyCode = "USD"): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currencyCode }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}
