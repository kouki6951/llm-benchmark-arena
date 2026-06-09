import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { internalError, validationError } from "@/lib/api";

// GET /api/models?enabled=true
export async function GET(req: NextRequest) {
  try {
    const enabledParam = req.nextUrl.searchParams.get("enabled");
    const where =
      enabledParam === "true"
        ? { enabled: true }
        : enabledParam === "false"
          ? { enabled: false }
          : undefined;

    const models = await prisma.benchmarkModel.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(models);
  } catch (e) {
    console.error(e);
    return internalError();
  }
}

// POST /api/models
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      provider,
      modelName,
      displayName,
      apiBaseUrl,
      inputCostPer1k,
      outputCostPer1k,
      enabled,
    } = body;

    if (!provider || !modelName || !displayName) {
      return validationError("provider, modelName, displayName は必須です");
    }

    const created = await prisma.benchmarkModel.create({
      data: {
        provider,
        modelName,
        displayName,
        apiBaseUrl: apiBaseUrl || null,
        inputCostPer1k:
          inputCostPer1k != null && inputCostPer1k !== ""
            ? Number(inputCostPer1k)
            : null,
        outputCostPer1k:
          outputCostPer1k != null && outputCostPer1k !== ""
            ? Number(outputCostPer1k)
            : null,
        enabled: enabled ?? true,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return internalError();
  }
}
