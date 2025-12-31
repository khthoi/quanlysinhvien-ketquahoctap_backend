import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum LoaiQuyDinh {
  XEP_LOAI_HOC_LUC = 'xep_loai_hoc_luc',
  DIEN_CHINH_SACH = 'dien_chinh_sach',
  CACH_TINH_DIEM = 'cach_tinh_diem',
  KHAC = 'khac',
}

@Entity('quy_dinh_dao_tao')
export class QuyDinhDaoTao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ten_quy_dinh', length: 255 })
  tenQuyDinh: string;

  @Column({
    name: 'loai_quy_dinh',
    type: 'enum',
    enum: LoaiQuyDinh,
    default: LoaiQuyDinh.KHAC,
  })
  loaiQuyDinh: LoaiQuyDinh;

  @Column({ type: 'text' })
  noiDung: string;

  @Column({ name: 'ngay_cap_nhat', type: 'date' })
  ngayCapNhat: Date;

  @Column({ type: 'text', nullable: true })
  ghiChu?: string; // Optional
}