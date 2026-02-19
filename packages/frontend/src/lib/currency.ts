export function formatCurrency(amount: number | string, currency: string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return currency === "INR" ? "₹0" : "$0.00";
  if (currency === "INR") {
    return `₹${num.toLocaleString("en-IN")}`;
  }
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getCurrencySymbol(currency: string): string {
  return currency === "INR" ? "₹" : "$";
}
