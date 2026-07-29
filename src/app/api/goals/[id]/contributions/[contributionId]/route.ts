import { withApiHandler } from "@/server/http/handler";
import { goalController } from "@/server/controllers/goal.controller";

type ContributionParams = { id: string; contributionId: string };

export const PATCH = withApiHandler<ContributionParams>(
  async ({ request, user, params }) =>
    goalController.updateContribution(
      user,
      params.id,
      params.contributionId,
      request,
    ),
);

export const DELETE = withApiHandler<ContributionParams>(
  async ({ user, params }) =>
    goalController.deleteContribution(
      user,
      params.id,
      params.contributionId,
    ),
);
