import { PartialType } from '@nestjs/mapped-types';
import { CreateChiTietMonHocDto } from './create-chi-tiet-mon-hoc.dto';

export class UpdateChiTietMonHocDto extends PartialType(CreateChiTietMonHocDto) {}