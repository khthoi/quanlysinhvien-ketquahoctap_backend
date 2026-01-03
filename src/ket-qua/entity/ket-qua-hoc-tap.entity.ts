import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { DanhgiaKetQuaHocTapEnum } from '../enums/danh-gia-ket-qua-hoc-tap.enum';
@Entity('ket_qua_hoc_tap')
@Unique(['sinhVien', 'lopHocPhan'])
export class KetQuaHocTap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'diem_qua_trinh', type: 'decimal', precision: 4, scale: 2, nullable: false })
  diemQuaTrinh: number;

  @Column({ name: 'diem_thanh_phan', type: 'decimal', precision: 4, scale: 2, nullable: false })
  diemThanhPhan: number;

  @Column({ name: 'diem_thi', type: 'decimal', precision: 4, scale: 2, nullable: false })
  diemThi: number;

  //@Column({ name: 'trang_thai', type: 'enum', enum: DanhgiaKetQuaHocTapEnum, nullable: false })
  //trangThai: DanhgiaKetQuaHocTapEnum;

  @ManyToOne(() => SinhVien, { nullable: false })
  @JoinColumn({ name: 'sinh_vien_id' })
  sinhVien: SinhVien;

  // Trong KetQuaHocTap.entity.ts
  @ManyToOne(() => LopHocPhan, { nullable: false })
  @JoinColumn({ name: 'lop_hoc_phan_id' })
  lopHocPhan: LopHocPhan;

}