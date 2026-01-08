import { ApDungChuongTrinhDT } from 'src/dao-tao/entity/ap-dung-chuong-trinh-dt.entity';
import { Entity, PrimaryGeneratedColumn, Column, Unique, OneToMany } from 'typeorm';
import { Lop } from './lop.entity';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';

@Entity('nien_khoa')
@Unique(['maNienKhoa'])
export class NienKhoa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ma_nien_khoa', length: 20})
  maNienKhoa: string;

  @Column({ name: 'ten_nien_khoa', length: 20 })
  tenNienKhoa: string;

  @Column({ name: 'nam_bat_dau' })
  namBatDau: number;

  @Column({ name: 'nam_ket_thuc' })
  namKetThuc: number;

  @Column({ type: 'text', nullable: true })
  moTa: string;

  // Trong class NienKhoa
  @OneToMany(() => ApDungChuongTrinhDT, ap => ap.nienKhoa)
  apDungChuongTrinhs: ApDungChuongTrinhDT[];

  @OneToMany(() => Lop, lop => lop.nienKhoa)
  lops: Lop[];

  @OneToMany(() => LopHocPhan, lopHocPhan => lopHocPhan.nienKhoa)
  lopHocPhans: LopHocPhan[];
}