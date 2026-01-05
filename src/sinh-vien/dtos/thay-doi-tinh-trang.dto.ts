import { IsNotEmpty, IsEnum } from 'class-validator';
import { TinhTrangHocTapEnum } from '../enums/tinh-trang-hoc-tap.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ThayDoiTinhTrangDto {
  @ApiProperty({ description: 'Tình trạng học tập mới của sinh viên', example: 'DANG_HOC - THOI_HOC - BAO_LUU - DA_TOT_NGHIEP' })
  @IsNotEmpty()
  @IsEnum(TinhTrangHocTapEnum)
  tinhTrang: TinhTrangHocTapEnum;
}