import { ApiProperty } from '@nestjs/swagger';

class SinhVienTheoTinhTrangDto {
    @ApiProperty({ example: 8456 })
    dangHoc: number;

    @ApiProperty({ example: 120 })
    baoLuu: number;

    @ApiProperty({ example: 85 })
    thoiHoc: number;

    @ApiProperty({ example: 2150 })
    daTotNghiep: number;
}

class ThongKeSinhVienDto {
    @ApiProperty({ example: 10811 })
    tongSinhVien: number;

    @ApiProperty({ type: SinhVienTheoTinhTrangDto })
    theoTinhTrang: SinhVienTheoTinhTrangDto;
}

export class ThongKeTongQuanResponseDto {
    @ApiProperty()
    sinhVien: ThongKeSinhVienDto;

    @ApiProperty({ example: 156 })
    tongGiangVien: number;

    @ApiProperty({ example: 28 })
    tongNganh: number;

    @ApiProperty({ example: 12 })
    tongKhoa: number;

    @ApiProperty({ example: 245 })
    tongMonHoc: number;

    @ApiProperty({ example: 320 })
    tongLop: number;

    @ApiProperty({ example: 1850 })
    tongLopHocPhan: number;

    @ApiProperty({ example: 1200})
    tongNienKhoa: number;

    @ApiProperty({ example: 45 })
    tongChuongTrinhDaoTao: number;
}