import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Nganh } from './nganh.entity';
import { NienKhoa } from './nien-khoa.entity';

@Entity('lop')
export class Lop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ten_lop', length: 50 })
  tenLop: string;

  @ManyToOne(() => Nganh, { nullable: false })
  @JoinColumn({ name: 'nganh_id' })
  nganh: Nganh;

  @ManyToOne(() => NienKhoa, { nullable: false })
  @JoinColumn({ name: 'nien_khoa_id' })
  nienKhoa: NienKhoa;
}