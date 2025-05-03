const multer = require('multer');
const sharp = require('sharp');
const path = require("path");
const fs = require('fs');
const { compare } = require('image-ssim');
require('dotenv').config();

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

exports.upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const isAllowed = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
        cb(isAllowed ? null : new Error('Only JPG, PNG, WebP formats are allowed'), isAllowed);
    }
});






// Compression Controller
exports.compressor = async (req, res) => {
    try {
        let { quality, width, height, isThumbnail, preferWebP, compressionPercent } = req.body;
        quality = parseInt(quality) || 80;
        width = width ? parseInt(width) : null;
        height = height ? parseInt(height) : null;
        compressionPercent = parseInt(compressionPercent) || 70;

        const inputPath = req.file.path;
        const originalBuffer = fs.readFileSync(inputPath);
        const originalSizeKB = originalBuffer.length / 1024;

        // Target Size Logic (Rule-Based)
        const targetSizeKB = Math.min(
            originalSizeKB * (compressionPercent / 100),
            isThumbnail === 'true' ? 100 : 300
        );

        let ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
        if (preferWebP === 'true') ext = 'webp';

        const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname));
        const outputPath = path.join(__dirname, process.env.COMPRESS_FILE_UPLOAD_PATH, `${baseName}.${ext}`);

        let currentQuality = quality;
        let compressedBuffer = await compressBuffer(originalBuffer, ext, currentQuality, width, height);

        // Compress to meet both: rule percentage + file size cap
        while ((compressedBuffer.length / 1024) > targetSizeKB && currentQuality > 50) {
            const ssimResult = await compare(originalBuffer, compressedBuffer);
            if (ssimResult.ssim < 0.95) {
                console.log(`SSIM too low (${ssimResult.ssim.toFixed(2)}), stopping compression`);
                break;
            }
            currentQuality -= 5;
            compressedBuffer = await compressBuffer(originalBuffer, ext, currentQuality, width, height);
        }

        await sharp(compressedBuffer).toFile(outputPath);
        res.download(outputPath);

    } catch (err) {
        console.error('Compression error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// Compression Helper
async function compressBuffer(inputBuffer, format, quality, width, height) {
    let instance = sharp(inputBuffer);
    if (width && height) {
        instance = instance.resize(width, height);
    }

    switch (format) {
        case 'jpeg':
        case 'jpg':
            return instance.jpeg({
                quality: quality,
                chromaSubsampling: '4:2:0'
            }).toBuffer();

        case 'png':
            return instance.png({
                compressionLevel: 9,
                adaptiveFiltering: true
            }).toBuffer();

        case 'webp':
            return instance.webp({ quality }).toBuffer();

        default:
            throw new Error('Unsupported format. Use jpg, png, or webp');
    }
}
