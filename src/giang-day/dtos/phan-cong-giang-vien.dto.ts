import { IsNotEmpty, IsInt, Min } from 'class-validator';

export class PhanCongGiangVienDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  giangVienId: number;
}