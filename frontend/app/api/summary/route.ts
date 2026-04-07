import { NextResponse } from "next/server";

interface PatientData {
  patientName?: string;
  weeklyReps?: number;
  painLevels?: number[];
  sessionCount?: number;
  avgPain?: number;
}

function generateClinicalSummary(data: PatientData): string {
  const {
    patientName = "Patient",
    weeklyReps = 0,
    painLevels = [],
    sessionCount = 0,
  } = data;

  const avgPain =
    painLevels.length > 0
      ? (painLevels.reduce((a, b) => a + b, 0) / painLevels.length).toFixed(1)
      : "N/A";

  const painTrend =
    painLevels.length >= 2
      ? painLevels[painLevels.length - 1] < painLevels[0]
        ? "showing improvement"
        : "requiring attention"
      : "within expected parameters";

  const repStatus =
    weeklyReps >= 60
      ? "exceeding targets"
      : weeklyReps >= 30
      ? "meeting targets"
      : "below targets for the week";

  return (
    `${patientName} completed ${weeklyReps} rehabilitation repetitions across ${sessionCount} sessions this week, ${repStatus}. ` +
    `Pain levels averaged ${avgPain}/10 and are ${painTrend}, suggesting the current protocol should ${
      painLevels.length > 0 && Number(avgPain) > 6
        ? "be reviewed by the supervising physician before advancing"
        : "continue with progressive resistance as tolerated"
    }.`
  );
}

export async function POST(req: Request) {
  try {
    const body: PatientData = await req.json();

    // In production, call an LLM here (e.g., OpenAI / Gemini)
    // For the hackathon MVP we use the deterministic function below:
    const summary = generateClinicalSummary(body);

    return NextResponse.json({
      summary,
      generatedAt: new Date().toISOString(),
      model: "kinetix-clinical-v1 (placeholder)",
      patient: body.patientName ?? "Unknown",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate summary", details: String(error) },
      { status: 400 }
    );
  }
}

// GET returns demo data
export async function GET() {
  const demoData: PatientData = {
    patientName: "Alex Kumar",
    weeklyReps: 72,
    painLevels: [6, 5, 5, 4, 4, 3, 3],
    sessionCount: 5,
  };

  const summary = generateClinicalSummary(demoData);

  return NextResponse.json({
    summary,
    generatedAt: new Date().toISOString(),
    model: "kinetix-clinical-v1 (placeholder)",
    patient: demoData.patientName,
    rawData: demoData,
  });
}
