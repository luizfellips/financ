import { withApiHandler } from "@/server/http/handler";
import { success } from "@/server/http/response";

export const GET = withApiHandler(
  async () => {
    return success({
      status: "ok",
      service: "financ",
      timestamp: new Date().toISOString(),
    });
  },
  { auth: false },
);
