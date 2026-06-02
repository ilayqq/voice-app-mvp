export function formatMoney(amount: number, currency = '₸'): string {
  const value = Number.isFinite(amount) ? amount : 0
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ${currency}`
}
