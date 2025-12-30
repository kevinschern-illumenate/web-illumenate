import { erpAPI } from './erp-client';

export interface LoginCredentials {
  usr: string;
  pwd: string;
}

export interface LoginResponse {
  message: string;
  home_page: string;
  full_name: string;
}

export interface UserInfo {
  user: string;
  full_name?: string;
}

/**
 * Login to Frappe using standard authentication endpoint
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await erpAPI.post<LoginResponse>('/api/method/login', {
    usr: credentials.usr,
    pwd: credentials.pwd,
  });
  return response.data;
}

/**
 * Logout from Frappe
 */
export async function logout(): Promise<void> {
  await erpAPI.call('logout');
}

/**
 * Get the currently logged in user
 */
export async function getLoggedUser(): Promise<string | null> {
  try {
    const response = await erpAPI.call<{ message: string }>('frappe.auth.get_logged_user');
    const user = response.data.message;
    // Frappe returns 'Guest' for unauthenticated users
    if (user === 'Guest') {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

/**
 * Check if the current session is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getLoggedUser();
  return user !== null;
}
