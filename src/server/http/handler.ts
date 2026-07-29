import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/server/errors/app-error";
import { handleRouteError } from "@/server/http/response";
import type { NextRequest } from "next/server";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
};

type HandlerContext<TParams> = {
  request: NextRequest;
  params: TParams;
  user: AuthenticatedUser | null;
};

type RouteHandlerOptions = {
  auth?: boolean;
};

type AppRouteHandler<TParams> = (
  context: HandlerContext<TParams>,
) => Promise<Response> | Response;

type RouteContext<TParams> = {
  params: Promise<TParams>;
};

export function withApiHandler<TParams extends Record<string, string> = Record<string, string>>(
  handler: AppRouteHandler<TParams>,
  options: RouteHandlerOptions = { auth: true },
) {
  return async (request: NextRequest, context: RouteContext<TParams>) => {
    try {
      const paramsValue = (await context.params) ?? ({} as TParams);

      let user: AuthenticatedUser | null = null;
      if (options.auth !== false) {
        const session = await auth();
        if (!session?.user?.id) {
          throw new UnauthorizedError();
        }
        user = {
          id: session.user.id,
          email: session.user.email ?? "",
          name: session.user.name ?? "",
        };
      }

      return await handler({
        request,
        params: paramsValue,
        user,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  };
}

export function requireUser(user: AuthenticatedUser | null): AuthenticatedUser {
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}
