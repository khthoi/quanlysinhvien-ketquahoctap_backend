import { Entity, PrimaryGeneratedColumn, Column, Unique, OneToMany, OneToOne } from 'typeorm';
import { GioiTinh } from '../enums/gioi-tinh.enum';
import { GiangVienMonHoc } from './giangvien-monhoc.entity';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';

@Entity('giang_vien')
@Unique(['maGiangVien'])
@Unique(['email'])
export class GiangVien {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ma_giang_vien', length: 20, nullable: false })
  maGiangVien: string;

  @Column({ name: 'ho_ten', length: 100, nullable: false })
  hoTen: string;

  @Column({ name: 'ngay_sinh', type: 'date', nullable: true })
  ngaySinh: Date;

  @Column({ length: 100, nullable: false })
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

  @OneToMany(() => LopHocPhan, lhp => lhp.giangVien)
  lopHocPhans: LopHocPhan[];

  @OneToOne(() => NguoiDung, nguoiDung => nguoiDung.giangVien)
  nguoiDung: NguoiDung;
}