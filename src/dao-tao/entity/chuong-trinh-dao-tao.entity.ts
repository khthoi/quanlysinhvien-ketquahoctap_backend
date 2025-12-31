import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Nganh } from 'src/danh-muc/entity/nganh.entity';

@Entity('chuong_trinh_dao_tao')
export class ChuongTrinhDaoTao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ten_chuong_trinh', length: 100 })
  tenChuongTrinh: string;

  @Column({ name: 'thoi_gian_dao_tao' })
  thoiGianDaoTao: number; // số năm

  @Column({ name: 'tong_tin_chi' })
  tongTinChi: number;

  @ManyToOne(() => Nganh, { nullable: false })
  @JoinColumn({ name: 'nganh_id' })
  nganh: Nganh;

}