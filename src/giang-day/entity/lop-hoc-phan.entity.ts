import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, OneToMany, Index } from 'typeorm';
import { MonHoc } from 'src/danh-muc/entity/mon-hoc.entity';
import { HocKy } from 'src/dao-tao/entity/hoc-ky.entity';
import { GiangVien } from 'src/danh-muc/entity/giang-vien.entity';
import { NienKhoa } from 'src/danh-muc/entity/nien-khoa.entity';
import { Nganh } from 'src/danh-muc/entity/nganh.entity';
import { SinhVienLopHocPhan } from './sinhvien-lophocphan.entity';
import { KetQuaHocTap } from 'src/ket-qua/entity/ket-qua-hoc-tap.entity';


@Entity('lop_hoc_phan')
@Index('IDX_lhp_hoc_ky_khoa_diem', ['hocKy', 'khoaDiem'])
@Index('IDX_lhp_mon_hoc_khoa_diem', ['monHoc', 'khoaDiem'])
@Index('IDX_lhp_mon_hoc', ['monHoc'])
export class LopHocPhan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ma_lop_hoc_phan', length: 50, unique: true })
  maLopHocPhan: string; // XSTK2024A, XSTK2024B

  @Column({ type: 'text', nullable: true })
  ghiChu: string;

  @Column({ name: 'ngay_tao', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  ngayTao: Date;

  @Column({ name: 'khoa_diem', type: 'boolean', default: false })
  khoaDiem: boolean;

  @ManyToOne(() => GiangVien, { nullable: true })
  @JoinColumn({ name: 'giang_vien_id' })
  giangVien: GiangVien | null;

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

  @OneToMany(() => SinhVienLopHocPhan, svlhp => svlhp.lopHocPhan)
  sinhVienLopHocPhans: SinhVienLopHocPhan[];

  @OneToMany(() => KetQuaHocTap, kq => kq.lopHocPhan)
  ketQuaHocTaps: KetQuaHocTap[];
}