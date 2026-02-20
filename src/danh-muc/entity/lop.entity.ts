import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, OneToMany, Index } from 'typeorm';
import { Nganh } from './nganh.entity';
import { NienKhoa } from './nien-khoa.entity';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';

@Index('IDX_LOP_MA_LOP', ['maLop'])
@Index('IDX_LOP_NGANH_ID', ['nganh'])
@Index('IDX_LOP_NIEN_KHOA_ID', ['nienKhoa'])
@Entity('lop')
@Unique(['maLop'])  
export class Lop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ma_lop', length: 30})
  maLop: string;

  @Column({ name: 'ten_lop', length: 50 })
  tenLop: string;

  @ManyToOne(() => Nganh, { nullable: false })
  @JoinColumn({ name: 'nganh_id' })
  nganh: Nganh;

  @ManyToOne(() => NienKhoa, { nullable: false })
  @JoinColumn({ name: 'nien_khoa_id' })
  nienKhoa: NienKhoa;

  @OneToMany(() => SinhVien, (sinhVien) => sinhVien.lop)
  sinhViens: SinhVien[];
}

export interface LopWithTongSinhVien extends Lop {
  tongSinhVien: number; // ← Field động từ loadRelationCountAndMap
}