import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, IsString, IsOptional, IsEnum } from 'class-validator';
import { LoaiYeuCauHocPhanEnum } from 'src/giang-day/enums/yeu-cau-hoc-phan.enum';

export class SuaYeuCauHocPhanDto {
  @ApiProperty({ description: 'ID yêu cầu học phần', example: 1 })
  @IsNotEmpty()
  @IsInt()
  yeuCauId: number;

  @ApiPropertyOptional({ description: 'ID môn học', example: 10 })
  @IsOptional()
  @IsInt()
  monHocId?: number;

  @ApiPropertyOptional({ description: 'Loại yêu cầu', enum: LoaiYeuCauHocPhanEnum, example: LoaiYeuCauHocPhanEnum.HOC_CAI_THIEN })
  @IsOptional()
  @IsEnum(LoaiYeuCauHocPhanEnum)
  loaiYeuCau?: LoaiYeuCauHocPhanEnum;

  @ApiPropertyOptional({ description: 'ID kết quả cũ', example: 5 })
  @IsOptional()
  @IsInt()
  ketQuaCuId?: number;

  @ApiPropertyOptional({ description: 'Lý do', example: 'Muốn học lại để cải thiện điểm' })
  @IsOptional()
  @IsString()
  lyDo?: string;
}

export class XoaYeuCauHocPhanDto {
  @ApiProperty({ description: 'ID yêu cầu học phần', example: 1 })
  @IsNotEmpty()
  @IsInt()
  yeuCauId: number;
}
