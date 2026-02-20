import { api } from '../../../shared/services/api';

export interface ReportData {
  overviewStats: any[];
  vehiclePerformance: any[];
  monthlyTrends: any[];
  fuelAnalysis: any[];
  maintenanceSummary: any[];
}

export const reportsService = {
  getReportData: async (type: string, dateRange: string) => {
    const response = await api.get<ReportData>(`/reports?type=${type}&range=${dateRange}`);
    return response.data;
  },

  exportReport: async (type: string, format: string = 'pdf') => {
    const response = await api.get(`/reports/export?type=${type}&format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
