import { PartialType } from '@nestjs/mapped-types';
import { CreateNamHocDto } from './create-nam-hoc.dto';

export class UpdateNamHocDto extends PartialType(CreateNamHocDto) {}