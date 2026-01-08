import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { LoaiMonEnum } from '../enums/loai-mon.enum';
import { GiangVienMonHoc } from './giangvien-monhoc.entity';
import { LopHocPhan } from 'src/giang-day/entity/lop-hoc-phan.entity';
import { ChiTietChuongTrinhDaoTao } from 'src/dao-tao/entity/chi-tiet-chuong-trinh-dao-tao.entity';

@Entity('mon_hoc')
export class MonHoc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ten_mon_hoc', length: 100 })
  tenMonHoc: string;

  @Column({ name: 'ma_mon_hoc', length: 30, unique: true })
  maMonHoc: string;

  @Column({
    name: 'loai_mon',
    type: 'enum',
    enum: LoaiMonEnum,
  })
  loaiMon: LoaiMonEnum;


  @Column({ name: 'so_tin_chi' })
  soTinChi: number;

  @Column({ type: 'text', nullable: true })
  moTa: string;

  @OneToMany(() => GiangVienMonHoc, gvmh => gvmh.monHoc)
  giangVienMonHocs: GiangVienMonHoc[];

  // Quan hệ ngược: một môn học có thể được mở ở nhiều lớp học phần
  @OneToMany(() => LopHocPhan, lhp => lhp.monHoc)
  lopHocPhans: LopHocPhan[];

  @OneToMany(() => ChiTietChuongTrinhDaoTao, ct => ct.monHoc)
  chiTietChuongTrinhDaoTaos: ChiTietChuongTrinhDaoTao[];
}