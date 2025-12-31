import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { LoaiMonEnum } from '../enums/loai-mon.enum';

@Entity('mon_hoc')
export class MonHoc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ten_mon_hoc', length: 100 })
  tenMonHoc: string;

  @Column({
    name: 'loai_mon',
    type: 'enum',
    enum: LoaiMonEnum,
  })
  loaiMon: LoaiMonEnum;


  @Column({ name: 'so_tin_chi' })
  soTinChi: number;

  @Column({ type: 'text', nullable: true })
  moTa: string;
}