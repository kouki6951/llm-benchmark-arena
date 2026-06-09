import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { internalError, validationError } from "@/lib/api";

// GET /api/cases?category=開発
export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category") || undefined;
    const cases = await prisma.benchmarkCase.findMany({
      where: category ? { category } : undefined,
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(cases);
  } catch (e) {
    console.error(e);
    return internalError();
  }
}

// POST /api/cases
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, prompt, rubricJson, expectedOutput, memo } = body;

    if (!title || !category || !prompt) {
      return validationError("title, category, prompt は必須です");
    }

    const created = await prisma.benchmarkCase.create({
      data: {
        title,
        category,
        prompt,
        rubricJson: rubricJson || null,
        expectedOutput: expectedOutput || null,
        memo: memo || null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return internalError();
  }
}
