import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('nam_hoc')
@Unique(['namBatDau', 'namKetThuc'])
export class NamHoc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nam_bat_dau' })
  namBatDau: number;

  @Column({ name: 'nam_ket_thuc' })
  namKetThuc: number;
}