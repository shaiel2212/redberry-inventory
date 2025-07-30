import api from './api';

/**
 * הפעלת בדיקת פריטים שחזרו למלאי
 */
const runCheckRestockedItems = async () => {
  try {
    const response = await api.post('/reports/check-restocked');
    return response.data;
  } catch (error) {
    console.error('Error running check restocked items job:', error);
    throw error;
  }
};

/**
 * הפעלת יצירת דוח חודשי
 */
const runGenerateMonthlyReport = async () => {
  try {
    const response = await api.post('/reports/generate-monthly');
    return response.data;
  } catch (error) {
    console.error('Error running generate monthly report job:', error);
    throw error;
  }
};

export default {
  runCheckRestockedItems,
  runGenerateMonthlyReport,
}; 