import { Controller, Post, Body } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { ContactService } from '../services/contact.service';
import { CreateContactDto } from '../dto/contact-dto';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
    constructor(private readonly contactService: ContactService) { }

    @Post()
    @ApiBody({ type: CreateContactDto })
    @ApiOperation({ summary: 'Create a contact message' })
    async createContact(@Body() createContactDto: CreateContactDto) {
        const contact = await this.contactService.createContact(createContactDto);
        return ApiResponseDto.success(
            'Contact form submitted successfully',
            contact,
        );
    }
}
