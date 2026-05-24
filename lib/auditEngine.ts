export interface ToolSpend {
  name: string; // 'Cursor' | 'GitHub Copilot' | 'Claude' | 'ChatGPT' | 'Gemini' | 'Windsurf' | 'Custom API' or other
  tier: string; // e.g. 'Hobby', 'Pro', 'Business', 'Individual', 'Enterprise', 'Free', 'Team', 'Plus', 'Ultra', 'Custom API Direct'
  seats: number; // Number of seats
  customSpend?: number; // Raw custom monthly spend for APIs
}

export interface AuditInput {
  tools: ToolSpend[];
  teamSize: number;
  primaryUseCase: string;
}

export interface ToolBreakdown {
  name: string;
  tier: string;
  seats: number;
  currentMonthlySpend: number;
  optimizedMonthlySpend: number;
  monthlySavings: number;
  isRedundant: boolean;
  wasteReason?: string;
  recommendation?: string;
}

export interface AuditResult {
  totalMonthlySpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  isOptimal: boolean;
  toolBreakdown: ToolBreakdown[];
  savingsDetails: string[];
}

export const SAAS_PRICING: Record<string, Record<string, number>> = {
  Cursor: {
    Hobby: 0,
    Pro: 20,
    Business: 40,
  },
  'GitHub Copilot': {
    Individual: 10,
    Business: 19,
    Enterprise: 39,
  },
  Claude: {
    Free: 0,
    Pro: 20,
    Team: 30, // Min 5 seats
  },
  ChatGPT: {
    Plus: 20,
    Team: 25, // Min 2 seats
  },
  Gemini: {
    Pro: 0,
    Ultra: 20,
  },
  Windsurf: {
    Pro: 15,
  },
};

/**
 * Checks if a tool tier accepts raw custom spend directly
 */
export function isCustomApi(toolName: string, tier: string): boolean {
  const nameLower = toolName.toLowerCase();
  const tierLower = tier.toLowerCase();
  return (
    nameLower.includes('api') ||
    tierLower.includes('api') ||
    tierLower.includes('custom') ||
    toolName === 'Claude API' ||
    toolName === 'OpenAI API' ||
    toolName === 'Gemini API'
  );
}

/**
 * Calculates current and optimized monthly spend for a single tool
 */
export function calculateToolSpend(tool: ToolSpend): {
  currentMonthlySpend: number;
  baseOptimizedMonthlySpend: number;
  wasteReason?: string;
  recommendation?: string;
} {
  const { name, tier, seats, customSpend } = tool;

  // Custom API tools accept raw spend directly without per-seat calculations
  if (isCustomApi(name, tier)) {
    const rawSpend = customSpend || 0;
    return {
      currentMonthlySpend: rawSpend,
      baseOptimizedMonthlySpend: rawSpend,
      recommendation: 'Custom API plans are active; monitored for rate limits.',
    };
  }

  const pricingMatrix = SAAS_PRICING[name];
  if (!pricingMatrix) {
    // Unknown tool, fallback to raw custom spend or zero
    const rawSpend = customSpend || 0;
    return {
      currentMonthlySpend: rawSpend,
      baseOptimizedMonthlySpend: rawSpend,
      recommendation: 'Custom tool spend; no predefined optimizations applied.',
    };
  }

  const pricePerSeat = pricingMatrix[tier];
  if (pricePerSeat === undefined) {
    const rawSpend = customSpend || 0;
    return {
      currentMonthlySpend: rawSpend,
      baseOptimizedMonthlySpend: rawSpend,
      recommendation: 'Custom tier spend; no predefined optimizations applied.',
    };
  }

  // Calculate base monthly spend
  let currentMonthlySpend = seats * pricePerSeat;
  let baseOptimizedMonthlySpend = currentMonthlySpend;
  let wasteReason: string | undefined;
  let recommendation: string | undefined;

  // Rule A (Seat Optimization)
  if (name === 'Claude' && tier === 'Team') {
    const minSeats = 5;
    // SaaS vendors enforce the billing of the minimum number of seats
    const currentBilledSeats = Math.max(seats, minSeats);
    currentMonthlySpend = currentBilledSeats * pricePerSeat;
    baseOptimizedMonthlySpend = currentMonthlySpend;

    if (seats < minSeats && seats > 0) {
      const proPrice = SAAS_PRICING['Claude']['Pro']; // $20
      const proSpendForSeats = seats * proPrice; // e.g. 3 seats * 20 = $60
      const waste = currentMonthlySpend - proSpendForSeats; // e.g. 150 - 60 = $90

      baseOptimizedMonthlySpend = proSpendForSeats;
      wasteReason = `Claude Team requires a minimum of ${minSeats} seats ($${minSeats * pricePerSeat}/mo). Billed for ${currentBilledSeats} seats but only utilizing ${seats}.`;
      recommendation = `Downgrade to Claude Pro ($${proPrice}/seat) for ${seats} user(s). Saves $${waste}/mo while retaining key individual features.`;
    }
  } else if (name === 'ChatGPT' && tier === 'Team') {
    const minSeats = 2;
    const currentBilledSeats = Math.max(seats, minSeats);
    currentMonthlySpend = currentBilledSeats * pricePerSeat;
    baseOptimizedMonthlySpend = currentMonthlySpend;

    if (seats < minSeats && seats > 0) {
      const plusPrice = SAAS_PRICING['ChatGPT']['Plus']; // $20
      const plusSpendForSeats = seats * plusPrice;
      const waste = currentMonthlySpend - plusSpendForSeats;

      baseOptimizedMonthlySpend = plusSpendForSeats;
      wasteReason = `ChatGPT Team requires a minimum of ${minSeats} seats ($${minSeats * pricePerSeat}/mo). Billed for ${currentBilledSeats} seats but only utilizing ${seats}.`;
      recommendation = `Downgrade to ChatGPT Plus ($${plusPrice}/seat) for ${seats} user(s). Saves $${waste}/mo.`;
    }
  }

  return {
    currentMonthlySpend,
    baseOptimizedMonthlySpend,
    wasteReason,
    recommendation,
  };
}

export function calculateAudit(input: AuditInput): AuditResult {
  const { tools, teamSize } = input;
  const toolBreakdown: ToolBreakdown[] = [];
  const savingsDetails: string[] = [];

  // Step 1: Calculate initial costs and apply Rule A (Seat Optimization)
  let totalMonthlySpend = 0;
  
  // Create deep copy/initial mapping of tools to breakdowns
  const rawBreakdowns = tools.map((tool) => {
    const { currentMonthlySpend, baseOptimizedMonthlySpend, wasteReason, recommendation } =
      calculateToolSpend(tool);

    totalMonthlySpend += currentMonthlySpend;

    return {
      name: tool.name,
      tier: tool.tier,
      seats: tool.seats,
      currentMonthlySpend,
      optimizedMonthlySpend: baseOptimizedMonthlySpend,
      monthlySavings: currentMonthlySpend - baseOptimizedMonthlySpend,
      isRedundant: false,
      wasteReason,
      recommendation,
    };
  });

  // Log Rule A details if any
  rawBreakdowns.forEach((rb) => {
    if (rb.wasteReason) {
      savingsDetails.push(`[Seat Optimization] ${rb.name}: ${rb.recommendation}`);
    }
  });

  // Step 2: Rule B (Redundancy Optimization)
  // If user pays for BOTH Cursor (Pro/Business) AND GitHub Copilot (Individual/Business/Enterprise)
  // for the same developer seats, flag Copilot as 100% redundant waste.
  const cursorPayingSeats = rawBreakdowns
    .filter((t) => t.name === 'Cursor' && (t.tier === 'Pro' || t.tier === 'Business'))
    .reduce((sum, t) => sum + t.seats, 0);

  let remainingCursorSeats = cursorPayingSeats;

  // Process Copilot tools to detect redundancy
  const processedBreakdowns = rawBreakdowns.map((tool) => {
    if (tool.name === 'GitHub Copilot' && ['Individual', 'Business', 'Enterprise'].includes(tool.tier) && tool.seats > 0) {
      if (remainingCursorSeats > 0) {
        const redundantSeats = Math.min(tool.seats, remainingCursorSeats);
        remainingCursorSeats -= redundantSeats;

        // Calculate pricing per seat for Copilot
        const pricePerSeat = tool.currentMonthlySpend / tool.seats;
        const redundancyWaste = redundantSeats * pricePerSeat;

        // Flag redundancy
        const isFullyRedundant = redundantSeats === tool.seats;
        
        tool.isRedundant = true;
        tool.optimizedMonthlySpend = Math.max(0, tool.optimizedMonthlySpend - redundancyWaste);
        tool.monthlySavings = tool.currentMonthlySpend - tool.optimizedMonthlySpend;
        
        const newReason = `Detected overlap of ${redundantSeats} seats with Cursor editor. Cursor contains advanced Copilot functionality built-in.`;
        tool.wasteReason = tool.wasteReason ? `${tool.wasteReason} ${newReason}` : newReason;

        const newRec = isFullyRedundant
          ? `Cancel GitHub Copilot completely. Standardizing on Cursor saves $${redundancyWaste.toFixed(0)}/mo.`
          : `Remove GitHub Copilot licenses for ${redundantSeats} Cursor developer(s). Saves $${redundancyWaste.toFixed(0)}/mo.`;
        
        tool.recommendation = tool.recommendation ? `${tool.recommendation} ${newRec}` : newRec;

        savingsDetails.push(`[License Redundancy] GitHub Copilot: Overlapping ${redundantSeats} seat(s) with Cursor. Recommendation: ${newRec}`);
      }
    }
    return tool;
  });

  // Step 3: Rule C (Bulk Discount)
  // If total cumulative monthly SaaS spend exceeds $500, calculate a flat 20% savings opportunity
  // explicitly noting "Credex Discounted Infrastructure Credits"
  let totalOptimizedSpend = processedBreakdowns.reduce((sum, t) => sum + t.optimizedMonthlySpend, 0);
  let totalMonthlySavings = totalMonthlySpend - totalOptimizedSpend;
  
  const threshold = 500;
  if (totalMonthlySpend > threshold) {
    // 20% discount on optimized spend representing Infrastructure credits
    const bulkSavings = totalOptimizedSpend * 0.2;
    totalOptimizedSpend -= bulkSavings;
    totalMonthlySavings = totalMonthlySpend - totalOptimizedSpend;

    savingsDetails.push(
      `[Credex Credits] Bulk Discount: Total AI SaaS spend of $${totalMonthlySpend.toFixed(0)}/mo qualifies you for Credex Discounted Infrastructure Credits. This provides a flat 20% discount, saving an additional $${bulkSavings.toFixed(0)}/mo.`
    );
  }

  // Step 4: Rule D (Honesty)
  // If savings are < $100 or 0, set isOptimal: true and don't manufacture fake savings
  let isOptimal = false;
  if (totalMonthlySavings < 100 || totalMonthlySavings <= 0) {
    isOptimal = true;
    totalMonthlySavings = 0;
    
    // Reset optimized spends to match current spend so the user sees a transparent "no action needed" optimal state
    processedBreakdowns.forEach((t) => {
      t.optimizedMonthlySpend = t.currentMonthlySpend;
      t.monthlySavings = 0;
      t.isRedundant = false;
      t.wasteReason = undefined;
      t.recommendation = 'Your configuration is optimal. Keep it up!';
    });
    
    // Clear out saving details and add optimal notice
    savingsDetails.length = 0;
    savingsDetails.push(
      'Your AI SaaS stack is highly optimized! There are no significant redundancies or forced seats waste to eliminate.'
    );
  }

  const totalAnnualSavings = totalMonthlySavings * 12;

  return {
    totalMonthlySpend: Math.round(totalMonthlySpend * 100) / 100,
    totalMonthlySavings: Math.round(totalMonthlySavings * 100) / 100,
    totalAnnualSavings: Math.round(totalAnnualSavings * 100) / 100,
    isOptimal,
    toolBreakdown: processedBreakdowns,
    savingsDetails,
  };
}
