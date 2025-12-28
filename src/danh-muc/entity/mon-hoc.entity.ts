import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('mon_hoc')
export class MonHoc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ten_mon_hoc', length: 100 })
  tenMonHoc: string;

  @Column({ name: 'so_tin_chi' })
  soTinChi: number;

  @Column({ type: 'text', nullable: true })
  moTa: string;
}