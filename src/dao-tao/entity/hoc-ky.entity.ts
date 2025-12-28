import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { NamHoc } from './nam-hoc.entity';

@Entity('hoc_ky')
export class HocKy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ten_hoc_ky', length: 10 })
  tenHocKy: string;

  @Column({ name: 'ngay_bat_dau', type: 'date', nullable: true })
  ngayBatDau: Date;

  @Column({ name: 'ngay_ket_thuc', type: 'date', nullable: true })
  ngayKetThuc: Date;

  @ManyToOne(() => NamHoc, { nullable: false })
  @JoinColumn({ name: 'nam_hoc_id' })
  namHoc: NamHoc;
}