import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
@Entity('ket_qua_hoc_tap')
@Unique(['sinhVien', 'lopHocPhan'])
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

  @Column({ name: 'trang_thai', type: 'enum', enum: ['ChuaHoanThanh', 'KhongDat', 'Dat'], nullable: true })
  trangThai: string;

  @ManyToOne(() => SinhVien, { nullable: false })
  @JoinColumn({ name: 'sinh_vien_id' })
  sinhVien: SinhVien;

  // Trong KetQuaHocTap.entity.ts
  @ManyToOne(() => LopHocPhan, { nullable: false })
  @JoinColumn({ name: 'lop_hoc_phan_id' })
  lopHocPhan: LopHocPhan;

}