import { ApiProperty } from '@nestjs/swagger';

// DTO cho khoa trong filters (chỉ cần id và tên)
class KhoaFilterDto {
  @ApiProperty({ description: 'ID khoa' })
  id: number;

  @ApiProperty({ description: 'Tên khoa' })
  tenKhoa: string;
}

// DTO cho khoa trong ngành (chi tiết hơn nếu cần)
class KhoaInNganhDto {
  @ApiProperty({ description: 'ID khoa' })
  id: number;

  @ApiProperty({ description: 'Mã khoa' })
  maKhoa: string;

  @ApiProperty({ description: 'Tên khoa' })
  tenKhoa: string;

  @ApiProperty({ nullable: true })
  moTa?: string | null;

  @ApiProperty({ type: String, format: 'date', nullable: true })
  ngayThanhLap?: string | null;
}

// DTO cho mỗi ngành trong data
class NganhItemResponseDto {
  @ApiProperty({ description: 'ID ngành' })
  id: number;

  @ApiProperty({ description: 'Mã ngành', example: '7480201' })
  maNganh: string;

  @ApiProperty({ description: 'Tên ngành' })
  tenNganh: string;

  @ApiProperty({ nullable: true })
  moTa?: string | null;

  @ApiProperty({ type: KhoaInNganhDto })
  khoa: KhoaInNganhDto;
}

// DTO cho filters
class FiltersResponseDto {
  @ApiProperty({ type: [KhoaFilterDto], description: 'Danh sách khoa để lọc' })
  khoa: KhoaFilterDto[];
}

// DTO cho pagination
class PaginationResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// DTO chính cho getAllNganh
export class GetAllNganhResponseDto {
  @ApiProperty({ type: [NganhItemResponseDto] })
  data: NganhItemResponseDto[];

  @ApiProperty({ type: FiltersResponseDto })
  filters: FiltersResponseDto;

  @ApiProperty({ type: PaginationResponseDto })
  pagination: PaginationResponseDto;
}

class KhoaInNganhDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  maKhoa: string;

  @ApiProperty()
  tenKhoa: string;

  @ApiProperty({ nullable: true })
  moTa?: string | null;

  @ApiProperty({ type: String, format: 'date', nullable: true })
  ngayThanhLap?: string | null;
}

export class GetNganhByIdResponseDto {
  @ApiProperty({ description: 'ID ngành' })
  id: number;

  @ApiProperty({ description: 'Mã ngành', example: '7480201' })
  maNganh: string;

  @ApiProperty({ description: 'Tên ngành' })
  tenNganh: string;

  @ApiProperty({ nullable: true })
  moTa?: string | null;

  @ApiProperty({ type: KhoaInNganhDetailDto, description: 'Thông tin khoa quản lý ngành' })
  khoa: KhoaInNganhDetailDto;
}