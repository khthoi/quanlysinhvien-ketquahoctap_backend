import { IsNotEmpty, IsInt } from 'class-validator';

export class XoaPhanCongMonHocDto {
  @IsNotEmpty()
  @IsInt()
  giangVienId: number;

  @IsNotEmpty()
  @IsInt()
  monHocId: number;
}