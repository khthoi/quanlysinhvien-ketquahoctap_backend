import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ChuongTrinhDaoTao } from './chuong-trinh-dao-tao.entity';
import { NienKhoa } from 'src/danh-muc/entity/nien-khoa.entity';

@Entity('ap_dung_chuong_trinh_dt')
@Unique(['chuongTrinh', 'nienKhoa']) // Đảm bảo không áp dụng trùng
export class ApDungChuongTrinhDT {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChuongTrinhDaoTao, { nullable: false })
  @JoinColumn({ name: 'chuong_trinh_id' })
  chuongTrinh: ChuongTrinhDaoTao;

  @ManyToOne(() => NienKhoa, { nullable: false })
  @JoinColumn({ name: 'nien_khoa_id' })
  nienKhoa: NienKhoa;

  @Column({ name: 'ngay_ap_dung', type: 'date', nullable: true })
  ngayApDung: Date;

  @Column({ type: 'text', nullable: true })
  ghiChu: string;
}