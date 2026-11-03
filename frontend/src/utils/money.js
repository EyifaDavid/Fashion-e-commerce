// [NORTH] Stored prices are Ghana cedi amounts; formatting does not convert them.
const cedis = new Intl.NumberFormat("en-GH", {
  style: "currency", currency: "GHS", currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});
export const formatMoney = (value) => cedis.format(Number(value) || 0);
