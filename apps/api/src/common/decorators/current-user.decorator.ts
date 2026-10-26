import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserSessionPayload } from '@doctalk/shared';

export const CurrentUser = createParamDecorator(
  (data: keyof UserSessionPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserSessionPayload | undefined;
    return data && user ? user[data] : user;
  },
);
