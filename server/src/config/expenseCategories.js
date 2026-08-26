import { ExpenseCategory } from '../models/ExpenseCategory.js';

/**
 * Check if the given category exists in the MongoDB database
 */
export const isValidCategory = async (category) => {
  if (!category) return false;
  const cat = await ExpenseCategory.findOne({ id: category });
  return !!cat;
};

/**
 * Check if the given subcategory is valid for the given category in the database
 */
export const isValidSubcategory = async (category, subcategory) => {
  if (!category) return false;
  const cat = await ExpenseCategory.findOne({ id: category });
  if (!cat) return false;
  
  if (!cat.subcategories || cat.subcategories.length === 0) {
    return !subcategory;
  }
  
  return cat.subcategories.includes(subcategory);
};
