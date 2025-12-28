import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Khoa } from './khoa.entity';

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
}