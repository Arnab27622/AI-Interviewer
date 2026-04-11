import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname) || '.webm';
        const sessionId = req.params.sessionId || 'unknown';
        const filename = `${sessionId}-${Date.now()}${ext}`;
        cb(null, filename);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "audio/webm", 
        "audio/wav", 
        "audio/mp3", 
        "audio/mpeg", 
        "audio/ogg", 
        "audio/mp4"
    ];
    
    // Some browsers append codecs to the mimetype, e.g., 'audio/webm;codecs=opus'
    const baseMimeType = file.mimetype.split(';')[0].trim();

    if (allowedMimeTypes.includes(baseMimeType)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only standardized audio formats are allowed."), false);
    }
}

const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 1024 * 1024 * 10 } });

const uploadSingleAudio = upload.single("audio")

export { uploadSingleAudio };