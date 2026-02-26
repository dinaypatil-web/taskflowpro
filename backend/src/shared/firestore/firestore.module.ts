import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirestoreService } from './firestore.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [FirestoreService],
    exports: [FirestoreService],
})
export class FirestoreModule { }
