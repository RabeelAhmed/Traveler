import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { FiUpload, FiX, FiCheck, FiMapPin, FiLoader, FiAlertCircle } from "react-icons/fi";
import axios from "axios";
import { axiosClient } from "../utils/axiosClient";
import { toast } from "react-hot-toast";
import { addedStory } from "../Toolkit/slices/storySlice";
import Header from "./Header";
import PageTransition from "./PageTransition";
import { springPress, scaleIn, fadeUp } from "../utils/motion";

const UploadStory = () => {
  const navigate = useNavigate();
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const dispatch = useDispatch();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [location, setLocation] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/webm",
    ];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Please select an image (JPEG, PNG, GIF) or video (MP4, WebM) file.");
      return;
    }

    // Validate file size (20MB max)
    if (selectedFile.size > 20 * 1024 * 1024) {
      toast.error("File size too large. Maximum 20MB allowed.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: long } = position.coords;
          resolve({ lat, long });
        },
        (error) => {
          reject(error);
        },
        { timeout: 10000 }
      );
    });
  };

  const uploadFile = async () => {
    if (!file || !title.trim()) {
      toast.error("Please select a file and enter a title.");
      return;
    }

    try {
      setIsUploading(true);
      setProgress(0);
      setLocationError(false);

      // Step 1: Get Cloudinary signature
      const { data } = await axiosClient.get("/story/generate-signature");
      const { apiKey, timestamp, signature, cloudName } = data.data;

      let uploadedUrl = "";
      let publicId = "";

      if (cloudName === "dummy" || !cloudName) {
        setProgress(25);
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
        });
        setProgress(50);
        uploadedUrl = base64Data;
        publicId = "dummy_story_" + Date.now();
      } else {
        // Step 2: Upload to Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);
        formData.append("folder", "Story_Media");

        const cloudinaryRes = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
          formData,
          {
            onUploadProgress: (e) => {
              const percent = Math.round((e.loaded / e.total) * 50);
              setProgress(percent);
            },
            timeout: 120000,
          }
        );

        uploadedUrl = cloudinaryRes.data.secure_url;
        publicId = cloudinaryRes.data.public_id;
      }

      // Step 3: Get user location
      try {
        const { lat, long } = await getLocation();
        setLocation({ lat, long });

        // Step 4: Post story to backend
        const process = await axiosClient.post(
          "/story/addstory",
          { title, url: uploadedUrl, publicId, lat, long },
          {
            onUploadProgress: (e) => {
              const percent = 50 + Math.round((e.loaded / e.total) * 50);
              setProgress(percent);
            },
          }
        );
        dispatch(addedStory(process?.data?.data?.story));
        toast.success(`${process?.data?.message}`);

        setProgress(100);
        setTimeout(() => navigate("/story", { replace: true }), 1500);
      } catch (err) {
        console.error("Location error:", err);
        setLocationError(true);
        toast.error("Location permission is required to upload a story.");
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to upload story. Please try again.";
      toast.error(errorMessage);
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const selectedFile = e.dataTransfer.files[0];
    if (selectedFile) {
      // Create a mock event for handleFileChange validation
      handleFileChange({ target: { files: [selectedFile] } });
    }
  };

  return (
    <PageTransition>
      <div className="bg-sand-50 min-h-screen pb-24 pt-20">
        
        {/* settings Header */}
        <Header
          title="Add a Story"
          subtitle="Upload a visual highlight and pin it to your current location."
        />

        <div className="max-w-lg mx-auto px-4 sm:px-6 mt-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-3xl border border-sand-100/80 shadow-[0_8px_30px_rgb(20,41,57,0.02)] p-6 md:p-8 flex flex-col gap-6 text-left"
          >
            
            {/* Empty Drop-Zone / Selection previews */}
            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div
                  key="dropzone"
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-colors duration-300 cursor-pointer select-none ${
                    isDragOver
                      ? "border-sunset-400 bg-sunset-500/5 text-sunset-600"
                      : "border-sand-300 hover:border-sunset-400 bg-sand-50/30 text-sand-500"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <motion.div
                    animate={{ scale: isDragOver ? 1.15 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <FiUpload className={`text-4xl transition-colors ${isDragOver ? "text-sunset-500" : "text-sand-400"}`} />
                  </motion.div>
                  <span className="font-display font-semibold text-sm text-sand-800">
                    Drag and drop file here
                  </span>
                  <span className="font-sans text-xs text-sand-400 leading-relaxed max-w-xs">
                    Or click to browse images or videos (JPEG, PNG, GIF, MP4, WebM up to 20MB)
                  </span>

                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                    accept="image/jpeg, image/png, image/gif, video/mp4, video/webm"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="w-full relative rounded-2xl overflow-hidden shadow-inner bg-sand-100 group aspect-[4/3] flex items-center justify-center"
                >
                  {file.type.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt="Story Upload Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      controls
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Remove Button overlay */}
                  <motion.button
                    {...springPress}
                    onClick={handleRemoveFile}
                    className="absolute top-3 right-3 bg-white hover:bg-red-50 text-red-500 p-2 rounded-full shadow-md transition-colors z-20"
                    title="Remove file"
                  >
                    <FiX className="text-base" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title Input field */}
            <div className="flex flex-col gap-1.5 w-full text-left">
              <input
                id="story-title"
                type="text"
                placeholder="What's your story about?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="peer order-2 w-full px-4 py-3 bg-sand-50/50 border border-sand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:bg-white transition-all text-xs md:text-sm text-sand-800"
                maxLength={100}
              />
              <div className="order-1 flex justify-between items-center w-full">
                <label
                  htmlFor="story-title"
                  className="text-xs font-bold text-sand-400 peer-focus:text-ocean-600 uppercase tracking-wider transition-colors"
                >
                  Story Title
                </label>
                <span
                  className={`text-[10px] font-sans font-bold transition-colors ${
                    title.length > 90 ? "text-sunset-500" : "text-sand-400"
                  }`}
                >
                  {title.length}/100
                </span>
              </div>
            </div>

            {/* Location Status info */}
            <div className="flex items-center text-xs font-semibold py-2 border-t border-b border-sand-100">
              <FiMapPin className="mr-2 text-base text-sand-400" />
              {location ? (
                <motion.span
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  className="text-jade-600 flex items-center gap-1"
                >
                  <FiCheck className="text-jade-600 animate-bounce" />
                  <span>Location added successfully</span>
                </motion.span>
              ) : locationError ? (
                <span className="text-sunset-600 flex items-center gap-1">
                  <FiAlertCircle className="text-base" />
                  <span>Location permission error</span>
                </span>
              ) : (
                <span className="text-sand-400 flex items-center gap-1.5">
                  <FiLoader className="animate-spin text-sm" />
                  <span>Location will be attached automatically</span>
                </span>
              )}
            </div>

            {/* Upload submit button */}
            <motion.button
              {...springPress}
              onClick={uploadFile}
              disabled={isUploading || !file || !title.trim()}
              className={`w-full py-3 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${
                isUploading || !file || !title.trim()
                  ? "bg-sand-200 text-sand-400 cursor-not-allowed"
                  : "bg-ocean-600 hover:bg-ocean-700 text-white"
              }`}
            >
              Upload Story
            </motion.button>

          </motion.div>
        </div>
      </div>

      {/* Circular Upload Progress Overlay takeover */}
      <AnimatePresence>
        {isUploading && (
          <div className="fixed inset-0 bg-ocean-950/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-[0_8px_30px_rgb(20,41,57,0.12)] border border-sand-100 flex flex-col items-center text-center gap-4"
            >
              <h3 className="font-display font-semibold text-xs text-sand-400 uppercase tracking-widest">
                {progress === 100 ? "Upload Complete!" : "Uploading Story..."}
              </h3>

              {/* Progress Ring */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="#F4F2EE"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="36"
                    stroke="#2EBD85" // jade-500
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray="226.2"
                    animate={{ strokeDashoffset: 226.2 - (progress / 100) * 226.2 }}
                    transition={{ duration: 0.15 }}
                  />
                </svg>

                {/* thumbnail preview */}
                <div className="w-16 h-16 rounded-full overflow-hidden bg-sand-100 z-10 flex items-center justify-center border border-sand-200 shadow-inner">
                  {progress === 100 ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ duration: 0.4 }}
                    >
                      <FiCheck className="text-3xl text-jade-600" />
                    </motion.div>
                  ) : previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Thumbnail Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUpload className="text-lg text-sand-400" />
                  )}
                </div>
              </div>

              <span className="font-display font-bold text-2xl text-sand-900 leading-tight">
                {progress}%
              </span>

              <span className="font-sans text-xs text-sand-400 leading-relaxed max-w-[200px]">
                {progress === 100
                  ? "Finalizing upload credentials and tags..."
                  : "Sending media file and location data to server..."}
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default UploadStory;
