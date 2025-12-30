import { NextResponse } from 'next/server';
import { testERPConnection } from '@/lib/erp-client';

export async function GET() {
  const result = await testERPConnection();
  
  return NextResponse.json(result, {
    status: result.success ? 200 : 503,
  });
}
