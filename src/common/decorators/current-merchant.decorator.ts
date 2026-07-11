import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';

export const CurrentMerchant = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    // Explicitly handle 'id' or 'merchantId' to ensure merchant scoping
    if (data === 'id' || data === 'merchantId') {
      if (!user?.merchantId) {
        throw new ForbiddenException('User is not associated with any merchant.');
      }
      return user.merchantId;
    }

    // If a specific property is requested, return it, otherwise return full user payload
    return data ? user?.[data] : user;
  },
);
