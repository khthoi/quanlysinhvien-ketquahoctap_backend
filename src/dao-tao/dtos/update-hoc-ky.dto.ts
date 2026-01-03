import { PartialType } from '@nestjs/mapped-types';
import { CreateHocKyDto } from './create-hoc-ky.dto';

export class UpdateHocKyDto extends PartialType(CreateHocKyDto) {}