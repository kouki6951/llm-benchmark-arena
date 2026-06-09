import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { internalError, notFound, validationError } from "@/lib/api";

async function getId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return Number(id);
}

// PUT /api/models/:id  （有効/無効切り替えを含む部分更新も許容）
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await getId(params);
    const exists = await prisma.benchmarkModel.findUnique({ where: { id } });
    if (!exists) return notFound();

    const body = await req.json();

    // enabled のみのトグル更新を許容
    if (
      Object.keys(body).length === 1 &&
      typeof body.enabled === "boolean"
    ) {
      const updated = await prisma.benchmarkModel.update({
        where: { id },
        data: { enabled: body.enabled },
      });
      return NextResponse.json(updated);
    }

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

    const updated = await prisma.benchmarkModel.update({
      where: { id },
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
        enabled: enabled ?? exists.enabled,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return internalError();
  }
}

// DELETE /api/models/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await getId(params);
    const exists = await prisma.benchmarkModel.findUnique({ where: { id } });
    if (!exists) return notFound();
    await prisma.benchmarkModel.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return internalError();
  }
}
