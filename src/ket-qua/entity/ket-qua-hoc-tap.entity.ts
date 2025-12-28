import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { PhanCongGiangDay } from 'src/giang-day/entity/phan-cong-giang-day.entity';

@Entity('ket_qua_hoc_tap')
@Unique(['sinhVien', 'phanCong'])
export class KetQuaHocTap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'diem_qua_trinh', type: 'decimal', precision: 4, scale: 2, nullable: true })
  diemQuaTrinh: number;

  @Column({ name: 'diem_thanh_phan', type: 'decimal', precision: 4, scale: 2, nullable: true })
  diemThanhPhan: number;

  @Column({ name: 'diem_thi', type: 'decimal', precision: 4, scale: 2, nullable: true })
  diemThi: number;

  @Column({ name: 'diem_tong', type: 'decimal', precision: 4, scale: 2, nullable: true })
  diemTong: number;

  @Column({ name: 'diem_chu', length: 5, nullable: true })
  diemChu: string;

  @Column({ name: 'xep_loai', length: 20, nullable: true })
  xepLoai: string;

  @ManyToOne(() => SinhVien, { nullable: false })
  @JoinColumn({ name: 'sinh_vien_id' })
  sinhVien: SinhVien;

  @ManyToOne(() => PhanCongGiangDay, { nullable: false })
  @JoinColumn({ name: 'phan_cong_id' })
  phanCong: PhanCongGiangDay;
}