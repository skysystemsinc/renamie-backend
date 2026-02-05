import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, ContactDocument } from '../schema/contact.schema';
import { CreateContactDto } from '../dto/contact-dto';


@Injectable()
export class ContactRepository {
    constructor(
        @InjectModel(Contact.name)
        private readonly contactModel: Model<ContactDocument>,
    ) { }

    async create(createContactDto: CreateContactDto): Promise<Contact> {
        const createdContact = new this.contactModel(createContactDto);
        return createdContact.save();
    }

}
