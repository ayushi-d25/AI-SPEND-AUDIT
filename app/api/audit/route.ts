import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateAudit } from '@/lib/auditEngine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tools, teamSize, primaryUseCase, email, company, role } = body;

    // Validate inputs
    if (!tools || !Array.isArray(tools)) {
      return NextResponse.json(
        { error: 'Tools must be an array' },
        { status: 400 }
      );
    }
    if (typeof teamSize !== 'number' || teamSize < 0) {
      return NextResponse.json(
        { error: 'Team size must be a positive number' },
        { status: 400 }
      );
    }

    // Run core audit calculation server-side
    const calculation = calculateAudit({
      tools,
      teamSize,
      primaryUseCase: primaryUseCase || 'Software Development',
    });

    // Store within a single Prisma transaction for atomicity
    const audit = await prisma.$transaction(async (tx) => {
      let lead = null;
      if (email && email.trim() !== '') {
        const cleanedEmail = email.trim();
        lead = await tx.lead.upsert({
          where: { email: cleanedEmail },
          update: {
            company: company?.trim() || null,
            role: role?.trim() || null,
          },
          create: {
            email: cleanedEmail,
            company: company?.trim() || null,
            role: role?.trim() || null,
          },
        });
      }

      return await tx.audit.create({
        data: {
          teamSize,
          primaryUseCase: primaryUseCase || 'Software Development',
          totalMonthlySpend: calculation.totalMonthlySpend,
          totalMonthlySavings: calculation.totalMonthlySavings,
          totalAnnualSavings: calculation.totalAnnualSavings,
          isOptimal: calculation.isOptimal,
          tools: calculation.toolBreakdown as any,
          savingsDetails: calculation.savingsDetails as any,
          leadId: lead ? lead.id : null,
        },
      });
    });

    // Return the generated UUID id and audit result
    return NextResponse.json({ id: audit.id, calculation });
  } catch (error: any) {
    console.error('API Error in /api/audit:', error);
    return NextResponse.json(
      { error: 'Failed to process audit: ' + error.message },
      { status: 500 }
    );
  }
}
