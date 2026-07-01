import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { CiCalendar, CiLocationOn } from "react-icons/ci";
import { FiX, FiPlus, FiCheck, FiUpload } from "react-icons/fi";
import { FaFlagCheckered } from "react-icons/fa";
import ReactStars from "react-rating-stars-component";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

import { getJourney, addStep, endJourney, clearCurrentJourney } from "../Toolkit/slices/journeySlice";
import { uploadImagesToCloudinary } from "../utils/cloudinaryUpload";
import JourneyStepNode from "../Components/JourneyStepNode";
import PostComp from "../Components/Post";
import CommentCard from "../Components/CommentCard";
import AddComment from "../Components/AddComment";
import Header from "../Components/Header";
import Loader from "../Components/Loader";
import PageTransition from "../Components/PageTransition";
import { staggerContainer, fadeUp, scaleIn, springPress } from "../utils/motion";

const JourneyTreeView = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const isLoggedIn = useSelector((state) => state.appConfig.isLoggedIn);
  const { currentJourney, status } = useSelector((state) => state.journey);

  const [selectedStepId, setSelectedStepId] = useState(null);
  const [showAddStepModal, setShowAddStepModal] = useState(false);

  // Add Step Form States
  const [stepDesc, setStepDesc] = useState("");
  const [stepLoc, setStepLoc] = useState("");
  const [stepRating, setStepRating] = useState(5);
  const [selectedImages, setSelectedImages] = useState([]); // { file, id, preview }
  const [stepHashtags, setStepHashtags] = useState([]);
  const [stepHashtagInput, setStepHashtagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    dispatch(getJourney(id));
    return () => {
      dispatch(clearCurrentJourney());
    };
  }, [id, dispatch]);

  if (status === "loading" && !currentJourney) {
    return <Loader />;
  }

  if (status === "failed" || (!currentJourney && status !== "idle")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-sand-500 font-sans p-8">
        <h2 className="text-xl font-bold mb-4">Journey Not Found</h2>
        <button onClick={() => navigate("/home")} className="px-4 py-2 bg-ocean-600 text-white rounded-xl">
          Back to Home
        </button>
      </div>
    );
  }

  if (!currentJourney) return null;

  const isOwner = myProfile?._id === currentJourney.owner?._id;
  const isActive = currentJourney.isActive;

  // Selected Step details for modal
  const selectedStep = currentJourney.steps?.find(
    (s) => (s.id || s._id) === selectedStepId
  );

  const handleEndJourney = () => {
    Swal.fire({
      title: "End Journey?",
      text: "This marks the journey as complete — you can't add more steps after this.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f1663a", // sunset highlight
      cancelButtonColor: "#2f5a79",
      confirmButtonText: "Yes, complete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(endJourney(id));
      }
    });
  };

  // Add Step Form Handlers
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 5) {
      toast.error("You can only upload up to 5 images per step.");
      return;
    }
    const newImages = files.map((file) => ({
      file,
      id: `${file.name}-${file.size}-${Math.random()}`,
      preview: URL.createObjectURL(file),
    }));
    setSelectedImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (idToRemove) => {
    setSelectedImages((prev) => {
      const target = prev.find((img) => img.id === idToRemove);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((img) => img.id !== idToRemove);
    });
  };

  const handleAddHashtag = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = stepHashtagInput.trim().replace(/#/g, "");
      if (tag) {
        if (stepHashtags.length >= 5) {
          toast.error("Maximum of 5 hashtags allowed.");
          return;
        }
        if (!stepHashtags.includes(`#${tag}`)) {
          setStepHashtags((prev) => [...prev, `#${tag}`]);
        }
      }
      setStepHashtagInput("");
    }
  };

  const removeHashtag = (tagToRemove) => {
    setStepHashtags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleAddStepSubmit = async (e) => {
    e.preventDefault();
    if (selectedImages.length === 0) {
      toast.error("Please add at least one photo for this step.");
      return;
    }
    if (!stepDesc.trim() || !stepLoc.trim()) {
      toast.error("Please provide a description and location.");
      return;
    }

    try {
      setIsUploading(true);
      const filesArray = selectedImages.map((img) => img.file);
      const uploadedMedia = await uploadImagesToCloudinary(filesArray);

      const body = {
        description: stepDesc,
        location: stepLoc,
        rating: stepRating,
        hashtags: JSON.stringify(stepHashtags),
        media: JSON.stringify(uploadedMedia),
      };

      await dispatch(addStep({ id, body })).unwrap();
      
      // Reset form
      setStepDesc("");
      setStepLoc("");
      setStepRating(5);
      setSelectedImages([]);
      setStepHashtags([]);
      setShowAddStepModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <PageTransition>
      <div className="bg-sand-50 min-h-screen pb-24 pt-20">
        
        {/* Editorial Header */}
        <Header
          title={currentJourney.title}
          subtitle={`A travel journey started by ${currentJourney.owner?.fullname}`}
        />

        {/* Tree Header Controls & Owner Information Card */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6">
          <div className="bg-white rounded-3xl border border-sand-200/80 shadow-[0_8px_30px_rgb(20,41,57,0.02)] p-6 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
            <div className="flex items-center gap-4">
              <img
                src={currentJourney.owner?.profilePicture?.url || ""}
                alt="Owner Avatar"
                className="w-14 h-14 object-cover rounded-full border border-sand-100 p-0.5"
              />
              <div>
                <h2 className="font-display font-extrabold text-lg text-sand-900 leading-tight">
                  {currentJourney.owner?.fullname}
                </h2>
                <p className="font-sans text-xs text-sand-500 mt-1 flex items-center gap-1.5">
                  <CiCalendar className="text-sm text-ocean-500" />
                  <span>
                    Started {new Date(currentJourney.startedAt).toLocaleDateString()}
                    {currentJourney.endedAt && ` — Completed ${new Date(currentJourney.endedAt).toLocaleDateString()}`}
                  </span>
                </p>
              </div>
            </div>

            {/* Badges and actions */}
            <div className="flex items-center gap-3">
              {isActive ? (
                <span className="text-[10px] font-bold text-sunset-600 bg-sunset-50 border border-sunset-100 rounded-full px-3 py-1 uppercase tracking-wider">
                  Active
                </span>
              ) : (
                <span className="text-[10px] font-bold text-jade-600 bg-jade-50 border border-jade-100 rounded-full px-3 py-1 uppercase tracking-wider flex items-center gap-1">
                  <FaFlagCheckered /> Completed
                </span>
              )}

              {/* Owner active buttons */}
              {isOwner && isActive && (
                <div className="flex gap-2">
                  <motion.button
                    {...springPress}
                    onClick={() => setShowAddStepModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-ocean-600 hover:bg-ocean-700 shadow-md shadow-ocean-500/10 focus:outline-none"
                  >
                    <FiPlus /> Add Step
                  </motion.button>
                  <motion.button
                    {...springPress}
                    onClick={handleEndJourney}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sunset-500 hover:bg-sunset-600 shadow-md shadow-sunset-500/10 focus:outline-none"
                  >
                    End Journey
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Zigzag steps list */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-16 relative">
          
          {/* Vertical connecting line */}
          <div className="absolute left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-ocean-500/30 via-ocean-500/50 to-ocean-500/20 -translate-x-1/2 z-0 hidden md:block" />
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-ocean-500/30 via-ocean-500/50 to-ocean-500/20 z-0 block md:hidden" />

          {/* Node items */}
          <motion.div
            variants={staggerContainer(0.08, 0.05)}
            initial="hidden"
            animate="visible"
            className="relative z-10 w-full"
          >
            {currentJourney.steps && currentJourney.steps.length > 0 ? (
              currentJourney.steps.map((step, index) => {
                const isLeftAligned = index % 2 === 0;
                return (
                  <motion.div key={step.id || step._id} variants={fadeUp}>
                    <JourneyStepNode
                      step={step}
                      index={index}
                      total={currentJourney.steps.length}
                      isLeftAligned={isLeftAligned}
                      onOpenDetail={(s) => setSelectedStepId(s.id || s._id)}
                    />
                  </motion.div>
                );
              })
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center text-sand-500 border border-sand-100 shadow-sm">
                No steps added to this journey yet.
              </div>
            )}
          </motion.div>
        </div>

        {/* Selected Step Drawer/Modal */}
        <AnimatePresence>
          {selectedStepId && selectedStep && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStepId(null)}
              className="fixed inset-0 bg-sand-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
            >
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="hidden"
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative border border-sand-100 shadow-2xl flex flex-col md:flex-row text-left"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedStepId(null)}
                  className="absolute top-4 right-4 z-40 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-sand-800 flex items-center justify-center shadow-md focus:outline-none"
                >
                  <FiX />
                </button>

                {/* Left Side: Post Content details */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 border-r border-sand-100">
                  <PostComp
                    post={selectedStep}
                    scrollToComment={() => {}}
                    openMobileComments={() => {}}
                  />
                </div>

                {/* Right Side: Comments list & additions */}
                <div className="w-full md:w-[320px] p-6 flex flex-col max-h-[50vh] md:max-h-full bg-sand-50/50">
                  <h3 className="font-display font-extrabold text-base text-sand-900 mb-4 pb-2 border-b border-sand-100">
                    Comments
                  </h3>
                  
                  {/* Comments scroll container */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
                    {selectedStep.comments && selectedStep.comments.length > 0 ? (
                      selectedStep.comments.map((comment, idx) => (
                        <CommentCard key={idx} comment={comment} />
                      ))
                    ) : (
                      <p className="text-xs text-sand-400 text-center py-8">No comments yet. Write one below!</p>
                    )}
                  </div>

                  {/* Add comment input bar */}
                  {isLoggedIn ? (
                    <AddComment postId={selectedStep.id || selectedStep._id} />
                  ) : (
                    <p className="text-xs text-sand-400 text-center py-2">
                      Please sign in to join the conversation.
                    </p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Step Overlay Modal */}
        <AnimatePresence>
          {showAddStepModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-sand-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 border border-sand-100 shadow-2xl relative text-left flex flex-col gap-5"
              >
                <button
                  onClick={() => setShowAddStepModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-sand-50 hover:bg-sand-100 text-sand-800 flex items-center justify-center focus:outline-none"
                  disabled={isUploading}
                >
                  <FiX />
                </button>

                <div>
                  <h3 className="font-display font-extrabold text-lg text-sand-900">Add Stop to Journey</h3>
                  <p className="font-sans text-[11px] text-sand-400 mt-1">
                    Log a new stop in your journey with photos, captions, and details.
                  </p>
                </div>

                <form onSubmit={handleAddStepSubmit} className="space-y-4">
                  {/* Photo Upload Zone */}
                  <div>
                    <label className="block text-xs font-bold text-sand-700 uppercase tracking-wider mb-2">
                      Add Photos (Max 5)
                    </label>
                    <label
                      htmlFor="step-file-upload"
                      className="w-full h-32 border-2 border-dashed border-sand-300 rounded-2xl cursor-pointer flex flex-col items-center justify-center text-sand-500 hover:border-ocean-400 hover:bg-ocean-50/10 transition-all shadow-sm"
                    >
                      <FiUpload className="text-2xl mb-1 text-sand-400" />
                      <span className="text-xs font-semibold text-sand-800">Upload Stop Images</span>
                      <input
                        id="step-file-upload"
                        type="file"
                        multiple
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isUploading}
                      />
                    </label>

                    {/* Previews */}
                    {selectedImages.length > 0 && (
                      <div className="grid grid-cols-5 gap-2 mt-3">
                        {selectedImages.map((img) => (
                          <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-sand-50 border border-sand-200">
                            <img src={img.preview} className="w-full h-full object-cover" alt="Preview" />
                            <button
                              type="button"
                              onClick={() => removeImage(img.id)}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] focus:outline-none"
                              disabled={isUploading}
                            >
                              <FiX />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stop Description */}
                  <div>
                    <label className="block text-xs font-bold text-sand-700 uppercase tracking-wider mb-2">
                      Stop Details / Description
                    </label>
                    <textarea
                      placeholder="What happened at this stop? Share your adventures..."
                      className="w-full p-4 border border-sand-200 rounded-2xl text-xs text-sand-800 font-sans focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 resize-none h-24"
                      value={stepDesc}
                      onChange={(e) => setStepDesc(e.target.value)}
                      disabled={isUploading}
                      required
                    />
                  </div>

                  {/* Stop Location */}
                  <div>
                    <label className="block text-xs font-bold text-sand-700 uppercase tracking-wider mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <CiLocationOn className="absolute left-4 top-3 text-lg text-ocean-500" />
                      <input
                        type="text"
                        placeholder="Where was this stop? (e.g. Islamabad, Pakistan)"
                        className="w-full pl-11 pr-4 py-3 border border-sand-200 rounded-2xl text-xs text-sand-800 font-sans focus:outline-none focus:ring-2 focus:ring-ocean-500/20"
                        value={stepLoc}
                        onChange={(e) => setStepLoc(e.target.value)}
                        disabled={isUploading}
                        required
                      />
                    </div>
                  </div>

                  {/* Rating & Hashtags Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-sand-700 uppercase tracking-wider mb-1">
                        Stop Rating
                      </label>
                      <ReactStars
                        count={5}
                        onChange={(r) => setStepRating(r)}
                        size={24}
                        activeColor="#f1663a" // sunset highlight
                        value={stepRating}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-sand-700 uppercase tracking-wider mb-2">
                        Hashtags (Max 5)
                      </label>
                      <input
                        type="text"
                        placeholder="Add tag and press Enter"
                        className="w-full px-4 py-3 border border-sand-200 rounded-2xl text-xs text-sand-800 font-sans focus:outline-none focus:ring-2 focus:ring-ocean-500/20"
                        value={stepHashtagInput}
                        onChange={(e) => setStepHashtagInput(e.target.value)}
                        onKeyDown={handleAddHashtag}
                        disabled={isUploading}
                      />
                      {stepHashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {stepHashtags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-ocean-600 bg-ocean-50 px-2 py-0.5 rounded-full"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeHashtag(tag)}
                                className="focus:outline-none hover:text-red-500"
                                disabled={isUploading}
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <div className="flex justify-end gap-2 pt-4 border-t border-sand-100">
                    <button
                      type="button"
                      onClick={() => setShowAddStepModal(false)}
                      className="px-4 py-2 border border-sand-200 text-sand-600 rounded-xl text-xs font-bold"
                      disabled={isUploading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl text-xs font-bold shadow-md shadow-ocean-500/10 flex items-center gap-1.5"
                      disabled={isUploading}
                    >
                      {isUploading ? "Uploading..." : <><FiCheck /> Add Stop</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageTransition>
  );
};

export default JourneyTreeView;
