const multer  = require('multer')


const storage = multer.memoryStorage()

const upload = multer({ storage: storage ,
    fileFilter: (req, file, done) => {
      try { require('../Utils/cloudinaryConfig').validateFile(file); done(null, true); } catch (err) { done(err); }
    },
    limits: { fields: 30, parts: 40,
        // limits file size to 110 MB (to support up to 100MB videos)
        fileSize: 1024 * 1024 * 110
    }
});
const singleUpload = upload.single('profilePicture'); // For single file uploads
const multipleUpload = upload.array('media[]', 5);   // For multiple file uploads (max 10)
const storyUpload = upload.single('story')
// Export the upload middleware
const profileUpload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 20 }, fileFilter: (req, file, done) => {
  try { if (require('../Utils/cloudinaryConfig').validateFile(file) !== 'image') throw new Error('Profile pictures must be images'); done(null, true); } catch (err) { done(err); }
} });
module.exports = { profileUpload, upload, singleUpload, multipleUpload, storyUpload };
