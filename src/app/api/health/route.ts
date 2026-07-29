import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiHandler } from "@/server/http/handler";

export const GET = withApiHandler(
  async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return NextResponse.json(
        {
          success: true,
          data: {
            status: "ok",
            database: "up",
            service: "financ",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 200 },
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          data: {
            status: "degraded",
            database: "down",
            service: "financ",
            timestamp: new Date().toISOString(),
          },
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Database unavailable",
          },
        },
        { status: 503 },
      );
    }
  },
  { auth: false },
);
