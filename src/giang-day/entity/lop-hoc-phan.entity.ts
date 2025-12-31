import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { MonHoc } from 'src/danh-muc/entity/mon-hoc.entity';
import { HocKy } from 'src/dao-tao/entity/hoc-ky.entity';
import { GiangVien } from 'src/danh-muc/entity/giang-vien.entity';
import { NienKhoa } from 'src/danh-muc/entity/nien-khoa.entity';
import { Nganh } from 'src/danh-muc/entity/nganh.entity';


@Entity('lop_hoc_phan')
@Unique('UQ_PHAN_CONG_GV', ['giangVien', 'monHoc', 'hocKy']) // Tránh trùng phân công GV
export class LopHocPhan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ma_lop_hoc_phan', length: 50, unique: true })
  maLopHocPhan: string; // XSTK2024A, XSTK2024B

  @Column({ name: 'si_so', default: 0 })
  siSo: number;

  @Column({ type: 'text', nullable: true })
  ghiChu: string;

  @Column({ name: 'ngay_tao', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  ngayTao: Date;

  @ManyToOne(() => GiangVien, { nullable: false })
  @JoinColumn({ name: 'giang_vien_id' })
  giangVien: GiangVien;

  @ManyToOne(() => NienKhoa, { nullable: false })
  @JoinColumn({ name: 'nien_khoa_id' })
  nienKhoa: NienKhoa;

  @ManyToOne(() => Nganh, { nullable: false })
  @JoinColumn({ name: 'nganh_id' })
  nganh: Nganh;

  @ManyToOne(() => MonHoc, { nullable: false })
  @JoinColumn({ name: 'mon_hoc_id' })
  monHoc: MonHoc;

  @ManyToOne(() => HocKy, { nullable: false })
  @JoinColumn({ name: 'hoc_ky_id' })
  hocKy: HocKy;
}