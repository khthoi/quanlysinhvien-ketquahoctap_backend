import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { LopHocPhan } from './lop-hoc-phan.entity';
import { LoaiHinhThamGiaLopHocPhanEnum } from '../enums/loai-hinh-tham-gia-lop-hoc-phan.enum';

@Entity('sinh_vien_lop_hoc_phan')
@Unique(['sinhVien', 'lopHocPhan'])
export class SinhVienLopHocPhan {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SinhVien, { nullable: false })
  @JoinColumn({ name: 'sinh_vien_id' })
  sinhVien: SinhVien;

  @ManyToOne(() => LopHocPhan, { nullable: false })
  @JoinColumn({ name: 'lop_hoc_phan_id' })
  lopHocPhan: LopHocPhan;

  @Column({
    name: 'loai_tham_gia',
    type: 'enum',
    enum: LoaiHinhThamGiaLopHocPhanEnum,
    default: LoaiHinhThamGiaLopHocPhanEnum.CHINH_QUY,
  })
  loaiThamGia: LoaiHinhThamGiaLopHocPhanEnum;

  @Column({ name: 'ngay_dang_ky', type: 'date', nullable: true })
  ngayDangKy: Date;

  @Column({ type: 'text', nullable: true })
  ghiChu: string;
}