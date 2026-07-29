import { withApiHandler } from "@/server/http/handler";
import { accountDataController } from "@/server/controllers/account-data.controller";

export const POST = withApiHandler(async ({ request, user }) =>
  accountDataController.purge(user, request),
);
