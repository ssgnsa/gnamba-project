import { ModuleService } from "./module.service";

export interface HrService extends ModuleService {
  getEmployeeCount(): Promise<number>;
  getCostCenters(): Promise<any[]>;
}