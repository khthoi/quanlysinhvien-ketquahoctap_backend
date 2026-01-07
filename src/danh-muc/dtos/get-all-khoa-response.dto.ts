import { ApiProperty } from '@nestjs/swagger';

// DTO cho ngành (chỉ các trường cần thiết)
class NganhInKhoaDto {
  @ApiProperty({ description: 'ID ngành' })
  id: number;

  @ApiProperty({ description: 'Mã ngành', example: '7480201' })
  maNganh: string;

  @ApiProperty({ description: 'Tên ngành', example: 'Công nghệ thông tin' })
  tenNganh: string;

  @ApiProperty({ description: 'Mô tả ngành', nullable: true })
  moTa?: string | null;
}

// DTO cho mỗi khoa
class KhoaItemResponseDto {
  @ApiProperty({ description: 'ID khoa' })
  id: number;

  @ApiProperty({ description: 'Mã khoa', example: 'CNTT' })
  maKhoa: string;

  @ApiProperty({ description: 'Tên khoa' })
  tenKhoa: string;

  @ApiProperty({ description: 'Mô tả khoa', nullable: true })
  moTa?: string | null;

  @ApiProperty({ description: 'Ngày thành lập', type: String, format: 'date', nullable: true })
  ngayThanhLap?: string | null;

  @ApiProperty({ type: [NganhInKhoaDto], description: 'Danh sách ngành thuộc khoa' })
  nganhs: NganhInKhoaDto[];
}

// DTO cho pagination
class PaginationResponseDto {
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
export class GetAllKhoaResponseDto {
  @ApiProperty({ type: [KhoaItemResponseDto], description: 'Danh sách khoa' })
  data: KhoaItemResponseDto[];

  @ApiProperty({ type: PaginationResponseDto })
  pagination: PaginationResponseDto;
}

export class GetKhoaByIdResponseDto {
  @ApiProperty({ description: 'ID khoa', example: 1 })
  id: number;

  @ApiProperty({ description: 'Mã khoa', example: 'CNTT' })
  maKhoa: string;

  @ApiProperty({ description: 'Tên khoa', example: 'Khoa Công nghệ Thông tin' })
  tenKhoa: string;

  @ApiProperty({ description: 'Mô tả khoa', nullable: true, example: 'Khoa đào tạo các ngành CNTT' })
  moTa?: string | null;

  @ApiProperty({
    description: 'Ngày thành lập khoa',
    type: String,
    format: 'date',
    nullable: true,
    example: '2020-01-01',
  })
  ngayThanhLap?: string | null;
}