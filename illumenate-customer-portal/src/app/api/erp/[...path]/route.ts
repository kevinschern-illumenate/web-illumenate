import { NextRequest, NextResponse } from 'next/server';

const ERP_URL = process.env.NEXT_PUBLIC_ERP_URL || 'http://localhost:8000';

/**
 * Fetch CSRF token from Frappe for session-based authentication
 * @param cookies - Cookie string from the incoming request
 * @returns CSRF token or null if unable to fetch
 */
async function getCSRFToken(cookies: string): Promise<string | null> {
  try {
    const response = await fetch(`${ERP_URL}/api/method/frappe.auth.get_csrf_token`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookies,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.message || null;
  } catch (error) {
    console.warn('Failed to fetch CSRF token:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Proxy handler for all ERP API requests
 * This allows client-side code to call /api/erp/... which gets proxied to the Frappe backend
 * Bypassing CORS issues
 */
async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const targetPath = path.join('/');
  const targetUrl = `${ERP_URL}/${targetPath}`;
  
  // Get the search params from the original request
  const searchParams = request.nextUrl.searchParams.toString();
  const fullUrl = searchParams ? `${targetUrl}?${searchParams}` : targetUrl;
  
  // Forward cookies from the incoming request
  const cookies = request.headers.get('cookie') || '';
  
  // Build headers for the proxied request
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cookie': cookies,
  };
  
  // Add API key/secret for server-side authentication if available
  const apiKey = process.env.ERP_API_KEY;
  const apiSecret = process.env.ERP_API_SECRET;
  if (apiKey && apiSecret) {
    headers['Authorization'] = `token ${apiKey}:${apiSecret}`;
  }
  
  // For POST/PUT/DELETE/PATCH requests with session-based auth, fetch and include CSRF token
  // CSRF token is NOT required when using API key/secret authentication
  const methodsRequiringCSRF = ['POST', 'PUT', 'DELETE', 'PATCH'];
  const hasApiKeyAuth = apiKey && apiSecret;
  if (methodsRequiringCSRF.includes(request.method) && !hasApiKeyAuth) {
    const csrfToken = await getCSRFToken(cookies);
    if (csrfToken) {
      headers['X-Frappe-CSRF-Token'] = csrfToken;
    }
  }
  
  try {
    // Prepare request options
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };
    
    // Only include body for methods that support it
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    }
    
    // Make the proxied request
    const response = await fetch(fullUrl, fetchOptions);
    
    // Get response data
    const data = await response.text();
    
    // Create response with proper status and headers
    const proxyResponse = new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
    });
    
    // Forward Set-Cookie headers from the ERP response
    const setCookieHeaders = response.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookie) => {
        proxyResponse.headers.append('Set-Cookie', cookie);
      });
    }
    
    // Set content type
    const contentType = response.headers.get('content-type');
    if (contentType) {
      proxyResponse.headers.set('Content-Type', contentType);
    }
    
    return proxyResponse;
  } catch (error) {
    console.error('ERP Proxy Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to ERP server',
        message: error instanceof Error ? error.message : 'Unknown error',
        url: fullUrl,
      },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
