import { PartialType } from '@nestjs/mapped-types';
import { CreateSinhVienDto } from './create-sinh-vien.dto';

export class UpdateSinhVienDto extends PartialType(CreateSinhVienDto) {}