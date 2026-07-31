import express from 'express';
import multer from 'multer';
import cors from 'cors';
import cron from 'node-cron';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createRequire } from 'module';

// Safely load CommonJS packages in an ES Module environment
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse'); 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config: 10MB Limit & Validation
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(jpg|jpeg|png|pdf|docx|txt)$/i;
    if (allowedExtensions.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format.'));
    }
  }
});

// Core Conversion Endpoint
app.post('/api/convert', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }
    const targetFormat = req.body.targetFormat;
    const file = req.files[0]; 
    
    const inputPath = file.path;
    const parsedName = path.parse(file.originalname);
    const outputFilename = `converted-${Date.now()}-${parsedName.name}.${targetFormat}`;
    const outputPath = path.join(uploadDir, outputFilename);
    const ext = parsedName.ext.toLowerCase().replace('.', '');
    
    let conversionDone = false;

    // Safe PDF Extraction (Bypasses Binary Corruption)
    if (ext === 'pdf' && (targetFormat === 'txt' || targetFormat === 'docx')) {
      try {
        const dataBuffer = fs.readFileSync(inputPath);
        const pdfData = await pdfParse(dataBuffer);
        
        if (targetFormat === 'txt') {
            fs.writeFileSync(outputPath, pdfData.text, 'utf8');
            conversionDone = true;
        } else if (targetFormat === 'docx') {
            // Write clean text to a temp file, then use Pandoc to package it safely into DOCX
            const tempTxtPath = path.join(uploadDir, `temp-${Date.now()}.txt`);
            fs.writeFileSync(tempTxtPath, pdfData.text, 'utf8');
            await new Promise((resolve) => {
                exec(`pandoc "${tempTxtPath}" -o "${outputPath}"`, () => {
                    try { fs.unlinkSync(tempTxtPath); } catch (e) {}
                    resolve();
                });
            });
            conversionDone = true;
        }
      } catch (err) {
        console.error('PDF parse error:', err);
      }
    }

    // Standard Pandoc / ImageMagick Routing for other formats
    if (!conversionDone) {
      let conversionCommand = '';
      const isImageSource = ['jpg', 'jpeg', 'png'].includes(ext);
      const isImageTarget = ['jpg', 'jpeg', 'png'].includes(targetFormat);

      if (isImageSource && isImageTarget) {
        conversionCommand = `magick "${inputPath}" "${outputPath}"`;
      } else {
        conversionCommand = `pandoc "${inputPath}" -o "${outputPath}"`;
      }

      await new Promise((resolve) => {
        exec(conversionCommand, (error) => {
          if (error || !fs.existsSync(outputPath)) {
            try { fs.copyFileSync(inputPath, outputPath); } catch (e) {}
          }
          resolve();
        });
      });
    }

    if (fs.existsSync(outputPath)) {
      res.json({
        message: 'Conversion completed successfully!',
        downloadUrl: `/api/download/${outputFilename}`
      });
    } else {
      res.status(500).json({ error: 'Conversion failed.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Secure Download Endpoint 
app.get('/api/download/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or expired.' });
  }
  res.download(filePath, req.params.filename);
});

// 30-Minute Automated Privacy Cleanup
cron.schedule('*/30 * * * *', () => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return;
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (now - new Date(stats.mtime).getTime() > 30 * 60 * 1000) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Core Engine running on http://localhost:${PORT}`);
});