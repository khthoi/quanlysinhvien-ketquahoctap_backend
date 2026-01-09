import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, Min } from "class-validator";

export class UpdateChiTietMonHocDto {
    @ApiPropertyOptional({ description: "Thứ tự học kỳ trong năm học" })
    @Min(1)
    @IsInt()
    thuTuHocKy?: number;

    @ApiPropertyOptional({ description: 'Ghi chú', example: 'Môn học bắt buộc' })
    @IsOptional()
    ghiChu?: string;
}