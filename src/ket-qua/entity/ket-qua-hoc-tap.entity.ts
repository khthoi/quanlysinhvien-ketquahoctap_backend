import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';

@Entity('ket_qua_hoc_tap')
@Unique(['sinhVien', 'lopHocPhan'])
export class KetQuaHocTap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'diem_qua_trinh',
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => value === null ? null : Number(value),
    },
  })
  diemQuaTrinh: number;

  @Column({
    name: 'diem_thanh_phan',
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => value === null ? null : Number(value),
    },
  })
  diemThanhPhan: number;

  @Column({
    name: 'diem_thi',
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => value === null ? null : Number(value),
    },
  })
  diemThi: number;

  @ManyToOne(() => SinhVien, { nullable: false })
  @JoinColumn({ name: 'sinh_vien_id' })
  sinhVien: SinhVien;

  @ManyToOne(() => LopHocPhan, { nullable: false })
  @JoinColumn({ name: 'lop_hoc_phan_id' })
  lopHocPhan: LopHocPhan;
}
