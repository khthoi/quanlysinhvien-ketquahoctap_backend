import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, OneToOne, OneToMany } from 'typeorm';
import { Lop } from 'src/danh-muc/entity/lop.entity';
import { GioiTinh } from 'src/danh-muc/enums/gioi-tinh.enum';
import { TinhTrangHocTapEnum } from '../enums/tinh-trang-hoc-tap.enum';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';
import { KetQuaHocTap } from 'src/ket-qua/entity/ket-qua-hoc-tap.entity';

@Entity('sinh_vien')
export class SinhVien {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ma_sinh_vien', length: 40, unique: true })
  maSinhVien: string;

  @Column({ name: 'ho_ten', length: 100 })
  hoTen: string;

  @Column({ name: 'ngay_sinh', type: 'date', nullable: false })
  ngaySinh: Date;

  @Column({
    name: 'gioi_tinh',
    type: 'enum',
    enum: GioiTinh,
    default: GioiTinh.KHONG_XAC_DINH,
  })
  gioiTinh: GioiTinh;

  @Column({ name: 'dia_chi', length: 255, nullable: true })
  diaChi: string;

  @Column({ length: 100, unique: true }) 
  email: string;

  @Column({ length: 15, nullable: true, unique: true }) 
  sdt: string;

  @Column({ name: 'ngay_nhap_hoc', type: 'date', nullable: false })
  ngayNhapHoc: Date;

  @Column({
    name: 'tinh_trang',
    type: 'enum',
    enum: TinhTrangHocTapEnum,
    default: TinhTrangHocTapEnum.DANG_HOC,
  })
  tinhTrang: TinhTrangHocTapEnum;

  @ManyToOne(() => Lop, { nullable: false })
  @JoinColumn({ name: 'lop_id' })
  lop: Lop;

  @OneToOne(() => NguoiDung, nguoiDung => nguoiDung.sinhVien)
  nguoiDung: NguoiDung;

  @OneToMany(() => KetQuaHocTap, kq => kq.sinhVien)
  ketQuaHocTaps: KetQuaHocTap[];
}