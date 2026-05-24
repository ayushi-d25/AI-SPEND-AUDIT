import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      totalMonthlySpend,
      totalMonthlySavings,
      totalAnnualSavings,
      isOptimal,
      toolBreakdown,
      savingsDetails,
    } = body;

    // Define a highly professional fallback summary template
    const fallbackSummary = `Based on our automated audit, your AI developer toolchain has ${
      isOptimal ? 'zero direct waste' : 'substantial optimization potential'
    }. 
    
${
  isOptimal
    ? 'Your current stack is fully optimized for seat counts and license redundancy. Developer licensing is aligned with your active engineering team. To protect your velocity, we recommend keeping this configuration active.'
    : `We have detected multiple avenues for savings. By downgrading under-utilized Team plans (saving $${toolBreakdown
        .filter((t: any) => t.wasteReason && t.wasteReason.includes('minimum'))
        .reduce((sum: number, t: any) => sum + t.monthlySavings, 0)
        .toFixed(0)}/mo) and eliminating redundant GitHub Copilot seats overlapping with Cursor (saving $${toolBreakdown
        .filter((t: any) => t.isRedundant)
        .reduce((sum: number, t: any) => sum + t.monthlySavings, 0)
        .toFixed(0)}/mo), you can shave off licensing costs without affecting engineering velocity.`
}

${
  totalMonthlySpend > 500
    ? `Additionally, your stack qualifies for Credex Discounted Infrastructure Credits, unlocking an immediate 20% bulk savings. Total annual savings opportunity is $${totalAnnualSavings.toFixed(
        0
      )}. Let's schedule a 15-minute Credex Consultation to execute these optimizations seamlessly.`
    : isOptimal
    ? 'Notify us to monitor your stack for next-gen pricing optimizations.'
    : `These simple stack corrections translate to $${totalAnnualSavings.toFixed(
        0
      )} in yearly savings. Book a brief consultation to lock in these optimizations.`
}`;

    // Try calling external LLMs
    const geminiKey = process.env.geminikey || process.env.GEMINI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    let summaryText = '';

    const promptText = `You are the expert Credex AI Spend Optimization Advisor. Analyze this AI spend audit and write a concise, professional, action-oriented executive summary (3 short paragraphs maximum). Highlight specific waste areas (like seat min violations or Cursor-Copilot redundancy) and how to optimize them. Keep it premium, direct, and convincing.

Audit Summary:
- Current Monthly Spend: $${totalMonthlySpend}
- Projected Monthly Savings: $${totalMonthlySavings}
- Projected Annual Savings: $${totalAnnualSavings}
- Is Stack Already Optimal: ${isOptimal ? 'Yes' : 'No'}

Per-Tool Details:
${toolBreakdown
  .map(
    (t: any) =>
      `- ${t.name} (${t.tier}): Current $${t.currentMonthlySpend}/mo, Optimized $${t.optimizedMonthlySpend}/mo, Savings $${t.monthlySavings}/mo. ${
        t.wasteReason ? `Waste Reason: ${t.wasteReason}` : ''
      } ${t.recommendation ? `Rec: ${t.recommendation}` : ''}`
  )
  .join('\n')}

Savings Recommendations:
${savingsDetails.map((d: string) => `- ${d}`).join('\n')}

Write a compelling executive summary that convinces the team to optimize their stack and consult with Credex to implement these changes. Do not include any greeting or conversational filler. Start directly with the analysis.`;

    if (anthropicKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [{ role: 'user', content: promptText }],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          summaryText = data.content?.[0]?.text || '';
        } else {
          console.warn('Anthropic API returned status:', res.status);
        }
      } catch (err) {
        console.error('Failed to call Anthropic API:', err);
      }
    }

    if (!summaryText && geminiKey) {
      try {
        // Standard endpoint for Gemini 2.5 Flash
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          summaryText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
          console.warn('Gemini API returned status:', res.status);
        }
      } catch (err) {
        console.error('Failed to call Gemini API:', err);
      }
    }

    // Fall back to template if API calls failed or keys were absent
    if (!summaryText) {
      summaryText = fallbackSummary;
    }

    return NextResponse.json({ summary: summaryText.trim() });
  } catch (error: any) {
    console.error('API Error in /api/summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary: ' + error.message },
      { status: 500 }
    );
  }
}
