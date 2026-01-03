import { PartialType } from '@nestjs/mapped-types';
import { CreateLopHocPhanDto } from './create-lop-hoc-phan.dto';

export class UpdateLopHocPhanDto extends PartialType(CreateLopHocPhanDto) {}