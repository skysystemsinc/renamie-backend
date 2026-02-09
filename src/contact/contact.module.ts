
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SSEModule } from 'src/sse/sse.module';
import { Contact, ContactSchema } from './schema/contact.schema';
import { ContactController } from './controllers/contact.controllers';
import { ContactService } from './services/contact.service';
import { ContactRepository } from './repositories/contact.repository';
import { SendgridService } from 'src/common/services/sendgrid';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Contact.name, schema: ContactSchema }]),
    ],
    controllers: [ContactController],
    providers: [ContactService, ContactRepository,  SendgridService],
    exports: [ContactService],
})
export class ContactModule { }
