import { IsString, IsOptional, IsDate } from 'class-validator';

export class UpdateKhoaDto {
    @IsOptional()
    @IsString()
    tenKhoa?: string;

    @IsOptional()
    @IsString()
    moTa?: string;
    
    @IsOptional()
    @IsDate()
    ngayThanhLap?: Date;
}