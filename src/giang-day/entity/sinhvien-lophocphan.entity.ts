import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { LopHocPhan } from './lop-hoc-phan.entity';

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
    enum: ['ChinhQuy', 'HocLai', 'CaiThien'],
    default: 'ChinhQuy',
  })
  loaiThamGia: string;

  @Column({ name: 'ngay_dang_ky', type: 'date', nullable: true })
  ngayDangKy: Date;

  @Column({ type: 'text', nullable: true })
  ghiChu: string;
}