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

// פורמט להצגה: dd/MM/yyyy
export const formatDateDisplay = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

// המרת מספר לגימטריה (אותיות עבריות), לדוגמה: 1 -> א', 15 -> ט"ו, 786 -> תשפ"ו
const HEBREW_NUMERAL_VALUES: Array<[number, string]> = [
  [400, "ת"], [300, "ש"], [200, "ר"], [100, "ק"],
  [90, "צ"], [80, "פ"], [70, "ע"], [60, "ס"], [50, "נ"],
  [40, "מ"], [30, "ל"], [20, "כ"], [10, "י"],
  [9, "ט"], [8, "ח"], [7, "ז"], [6, "ו"], [5, "ה"],
  [4, "ד"], [3, "ג"], [2, "ב"], [1, "א"],
];

const toHebrewNumeral = (num: number): string => {
  if (num === 15) return 'ט"ו';
  if (num === 16) return 'ט"ז';

  let remaining = num;
  let letters = "";
  for (const [value, letter] of HEBREW_NUMERAL_VALUES) {
    while (remaining >= value) {
      letters += letter;
      remaining -= value;
    }
  }

  if (letters.length <= 1) return `${letters}'`;
  return `${letters.slice(0, -1)}"${letters.slice(-1)}`;
};

// תאריך עברי בגימטריה: יום בחודש + שם החודש + שנה, לדוגמה: א' תשרי תשפ"ו
export const formatHebrewDate = (date: Date): string => {
  const parts = new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    year: "numeric",
    calendar: "hebrew",
  }).formatToParts(date);

  const day = Number(parts.find((p) => p.type === "day")?.value ?? "1");
  const year = Number(parts.find((p) => p.type === "year")?.value ?? "0");
  const month = new Intl.DateTimeFormat("he-IL", { month: "long", calendar: "hebrew" }).format(date);

  return `${toHebrewNumeral(day)} ${month} ${toHebrewNumeral(year % 1000)}`;
};

export const formatHour = (hour: number): string => `${String(hour).padStart(2, "0")}:00`;

// שמות החודשים הלועזיים בעברית
export const GREGORIAN_MONTH_NAMES = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

// פורמט "YYYY-MM" -> "ינואר 2026"
export const formatMonthLabel = (month: string): string => {
  const [year, monthNum] = month.split("-");
  const name = GREGORIAN_MONTH_NAMES[Number(monthNum) - 1] ?? monthNum;
  return `${name} ${year}`;
};

// שמות חודשים מקוצרים לגרף
export const SHORT_MONTH_NAMES = [
  "ינ׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יונ׳",
  "יול׳", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳",
];

// מפתח החודש הנוכחי בפורמט "YYYY-MM"
export const getCurrentMonthKey = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};
