import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DeXuatHocLaiDto {
    @ApiProperty({ description: 'Mã năm học', example: 'NH2024' })
    @IsNotEmpty()
    @IsString()
    maNamHoc: string;

    @ApiProperty({ description: 'Học kỳ', example: 1 })
    @IsNotEmpty()
    @IsNumber()
    hocKy: number;
}