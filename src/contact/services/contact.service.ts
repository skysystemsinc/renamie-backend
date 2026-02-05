import {
    ConflictException,
    Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact } from '../schema/contact.schema';
import { CreateContactDto } from '../dto/contact-dto';
import { ContactRepository } from '../repositories/contact.repository';
import { SendgridService } from 'src/common/services/sendgrid';
import { emial } from 'src/utils/constant';

@Injectable()
export class ContactService {
    constructor(
        @InjectModel(Contact.name)
        private readonly contactRepository: ContactRepository,
        private sendgridService: SendgridService,

    ) { }

    async createContact(createContactDto: CreateContactDto) {
        const contactResult = await this.contactRepository.create(createContactDto);
        // if (contactResult) {
        //     await this.sendgridService.sendContactEmail(
        //         emial?.contact,
        //         createContactDto.firstName,
        //         createContactDto.lastName,
        //         createContactDto.email,
        //         createContactDto.message ?? '',
        //         new Date().getFullYear().toString(),
        //     );
        // }
        return contactResult;
    }
}
