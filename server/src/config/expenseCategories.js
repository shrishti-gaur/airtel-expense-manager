export const EXPENSE_CATEGORIES = {
  'Conveyance': ['Auto Charges', 'Taxi Charges'],
  'HR-related Expenses': [
    'Communication Expense CFA Limit',
    'Handset',
    'Joining / Recruitment Expense',
    'Pantry Tea and Coffee Expense',
    'Retail Plan Bill',
    'Staff Welfare',
    'Team Engagement Expense'
  ],
  'Imprest Reimbursement': [
    'CSE Call Center Engagement Expenses',
    'Meeting Expenses',
    'Pantry Tea and Coffee Expenses',
    'Photocopy Expenses',
    'Postable and Courier Expenses',
    'Printing and Stationery',
    'R&M Office',
    'Rates and Taxes'
  ],
  'International Tour Expense': [
    'Hotel Stay',
    'International Communication Charges',
    'International Conveyance Expenses',
    'Laundry Expenses',
    'Meals',
    'Per Diem on International Travel',
    'Visa Expenses'
  ],
  'Network Maintenance Expense': [
    'Network Liaison Expenses',
    'Network Maintenance Expense',
    'Network Material Transportation',
    'Network Misc. Expenses',
    'Network Regulatory Expenses',
    'Temp Other Route Allocation'
  ],
  'Network Meeting Expenses': [
    'Network Meeting Expenses'
  ],
  'Retail Store Expenses': [
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
  'Relocation Expenses': [
    'Airfare',
    'Laundry Expenses',
    'Meals',
    'Taxi Charges',
    'Train/Bus Travel',
    'Vehicle Registration Expense'
  ],
  'Sales Meeting Expenses': [
    'Sales Meeting Expense'
  ],
  'Tour Bill': [
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
  ]
};

export const isValidCategory = (category) => {
  return category in EXPENSE_CATEGORIES;
};

export const isValidSubcategory = (category, subcategory) => {
  if (!isValidCategory(category)) return false;
  
  const subcategories = EXPENSE_CATEGORIES[category];
  if (subcategories.length === 0) {
    return !subcategory;
  }
  
  return subcategories.includes(subcategory);
};
