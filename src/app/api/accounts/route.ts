import { withApiHandler } from "@/server/http/handler";
import { accountController } from "@/server/controllers/account.controller";

export const GET = withApiHandler(async ({ request, user }) =>
  accountController.list(user, request),
);

export const POST = withApiHandler(async ({ request, user }) =>
  accountController.create(user, request),
);
