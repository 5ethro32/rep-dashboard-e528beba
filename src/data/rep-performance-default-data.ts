
import { RepData, SummaryData, RepChangesRecord } from "@/types/rep-performance.types";

export const defaultOverallData: RepData[] = [
  { rep: "Clare Quinn", spend: 174152.39, profit: 22951.81, margin: 13.18, packs: 105432, activeAccounts: 42, totalAccounts: 81, profitPerActiveShop: 546.47, profitPerPack: 0.22, activeRatio: 51.85 },
  { rep: "Craig McDowall", spend: 607269.54, profit: 75999.24, margin: 12.51, packs: 327729, activeAccounts: 127, totalAccounts: 291, profitPerActiveShop: 598.42, profitPerPack: 0.23, activeRatio: 43.64 },
  { rep: "Ged Thomas", spend: 186126.64, profit: 37837.48, margin: 20.33, packs: 122874, activeAccounts: 70, totalAccounts: 95, profitPerActiveShop: 540.54, profitPerPack: 0.31, activeRatio: 73.68 },
  { rep: "Jonny Cunningham", spend: 230514.37, profit: 51753.68, margin: 22.45, packs: 142395, activeAccounts: 55, totalAccounts: 111, profitPerActiveShop: 940.98, profitPerPack: 0.36, activeRatio: 49.55 },
  { rep: "Michael McKay", spend: 324630.48, profit: 53194.85, margin: 16.39, packs: 184224, activeAccounts: 105, totalAccounts: 192, profitPerActiveShop: 506.62, profitPerPack: 0.29, activeRatio: 54.69 },
  { rep: "Pete Dhillon", spend: 167740.56, profit: 33757.35, margin: 20.12, packs: 114437, activeAccounts: 76, totalAccounts: 109, profitPerActiveShop: 444.18, profitPerPack: 0.29, activeRatio: 69.72 },
  { rep: "Stuart Geddes", spend: 162698.54, profit: 25799.93, margin: 15.86, packs: 68130, activeAccounts: 57, totalAccounts: 71, profitPerActiveShop: 452.63, profitPerPack: 0.38, activeRatio: 80.28 },
  { rep: "Murray Glasgow", spend: 1259.21, profit: 365.84, margin: 29.05, packs: 289, activeAccounts: 3, totalAccounts: 5, profitPerActiveShop: 121.95, profitPerPack: 1.27, activeRatio: 60.00 }
];

export const defaultRepData: RepData[] = [
  { rep: "Clare Quinn", spend: 174152.39, profit: 22951.81, margin: 13.18, packs: 105432, activeAccounts: 42, totalAccounts: 81, profitPerActiveShop: 546.47, profitPerPack: 0.22, activeRatio: 51.85 },
  { rep: "Craig McDowall", spend: 283468.89, profit: 44286.56, margin: 15.62, packs: 190846, activeAccounts: 108, totalAccounts: 262, profitPerActiveShop: 410.06, profitPerPack: 0.23, activeRatio: 41.22 },
  { rep: "Ged Thomas", spend: 152029.32, profit: 34298.11, margin: 22.56, packs: 102684, activeAccounts: 69, totalAccounts: 94, profitPerActiveShop: 497.07, profitPerPack: 0.33, activeRatio: 73.40 },
  { rep: "Jonny Cunningham", spend: 162333.80, profit: 29693.82, margin: 18.29, packs: 91437, activeAccounts: 48, totalAccounts: 91, profitPerActiveShop: 618.62, profitPerPack: 0.32, activeRatio: 52.75 },
  { rep: "Michael McKay", spend: 324630.48, profit: 53194.85, margin: 16.39, packs: 184224, activeAccounts: 105, totalAccounts: 192, profitPerActiveShop: 506.62, profitPerPack: 0.29, activeRatio: 54.69 },
  { rep: "Pete Dhillon", spend: 167740.56, profit: 33757.35, margin: 20.12, packs: 114437, activeAccounts: 76, totalAccounts: 109, profitPerActiveShop: 444.18, profitPerPack: 0.29, activeRatio: 69.72 },
  { rep: "Stuart Geddes", spend: 154070.16, profit: 25005.81, margin: 16.23, packs: 62039, activeAccounts: 56, totalAccounts: 70, profitPerActiveShop: 446.53, profitPerPack: 0.40, activeRatio: 80.00 },
  { rep: "Murray Glasgow", spend: 1259.21, profit: 365.84, margin: 29.05, packs: 289, activeAccounts: 3, totalAccounts: 5, profitPerActiveShop: 121.95, profitPerPack: 1.27, activeRatio: 60.00 }
];

export const defaultRevaData: RepData[] = [
  { rep: "Louise Skiba", spend: 113006.33, profit: 11745.28, margin: 10.39, packs: 88291, activeAccounts: 10, totalAccounts: 13, profitPerActiveShop: 1174.53, profitPerPack: 0.13, activeRatio: 76.92 },
  { rep: "Stuart Geddes", spend: 8628.38, profit: 794.12, margin: 9.20, packs: 6091, activeAccounts: 1, totalAccounts: 1, profitPerActiveShop: 794.12, profitPerPack: 0.13, activeRatio: 100.00 },
  { rep: "Craig McDowall", spend: 123321.25, profit: 11616.22, margin: 9.42, packs: 88633, activeAccounts: 13, totalAccounts: 13, profitPerActiveShop: 893.56, profitPerPack: 0.13, activeRatio: 100.00 },
  { rep: "Ged Thomas", spend: 34097.32, profit: 3539.37, margin: 10.38, packs: 20190, activeAccounts: 2, totalAccounts: 2, profitPerActiveShop: 1769.69, profitPerPack: 0.18, activeRatio: 100.00 },
  { rep: "Jonny Cunningham", spend: 15361.23, profit: 1543.18, margin: 10.05, packs: 12953, activeAccounts: 3, totalAccounts: 4, profitPerActiveShop: 514.39, profitPerPack: 0.12, activeRatio: 75.00 },
  { rep: "Pete Dhillon", spend: 12554.86, profit: 1297.68, margin: 10.34, packs: 10216, activeAccounts: 2, totalAccounts: 3, profitPerActiveShop: 648.84, profitPerPack: 0.13, activeRatio: 66.67 },
  { rep: "Michael McKay", spend: 9875.24, profit: 1052.31, margin: 10.66, packs: 7843, activeAccounts: 2, totalAccounts: 3, profitPerActiveShop: 526.16, profitPerPack: 0.13, activeRatio: 66.67 }
];

export const defaultWholesaleData: RepData[] = [
  { rep: "Craig McDowall", spend: 200479.40, profit: 20096.46, margin: 10.02, packs: 48250, activeAccounts: 6, totalAccounts: 16, profitPerActiveShop: 3349.41, profitPerPack: 0.42, activeRatio: 37.50 },
  { rep: "Pete Dhillon", spend: 5850.00, profit: 900.00, margin: 15.38, packs: 11000, activeAccounts: 1, totalAccounts: 1, profitPerActiveShop: 900.00, profitPerPack: 0.08, activeRatio: 100.00 },
  { rep: "Jonny Cunningham", spend: 68180.57, profit: 22059.86, margin: 32.36, packs: 50958, activeAccounts: 7, totalAccounts: 20, profitPerActiveShop: 3151.41, profitPerPack: 0.43, activeRatio: 35.00 },
  { rep: "Mike Cooper", spend: 88801.22, profit: 13545.86, margin: 15.25, packs: 91490, activeAccounts: 10, totalAccounts: 20, profitPerActiveShop: 1354.59, profitPerPack: 0.15, activeRatio: 50.00 }
];

export const defaultBaseSummary: SummaryData = {
  totalSpend: 1419684.81,
  totalProfit: 243554.15,
  totalPacks: 851388,
  totalAccounts: 904,
  activeAccounts: 507,
  averageMargin: 15.90
};

export const defaultRevaValues: SummaryData = {
  totalSpend: 279053.28,
  totalProfit: 27694.99,
  totalPacks: 203205,
  totalAccounts: 29,
  activeAccounts: 26,
  averageMargin: 9.85
};

export const defaultWholesaleValues: SummaryData = {
  totalSpend: 363311.19,
  totalProfit: 56602.18,
  totalPacks: 201698,
  totalAccounts: 57,
  activeAccounts: 24,
  averageMargin: 15.58
};

export const defaultSummaryChanges: SummaryData = {
  totalSpend: 3.55,
  totalProfit: 18.77,
  totalPacks: -3.86,
  totalAccounts: 7.89,
  activeAccounts: -4.31,
  averageMargin: 2.04
};

export const defaultRepChanges: RepChangesRecord = {
  "Clare Quinn": { spend: -13.97, profit: 23.17, margin: 43.17, packs: -10.76, activeAccounts: -5.0, totalAccounts: 2.5, profitPerActiveShop: 14.43, profitPerPack: 38.03, activeRatio: 6.36 },
  "Craig McDowall": { spend: 18.28, profit: 19.44, margin: 0.98, packs: 0.60, activeAccounts: -3.2, totalAccounts: 4.1, profitPerActiveShop: 28.79, profitPerPack: 18.72, activeRatio: -12.72 },
  "Ged Thomas": { spend: -4.21, profit: 4.25, margin: 8.84, packs: -14.71, activeAccounts: 1.5, totalAccounts: 0.0, profitPerActiveShop: 7.24, profitPerPack: 22.14, activeRatio: -3.80 },
  "Jonny Cunningham": { spend: 3.11, profit: 70.82, margin: 65.67, packs: 2.84, activeAccounts: 8.3, totalAccounts: -2.2, profitPerActiveShop: 101.88, profitPerPack: 66.10, activeRatio: -16.15 },
  "Michael McKay": { spend: 15.55, profit: 45.26, margin: 25.71, packs: 8.70, activeAccounts: 4.8, totalAccounts: 3.2, profitPerActiveShop: 59.09, profitPerPack: 33.63, activeRatio: -9.17 },
  "Pete Dhillon": { spend: -13.56, profit: -0.59, margin: 15.00, packs: -27.31, activeAccounts: -6.2, totalAccounts: 2.8, profitPerActiveShop: 2.02, profitPerPack: 36.75, activeRatio: -3.46 },
  "Stuart Geddes": { spend: -11.2, profit: -5.95, margin: 5.90, packs: -37.00, activeAccounts: -1.8, totalAccounts: 1.4, profitPerActiveShop: -7.66, profitPerPack: 49.30, activeRatio: -1.08 },
  "Louise Skiba": { spend: -1.11, profit: 2.94, margin: 4.09, packs: -3.86, activeAccounts: 0.0, totalAccounts: 0.0, profitPerActiveShop: -7.36, profitPerPack: 7.07, activeRatio: -5.97 },
  "Mike Cooper": { spend: 11.78, profit: -20.33, margin: -28.73, packs: 117.82, activeAccounts: 11.1, totalAccounts: 0.0, profitPerActiveShop: -28.25, profitPerPack: -63.41, activeRatio: 11.11 },
  "Murray Glasgow": { spend: 100, profit: 100, margin: 100, packs: 100, activeAccounts: 100, totalAccounts: 100, profitPerActiveShop: 100, profitPerPack: 100, activeRatio: 100 }
};
