import { ApDungChuongTrinhDT } from 'src/dao-tao/entity/ap-dung-chuong-trinh-dt.entity';
import { Entity, PrimaryGeneratedColumn, Column, Unique, OneToMany } from 'typeorm';

@Entity('nien_khoa')
@Unique(['tenNienKhoa'])
export class NienKhoa {
  @PrimaryGeneratedColumn()
  id: number;

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
}