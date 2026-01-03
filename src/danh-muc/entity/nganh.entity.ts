import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Khoa } from './khoa.entity';
import { ApDungChuongTrinhDT } from 'src/dao-tao/entity/ap-dung-chuong-trinh-dt.entity';

@Entity('nganh')
export class Nganh {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ten_nganh', length: 100 })
  tenNganh: string;

  @Column({ type: 'text', nullable: true })
  moTa: string;

  @ManyToOne(() => Khoa, { nullable: false })
  @JoinColumn({ name: 'khoa_id' })
  khoa: Khoa;

  // Trong class Nganh
  @OneToMany(() => ApDungChuongTrinhDT, ap => ap.nganh)
  apDungChuongTrinhs: ApDungChuongTrinhDT[];
}