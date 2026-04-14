import { l } from "@atproto/lex";

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function formatFieldError(field: string): string {
  return field ? `Invalid ${field}` : "Invalid datetime";
}

function dateOnlyToUtcDate(value: string, field = "datetime"): Date {
  const match = value.match(DATE_ONLY_RE);
  if (!match) {
    throw new Error(`${formatFieldError(field)}: expected YYYY-MM-DD`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    throw new Error(`${formatFieldError(field)}: invalid calendar date`);
  }

  return utcDate;
}

export function currentAtprotoDatetime(): string {
  return l.currentDatetimeString();
}

export function toAtprotoDatetime(date: Date, field = "datetime"): string {
  try {
    return l.toDatetimeString(date);
  } catch {
    throw new Error(`${formatFieldError(field)}: not a valid ATProto datetime`);
  }
}

export function asAtprotoDatetime(input: string, field = "datetime"): string {
  try {
    return l.asDatetimeString(input);
  } catch {
    throw new Error(`${formatFieldError(field)}: not a valid ATProto datetime`);
  }
}

export function dateOnlyToAtprotoDatetime(
  value: string,
  field = "datetime",
): string {
  return toAtprotoDatetime(dateOnlyToUtcDate(value, field), field);
}

export function coerceAtprotoDatetime(
  input: string,
  field = "datetime",
): string {
  if (DATE_ONLY_RE.test(input)) {
    return dateOnlyToAtprotoDatetime(input, field);
  }
  return asAtprotoDatetime(input, field);
}

export function localDateToAtprotoDatetime(
  date: Date,
  field = "datetime",
): string {
  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  return toAtprotoDatetime(utcDate, field);
}
