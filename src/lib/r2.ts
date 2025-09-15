import { S3Client, GetObjectCommand, PutObjectCommand, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Validação das variáveis de ambiente
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  throw new Error('Variáveis de ambiente do R2 não configuradas. Verifique: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME');
}

// Cliente S3 configurado para Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Configura CORS no bucket R2
 * Execute esta função uma vez para configurar o bucket
 */
export async function configureCors() {
  try {
    console.log('Configurando CORS para o bucket:', R2_BUCKET_NAME);
    
    const corsCommand = new PutBucketCorsCommand({
      Bucket: R2_BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
            AllowedOrigins: ["*"], // Em produção, especifique seus domínios
            ExposeHeaders: ["ETag", "x-amz-meta-custom-header"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    });
    
    await s3Client.send(corsCommand);
    console.log('CORS configurado com sucesso');
  } catch (error) {
    console.error('Erro ao configurar CORS:', error);
    throw new Error(`Falha ao configurar CORS: ${error}`);
  }
}

/**
 * Gera URL assinada para upload (PUT)
 */
export async function getSignedPutUrl(key: string, contentType: string) {
  try {
    console.log('Gerando URL PUT assinada para:', { 
      key, 
      contentType, 
      bucket: R2_BUCKET_NAME 
    });
    
    // Limpa a key removendo barras duplas ou caracteres inválidos
    const cleanKey = key.replace(/\/+/g, '/').replace(/^\//, '');
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: cleanKey,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hora
    });

    console.log('URL PUT gerada com sucesso para key:', cleanKey);
    return signedUrl;
  } catch (error) {
    console.error('Erro ao gerar URL PUT assinada:', error);
    throw new Error(`Falha ao gerar URL de upload: ${error}`);
  }
}

/**
 * Gera URL assinada para download (GET)
 */
export async function getSignedGetUrl(key: string) {
  try {
    console.log('Gerando URL GET assinada para:', { 
      key, 
      bucket: R2_BUCKET_NAME 
    });
    
    // Limpa a key removendo barras duplas ou caracteres inválidos
    const cleanKey = key.replace(/\/+/g, '/').replace(/^\//, '');
    
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: cleanKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hora
    });

    console.log('URL GET gerada com sucesso para key:', cleanKey);
    return signedUrl;
  } catch (error) {
    console.error('Erro ao gerar URL GET assinada:', error);
    throw new Error(`Falha ao gerar URL de download: ${error}`);
  }
}
