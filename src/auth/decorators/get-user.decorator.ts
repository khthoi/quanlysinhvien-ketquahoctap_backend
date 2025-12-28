import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = (data: string) => {
  return createParamDecorator((_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user?.[data] : request.user;
  })();
};