import { IsNotEmpty, IsEnum } from 'class-validator';
import { TinhTrangHocTapEnum } from '../enums/tinh-trang-hoc-tap.enum';

export class ThayDoiTinhTrangDto {
  @IsNotEmpty()
  @IsEnum(TinhTrangHocTapEnum)
  tinhTrang: TinhTrangHocTapEnum;
}