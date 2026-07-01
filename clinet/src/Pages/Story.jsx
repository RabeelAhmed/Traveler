import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import { FcLike } from "react-icons/fc";
import { CiHeart } from "react-icons/ci";
import { AiOutlinePlus } from "react-icons/ai";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import L from "leaflet";
import Header from "../Components/Header";
import Logo from "../assets/Images/logoColor.png";
import { getStoryData, likeAndUnlikeStory } from "../Toolkit/slices/storySlice";
import { springPress, scaleIn, fadeUp } from "../utils/motion";

const Story = () => {
  const dispatch = useDispatch();
  const story = useSelector((state) => state.story.story);
  const storyStatus = useSelector((state) => state.story.status);

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lat, setLat] = useState(null);
  const [long, setLong] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [animating, setAnimating] = useState(false);

  const videoRef = useRef(null);

  const DURATION_IMAGE = 5000; // 5 seconds for images

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLong(position.coords.longitude);
      },
      (error) => {
        console.error("Error fetching geolocation:", error);
        setLat(40.7128); // Default to New York
        setLong(-74.0060);
      }
    );

    if (storyStatus === "idle") {
      dispatch(getStoryData());
    }
  }, [dispatch, storyStatus]);

  const activeStory = story[currentIndex];

  useEffect(() => {
    if (activeStory) {
      setIsLiked(activeStory.isLiked);
    }
  }, [currentIndex, activeStory]);

  const isVideo = activeStory?.videoUrl?.match(/\.(mp4|webm|ogg)$/i) || activeStory?.video?.url?.match(/\.(mp4|webm|ogg|mkv)$/i);

  // Progressive timer sequence for image slides
  useEffect(() => {
    if (!selectedVideo || paused || isVideo) return;

    const tickRate = 50; // tick every 50ms for smooth progress bar updates
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (tickRate / DURATION_IMAGE) * 100;
      });
    }, tickRate);

    return () => clearInterval(timer);
  }, [selectedVideo, currentIndex, paused, isVideo]);

  // Video progress synchronization
  const handleVideoTimeUpdate = () => {
    if (videoRef.current && isVideo && !paused) {
      const { currentTime, duration } = videoRef.current;
      if (duration) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };

  const handleVideoEnded = () => {
    handleNext();
  };

  const handleNext = () => {
    setProgress(0);
    if (currentIndex < story.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      closePopup();
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const openPopup = (video, index) => {
    setCurrentIndex(index);
    setSelectedVideo(video);
    setIsPlaying(true);
    setProgress(0);
    setPaused(false);
  };

  const closePopup = () => {
    setSelectedVideo(null);
    setIsPlaying(false);
    setProgress(0);
    setPaused(false);
  };

  const handleLike = (e, storyId) => {
    e.stopPropagation();
    dispatch(likeAndUnlikeStory({ storyId }));
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
    setIsLiked((prev) => !prev);
  };

  if (storyStatus === "loading" || (!lat && !long)) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-sand-50">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes glow {
            0%, 100% { opacity: 0.6; transform: scale(0.98); }
            50% { opacity: 1; transform: scale(1.02); }
          }
        `}} />
        <div style={{ animation: "glow 2s infinite ease-in-out" }} className="flex flex-col items-center">
          <img src={Logo} alt="Traveler" className="w-16 h-16 animate-bounce" />
          <p className="font-display font-bold text-xs text-sand-500 tracking-widest uppercase mt-4">
            Loading Stories Map...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sand-50 min-h-screen pb-20 pt-20">
      
      {/* Title section header */}
      <Header
        title="Travel Stories"
        subtitle="Zoom in and tap pins to slide through stories shared around the world."
      />

      {/* Inject custom drop-in keyframes for pins */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pinDrop {
          0% { transform: translateY(-30px) scale(0); opacity: 0; }
          60% { transform: translateY(5px) scale(1.1); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .custom-marker-animated {
          animation: pinDrop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}} />

      {/* Map Content panel wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 relative z-0">
        
        {/* Rounded Vignette container frame */}
        <div className="relative w-full h-[70vh] rounded-3xl overflow-hidden border border-sand-100/80 shadow-[0_8px_30px_rgb(20,41,57,0.02)]">
          
          {/* Vignette Shadow Overlay overlaying borders */}
          <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_80px_rgba(20,41,57,0.12)] rounded-3xl" />

          {/* Add Story FAB with pulsing expands rings */}
          <Link to="/addstory" className="absolute top-6 right-6 z-20">
            <motion.button
              {...springPress}
              className="relative w-12 h-12 bg-sunset-500 hover:bg-sunset-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors select-none"
            >
              <span className="absolute inset-0 rounded-full bg-sunset-500 animate-ping opacity-35 -z-10" />
              <AiOutlinePlus className="text-xl" />
            </motion.button>
          </Link>

          {/* Map Base Leaflet canvas */}
          <MapContainer
            center={[lat, long]}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            {/* Muted CARTO basemaps tile layer URL */}
            <TileLayer
              attribution="&copy; <a href='https://carto.com/'>CARTO</a> voyager"
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* Render video markers drop-in staggering indexes */}
            {story.map((video, idx) => (
              <Marker
                key={video._id}
                position={[video.location.latitude, video.location.longitude]}
                eventHandlers={{
                  click: () => openPopup(video, idx),
                }}
                icon={L.divIcon({
                  className: "custom-marker-wrapper",
                  html: `<div class="custom-marker-animated w-9 h-9 border-2 border-white rounded-full overflow-hidden shadow-md flex items-center justify-center bg-ocean-700" style="animation-delay: ${idx * 80}ms; opacity: 0;">
                    <img src="${video?.user?.profilePicture?.url}" alt="User Avatar" class="w-full h-full object-cover" />
                  </div>`,
                  iconSize: [36, 36],
                  iconAnchor: [18, 36],
                })}
              />
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Sequential Instagram-Style story viewer takeover */}
      <AnimatePresence>
        {selectedVideo && activeStory && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none">
            
            {/* Swipe dismissal wrapper */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              onDragEnd={(event, info) => {
                if (info.offset.y > 150) closePopup();
              }}
              className="relative w-full h-full flex flex-col justify-center items-center"
            >
              
              {/* Media viewer */}
              <div
                className="w-full h-full relative flex items-center justify-center"
                onMouseDown={() => setPaused(true)}
                onMouseUp={() => setPaused(false)}
                onTouchStart={() => setPaused(true)}
                onTouchEnd={() => setPaused(false)}
              >
                {isVideo ? (
                  <video
                    ref={videoRef}
                    src={activeStory?.videoUrl || activeStory?.video?.url}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    onPlay={() => {
                      setIsPlaying(true);
                      if (paused) videoRef.current.pause();
                    }}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={handleVideoTimeUpdate}
                    onEnded={handleVideoEnded}
                  />
                ) : (
                  <img
                    src={activeStory?.videoUrl || activeStory?.video?.url}
                    alt={activeStory?.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Segmented top Progress Line indicators */}
              <div className="absolute top-4 inset-x-4 flex gap-1 z-50">
                {story.map((item, idx) => {
                  let fillWidth = "0%";
                  if (idx < currentIndex) fillWidth = "100%";
                  if (idx === currentIndex) fillWidth = `${progress}%`;
                  return (
                    <div key={item._id} className="h-0.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-100 ease-linear"
                        style={{ width: fillWidth }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Story headers (avatars and cancel clicks) */}
              <div className="absolute top-8 inset-x-4 flex items-center justify-between z-50 px-2 pointer-events-none">
                <div className="flex items-center space-x-3 pointer-events-auto">
                  <div className="w-9 h-9 rounded-full border border-white/20 p-0.5 overflow-hidden bg-black/20">
                    <img
                      src={activeStory?.user?.profilePicture?.url}
                      alt={activeStory?.user?.fullname}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <span className="font-display font-bold text-sm text-white shadow-sm drop-shadow-md">
                    {activeStory?.user?.fullname}
                  </span>
                </div>

                <button
                  onClick={closePopup}
                  className="bg-black/35 backdrop-blur-sm border border-white/10 hover:bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center pointer-events-auto transition-all text-lg font-bold font-sans"
                >
                  &times;
                </button>
              </div>

              {/* Nav Tap-Zones (left third goes prev, right third goes next) */}
              <div
                className="absolute inset-y-0 left-0 w-[30%] z-30 cursor-w-resize"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
              />
              <div
                className="absolute inset-y-0 right-0 w-[30%] z-30 cursor-e-resize"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              />

              {/* Bottom Scrim overlay (gradient, title, likes) */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-24 text-left flex flex-col gap-2 z-40">
                <h3 className="font-display font-semibold text-lg text-white drop-shadow-sm leading-snug">
                  {activeStory?.title}
                </h3>
                
                <div className="flex items-center gap-3 mt-2">
                  <motion.button
                    {...springPress}
                    onClick={(e) => handleLike(e, activeStory._id)}
                    className="flex items-center justify-center w-11 h-11 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white shadow-md transition-colors"
                  >
                    {isLiked ? (
                      <FcLike className="text-xl" />
                    ) : (
                      <CiHeart
                        className={`text-2xl text-white ${
                          animating ? "scale-125" : ""
                        }`}
                      />
                    )}
                  </motion.button>
                </div>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Story;
