import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { GiangVien } from 'src/danh-muc/entity/giang-vien.entity';
import { MonHoc } from 'src/danh-muc/entity/mon-hoc.entity';
import { Lop } from 'src/danh-muc/entity/lop.entity';
import { HocKy } from 'src/dao-tao/entity/hoc-ky.entity';
import { NamHoc } from 'src/dao-tao/entity/nam-hoc.entity';

@Entity('phan_cong_giang_day')
@Unique(['giangVien', 'monHoc', 'lop', 'hocKy', 'namHoc'])
export class PhanCongGiangDay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ngay_phan_cong', type: 'date', nullable: true })
  ngayPhanCong: Date;

  @Column({ type: 'text', nullable: true })
  ghiChu: string;

  @ManyToOne(() => GiangVien, { nullable: false })
  @JoinColumn({ name: 'giang_vien_id' })
  giangVien: GiangVien;

  @ManyToOne(() => MonHoc, { nullable: false })
  @JoinColumn({ name: 'mon_hoc_id' })
  monHoc: MonHoc;

  @ManyToOne(() => Lop, { nullable: false })
  @JoinColumn({ name: 'lop_id' })
  lop: Lop;

  @ManyToOne(() => HocKy, { nullable: false })
  @JoinColumn({ name: 'hoc_ky_id' })
  hocKy: HocKy;

  @ManyToOne(() => NamHoc, { nullable: false })
  @JoinColumn({ name: 'nam_hoc_id' })
  namHoc: NamHoc;
}