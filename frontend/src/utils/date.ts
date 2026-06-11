export const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];

// שעות עבודה: ראשון-חמישי 9-16, שישי 9-12
export const getRegularHours = (dayIndex: number): number[] => {
  if (dayIndex === 5) return [9, 10, 11]; // שישי
  return [9, 10, 11, 12, 13, 14, 15];
};

// כל השעות האפשריות בלוח (איחוד של כל הימים) - משמש לשורות הטבלה
export const ALL_HOURS = [9, 10, 11, 12, 13, 14, 15];

// מחזיר את יום ראשון של השבוע שמכיל את התאריך הנתון
export const getWeekStart = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// פורמט YYYY-MM-DD
export const formatDateISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// פורמט להצגה: dd/MM
export const formatDateDisplay = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}`;
};

export const formatHour = (hour: number): string => `${String(hour).padStart(2, "0")}:00`;
