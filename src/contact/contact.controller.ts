import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ContactService } from './contact.service';
import { SendFormInformationDto } from './dtos/send-form-information.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('send-form-information')
  async sendForm(@Body() payload: SendFormInformationDto) {
    try {
      await this.contactService.sendFormInformation(payload);
      return { success: true };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new HttpException('Failed to send email', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
