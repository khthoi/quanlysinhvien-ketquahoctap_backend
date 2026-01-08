import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, Unique } from 'typeorm';
import { Khoa } from './khoa.entity';
import { ApDungChuongTrinhDT } from 'src/dao-tao/entity/ap-dung-chuong-trinh-dt.entity';
import { Lop } from './lop.entity';
import { ChuongTrinhDaoTao } from 'src/dao-tao/entity/chuong-trinh-dao-tao.entity';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';

@Entity('nganh')
@Unique(['maNganh'])
export class Nganh {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ma_nganh', length: 30})
  maNganh: string;

  @Column({ name: 'ten_nganh', length: 100 })
  tenNganh: string;

  @Column({ type: 'text', nullable: true })
  moTa: string;

  @ManyToOne(() => Khoa, { nullable: false })
  @JoinColumn({ name: 'khoa_id' })
  khoa: Khoa;

  @OneToMany(() => ApDungChuongTrinhDT, ap => ap.nganh)
  apDungChuongTrinhs: ApDungChuongTrinhDT[];

  @OneToMany(() => Lop, lop => lop.nganh)
  lops: Lop[];

  @OneToMany(() => ChuongTrinhDaoTao, chuongTrinh => chuongTrinh.nganh)
  chuongTrinhs: ChuongTrinhDaoTao[];

  @OneToMany(() => LopHocPhan, lopHocPhan => lopHocPhan.nganh)
  lopHocPhans: LopHocPhan[];
}