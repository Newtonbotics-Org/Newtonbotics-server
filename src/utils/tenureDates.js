/**
 * Parse tenure values from API input or legacy year-only numbers.
 */
function coerceTenureDate(value) {
  if (value == null || value === '') return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(Date.UTC(value, 0, 1));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const d = trimmed.includes('T')
      ? new Date(trimmed)
      : new Date(`${trimmed}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

function compareTenureDates(a, b) {
  const da = coerceTenureDate(a);
  const db = coerceTenureDate(b);
  if (!da || !db) return 0;
  return da.getTime() - db.getTime();
}

function formatTenureDate(value) {
  const d = coerceTenureDate(value);
  if (!d) return '';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatTenureRange(start, end) {
  const startLabel = formatTenureDate(start);
  if (!startLabel) return '';
  const endLabel = end ? formatTenureDate(end) : '';
  if (!endLabel || endLabel === startLabel) return startLabel;
  return `${startLabel} – ${endLabel}`;
}

function tenureDateValidator(field, { optional = false, forUpdate = false } = {}) {
  const { body } = require('express-validator');
  let chain = body(field);
  if (optional || forUpdate) {
    chain = chain.optional({ nullable: true });
  }
  return chain
    .custom((value) => {
      if (value == null || value === '') {
        if (optional || forUpdate) return true;
        throw new Error(`${field} is required`);
      }
      const parsed = coerceTenureDate(value);
      if (!parsed) throw new Error(`Invalid ${field} date`);
      return true;
    })
    .customSanitizer((value) => coerceTenureDate(value));
}

module.exports = {
  coerceTenureDate,
  compareTenureDates,
  formatTenureDate,
  formatTenureRange,
  tenureDateValidator,
};
