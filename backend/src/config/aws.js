import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import env from './env.js';
import pino from 'pino';

const logger = pino({ name: 'aws' });

// S3 Client configuration
let s3Client;
if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
  logger.info('✅ AWS S3 client initialized');
} else {
  logger.warn('⚠️  AWS S3 credentials not provided, S3 functionality disabled');
}

// SES Client configuration
let sesClient;
if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  sesClient = new SESClient({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
  logger.info('✅ AWS SES client initialized');
} else {
  logger.warn('⚠️  AWS SES credentials not provided, email functionality disabled');
}

// Generate pre-signed URL for file upload
export const generateUploadUrl = async (key, contentType, expiresIn = 3600) => {
  if (!s3Client || !env.AWS_S3_BUCKET) {
    throw new Error('S3 not configured');
  }

  try {
    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    logger.info('Generated upload URL for key:', key);
    
    return {
      uploadUrl,
      key,
      bucket: env.AWS_S3_BUCKET,
    };
  } catch (error) {
    logger.error('Failed to generate upload URL:', error);
    throw error;
  }
};

// Generate pre-signed URL for file download
export const generateDownloadUrl = async (key, expiresIn = 3600) => {
  if (!s3Client || !env.AWS_S3_BUCKET) {
    throw new Error('S3 not configured');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    logger.info('Generated download URL for key:', key);
    
    return downloadUrl;
  } catch (error) {
    logger.error('Failed to generate download URL:', error);
    throw error;
  }
};

// Delete file from S3
export const deleteFile = async (key) => {
  if (!s3Client || !env.AWS_S3_BUCKET) {
    throw new Error('S3 not configured');
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    logger.info('Deleted file from S3:', key);
  } catch (error) {
    logger.error('Failed to delete file from S3:', error);
    throw error;
  }
};

// Send email using SES
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!sesClient || !env.SES_FROM_EMAIL) {
    logger.warn('SES not configured, email not sent');
    return;
  }

  try {
    const command = new SendEmailCommand({
      Source: env.SES_FROM_EMAIL,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: html ? {
            Data: html,
            Charset: 'UTF-8',
          } : undefined,
          Text: text ? {
            Data: text,
            Charset: 'UTF-8',
          } : undefined,
        },
      },
    });

    const result = await sesClient.send(command);
    logger.info('Email sent successfully:', { to, subject, messageId: result.MessageId });
    return result;
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

export { s3Client, sesClient };