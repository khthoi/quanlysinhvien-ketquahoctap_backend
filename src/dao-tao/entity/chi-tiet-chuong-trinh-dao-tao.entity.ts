import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ChuongTrinhDaoTao } from './chuong-trinh-dao-tao.entity';
import { MonHoc } from 'src/danh-muc/entity/mon-hoc.entity';
import { HocKy } from './hoc-ky.entity';

@Entity('chi_tiet_chuong_trinh_dao_tao')
export class ChiTietChuongTrinhDaoTao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'thu_tu_hoc_ky' })
  thuTuHocKy: number;

  @Column({
    name: 'loai_mon',
    type: 'enum',
    enum: ['Môn chính', 'Môn phụ'],
  })
  loaiMon: string;

  @Column({ name: 'so_tin_chi' })
  soTinChi: number;

  @Column({ type: 'text', nullable: true })
  ghiChu: string;

  @ManyToOne(() => ChuongTrinhDaoTao, { nullable: false })
  @JoinColumn({ name: 'chuong_trinh_id' })
  chuongTrinh: ChuongTrinhDaoTao;

  @ManyToOne(() => MonHoc, { nullable: false })
  @JoinColumn({ name: 'mon_hoc_id' })
  monHoc: MonHoc;

  @ManyToOne(() => HocKy, { nullable: false })
  @JoinColumn({ name: 'hoc_ky_id' })
  hocKy: HocKy;
}