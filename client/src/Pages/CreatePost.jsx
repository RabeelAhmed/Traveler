import React, { useState, useEffect } from "react";
import { CiLocationOn, CiCircleInfo } from "react-icons/ci";
import { FiUpload, FiX, FiCheck } from "react-icons/fi";
import { FaArrowLeft } from "react-icons/fa";
import ReactStars from "react-rating-stars-component";
import { useSelector } from "react-redux";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { axiosClient } from "../utils/axiosClient";
import { useNavigate, useLocation } from "react-router";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { Tooltip } from "react-tooltip";
import { uploadImagesToCloudinary } from "../utils/cloudinaryUpload";
import Header from "../Components/Header";
import PageTransition from "../Components/PageTransition";
import JourneyComposerToggle from "../Components/JourneyComposerToggle";
import { springPress, scaleIn, fadeUp } from "../utils/motion";

const slideVariants = {
  enter: (dir) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: "spring", stiffness: 280, damping: 28 },
      opacity: { duration: 0.2 },
    },
  },
  exit: (dir) => ({
    x: dir < 0 ? "100%" : "-100%",
    opacity: 0,
    transition: {
      x: { type: "spring", stiffness: 280, damping: 28 },
      opacity: { duration: 0.2 },
    },
  }),
};

const CreatePost = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const myProfile = useSelector((state) => state.appConfig.myProfile);

  const [step, setStep] = useState(0); // 0 = Pick Photos, 1 = Details, 2 = Review
  const [direction, setDirection] = useState(1);
  const [postType, setPostType] = useState("post");

  const [loc, setLoc] = useState("Sialkot, Pakistan");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedImages, setSelectedImages] = useState([]); // Array of { file, id, preview }
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [rating, setRating] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      selectedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [selectedImages]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 5) {
      setErrorMsg("You can only upload a maximum of 5 images.");
    } else {
      setErrorMsg("");
      const newImages = files.map((file) => ({
        file,
        id: `${file.name}-${file.size}-${Math.random()}`,
        preview: URL.createObjectURL(file),
      }));
      setSelectedImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeImage = (idToRemove) => {
    setSelectedImages((prev) => {
      const target = prev.find((img) => img.id === idToRemove);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((img) => img.id !== idToRemove);
    });
  };

  const handleNext = () => {
    if (step === 0 && selectedImages.length === 0) {
      toast.error("Please add at least one image.");
      return;
    }
    if (step === 1 && (!title.trim() || !desc.trim())) {
      toast.error("Please enter a title and description.");
      return;
    }

    setDirection(1);
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  const ratingChanged = (newRating) => {
    setRating(newRating);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const filesArray = selectedImages.map((img) => img.file);
      const uploadedMedia = await uploadImagesToCloudinary(filesArray);

      const payload = {
        title,
        description: desc,
        location: loc,
        rating,
        hashtags: JSON.stringify(hashtags),
        media: JSON.stringify(uploadedMedia),
      };

      const isJourney = postType === "journey";
      const endpoint = isJourney ? "/journey/start" : "/post/createpost";
      const response = await axiosClient.post(endpoint, payload);

      if (response.data.status === "ok" || response.data.statusCode === 201) {
        toast.success(isJourney ? "Journey started successfully!" : "Post uploaded successfully!");

        if (!isJourney && response.data.result.achivement) {
          Swal.fire({
            title: "🎉 Congratulations! You've earned the First Step badge!",
            text: "You Have Created Your First Post",
            imageUrl:
              "https://res.cloudinary.com/djiqzvcev/image/upload/v1739281946/achivement3_hlkpml.png",
            imageWidth: 200,
            imageHeight: 200,
            imageAlt: "First Step Badge",
            padding: "3em",
            width: 600,
            color: "#716add",
            background: "#fff url(/images/trees.png)",
            backdrop: `rgba(0,0,123,0.4) url("/images/nyan-cat.gif") left top no-repeat`,
          });
        }

        setTimeout(() => {
          if (isJourney) {
            const journeyId = response.data.result.journey._id || response.data.result.journey.id;
            navigate(`/journey/${journeyId}`);
          } else {
            navigate(`/profile/${myProfile?._id}`);
          }
        }, 1500);
      } else {
        toast.error("Failed to upload. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="bg-sand-50 min-h-screen pb-24 pt-20">
        
        {/* Settings Header */}
        <Header
          title="Create Journey"
          subtitle="Publish a travel highlight post complete with photos, ratings, and locations."
        />

        <div className="max-w-xl mx-auto px-4 sm:px-6 mt-6">
          <div className="bg-white rounded-[2rem] border border-sand-100/80 shadow-[0_8px_30px_rgb(20,41,57,0.02)] p-6 md:p-8 flex flex-col gap-6 text-left">
            
            {/* Top Wizard Progress Indicator Segment */}
            <div className="flex items-center gap-2 mb-2 w-full justify-center">
              {[0, 1, 2].map((s) => {
                const isActive = step === s;
                return (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full max-w-[80px] transition-colors duration-300 ${
                      isActive ? "bg-ocean-600" : "bg-sand-200"
                    }`}
                  />
                );
              })}
            </div>

            {/* Journey/Post selection toggle */}
            {step === 0 && (
              <JourneyComposerToggle value={postType} onChange={setPostType} />
            )}

            {/* Back action if not step 0 */}
            {step > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-[10px] font-bold text-sand-400 hover:text-sand-600 uppercase tracking-wider select-none focus:outline-none"
              >
                <FaArrowLeft />
                <span>Back</span>
              </button>
            )}

            {/* Steps Container */}
            <AnimatePresence custom={direction} mode="wait">
              {step === 0 && (
                /* Step 1: Photos drop zone and drag reorder */
                <motion.div
                  key="step0"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="flex flex-col gap-5 w-full"
                >
                  <div>
                    <h3 className="font-display font-semibold text-base text-sand-900 leading-tight">
                      Add Photos
                    </h3>
                    <p className="font-sans text-[11px] text-sand-400 mt-1">
                      Choose up to 5 photos to share your journey visually.
                    </p>
                  </div>

                  <label
                    htmlFor="file-upload"
                    className="relative w-full h-36 border-2 border-dashed border-sand-300 rounded-2xl cursor-pointer flex flex-col items-center justify-center text-sand-500 hover:border-ocean-400 hover:bg-ocean-50/10 transition-all shadow-sm"
                  >
                    {selectedImages.length < 5 ? (
                      <>
                        <FiUpload className="text-3xl mb-2 text-sand-400" />
                        <span className="text-sm font-semibold text-sand-800">
                          Click to upload images
                        </span>
                        <span className="text-[10px] text-sand-400 mt-1">
                          JPEG, PNG formats supported
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-sunset-500">
                        Maximum 5 images reached
                      </span>
                    )}
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                      multiple
                      disabled={selectedImages.length >= 5}
                    />
                  </label>

                  {errorMsg && (
                    <p className="text-xs text-sunset-500 font-semibold text-center">
                      {errorMsg}
                    </p>
                  )}

                  {/* Drag to reorder preview grid */}
                  {selectedImages.length > 0 && (
                    <Reorder.Group
                      axis="y"
                      values={selectedImages}
                      onReorder={setSelectedImages}
                      className="space-y-3 mt-2"
                    >
                      {selectedImages.map((image) => (
                        <Reorder.Item
                          key={image.id}
                          value={image}
                          className="relative rounded-2xl overflow-hidden border border-sand-100 shadow-sm cursor-grab active:cursor-grabbing bg-white aspect-[16/9] md:aspect-[21/9]"
                        >
                          <img
                            src={image.preview}
                            alt="Selection Preview"
                            className="object-cover w-full h-full"
                          />
                          
                          <motion.button
                            {...springPress}
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-red-500 p-2 rounded-full shadow-md transition-colors z-20"
                            aria-label="Remove image"
                          >
                            <FiX className="text-sm" />
                          </motion.button>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  )}

                  <div className="pt-4 flex justify-end">
                    <motion.button
                      {...springPress}
                      onClick={handleNext}
                      className="px-6 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-colors"
                    >
                      Next
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                /* Step 2: Form Details */
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="flex flex-col gap-5 w-full"
                >
                  <div>
                    <h3 className="font-display font-semibold text-base text-sand-900 leading-tight">
                      Tell the story
                    </h3>
                    <p className="font-sans text-[11px] text-sand-400 mt-1">
                      Write details, describe settings, and tag hashtags.
                    </p>
                  </div>

                  {/* Title */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <input
                      type="text"
                      placeholder="Post Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="peer order-2 w-full px-4 py-3 bg-sand-50/50 border border-sand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-600 focus:bg-white transition-all text-xs md:text-sm text-sand-800 font-semibold"
                      required
                    />
                    <label className="order-1 text-[10px] font-bold text-sand-400 peer-focus:text-ocean-600 uppercase tracking-wider">
                      Title
                    </label>
                  </div>

                  {/* Desc */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <textarea
                      placeholder="Describe your journey..."
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      rows={4}
                      className="peer order-2 w-full px-4 py-3 bg-sand-50/50 border border-sand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-600 focus:bg-white transition-all text-xs md:text-sm text-sand-800 resize-none leading-relaxed"
                      required
                    />
                    <label className="order-1 text-[10px] font-bold text-sand-400 peer-focus:text-ocean-600 uppercase tracking-wider">
                      Description
                    </label>
                  </div>

                  {/* Location */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="peer order-2 flex items-center bg-sand-50/50 border border-sand-200 rounded-xl focus-within:ring-2 focus-within:ring-ocean-600 focus-within:bg-white transition-all">
                      <input
                        id="location-input"
                        type="text"
                        placeholder="Enter location"
                        value={locationInput}
                        onChange={(e) => {
                          setLocationInput(e.target.value);
                          setLoc(e.target.value);
                        }}
                        className="w-full px-4 py-3 bg-transparent outline-none text-xs md:text-sm text-sand-800"
                      />
                      <span
                        data-tooltip-id="location-tooltip"
                        data-tooltip-content="Format: City, Province, Country"
                        className="cursor-pointer text-sand-400 hover:text-ocean-600 px-3 transition-colors"
                      >
                        <CiCircleInfo size={18} />
                      </span>
                    </div>
                    <label className="order-1 text-[10px] font-bold text-sand-400 peer-focus:text-ocean-600 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Location</span>
                      <Tooltip id="location-tooltip" place="top" />
                    </label>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-[10px] font-bold text-sand-400 uppercase tracking-wider mb-2">
                      Rate this Journey
                    </label>
                    <ReactStars
                      count={5}
                      onChange={ratingChanged}
                      size={28}
                      activeColor="#ffd700"
                      isHalf={true}
                    />
                  </div>

                  {/* Hashtags */}
                  <div>
                    <label className="block text-[10px] font-bold text-sand-400 uppercase tracking-wider mb-2">
                      Hashtags (max 5)
                    </label>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={hashtagInput}
                        onChange={(e) => setHashtagInput(e.target.value)}
                        placeholder="#nature"
                        className="flex-grow px-4 py-2.5 bg-sand-50/50 border border-sand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-600 focus:bg-white text-xs md:text-sm text-sand-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = hashtagInput.trim();
                          if (trimmed && hashtags.length < 5 && !hashtags.includes(trimmed)) {
                            setHashtags([...hashtags, trimmed]);
                            setHashtagInput("");
                          }
                        }}
                        className="px-4 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    {hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {hashtags.map((tag, idx) => (
                          <div
                            key={idx}
                            className="bg-ocean-50 text-ocean-700 border border-ocean-100 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 select-none"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              className="text-red-500 font-bold hover:text-red-650"
                              onClick={() => setHashtags((prev) => prev.filter((_, i) => i !== idx))}
                              aria-label={`Remove hashtag ${tag}`}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <motion.button
                      {...springPress}
                      onClick={handleNext}
                      className="px-6 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-colors"
                    >
                      Next
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                /* Step 3: Review Preview Card */
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="flex flex-col gap-5 w-full"
                >
                  <div>
                    <h3 className="font-display font-semibold text-base text-sand-900 leading-tight">
                      Review & Publish
                    </h3>
                    <p className="font-sans text-[11px] text-sand-400 mt-1">
                      Check your post preview block below before sharing it globally.
                    </p>
                  </div>

                  {/* Live Mock PostCard */}
                  <div className="bg-white rounded-3xl border border-sand-200/80 overflow-hidden shadow-sm text-left">
                    
                    {/* First selected image preview as hero */}
                    {selectedImages[0]?.preview && (
                      <div className="w-full h-40 overflow-hidden relative">
                        <img
                          src={selectedImages[0].preview}
                          alt={title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-sand-50">
                        <div className="w-9 h-9 rounded-full border border-sand-100 p-0.5 overflow-hidden">
                          <img
                            src={myProfile?.profilePicture?.url}
                            alt={myProfile?.fullname}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-sans font-bold text-sand-900">
                            {myProfile?.fullname}
                          </p>
                          <p className="text-[10px] font-sans text-sand-400 mt-0.5">
                            Just now
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <ReactStars
                          count={5}
                          value={rating}
                          edit={false}
                          size={16}
                          activeColor="#ffd700"
                        />
                        {hashtags.length > 0 && (
                          <span className="text-[10px] font-bold text-ocean-600 truncate max-w-sm uppercase">
                            {hashtags.join(" ")}
                          </span>
                        )}
                      </div>

                      <h2 className="font-display font-bold text-lg text-sand-900 leading-snug mb-2">
                        {title}
                      </h2>
                      <p className="font-sans text-xs text-sand-650 leading-relaxed line-clamp-3 whitespace-pre-line">
                        {desc}
                      </p>

                      <div className="flex items-center gap-1 text-sand-400 pt-4 mt-4 border-t border-sand-50 text-[10px] font-bold uppercase tracking-wider">
                        <CiLocationOn className="text-base text-ocean-500" />
                        <span>{loc}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submission actions */}
                  <div className="pt-4 flex justify-end">
                    <motion.button
                      {...springPress}
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className={`px-8 py-3 bg-sunset-500 hover:bg-sunset-650 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all ${
                        isLoading ? "bg-sand-200 text-sand-400 cursor-not-allowed" : ""
                      }`}
                    >
                      {isLoading ? "Publishing..." : "Publish Post"}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>

      {/* Progress upload overlay screen */}
      <AnimatePresence>
        {isLoading && (
          <div className="fixed inset-0 bg-ocean-950/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-[0_8px_30px_rgb(20,41,57,0.12)] border border-sand-100 flex flex-col items-center text-center gap-4 animate-pulse"
            >
              <div className="w-10 h-10 border-4 border-t-ocean-600 border-sand-100 rounded-full animate-spin" />
              <span className="font-display font-semibold text-xs text-sand-400 uppercase tracking-widest">
                Uploading Journey...
              </span>
              <span className="font-sans text-[11px] text-sand-400 leading-relaxed max-w-[200px]">
                Uploading images to Cloudinary and registering database records...
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default CreatePost;
