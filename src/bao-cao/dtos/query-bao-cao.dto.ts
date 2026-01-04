import { Type } from "class-transformer";
import { IsOptional, IsNumber, IsEnum } from "class-validator";

export enum LoaiHocLaiEnum {
  HOC_LAI = 'HOC_LAI',
  HOC_CAI_THIEN = 'HOC_CAI_THIEN',
  TAT_CA = 'TAT_CA',
}

export class FilterHocLaiDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  hocKyId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  nganhId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  nienKhoaId?: number;

  @IsOptional()
  @IsEnum(LoaiHocLaiEnum)
  loaiHocLai?: LoaiHocLaiEnum;}

export class FilterThongKeNganhDto {
  nganhId: number;
  hocKyId: number;
  nienKhoaId?: number;
}

export class FilterThongKeLopHocPhanDto {
  lopHocPhanIds?: number[];
  hocKyId?: number;
  monHocId?: number;
  giangVienId?: number;
}

export enum LoaiDanhSachEnum {
  LOP_HANH_CHINH = 'LOP_HANH_CHINH',
  NGANH_NIEN_KHOA = 'NGANH_NIEN_KHOA',
  LOP_HOC_PHAN = 'LOP_HOC_PHAN',
  ROT_2_MON_TRO_LEN = 'ROT_2_MON_TRO_LEN',
  CANH_BAO_GPA = 'CANH_BAO_GPA',
  KHEN_THUONG = 'KHEN_THUONG',
}

export class FilterDanhSachSinhVienDto {
  loaiDanhSach: LoaiDanhSachEnum;
  lopId?: number;
  nganhId?: number;
  nienKhoaId?: number;
  lopHocPhanId?: number;
  hocKyId?: number;
  nguongGPA?: number; // Mặc định 2.0 cho cảnh báo
  xepLoai?: 'XUAT_SAC' | 'GIOI' | 'KHA' | 'TRUNG_BINH';
}