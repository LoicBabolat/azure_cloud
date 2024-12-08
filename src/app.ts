import express, { Request, Response } from "express";
import { BlobServiceClient, StorageSharedKeyCredential, ContainerClient } from "@azure/storage-blob";
import path from 'node:path';
import * as fs from "node:fs";
import { PrismaClient, User } from '@prisma/client';
const prisma = new PrismaClient();
import { Readable } from 'stream';

const accountName = "welearnblob";
const accountURL = `https://${accountName}.blob.core.windows.net`;
const blobServiceClient = new BlobServiceClient(
    accountURL,
    new StorageSharedKeyCredential("welearnblob", "76lKkWPULgyr2o6gVlrN4vVnihn90y41RTHlNQLJ5yEyni3NmxSia+iWtV8E4Zfkw6pdMjvdhCvd+ASt9j/pBg==")
);

const containerName = "video";
const containerClient = blobServiceClient.getContainerClient(containerName);

const app = express();

// Middleware pour gérer les sessions (sans sécurité)
let currentUser: User | null = null;

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Ajoutez cette ligne pour parser les requêtes JSON

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route pour la page d'accueil
app.get('/', (req, res) => {
    res.render('index');
});

// Route pour la page de connexion
app.get('/login', (req, res) => {
    res.render('login');
});

// Route pour la page d'inscription
app.get('/register', (req, res) => {
    res.render('register');
});

// Route pour gérer l'inscription
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    await prisma.user.create({
        data: {
            name,
            email,
            password,
        },
    });
    res.redirect('/login');
});

// Route pour gérer la connexion
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.password === password) {
        currentUser = user;
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

// Route pour la déconnexion
app.get('/logout', (req, res) => {
    currentUser = null;
    res.redirect('/login');
});

// Route pour la page d'ajout de vidéo
app.get('/add-video', (req, res) => {
    if (!currentUser) {
        return res.redirect('/login');
    }
    res.render('add-video');
});

// Route pour gérer l'ajout de vidéo
app.post('/add-video', async (req: Request, res: Response): Promise<any> => {
    if (!currentUser) {
        return res.redirect('/login');
    }

    const uploadDir = path.join(__dirname, 'public', 'video');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    const fileName = req.headers['x-file-name'] as string;
    const description = req.headers['x-file-description'] as string;
    const thumbnailFileName = req.headers['x-file-thumbnail-name'] as string;
    const userId = currentUser.id;

    if (!fileName || !description || !thumbnailFileName || !userId) {
        return res.status(400).send('All fields are required');
    }
    console.log(fileName, description, thumbnailFileName, userId);

    const filePath = path.join(uploadDir, fileName);
    const fileStream = fs.createWriteStream(filePath);

    req.pipe(fileStream);

    req.on('end', async () => {
        try {
            const blobClient = containerClient.getBlockBlobClient(fileName);
            const readStream = fs.createReadStream(filePath);
            await blobClient.uploadStream(readStream);
            console.log('Video uploaded to Azure Blob Storage');

            const thumbnailBlobClient = containerClient.getBlockBlobClient(thumbnailFileName);
            const thumbnailReadStream = fs.createReadStream(path.join(uploadDir, thumbnailFileName));
            await thumbnailBlobClient.uploadStream(thumbnailReadStream);
            console.log('Thumbnail uploaded to Azure Blob Storage');

            await prisma.video.create({
                data: {
                    fileName,
                    description,
                    thumbnail: thumbnailFileName,
                    userId: userId,
                },
            });

            res.status(200).send('File uploaded successfully');
        } catch (error) {
            console.error('Error uploading files:', error);
            res.status(500).send('Error uploading files');
        }
    });

    req.on('error', (err) => {
        console.error('Error uploading file:', err);
        res.status(500).send('Error uploading file');
    });
});

// Route pour la page de liste des vidéos
app.get('/video-list', async (req, res) => {
    if (!currentUser) {
        return res.redirect('/login');
    }
    const videos = await prisma.video.findMany();
    res.render('video-list', { videos });
});

// Route pour afficher une vidéo unique avec streaming
app.get('/video/:id', async (req: Request, res: Response): Promise<any> => {
    if (!currentUser) {
        return res.redirect('/login');
    }
    const videoId = parseInt(req.params.id);
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
        return res.status(404).send('Video not found');
    }
    // Render the video page
    res.render('video', { video });
});

// Route pour streamer une vidéo
app.get('/video/:id/stream', async (req: Request, res: Response): Promise<any> => {
    const videoId = parseInt(req.params.id);
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
        return res.status(404).send('Video not found');
    }
    try {
        const blobClient = containerClient.getBlockBlobClient(video.fileName);
        const downloadBlobBlockResponse = await blobClient.download(0);
        const blobStream = downloadBlobBlockResponse.readableStreamBody;

        res.setHeader('Content-Type', downloadBlobBlockResponse.contentType as string);
        res.setHeader('Content-Length', downloadBlobBlockResponse.contentLength as number);

        blobStream?.pipe(res);

        blobStream?.on('error', (err) => {
            console.error('Error streaming blob:', err);
            res.status(500).send('Error streaming blob');
        });
    } catch (e) {
        console.error(e);
        res.status(500).send('Error streaming file');
    }
});

// Route pour récupérer une image
app.get('/video/:id/img', async (req: Request, res: Response): Promise<any> => {
    const videoId = parseInt(req.params.id);
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
        return res.status(404).send('Image not found');
    }
    try {
        const blobClient = containerClient.getBlockBlobClient(video.thumbnail);
        const downloadBlobBlockResponse = await blobClient.download(0);
        const blobStream = downloadBlobBlockResponse.readableStreamBody;

        res.setHeader('Content-Type', downloadBlobBlockResponse.contentType as string);
        res.setHeader('Content-Length', downloadBlobBlockResponse.contentLength as number);

        blobStream?.pipe(res);

        blobStream?.on('error', (err) => {
            console.error('Error streaming blob:', err);
            res.status(500).send('Error streaming blob');
        });
    } catch (e) {
        console.error(e);
        res.status(500).send('Error streaming file');
    }
});

app.get("/indexBis", async (req: Request, res: Response) => {
    res.render('indexBis');
})

// Endpoint pour recevoir le fichier et le télécharger dans Azure Blob Storage
// Endpoint pour recevoir le fichier et le télécharger dans Azure Blob Storage
app.post('/upload', async (req: Request, res: Response): Promise<any> => {
    const uploadDir = path.join(__dirname, 'public', 'video');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }
    const fileName = req.headers['x-file-name'] as string;
    const filePath = path.join(uploadDir, fileName);
    const fileStream = fs.createWriteStream(filePath);
    if (!fileName) {
        return res.status(400).send('All fields are required');
    }

    req.pipe(fileStream);

    req.on('end', async () => {
        try {
            const blobClient = containerClient.getBlockBlobClient(fileName);
            const readStream = fs.createReadStream(filePath);
            await blobClient.uploadStream(readStream);
            console.log('File uploaded to Azure Blob Storage');

            res.status(200).json({ fileName });
        } catch (error) {
            console.error('Error2 uploading file:', error);
            res.status(500).send('Error2 uploading file');
        }
    });

    req.on('error', (err) => {
        console.error('Error1 uploading file:', err);
        res.status(500).send('Error1 uploading file');
    });
});

// Nouvelle route pour ajouter les données à la base de données
app.post('/add-video-data', async (req: Request, res: Response): Promise<any> => {
    if (!currentUser) {
        return res.redirect('/login');
    }
    const { fileName, thumbnailFileName, description } = req.body;

    if (!fileName || !thumbnailFileName || !description) {
        return res.status(400).send('All fields are required');
    }

    try {
        await prisma.video.create({
            data: {
                fileName,
                description,
                thumbnail: thumbnailFileName,
                userId: currentUser.id,
            },
        });

        res.status(200).redirect('/');
    } catch (error) {
        console.error('Error adding video data to the database:', error);
        res.status(500).send('Error adding video data to the database');
    }
});

// Endpoint pour lire le fichier depuis Azure Blob Storage
app.get('/stream-old', async (req: Request, res: Response): Promise<any> => {
    try {
        const fileName = req.query.file as string;
        if (!fileName) {
            return res.status(400).send('File name is required');
        }

        const blobClient = containerClient.getBlockBlobClient(fileName);
        const downloadBlobBlockResponse = await blobClient.download(0);
        const blobStream = downloadBlobBlockResponse.readableStreamBody;

        res.setHeader('Content-Type', downloadBlobBlockResponse.contentType as string);
        res.setHeader('Content-Length', downloadBlobBlockResponse.contentLength as number);

        blobStream?.pipe(res);

        blobStream?.on('error', (err) => {
            console.error('Error downloading blob:', err);
            res.status(500).send('Error downloading blob');
        });
    } catch (e) {
        console.error(e);
        res.status(500).send('Error downloading file');
    }
});

app.listen(process.env.PORT || 3007, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`);
});
