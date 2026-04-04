export const isNumeric = (val) => {
  return typeof val === "string" && val.trim() !== "" && !isNaN(Number(val));
};

export const isValidDate = (date) => {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(date)) return false;
  const [day, month, year] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
};

export const toBoolean = (val) => {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    return val.toLowerCase() === "true";
  }
  return false;
};