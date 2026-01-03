import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Nganh } from 'src/danh-muc/entity/nganh.entity';
import { ApDungChuongTrinhDT } from './ap-dung-chuong-trinh-dt.entity';
import { ChiTietChuongTrinhDaoTao } from './chi-tiet-chuong-trinh-dao-tao.entity';

@Entity('chuong_trinh_dao_tao')
export class ChuongTrinhDaoTao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ten_chuong_trinh', length: 100 })
  tenChuongTrinh: string;

  @Column({ name: 'thoi_gian_dao_tao' })
  thoiGianDaoTao: number; // số năm

  @ManyToOne(() => Nganh, { nullable: false })
  @JoinColumn({ name: 'nganh_id' })
  nganh: Nganh;

  @OneToMany(() => ApDungChuongTrinhDT, ap => ap.chuongTrinh)
  apDungChuongTrinhs: ApDungChuongTrinhDT[];

  // ← THÊM QUAN HỆ NGƯỢC ĐẾN CHI TIẾT MÔN HỌC
  @OneToMany(() => ChiTietChuongTrinhDaoTao, ct => ct.chuongTrinh)
  chiTietMonHocs: ChiTietChuongTrinhDaoTao[];
}