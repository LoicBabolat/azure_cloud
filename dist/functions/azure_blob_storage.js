"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadBlob = downloadBlob;
exports.downloadBlobAsStream = downloadBlobAsStream;
exports.uploadBlobFromReadStream = uploadBlobFromReadStream;
const storage_blob_1 = require("@azure/storage-blob");
function downloadBlob(containerClient, blobName, localFilePath, localFileName) {
    return __awaiter(this, void 0, void 0, function* () {
        let blobClient = containerClient.getBlobClient(blobName);
        if (localFilePath === undefined) {
            localFileName = storage_blob_1.BlobClient.name;
        }
        yield blobClient.downloadToFile(localFilePath + "/" + localFileName);
    });
}
function downloadBlobAsStream(containerClient, blobName, writableStream) {
    return __awaiter(this, void 0, void 0, function* () {
        const blobClient = containerClient.getBlobClient(blobName);
        const downloadResponse = yield blobClient.download();
        if (!downloadResponse.errorCode && (downloadResponse === null || downloadResponse === void 0 ? void 0 : downloadResponse.readableStreamBody)) {
            downloadResponse.readableStreamBody.pipe(writableStream);
        }
    });
}
function uploadBlobFromReadStream(containerClient, blobName, readStream) {
    return __awaiter(this, void 0, void 0, function* () {
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        yield blockBlobClient.uploadStream(readStream);
    });
}
