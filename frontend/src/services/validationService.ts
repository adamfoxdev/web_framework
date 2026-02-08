import { api } from './api';
import type {
  ValidateDataRequest,
  ValidationReport,
  DataProfile,
  AutoCorrectionSuggestion
} from '../types';

export const validationService = {
  // Validate data against configured rules
  validateData: (request: ValidateDataRequest) =>
    api.post<{
      success: boolean;
      report: ValidationReport;
    }>('/validation/validate', request),

  // Get data profile (statistics)
  profileData: (request: ValidateDataRequest) =>
    api.post<{
      success: boolean;
      profile: DataProfile;
    }>('/validation/profile', request),

  // Detect duplicate records
  detectDuplicates: (request: ValidateDataRequest) =>
    api.post<{
      success: boolean;
      duplicatesFound: number;
      details: Array<{
        rowNumber: number;
        duplicateOfRow: number;
        checkFields: string[];
        values: Record<string, any>;
      }>;
    }>('/validation/detect-duplicates', request),

  // Get auto-correction suggestions
  suggestCorrections: (request: ValidateDataRequest) =>
    api.post<{
      success: boolean;
      suggestionsCount: number;
      suggestions: Array<{
        rowNumber: number;
        corrections: AutoCorrectionSuggestion[];
      }>;
    }>('/validation/suggest-corrections', request),
};
