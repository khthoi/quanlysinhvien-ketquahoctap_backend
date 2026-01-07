import { ApiProperty } from '@nestjs/swagger';
import { VaiTroNguoiDungEnum } from '../enums/vai-tro-nguoi-dung.enum';
import { ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

// DTO cho phần profile sinh viên
export class SinhVienProfileDto {
    @ApiProperty({ description: 'Loại profile', example: 'sinhvien' })
    type: 'sinhvien' = 'sinhvien';

    @ApiProperty({ description: 'ID sinh viên' })
    id: number;

    @ApiProperty({ description: 'Mã sinh viên', example: 'SV001' })
    maSinhVien: string;

    @ApiProperty({ description: 'Họ tên sinh viên' })
    hoTen: string;

    @ApiProperty({ description: 'Email' })
    email: string;

    @ApiProperty({ description: 'Số điện thoại' })
    sdt: string;

    @ApiProperty({ description: 'Ngày sinh', type: String, format: 'date' })
    ngaySinh: Date;

    @ApiProperty({ enum: ['NAM', 'NU', null], nullable: true })
    gioiTinh: 'NAM' | 'NU' | null;

    @ApiProperty({ description: 'Địa chỉ', nullable: true })
    diaChi: string | null;
}

// DTO cho phần profile giảng viên
export class GiangVienProfileDto {
    @ApiProperty({ description: 'Loại profile', example: 'giangvien' })
    type: 'giangvien' = 'giangvien';

    @ApiProperty({ description: 'ID giảng viên' })
    id: number;

    @ApiProperty({ description: 'Họ tên giảng viên' })
    hoTen: string;

    @ApiProperty({ description: 'Email' })
    email: string;

    @ApiProperty({ description: 'Số điện thoại' })
    sdt: string;

    @ApiProperty({ description: 'Ngày sinh', type: String, format: 'date' })
    ngaySinh: Date;

    @ApiProperty({ enum: ['NAM', 'NU', null], nullable: true })
    gioiTinh: 'NAM' | 'NU' | null;

    @ApiProperty({ description: 'Địa chỉ', nullable: true })
    diaChi: string | null;
}

@ApiExtraModels(SinhVienProfileDto, GiangVienProfileDto)
export class UserItemResponseDto {
    @ApiProperty({ description: 'ID người dùng' })
    id: number;

    @ApiProperty({ description: 'Tên đăng nhập' })
    tenDangNhap: string;

    @ApiProperty({ enum: VaiTroNguoiDungEnum })
    vaiTro: VaiTroNguoiDungEnum;

    @ApiProperty({ description: 'Ngày tạo tài khoản', type: String, format: 'date-time' })
    ngayTao: Date;

    @ApiProperty({
        description: 'Thông tin chi tiết theo vai trò (null nếu là admin/cán bộ)',
        oneOf: [
            { $ref: getSchemaPath(SinhVienProfileDto) },
            { $ref: getSchemaPath(GiangVienProfileDto) },
        ],
        nullable: true,
    })
    profile: SinhVienProfileDto | GiangVienProfileDto | null;
}

// DTO cho pagination
export class PaginationResponseDto {
    @ApiProperty({ description: 'Tổng số bản ghi' })
    total: number;

    @ApiProperty({ description: 'Trang hiện tại' })
    page: number;

    @ApiProperty({ description: 'Số bản ghi mỗi trang' })
    limit: number;

    @ApiProperty({ description: 'Tổng số trang' })
    totalPages: number;
}

// DTO chính trả về
export class GetAllUsersResponseDto {
    @ApiProperty({ type: [UserItemResponseDto] })
    data: UserItemResponseDto[];

    @ApiProperty({ type: PaginationResponseDto })
    pagination: PaginationResponseDto;
}

export class GetUserResponseDto {
  @ApiProperty({ description: 'ID người dùng', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tên đăng nhập', example: 'admin1' })
  tenDangNhap: string;

  @ApiProperty({
    description: 'Vai trò của người dùng',
    enum: VaiTroNguoiDungEnum,
    example: VaiTroNguoiDungEnum.ADMIN,
  })
  vaiTro: VaiTroNguoiDungEnum;

  @ApiProperty({
    description: 'Ngày tạo tài khoản',
    type: String,
    format: 'date-time',
    example: '2024-01-01T08:00:00Z',
  })
  ngayTao: Date;
}