import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { VaiTroNguoiDungEnum } from 'src/auth/enums/vai-tro-nguoi-dung.enum'; // import enum của bạn

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy tất cả roles từ method + class và MERGE (union)
    const requiredRoles = this.reflector.getAllAndMerge<VaiTroNguoiDungEnum[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    // Nếu không khai báo role nào → cho qua (hoặc bạn có thể throw nếu muốn bắt buộc role)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Kiểm tra user có ít nhất 1 role nằm trong danh sách requiredRoles không
    // Giả sử user.vaiTro là một giá trị kiểu VaiTroNguoiDungEnum (không phải mảng)
    return requiredRoles.includes(user?.vaiTro);
    
    // Nếu user có nhiều vai trò (user.vaiTro là mảng), thì dùng:
    // return requiredRoles.some(role => user?.vaiTro?.includes(role));
  }
}