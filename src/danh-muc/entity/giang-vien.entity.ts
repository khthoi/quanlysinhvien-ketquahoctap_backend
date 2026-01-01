import { Entity, PrimaryGeneratedColumn, Column, Unique, OneToMany } from 'typeorm';
import { GioiTinh } from '../enums/gioi-tinh.enum';
import { GiangVienMonHoc } from './giangvien-monhoc.entity';

@Entity('giang_vien')
@Unique(['email'])
@Unique(['sdt'])
export class GiangVien {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ho_ten', length: 100 })
  hoTen: string;

  @Column({ name: 'ngay_sinh', type: 'date', nullable: true })
  ngaySinh: Date;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 15, nullable: true })
  sdt: string;

  @Column({
    name: 'gioi_tinh',
    type: 'enum',
    enum: GioiTinh,
    default: GioiTinh.KHONG_XAC_DINH,
  })
  gioiTinh: GioiTinh;

  @Column({ name: 'dia_chi', length: 255, nullable: true })
  diaChi: string;

  @OneToMany(() => GiangVienMonHoc, gvmh => gvmh.giangVien)
  monHocGiangViens: GiangVienMonHoc[];
}