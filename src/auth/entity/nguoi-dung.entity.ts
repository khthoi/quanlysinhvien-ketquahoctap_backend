import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { GiangVien } from 'src/danh-muc/entity/giang-vien.entity';

@Entity('nguoi_dung')
@Unique(['tenDangNhap'])
export class NguoiDung {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ten_dang_nhap', length: 50 })
  tenDangNhap: string;

  @Column({ name: 'mat_khau', length: 255 })
  matKhau: string;

  @Column({
    name: 'vai_tro',
    type: 'enum',
    enum: ['Admin', 'GiangVien', 'SinhVien', 'CanBo'],
  })
  vaiTro: string;

  @Column({ name: 'ngay_tao', type: 'date', nullable: true })
  ngayTao: Date;

  @ManyToOne(() => SinhVien, { nullable: true })
  @JoinColumn({ name: 'sinh_vien_id' })
  sinhVien?: SinhVien;

  @ManyToOne(() => GiangVien, { nullable: true })
  @JoinColumn({ name: 'giang_vien_id' })
  giangVien?: GiangVien;
}