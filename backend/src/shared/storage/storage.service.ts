import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private bucket: any;

    constructor(private configService: ConfigService) {
        if (!admin.apps.length) {
            this.logger.warn('Firebase not initialized when StorageService was created. Ensure FirestoreModule is loaded.');
        } else {
            this.bucket = admin.storage().bucket();
            this.logger.log('StorageService initialized with default bucket.');
        }
    }

    async uploadFile(file: any, folder: string = 'attachments'): Promise<any> {
        const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
        const fileRef = this.bucket.file(fileName);

        await fileRef.save(file.buffer, {
            contentType: file.mimetype,
            metadata: {
                firebaseStorageDownloadTokens: uuidv4(),
            },
        });

        // Make the file public or get a signed URL
        // For simplicity in this TaskFlow Pro context, we'll use a public-ish access or a long-lived signed URL
        const [url] = await fileRef.getSignedUrl({
            action: 'read',
            expires: '03-01-2500', // Far future
        });

        return {
            name: file.originalname,
            url,
            type: file.mimetype,
            size: file.size,
        };
    }

    async deleteFile(url: string): Promise<void> {
        try {
            // Extract file path from URL if needed, or store path in DB
            // For now, this is a placeholder as deleting by URL requires parsing
            this.logger.log(`Deleting file at ${url}`);
        } catch (error) {
            this.logger.error(`Failed to delete file: ${error.message}`);
        }
    }
}
