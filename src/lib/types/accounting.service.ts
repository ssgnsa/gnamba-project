import { ModuleService } from "./module.service";

export interface AccountingService extends ModuleService {
  getBalanceSheet(year: number): Promise<any>;
  getProfitAndLoss(year: number): Promise<any>;
}