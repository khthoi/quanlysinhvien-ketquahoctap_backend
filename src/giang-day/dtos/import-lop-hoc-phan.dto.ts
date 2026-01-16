import { ApiProperty } from '@nestjs/swagger';

export class ImportLopHocPhanResultDto {
    @ApiProperty()
    message: string;

    @ApiProperty()
    summary: {
        success: number;
        failed: number;
        total: number;
    };

    @ApiProperty()
    details: {
        row: number;
        maLopHocPhan:  string;
        status: 'success' | 'failed';
        message:  string;
        soSinhVienDaDangKy?:  number;
    }[];

    @ApiProperty()
    errors?:  {
        row:  number;
        maLopHocPhan: string;
        error: string;
    }[];
}