/**
 * Build a partial-match filter for user search (name, email, student ID).
 * Uses case-insensitive regex instead of MongoDB $text (which needs whole words).
 */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyUserSearchFilter(searchQuery, q) {
  const trimmed = typeof q === 'string' ? q.trim() : '';
  if (!trimmed) return;

  const regex = new RegExp(escapeRegex(trimmed), 'i');
  searchQuery.$or = [
    { firstName: regex },
    { lastName: regex },
    { email: regex },
    { studentId: regex },
  ];
}

module.exports = {
  applyUserSearchFilter,
};
