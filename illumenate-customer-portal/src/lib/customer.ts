import { erpAPI } from './erp-client';

export interface CustomerProject {
  name: string;
  project_name: string;
  project_code: string;
  status?: string;
  expected_start_date?: string;
  expected_end_date?: string;
  percent_complete?: number;
}

export interface CustomerInfo {
  name: string;
  customer_name: string;
  customer_type?: string;
  territory?: string;
  customer_group?: string;
}

interface FrappeListResponse<T> {
  data: T[];
}

interface FrappeDocResponse<T> {
  data: T;
}

/**
 * Get projects for the current customer
 * Uses Frappe's whitelisted method to scope by logged-in user's customer
 */
export async function getCustomerProjects(): Promise<CustomerProject[]> {
  const response = await erpAPI.getList<FrappeListResponse<CustomerProject>>('Project', {
    fields: [
      'name',
      'project_name',
      'project_code',
      'status',
      'expected_start_date',
      'expected_end_date',
      'percent_complete',
    ],
  });
  return response.data.data || [];
}

/**
 * Get a single project by name
 */
export async function getProject(name: string): Promise<CustomerProject> {
  const response = await erpAPI.getDoc<FrappeDocResponse<CustomerProject>>('Project', name);
  return response.data.data;
}

/**
 * Get customer information for the logged-in user
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    const response = await erpAPI.call<{ message: CustomerInfo }>('frappe.client.get_value', {
      doctype: 'Customer',
      fieldname: ['name', 'customer_name', 'customer_type', 'territory', 'customer_group'],
    });
    return response.data.message || null;
  } catch {
    return null;
  }
}
