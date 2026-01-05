import { Entity, PrimaryGeneratedColumn, Column, Unique, OneToMany } from 'typeorm';
import { HocKy } from './hoc-ky.entity';

@Entity('nam_hoc')
@Unique(['namBatDau', 'namKetThuc'])
@Unique(['maNamHoc'])
export class NamHoc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ma_nam_hoc', length: 20 })
  maNamHoc: string;

  @Column({ name: 'ten_nam_hoc', length: 20 })
  tenNamHoc: string;

  @Column({ name: 'nam_bat_dau' })
  namBatDau: number;

  @Column({ name: 'nam_ket_thuc' })
  namKetThuc: number;

  @OneToMany(() => HocKy, (hocKy) => hocKy.namHoc)
  hocKys: HocKy[];
}