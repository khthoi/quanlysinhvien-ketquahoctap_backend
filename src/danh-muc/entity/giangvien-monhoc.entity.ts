import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { GiangVien } from 'src/danh-muc/entity/giang-vien.entity';
import { MonHoc } from 'src/danh-muc/entity/mon-hoc.entity';

@Entity('giang_vien_mon_hoc')
@Unique(['giangVien', 'monHoc'])
export class GiangVienMonHoc {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => GiangVien, { nullable: false })
  @JoinColumn({ name: 'giang_vien_id' })
  giangVien: GiangVien;

  @ManyToOne(() => MonHoc, { nullable: false })
  @JoinColumn({ name: 'mon_hoc_id' })
  monHoc: MonHoc;

  @Column({ type: 'text', nullable: true })
  ghiChu: string;
}