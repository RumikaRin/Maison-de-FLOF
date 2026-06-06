export interface PaintCalculatorInput {
  length: number;    // meters
  width: number;     // meters
  height: number;    // meters (default 2.8)
  doors: number;     // quantity of doors
  windows: number;   // quantity of windows
  coats: number;     // quantity of coats (default 2)
  coverage: number;  // m²/liter/coat (from paint product specs)
}

export interface PaintCalculatorResult {
  totalArea: number; // m²
  litersNeeded: number; // liters
  cans: {
    "1L": number;
    "5L": number;
    "18L": number;
  };
}

export function calculatePaint(input: PaintCalculatorInput): PaintCalculatorResult {
  const wallArea = 2 * (input.length + input.width) * (input.height || 2.8);
  const doorArea = (input.doors || 0) * 1.8;   // average 1.8 sqm per door
  const windowArea = (input.windows || 0) * 1.2; // average 1.2 sqm per window
  const paintableArea = Math.max(0, wallArea - doorArea - windowArea);
  
  const litersNeeded = (paintableArea * (input.coats || 2)) / (input.coverage || 10);
  const ceilLiters = Math.ceil(litersNeeded);

  return {
    totalArea: parseFloat(paintableArea.toFixed(2)),
    litersNeeded: ceilLiters,
    cans: {
      "1L": Math.ceil(ceilLiters / 1),
      "5L": Math.ceil(ceilLiters / 5),
      "18L": Math.ceil(ceilLiters / 18),
    }
  };
}
