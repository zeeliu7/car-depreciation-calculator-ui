import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";

export const maxDuration = 60;

interface SummaryRequestBody {
  carInfo: {
    mileage: string;
    fuel_type: string;
    transmission: string;
    accident: string;
    clean_title: string;
    model_year: string;
    selling_price: string;
    selling_year: string;
  };
  step1Result: string;
  step2Result: string;
  step3Result: string;
}

function buildPrompt(body: SummaryRequestBody): string {
  const { carInfo, step1Result, step2Result, step3Result } = body;
  const formattedPrice = Number(carInfo.selling_price).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return `You are an automotive financial analyst. A user has provided their vehicle information and you have access to a quantitative depreciation forecast, current U.S. government policy news, and current consumer demand trends. Provide a comprehensive and practical analysis.

---

## Vehicle Details
- **Model Year:** ${carInfo.model_year}
- **Current Mileage:** ${Number(carInfo.mileage).toLocaleString()} miles
- **Fuel Type:** ${carInfo.fuel_type}
- **Transmission:** ${carInfo.transmission}
- **Accident History:** ${carInfo.accident}
- **Clean Title:** ${carInfo.clean_title}
- **Original Purchase Price:** ${formattedPrice} (year ${carInfo.selling_year})

---

## Quantitative Depreciation Forecast
${step1Result}

---

## Current U.S. Government Policies (Auto Market)
${step2Result || "(Data was unavailable — use your knowledge for this section.)"}

---

## Current U.S. Consumer Demand Trends (Auto Market)
${step3Result || "(Data was unavailable — use your knowledge for this section.)"}

---

Write a brief markdown analysis with exactly these sections (2–3 sentences each):

### Forecast Assessment
Does the model prediction align with current market conditions, and why?

### Policy Impact
Which policies most affect this specific vehicle (${carInfo.fuel_type}, ${carInfo.model_year})?

### Demand & Resale
How liquid is this vehicle type and what resale discount should the owner expect?

### Financial Outlook
Realistic value trajectory over 1–5 years given all factors.

### Action Points
Up to 3 concrete bullet points the owner should act on.

Be direct. Reference the actual numbers. Total response under 400 words.`;
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const body: SummaryRequestBody = await request.json();
    const prompt = buildPrompt(body);
    const result = await callClaude(prompt, 1024);
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
