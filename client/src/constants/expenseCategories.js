export const EXPENSE_CATEGORIES = [
  {
    id: 'Conveyance',
    label: 'Conveyance',
    group: 'Travel & Tours',
    subcategories: ['Auto Charges', 'Taxi Charges'],
    aliases: ['conveyance', 'cab fare', 'taxi fare', 'auto fare', 'travel', 'cab', 'taxi', 'ola', 'uber'],
  },
  {
    id: 'HR-related Expenses',
    label: 'HR-related Expenses',
    group: 'HR & Imprest',
    subcategories: [
      'Communication Expense CFA Limit',
      'Handset',
      'Joining / Recruitment Expense',
      'Pantry Tea and Coffee Expense',
      'Retail Plan Bill',
      'Staff Welfare',
      'Team Engagement Expense'
    ],
    aliases: ['hr expenses', 'hr-related', 'hr related', 'recruitment expense', 'office supplies', 'stationery', 'others'],
  },
  {
    id: 'Imprest Reimbursement',
    label: 'Imprest Reimbursement',
    group: 'HR & Imprest',
    subcategories: [
      'CSE Call Center Engagement Expenses',
      'Meeting Expenses',
      'Pantry Tea and Coffee Expenses',
      'Photocopy Expenses',
      'Postable and Courier Expenses',
      'Printing and Stationery',
      'R&M Office',
      'Rates and Taxes'
    ],
    aliases: ['imprest', 'imprest cash', 'petty cash'],
  },
  {
    id: 'International Tour Expense',
    label: 'International Tour Expense',
    group: 'Travel & Tours',
    subcategories: [
      'Hotel Stay',
      'International Communication Charges',
      'International Conveyance Expenses',
      'Laundry Expenses',
      'Meals',
      'Per Diem on International Travel',
      'Visa Expenses'
    ],
    aliases: ['international tour', 'foreign travel', 'visa expense', 'intl tour'],
  },
  {
    id: 'Network Maintenance Expense',
    label: 'Network Maintenance Expense',
    group: 'Operations',
    subcategories: [
      'Network Liaison Expenses',
      'Network Maintenance Expense',
      'Network Material Transportation',
      'Network Misc. Expenses',
      'Network Regulatory Expenses',
      'Temp Other Route Allocation'
    ],
    aliases: ['network maintenance', 'fiber maintenance', 'mast repair', 'site maintenance', 'maintenance'],
  },
  {
    id: 'Network Meeting Expenses',
    label: 'Network Meeting Expenses',
    group: 'Meetings',
    subcategories: [
      'Network Meeting Expenses'
    ],
    aliases: ['network meeting', 'telecom meeting', 'partner alignment'],
  },
  {
    id: 'Retail Store Expenses',
    label: 'Retail Store Expenses',
    group: 'Operations',
    subcategories: [
      'Conveyance for Store Purpose',
      'Courier Charges',
      'Diesel for Store',
      'Housekeeping Consumables',
      'Kiosk ROL',
      'Minor Store Repairs and Maintenance',
      'Staff Engagement and Refreshments',
      'Stationery',
      'Uniform Stitching Expenses',
      'Water Bill'
    ],
    aliases: ['retail store', 'own retail store', 'retail outlet', 'store maintenance', 'pos expense', 'store'],
  },
  {
    id: 'Relocation Expenses',
    label: 'Relocation Expenses',
    group: 'Travel & Tours',
    subcategories: [
      'Airfare',
      'Laundry Expenses',
      'Meals',
      'Taxi Charges',
      'Train/Bus Travel',
      'Vehicle Registration Expense'
    ],
    aliases: ['relocation', 'moving expense', 'shifter charge', 'brokerage'],
  },
  {
    id: 'Sales Meeting Expenses',
    label: 'Sales Meeting Expenses',
    group: 'Meetings',
    subcategories: [
      'Sales Meeting Expense'
    ],
    aliases: ['sales meeting', 'client pitch', 'deal closure alignment', 'meals', 'entertainment', 'dining'],
  },
  {
    id: 'Tour Bill',
    label: 'Tour Bill',
    group: 'Travel & Tours',
    subcategories: [
      'Air Travel',
      'Auto Charges',
      'Car Rental',
      'Excess Baggage Charges',
      'Insurance Expense for Overseas Tour',
      'International Conveyance Expense',
      'International Loading and Boarding',
      'International Out-of-Pocket',
      'Lodging',
      'Meals etc.',
      'Medical Expenses',
      'Train/Bus Travel'
    ],
    aliases: ['tour bill', 'official tour', 'domestic travel bill'],
  }
];

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
