const CONTRIBUTION_WEIGHT_REGEX = /^(?=.*[1-9])\d+(?:\.\d+)?$/;

/**
 * HTML pattern string for contribution weights.
 *
 * Use this on text inputs that capture lexicon `contributionWeight` values.
 * The lexicon stores weights as strings, but the value still needs to be a
 * positive decimal number such as `1`, `0.5`, or `25`.
 */
export const CONTRIBUTION_WEIGHT_PATTERN = "(?=.*[1-9])\\d+(\\.\\d+)?";

/**
 * Returns whether an optional contribution weight is valid for submission.
 *
 * Blank values are allowed because the lexicon field is optional. Non-blank
 * values must be positive decimal strings and fit within the lexicon's
 * 100-character limit.
 */
export function isValidContributionWeight(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return trimmed.length <= 100 && CONTRIBUTION_WEIGHT_REGEX.test(trimmed);
}

/**
 * Trims and validates an optional contribution weight before writing records.
 *
 * Returns `undefined` for blank input so callers can omit the optional field.
 * Throws a user-facing error when the value is not a positive decimal string.
 */
export function normalizeContributionWeight(
  value?: string,
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  if (!isValidContributionWeight(trimmed)) {
    throw new Error(
      "Contribution weight must be a positive numeric value like 1, 0.5, or 25.",
    );
  }

  return trimmed;
}
