import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('khoa')
export class Khoa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ten_khoa', length: 100 })
  tenKhoa: string;

  @Column({ type: 'text', nullable: true })
  moTa: string;

  @Column({ name: 'ngay_thanh_lap', type: 'date', nullable: true })
  ngayThanhLap: Date;
}