// מחזיר תאריך חדש בתוספת מספר חודשים
export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};
