import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SinhVien } from 'src/sinh-vien/entity/sinh-vien.entity';
import { MonHoc } from 'src/danh-muc/entity/mon-hoc.entity';
import { ChiTietChuongTrinhDaoTao } from 'src/dao-tao/entity/chi-tiet-chuong-trinh-dao-tao.entity';
import { LopHocPhan } from './lop-hoc-phan.entity';
import { NguoiDung } from 'src/auth/entity/nguoi-dung.entity';
import {
  LoaiYeuCauHocPhanEnum,
  TrangThaiYeuCauHocPhanEnum,
} from '../enums/yeu-cau-hoc-phan.enum';

@Entity('yeu_cau_hoc_phan')
export class YeuCauHocPhan {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SinhVien, { nullable: false })
  @JoinColumn({ name: 'sinh_vien_id' })
  sinhVien: SinhVien;

  @ManyToOne(() => MonHoc, { nullable: false })
  @JoinColumn({ name: 'mon_hoc_id' })
  monHoc: MonHoc;

  @ManyToOne(() => ChiTietChuongTrinhDaoTao, { nullable: true })
  @JoinColumn({ name: 'chi_tiet_ctdt_id' })
  chiTietCTDT?: ChiTietChuongTrinhDaoTao | null;

  @Column({
    name: 'loai_yeu_cau',
    type: 'enum',
    enum: LoaiYeuCauHocPhanEnum,
  })
  loaiYeuCau: LoaiYeuCauHocPhanEnum;

  @Column({ name: 'ket_qua_cu_id', type: 'int', nullable: true })
  ketQuaCuId?: number | null;

  @Column({ name: 'ly_do', type: 'text', nullable: true })
  lyDo?: string;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: TrangThaiYeuCauHocPhanEnum,
    default: TrangThaiYeuCauHocPhanEnum.CHO_DUYET,
  })
  trangThai: TrangThaiYeuCauHocPhanEnum;

  @ManyToOne(() => LopHocPhan, { nullable: true })
  @JoinColumn({ name: 'lop_hoc_phan_da_duyet_id' })
  lopHocPhanDaDuyet?: LopHocPhan | null;

  @ManyToOne(() => NguoiDung, { nullable: true })
  @JoinColumn({ name: 'nguoi_xu_ly_id' })
  nguoiXuLy?: NguoiDung | null;

  @Column({
    name: 'ngay_tao',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  ngayTao: Date;

  @Column({ name: 'ngay_xu_ly', type: 'timestamp', nullable: true })
  ngayXuLy?: Date | null;

  @Column({ name: 'ghi_chu_phong_dt', type: 'text', nullable: true })
  ghiChuPhongDaoTao?: string | null;
}

