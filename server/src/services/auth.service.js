/**
 * Auth Service Placeholder
 */
export class AuthService {
  /**
   * Verify credentials and generate session tokens
   * TODO: Implement active Entra ID validation or local user lookup.
   */
  async authenticateUser(email, _password) {
    // Placeholder login authentication service
    console.log(`[Auth Service] Authenticating user: ${email}`);

    // Simulate database lookup / AD mapping
    if (email.includes('employee')) {
      return {
        token: 'mock-employee-token',
        user: { id: 'emp_123', name: 'John Employee', role: 'Employee', email },
      };
    } else if (email.includes('manager')) {
      return {
        token: 'mock-manager-token',
        user: { id: 'mgr_456', name: 'Sarah Manager', role: 'Manager', email },
      };
    } else if (email.includes('finance')) {
      return {
        token: 'mock-finance-token',
        user: { id: 'fin_789', name: 'David Finance', role: 'Finance', email },
      };
    }

    throw new Error('Invalid credentials');
  }

  /**
   * Verify session token payload
   */
  async verifySession(token) {
    console.log(`[Auth Service] Validating session token: ${token}`);
    return { id: 'user_gen', role: 'Employee' };
  }
}

export const authService = new AuthService();
