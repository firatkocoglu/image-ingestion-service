import 'dotenv/config';

type EnvConfig = {
    unsplashAccessKey: string;
    unsplashQuerySize: number;
    cloudinaryCloudName: string;
    cloudinaryApiKey: string;
    cloudinaryApiSecret: string;
    cloudinaryUploadFolder: string;
    laravelApiBaseUrl: string;
    laravelApiToken: string;
    retryAttempts: number;
    retryBackoffMs: number;
    productInputJsonPath: string;
};

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function parseNumberEnv(name: string, defaultValue: number): number {
    const raw = process.env[name];
    if (!raw) return defaultValue;
    const parsed= Number(raw);
    if (Number.isNaN(parsed)) {
        throw new Error(`Invalid number for environment variable: ${name}`);
    }
    return parsed;
}

export const env: EnvConfig = {
    unsplashAccessKey: requireEnv('UNSPLASH_ACCESS_KEY'),
    unsplashQuerySize: parseNumberEnv('UNSPLASH_QUERY_SIZE', 4),
    cloudinaryCloudName: requireEnv('CLOUDINARY_CLOUD_NAME'),
    cloudinaryApiKey: requireEnv('CLOUDINARY_API_KEY'),
    cloudinaryApiSecret: requireEnv('CLOUDINARY_API_SECRET'),
    cloudinaryUploadFolder: requireEnv('CLOUDINARY_UPLOAD_FOLDER'),
    laravelApiBaseUrl: requireEnv('LARAVEL_API_BASE_URL'),
    laravelApiToken: requireEnv('LARAVEL_API_TOKEN'),
    retryAttempts: parseNumberEnv('RETRY_ATTEMPTS', 3),
    retryBackoffMs: parseNumberEnv('RETRY_BACKOFF_MS', 500),
    productInputJsonPath: requireEnv('PRODUCT_INPUT_JSON_PATH') || "./products.json",
};
