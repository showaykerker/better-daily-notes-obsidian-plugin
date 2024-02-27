import imageCompression from 'browser-image-compression';

export async function limitImageFileSize(file: File, size: number, preserveExifData: boolean): Promise<File> {
    if (size === -1) {
        return Promise.resolve(file);
    }
    const options = {
        maxSizeMB: size / 1024.0,
        useWebWorker: true,
        maxIteration: 10,
        preserveExifData: preserveExifData,
    };
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
}

// Note: You'll need to adjust the parameters and return types based on how you plan to use these functions outside the class.