import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SinhVien } from './sinh-vien.entity';

@Entity('khen_thuong_ky_luat')
export class KhenThuongKyLuat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ['Khen thưởng', 'Kỷ luật'],
  })
  loai: string;

  @Column({ type: 'text' })
  noiDung: string;

  @Column({ name: 'ngay_quyet_dinh', type: 'date' })
  ngayQuyetDinh: Date;

  @ManyToOne(() => SinhVien, { nullable: false })
  @JoinColumn({ name: 'sinh_vien_id' })
  sinhVien: SinhVien;
}