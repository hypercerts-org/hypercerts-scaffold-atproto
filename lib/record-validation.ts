import type { ValidationResult } from "@atproto/lexicon";

/**
 * Validates a record against its lexicon schema and throws if invalid.
 * @param label - Human-readable label for error messages (e.g. "activity", "contribution")
 * @param record - The record to validate
 * @param validateFn - The validateRecord function from the lexicon namespace
 * @throws Error with descriptive message if validation fails
 */
export function assertValidRecord<T extends Record<string, unknown>>(
  label: string,
  record: unknown,
  validateFn: (v: unknown) => ValidationResult<T>,
): asserts record is T {
  const result = validateFn(record);
  if (!result.success) {
    throw new Error(`Invalid ${label} record: ${result.error.message}`);
  }
}
