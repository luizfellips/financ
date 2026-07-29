import { withApiHandler } from "@/server/http/handler";
import { settingsController } from "@/server/controllers/settings.controller";

export const GET = withApiHandler(async ({ user }) =>
  settingsController.get(user),
);

export const PATCH = withApiHandler(async ({ request, user }) =>
  settingsController.update(user, request),
);

export const PUT = withApiHandler(async ({ request, user }) =>
  settingsController.update(user, request),
);
