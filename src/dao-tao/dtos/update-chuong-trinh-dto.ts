import { PartialType } from '@nestjs/mapped-types';
import { CreateChuongTrinhDto } from './create-chuong-trinh-dto';

export class UpdateChuongTrinhDto extends PartialType(CreateChuongTrinhDto) {}