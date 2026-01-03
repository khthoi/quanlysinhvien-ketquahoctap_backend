import { IsNotEmpty, IsInt } from 'class-validator';

export class PhanLopDto {
  @IsNotEmpty()
  @IsInt()
  lopId: number;
}