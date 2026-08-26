import { Employee } from '../models/Employee.js';
import { verifyPassword } from '../utils/hash.util.js';
import { getAllowedCategoriesForManager } from '../utils/category.util.js';

/**
 * Auth Service Database Implementation
 */
export class AuthService {
  /**
   * Verify credentials and generate session tokens from MongoDB database
   */
  async authenticateUser(email, password) {
    console.log(`[Auth Service] Authenticating user from DB: ${email}`);

    const identifier = email.toLowerCase().trim();
    const employee = await Employee.findOne({
      $or: [
        { email: identifier },
        { employeeId: identifier },
        { employeeId: identifier.toUpperCase() }
      ]
    });

    if (!employee) {
      throw new Error(`Corporate account not registered for: ${email}`);
    }

    if (!employee.passwordHash) {
      throw new Error('Corporate account password has not been configured.');
    }

    if (!password || !verifyPassword(password, employee.passwordHash)) {
      throw new Error('Invalid authentication credentials');
    }

    // Generate backward-compatible token with employee ID
    const token = `mock-${employee.role.toLowerCase()}-token-${employee.employeeId}`;
    const allowedCategories = await getAllowedCategoriesForManager(employee);

    return {
      token,
      user: {
        id: employee.employeeId,
        name: employee.name,
        role: employee.role,
        email: employee.email,
        department: employee.department,
        costCenter: employee.costCenter,
        allowedCategories,
      },
    };
  }

  /**
   * Verify session token payload from database
   */
  async verifySession(token) {
    console.log(`[Auth Service] Validating session token: ${token}`);

    if (token.startsWith('mock-')) {
      const parts = token.split('-');
      // Support both legacy "mock-employee-token" and new "mock-employee-token-emp_123"
      let employeeId = parts[3];
      if (!employeeId) {
        if (token === 'mock-employee-token') employeeId = 'emp_123';
        else if (token === 'mock-manager-token') employeeId = 'mgr_456';
        else if (token === 'mock-finance-token') employeeId = 'fin_789';
      }

      if (employeeId) {
        const employee = await Employee.findOne({ employeeId });
        if (employee) {
          const allowedCategories = await getAllowedCategoriesForManager(employee);
          return {
            id: employee.employeeId,
            role: employee.role,
            name: employee.name,
            department: employee.department,
            costCenter: employee.costCenter,
            allowedCategories,
          };
        }
      }
    }

    return { id: 'user_gen', role: 'Employee', name: 'General User', allowedCategories: [] };
  }
}

export const authService = new AuthService();
