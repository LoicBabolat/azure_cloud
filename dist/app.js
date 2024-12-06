"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const storage_blob_1 = require("@azure/storage-blob");
const node_path_1 = __importDefault(require("node:path"));
const fs = __importStar(require("node:fs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const accountName = "welearnblob";
const accountURL = `https://${accountName}.blob.core.windows.net`;
const blobServiceClient = new storage_blob_1.BlobServiceClient(accountURL, new storage_blob_1.StorageSharedKeyCredential("welearnblob", "76lKkWPULgyr2o6gVlrN4vVnihn90y41RTHlNQLJ5yEyni3NmxSia+iWtV8E4Zfkw6pdMjvdhCvd+ASt9j/pBg=="));
const containerName = "video";
const containerClient = blobServiceClient.getContainerClient(containerName);
const app = (0, express_1.default)();
let currentUser = null;
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(node_path_1.default.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', node_path_1.default.join(__dirname, 'views'));
app.get('/', (req, res) => {
    res.render('index');
});
app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/register', (req, res) => {
    res.render('register');
});
app.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    yield prisma.user.create({
        data: {
            name,
            email,
            password,
        },
    });
    res.redirect('/login');
}));
app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield prisma.user.findUnique({ where: { email } });
    if (user && user.password === password) {
        currentUser = user;
        res.redirect('/');
    }
    else {
        res.redirect('/login');
    }
}));
app.get('/logout', (req, res) => {
    currentUser = null;
    res.redirect('/login');
});
app.post('/add-video', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!currentUser) {
        return res.redirect('/login');
    }
    const uploadDir = node_path_1.default.join(__dirname, 'public', 'video');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }
    const fileName = req.headers['x-file-name'];
    const description = req.headers['x-file-description'];
    const thumbnailFileName = req.headers['x-file-thumbnail-name'];
    const userId = currentUser.id;
    if (!fileName || !description || !thumbnailFileName || !userId) {
        return res.status(400).send('All fields are required');
    }
    const filePath = node_path_1.default.join(uploadDir, fileName);
    const fileStream = fs.createWriteStream(filePath);
    req.pipe(fileStream);
    const thumbnailPath = node_path_1.default.join(uploadDir, thumbnailFileName);
    const thumbnailStream = fs.createWriteStream(thumbnailPath);
    req.pipe(thumbnailStream);
    req.on('end', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const blobClient = containerClient.getBlockBlobClient(fileName);
            const readStream = fs.createReadStream(filePath);
            yield blobClient.uploadStream(readStream);
            console.log('Video uploaded to Azure Blob Storage');
            const thumbnailBlobClient = containerClient.getBlockBlobClient(thumbnailFileName);
            const thumbnailReadStream = fs.createReadStream(thumbnailPath);
            yield thumbnailBlobClient.uploadStream(thumbnailReadStream);
            console.log('Thumbnail uploaded to Azure Blob Storage');
            yield prisma.video.create({
                data: {
                    fileName,
                    description,
                    thumbnail: thumbnailFileName,
                    userId: userId,
                },
            });
            res.status(200).send('File uploaded successfully');
        }
        catch (error) {
            console.error('Error uploading files:', error);
            res.status(500).send('Error uploading files');
        }
    }));
    req.on('error', (err) => {
        console.error('Error uploading file:', err);
        res.status(500).send('Error uploading file');
    });
}));
app.get('/add-video', (req, res) => {
    if (!currentUser) {
        return res.redirect('/login');
    }
    res.render('add-video');
});
app.get('/video-list', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!currentUser) {
        return res.redirect('/login');
    }
    const videos = yield prisma.video.findMany();
    res.render('video-list', { videos });
}));
app.post('/add-video', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!currentUser) {
        return res.redirect('/login');
    }
    const { fileName, description, thumbnail } = req.body;
    yield prisma.video.create({
        data: {
            fileName,
            description,
            thumbnail,
            userId: currentUser.id,
        },
    });
    res.redirect('/video-list');
}));
app.get('/video/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const videoId = parseInt(req.params.id);
    const video = yield prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
        return res.status(404).send('Video not found');
    }
    res.render('video', { video });
}));
app.get('/video/:id/stream', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const videoId = parseInt(req.params.id);
    const video = yield prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
        return res.status(404).send('Video not found');
    }
    try {
        const blobClient = containerClient.getBlockBlobClient(video.fileName);
        const downloadBlobBlockResponse = yield blobClient.download(0);
        const blobStream = downloadBlobBlockResponse.readableStreamBody;
        res.setHeader('Content-Type', downloadBlobBlockResponse.contentType);
        res.setHeader('Content-Length', downloadBlobBlockResponse.contentLength);
        blobStream === null || blobStream === void 0 ? void 0 : blobStream.pipe(res);
        blobStream === null || blobStream === void 0 ? void 0 : blobStream.on('error', (err) => {
            console.error('Error streaming blob:', err);
            res.status(500).send('Error streaming blob');
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).send('Error streaming file');
    }
}));
app.listen(process.env.PORT || 3007, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`);
});
