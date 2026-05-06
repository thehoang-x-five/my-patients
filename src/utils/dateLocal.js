function asDate(value = new Date()) {
  if (value instanceof Date) return value;
  return new Date(value);
}

export function toLocalYmd(value = new Date()) {
  const date = asDate(value);
  if (Number.isNaN(date.getTime())) return "";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfLocalDay(value = new Date()) {
  const date = asDate(value);
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  local.setHours(0, 0, 0, 0);
  return local;
}

export function endOfLocalDay(value = new Date()) {
  const date = asDate(value);
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  local.setHours(23, 59, 59, 999);
  return local;
}

export function toLocalDateTimeParam(value) {
  const date = asDate(value);
  if (Number.isNaN(date.getTime())) return null;

  const ymd = toLocalYmd(date);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  const ms = date.getMilliseconds();

  return ms > 0
    ? `${ymd}T${hh}:${mm}:${ss}.${String(ms).padStart(3, "0")}`
    : `${ymd}T${hh}:${mm}:${ss}`;
}

export function toLocalHms(value = new Date()) {
  const date = asDate(value);
  if (Number.isNaN(date.getTime())) return "";

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function startOfLocalDayParam(value = new Date()) {
  return toLocalDateTimeParam(startOfLocalDay(value));
}

export function endOfLocalDayParam(value = new Date()) {
  return toLocalDateTimeParam(endOfLocalDay(value));
}
