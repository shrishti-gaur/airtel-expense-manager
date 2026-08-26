export const EXPENSE_CATEGORIES = [];

export const setExpenseCategories = (categories) => {
  EXPENSE_CATEGORIES.length = 0;
  EXPENSE_CATEGORIES.push(...categories);
};

export const normalizeCategory = (categoryName) => {
  if (!categoryName) return '';
  const trimmed = categoryName.trim().toLowerCase();

  // Find a category where the ID, Label, or some known aliases match
  const matched = EXPENSE_CATEGORIES.find(cat => 
    cat.id.toLowerCase() === trimmed || 
    cat.label.toLowerCase() === trimmed ||
    (cat.aliases && cat.aliases.some(alias => alias.toLowerCase() === trimmed))
  );

  if (matched) return matched.id;

  // OCR/legacy fallbacks to map old category types to closest new categories
  if (trimmed.includes('travel') || trimmed.includes('cab') || trimmed.includes('taxi') || trimmed.includes('accommodation') || trimmed.includes('hotel')) {
    return 'Conveyance';
  }
  if (trimmed.includes('meals') || trimmed.includes('entertainment') || trimmed.includes('dining') || trimmed.includes('food')) {
    return 'Sales Meeting Expenses';
  }
  if (trimmed.includes('internet') || trimmed.includes('broadband') || trimmed.includes('phone') || trimmed.includes('mobile') || trimmed.includes('telecom')) {
    return 'Network Maintenance Expense';
  }
  if (trimmed.includes('software') || trimmed.includes('license') || trimmed.includes('saas') || trimmed.includes('hosting')) {
    return 'Network Maintenance Expense';
  }
  if (trimmed.includes('office') || trimmed.includes('supplies') || trimmed.includes('stationery')) {
    return 'HR-related Expenses';
  }

  // Fallback default
  return 'HR-related Expenses';
};
