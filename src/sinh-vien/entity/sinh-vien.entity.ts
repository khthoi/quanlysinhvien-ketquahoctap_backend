import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Lop } from 'src/danh-muc/entity/lop.entity';
import { GioiTinh } from 'src/danh-muc/enums/gioi-tinh.enum';

@Entity('sinh_vien')
export class SinhVien {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ma_sinh_vien', length: 40, unique: true })
  maSinhVien: string;

  @Column({ name: 'ho_ten', length: 100 })
  hoTen: string;

  @Column({ name: 'ngay_sinh', type: 'date', nullable: true })
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

  @Column({ length: 100, unique: true }) // Nếu muốn unique email ở đây
  email: string;

  @Column({ length: 15, nullable: true })
  sdt: string;

  @Column({ name: 'ngay_nhap_hoc', type: 'date', nullable: true })
  ngayNhapHoc: Date;

  @Column({
    name: 'tinh_trang',
    type: 'enum',
    enum: ['Đang học', 'Bảo lưu', 'Thôi học', 'Đã tốt nghiệp'],
    default: 'Đang học',
  })
  tinhTrang: string;

  @ManyToOne(() => Lop, { nullable: false })
  @JoinColumn({ name: 'lop_id' })
  lop: Lop;
}