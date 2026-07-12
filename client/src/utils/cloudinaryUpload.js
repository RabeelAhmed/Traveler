import { axiosClient } from "./axiosClient";
import imageCompression from "browser-image-compression";

export const uploadImagesToCloudinary = async (files) => {
  const formData = new FormData();

  for (const file of files) {
    let fileToUpload = file;
    // Compress only images, leave videos as-is
    if (file.type.startsWith("image/")) {
      try {
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 1, // max 1 MB
          maxWidthOrHeight: undefined,
          useWebWorker: true,
          initialQuality: 0.85,
        });
      } catch (err) {
        console.error("Image compression failed, uploading original:", err);
      }
    }
    formData.append("files", fileToUpload);
  }

  const response = await axiosClient.post("/post/upload-media", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.result.media;
};

export const uploadProfilePictureToCloudinary = async (file) => {
  let fileToUpload = file;
  if (file.type.startsWith("image/")) {
    try {
      fileToUpload = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        initialQuality: 0.85,
      });
    } catch (err) {
      console.error("Image compression failed, uploading original:", err);
    }
  }

  const formData = new FormData();
  formData.append("file", fileToUpload);

  const response = await axiosClient.post("/auth/upload-profile-pic", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data; // contains secure_url, public_id
};
