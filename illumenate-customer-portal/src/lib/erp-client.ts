import axios, { AxiosInstance, AxiosError } from 'axios';

// Create axios instance for ERP API calls
const erpClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ERP_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for adding auth headers and validating configuration
erpClient.interceptors.request.use(
  (config) => {
    // Check if ERP URL is configured
    if (!process.env.NEXT_PUBLIC_ERP_URL) {
      const error = new Error('ERP URL not configured. Please set NEXT_PUBLIC_ERP_URL environment variable.');
      console.warn('ERP Configuration Warning:', error.message);
      return Promise.reject(error);
    }

    // Add API key/secret for server-side requests
    if (typeof window === 'undefined') {
      const apiKey = process.env.ERP_API_KEY;
      const apiSecret = process.env.ERP_API_SECRET;
      
      if (apiKey && apiSecret) {
        config.headers['Authorization'] = `token ${apiKey}:${apiSecret}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
erpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      console.error('ERP API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
      
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          console.error('Unauthorized - Check API credentials');
          break;
        case 403:
          console.error('Forbidden - Insufficient permissions');
          break;
        case 404:
          console.error('Not Found - Resource does not exist');
          break;
        case 500:
          console.error('Server Error - ERP system issue');
          break;
      }
    } else if (error.request) {
      // Request made but no response received
      const erpUrl = process.env.NEXT_PUBLIC_ERP_URL;
      if (!erpUrl) {
        console.warn('ERP Connection Error: ERP URL not configured. Please set NEXT_PUBLIC_ERP_URL environment variable.');
      } else {
        const requestUrl = error.config?.url 
          ? new URL(error.config.url, erpUrl).toString() 
          : erpUrl;
        console.error(`ERP Connection Error: No response received from ${requestUrl}. Please ensure the ERP server is running.`);
      }
    } else {
      // Error setting up the request
      console.error('ERP Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to test ERP connectivity
export async function testERPConnection(): Promise<{
  success: boolean;
  message: string;
  status?: number;
}> {
  // Check if ERP URL is configured first
  if (!process.env.NEXT_PUBLIC_ERP_URL) {
    return {
      success: false,
      message: 'ERP URL not configured. Please set NEXT_PUBLIC_ERP_URL environment variable.',
    };
  }

  try {
    const response = await erpClient.get('/api/method/frappe.auth.get_logged_user');
    return {
      success: true,
      message: 'Connected successfully',
      status: response.status,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      // Even a 401/403 means we can reach the ERP
      if (error.response) {
        return {
          success: true,
          message: `ERP reachable (Status: ${error.response.status})`,
          status: error.response.status,
        };
      }
      return {
        success: false,
        message: `Cannot connect to ERP: ${error.message}`,
      };
    }
    // Handle non-Axios errors (e.g., missing ERP URL configuration)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Type-safe API method helpers
export const erpAPI = {
  // GET request
  get: <T>(url: string, params?: Record<string, unknown>) =>
    erpClient.get<T>(url, { params }),

  // POST request
  post: <T>(url: string, data?: Record<string, unknown>) =>
    erpClient.post<T>(url, data),

  // PUT request
  put: <T>(url: string, data?: Record<string, unknown>) =>
    erpClient.put<T>(url, data),

  // DELETE request
  delete: <T>(url: string) =>
    erpClient.delete<T>(url),

  // Frappe-specific method call
  call: <T>(method: string, args?: Record<string, unknown>) =>
    erpClient.post<T>(`/api/method/${method}`, args),

  // Get document
  getDoc: <T>(doctype: string, name: string) =>
    erpClient.get<T>(`/api/resource/${doctype}/${name}`),

  // Get list of documents
  getList: <T>(doctype: string, params?: {
    fields?: string[];
    filters?: Record<string, unknown>[];
    limit_page_length?: number;
    limit_start?: number;
    order_by?: string;
  }) =>
    erpClient.get<T>(`/api/resource/${doctype}`, { params }),

  // Create document
  createDoc: <T>(doctype: string, data: Record<string, unknown>) =>
    erpClient.post<T>(`/api/resource/${doctype}`, data),

  // Update document
  updateDoc: <T>(doctype: string, name: string, data: Record<string, unknown>) =>
    erpClient.put<T>(`/api/resource/${doctype}/${name}`, data),

  // Delete document
  deleteDoc: <T>(doctype: string, name: string) =>
    erpClient.delete<T>(`/api/resource/${doctype}/${name}`),
};

export default erpClient;
