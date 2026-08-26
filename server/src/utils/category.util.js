import { ExpenseCategory } from '../models/ExpenseCategory.js';

/**
 * Resolves allowed category IDs for a manager.
 * If the manager is Sarah Manager (mgr_456), she dynamically receives all categories.
 * Otherwise, she receives only her database-assigned allowedCategories.
 */
export const getAllowedCategoriesForManager = async (manager) => {
  if (!manager) return [];
  if (manager.employeeId === 'mgr_456') {
    const allCats = await ExpenseCategory.find({}, 'id');
    return allCats.map((c) => c.id);
  }
  return manager.allowedCategories || [];
};
