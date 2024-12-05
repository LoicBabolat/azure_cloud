import {BlobClient, BlockBlobClient, ContainerClient} from "@azure/storage-blob";
import * as fs from "node:fs";

/**
 * dowload a file from blob, with optionnal local name
 * @param containerClient
 * @param blobName
 * @param localFilePath local path to save the file without the ending /
 * @param localFileName
 */
export async function downloadBlob(containerClient: ContainerClient, blobName: string,  localFilePath: string, localFileName?: string) {
    let blobClient: BlobClient = containerClient.getBlobClient(blobName)

    if(localFilePath === undefined) {
        localFileName = BlobClient.name
    }

    await blobClient.downloadToFile(localFilePath + "/" + localFileName)
}

/**
 * Download a blob as a stream
 * @param containerClient
 * @param blobName
 * @param writableStream
 */
export async function downloadBlobAsStream(
    containerClient: ContainerClient,
    blobName: string,
    writableStream: fs.WriteStream
) {

    const blobClient: BlobClient = containerClient.getBlobClient(blobName);

    const downloadResponse = await blobClient.download();

    if (!downloadResponse.errorCode && downloadResponse?.readableStreamBody) {
        downloadResponse.readableStreamBody.pipe(writableStream);
    }
}

/**
 * Upload a file to blob from a read stream
 * @param containerClient
 * @param blobName
 * @param readStream
 */
export async function uploadBlobFromReadStream(
    containerClient: ContainerClient,
    blobName: string,
    readStream: fs.ReadStream
): Promise<void> {

    // Create blob client from container client
    const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadStream(readStream);
}