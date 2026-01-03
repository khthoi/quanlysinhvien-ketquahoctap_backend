import { PartialType } from '@nestjs/mapped-types';
import { CreateApDungDto } from './create-ap-dung-dto';

export class UpdateApDungDto extends PartialType(CreateApDungDto) {}