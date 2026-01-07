import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, OneToMany } from 'typeorm';
import { NamHoc } from './nam-hoc.entity';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';

@Entity('hoc_ky')
@Unique(['maHocKy'])
export class HocKy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ma_hoc_ky', length: 30})
  maHocKy: string;

  @Column({ name: 'ten_hoc_ky', length: 10 })
  tenHocKy: string;

  @Column({ name: 'ngay_bat_dau', type: 'date', nullable: false })
  ngayBatDau: Date;

  @Column({ name: 'ngay_ket_thuc', type: 'date', nullable: false })
  ngayKetThuc: Date;

  @ManyToOne(() => NamHoc, { nullable: false })
  @JoinColumn({ name: 'nam_hoc_id' })
  namHoc: NamHoc;
  
  // Thêm quan hệ ngược với LopHocPhan
  @OneToMany(() => LopHocPhan, (lopHocPhan) => lopHocPhan.hocKy)
  lopHocPhans: LopHocPhan[];
}