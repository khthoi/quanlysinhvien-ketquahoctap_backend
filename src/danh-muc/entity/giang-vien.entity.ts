import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('giang_vien')
@Unique(['email'])
export class GiangVien {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ho_ten', length: 100 })
  hoTen: string;

  @Column({ name: 'ngay_sinh', type: 'date', nullable: true })
  ngaySinh: Date;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 15, nullable: true })
  sdt: string;

  @Column({ name: 'gioi_tinh', length: 10, nullable: true })
  gioiTinh: string;

  @Column({ name: 'dia_chi', length: 255, nullable: true })
  diaChi: string;
}