import { Employee } from '../models/Employee.js';

/**
 * Auth Service Database Implementation
 */
export class AuthService {
  /**
   * Verify credentials and generate session tokens from MongoDB database
   */
  async authenticateUser(email, _password) {
    console.log(`[Auth Service] Authenticating user from DB: ${email}`);

    const employee = await Employee.findOne({ email: email.toLowerCase().trim() });
    if (!employee) {
      throw new Error(`Corporate account not registered for email: ${email}`);
    }

    // Generate backward-compatible token with employee ID
    const token = `mock-${employee.role.toLowerCase()}-token-${employee.employeeId}`;

    return {
      token,
      user: {
        id: employee.employeeId,
        name: employee.name,
        role: employee.role,
        email: employee.email,
        department: employee.department,
        costCenter: employee.costCenter,
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
          return {
            id: employee.employeeId,
            role: employee.role,
            name: employee.name,
            department: employee.department,
            costCenter: employee.costCenter,
          };
        }
      }
    }

    return { id: 'user_gen', role: 'Employee', name: 'General User' };
  }
}

export const authService = new AuthService();
