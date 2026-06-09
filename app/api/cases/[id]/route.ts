import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { internalError, notFound, validationError } from "@/lib/api";

async function getId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return Number(id);
}

// GET /api/cases/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await getId(params);
    const item = await prisma.benchmarkCase.findUnique({ where: { id } });
    if (!item) return notFound();
    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return internalError();
  }
}

// PUT /api/cases/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await getId(params);
    const body = await req.json();
    const { title, category, prompt, rubricJson, expectedOutput, memo } = body;

    if (!title || !category || !prompt) {
      return validationError("title, category, prompt は必須です");
    }

    const exists = await prisma.benchmarkCase.findUnique({ where: { id } });
    if (!exists) return notFound();

    const updated = await prisma.benchmarkCase.update({
      where: { id },
      data: {
        title,
        category,
        prompt,
        rubricJson: rubricJson || null,
        expectedOutput: expectedOutput || null,
        memo: memo || null,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return internalError();
  }
}

// DELETE /api/cases/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await getId(params);
    const exists = await prisma.benchmarkCase.findUnique({ where: { id } });
    if (!exists) return notFound();
    await prisma.benchmarkCase.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return internalError();
  }
}
