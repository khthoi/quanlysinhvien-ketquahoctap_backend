import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { GiangVien } from 'src/danh-muc/entity/giang-vien.entity';
import { VaiTroNguoiDungEnum } from '../enums/vai-tro-nguoi-dung.enum';

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
    enum: VaiTroNguoiDungEnum,
  })
  vaiTro: VaiTroNguoiDungEnum;

  @Column({ name: 'ngay_tao', type: 'date', nullable: true })
  ngayTao: Date;

  // Thêm các trường cho OTP đổi mật khẩu
  @Column({ name: 'change_password_otp', type: 'varchar', length: 6, nullable: true })
  changePasswordOtp?: string | null;

  @Column({ name: 'change_password_otp_expires', type: 'timestamp', nullable: true })
  changePasswordOtpExpires?: Date | null;

  @Column({ name: 'pending_new_password', type: 'varchar', length: 255, nullable: true })
  pendingNewPassword?: string | null;

  @ManyToOne(() => SinhVien, { nullable: true })
  @JoinColumn({ name: 'sinh_vien_id' })
  sinhVien?: SinhVien;

  @ManyToOne(() => GiangVien, { nullable: true })
  @JoinColumn({ name: 'giang_vien_id' })
  giangVien?: GiangVien;
}