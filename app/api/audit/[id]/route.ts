import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve dynamic params asynchronously (standard in Next.js 15/16)
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Audit ID parameter is required' },
        { status: 400 }
      );
    }

    // Fetch the audit record
    const audit = await prisma.audit.findUnique({
      where: { id },
    });

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found or expired' },
        { status: 404 }
      );
    }

    // Strip out the lead relation and link to maintain absolute privacy
    const { leadId, ...anonymousAudit } = audit;

    return NextResponse.json(anonymousAudit);
  } catch (error: any) {
    console.error('API Error in /api/audit/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve anonymous audit: ' + error.message },
      { status: 500 }
    );
  }
}
