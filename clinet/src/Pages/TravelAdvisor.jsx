import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaArrowLeft, FaUndo } from "react-icons/fa";
import { MdOutlineTravelExplore } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Header from "../Components/Header";
import MoreInfoModal from "../Components/MoreInfoModel";
import { toast } from "react-hot-toast";
import PageTransition from "../Components/PageTransition";
import { springPress, scaleIn, fadeUp, staggerContainer } from "../utils/motion";

const ADVISOR_APP_SERVER_BASE_URL = import.meta.env.VITE_TRAVEL_ADVISOR_BASE_URL;

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

const TravelAdvisor = () => {
  const [province, setProvince] = useState("");
  const [destinationType, setDestinationType] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Concierge Wizard step states
  const [step, setStep] = useState(0); // 0 = pick province, 1 = pick category
  const [direction, setDirection] = useState(1);
  const [loadingText, setLoadingText] = useState("Searching the map...");

  const openModal = (place) => {
    setSelectedPlace(place);
  };

  const closeModal = () => {
    setSelectedPlace(null);
  };

  const provinces = [
    "Punjab",
    "Sindh",
    "Khyber Pakhtunkhwa",
    "Balochistan",
    "Gilgit−Baltistan",
    "Islamabad",
    "Azad Kashmir",
  ];

  const destinationTypes = [
    "Mountainous",
    "Valley",
    "Lake",
    "Waterfall",
    "Coastal",
    "Hill Station",
    "Mosque",
    "Fort",
    "Temple",
    "Museum",
    "National Park",
    "Monument",
    "Resort",
    "Desert",
    "Mine",
  ];

  const handleProvinceSelect = (p) => {
    setProvince(p);
    if (p) {
      setDirection(1);
      setStep(1);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(0);
  };

  const handleResetSearch = () => {
    setProvince("");
    setDestinationType("");
    setResults([]);
    setStep(0);
    setDirection(-1);
  };

  // Compass subtitles cycling
  useEffect(() => {
    if (!loading) return;
    const texts = [
      "Searching the map...",
      "Matching your interests...",
      "Evaluating secret gems...",
      "Plotting coordinates...",
    ];
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % texts.length;
      setLoadingText(texts[idx]);
    }, 1500);
    return () => clearInterval(timer);
  }, [loading]);

  const handleSubmit = async () => {
    if (!province || !destinationType) {
      toast.error("Please pick both province and category.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${ADVISOR_APP_SERVER_BASE_URL}/recommend?district=${encodeURIComponent(
          province
        )}&category=${encodeURIComponent(destinationType)}`
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Invalid district") {
          toast.error("Invalid district");
        } else if (data.error === "Invalid category") {
          toast.error("Invalid category");
        } else if (data.message === "No recommendations found") {
          toast.error("No recommendations found");
        } else {
          toast.error("Something went wrong. Please try again.");
        }
        return;
      }

      if (Array.isArray(data) && data.length === 0) {
        toast.error("No spots found matching interests.");
        return;
      }

      setResults(data);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showResults = results.length > 0;

  return (
    <PageTransition>
      <div className="bg-sand-50 min-h-screen pb-24 pt-20">
        
        <Header
          title="Travel Advisor"
          subtitle="Answer two quick questions to discover tailored travel recommendations."
        />

        {/* Custom Marker styles injection */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pinDrop {
            0% { transform: translateY(-30px) scale(0); opacity: 0; }
            60% { transform: translateY(5px) scale(1.1); opacity: 1; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
          }
          .leaflet-marker-icon-animated {
            animation: pinDrop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
          @keyframes compassRotate {
            0% { transform: rotate(0deg); }
            50% { transform: rotate(180deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex flex-col items-center">
          
          <AnimatePresence mode="wait">
            {!showResults ? (
              
              /* STEP CONCIERGE WIZARD (Immersive Dark Panel) */
              <motion.div
                key="concierge-wizard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full max-w-xl bg-gradient-to-br from-ocean-700 via-ocean-600 to-ocean-950 p-8 rounded-[2rem] shadow-[0_12px_40px_rgba(20,41,57,0.15)] text-center text-white flex flex-col items-center justify-center min-h-[380px] overflow-hidden"
              >
                {loading ? (
                  /* Animated compass loader */
                  <div className="flex flex-col items-center py-10">
                    <div className="relative w-16 h-16 mb-5 bg-white/10 rounded-full border border-white/15 shadow-inner flex items-center justify-center">
                      <MdOutlineTravelExplore
                        style={{ animation: "compassRotate 2s infinite cubic-bezier(0.68, -0.6, 0.32, 1.6)" }}
                        className="text-4xl text-sunset-400"
                      />
                    </div>
                    <p className="font-display font-semibold text-sm text-sand-200 tracking-wide animate-pulse">
                      {loadingText}
                    </p>
                  </div>
                ) : (
                  <AnimatePresence custom={direction} mode="wait">
                    {step === 0 ? (
                      /* Step 0: Province */
                      <motion.div
                        key="step0"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full flex flex-col items-center"
                      >
                        <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-2 leading-tight">
                          Where are you exploring?
                        </h2>
                        <p className="font-sans text-xs md:text-sm text-sand-200/90 max-w-sm mb-8 leading-relaxed">
                          Select the province or territory you plan to discover.
                        </p>

                        <div className="w-full max-w-sm flex items-center bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 text-white transition-all focus-within:ring-2 focus-within:ring-sunset-400">
                          <FaMapMarkerAlt className="text-sunset-400 mr-3 text-lg" />
                          <select
                            value={province}
                            onChange={(e) => handleProvinceSelect(e.target.value)}
                            className="w-full bg-transparent text-white font-sans font-bold text-sm focus:outline-none cursor-pointer"
                          >
                            <option value="" className="text-sand-900 bg-white">
                              Select Province
                            </option>
                            {provinces.map((p) => (
                              <option key={p} value={p} className="text-sand-900 bg-white font-bold">
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    ) : (
                      /* Step 1: Category */
                      <motion.div
                        key="step1"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full flex flex-col items-center"
                      >
                        <div className="w-full flex items-center mb-4">
                          <button
                            onClick={handleBack}
                            className="flex items-center gap-1 text-xs font-semibold text-sand-200 hover:text-white uppercase tracking-wider transition-colors select-none pointer-events-auto"
                          >
                            <FaArrowLeft className="text-[10px]" />
                            <span>Back</span>
                          </button>
                        </div>

                        <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-2 leading-tight">
                          What kind of place?
                        </h2>
                        <p className="font-sans text-xs md:text-sm text-sand-200/90 max-w-sm mb-8 leading-relaxed">
                          Choose the visual category or environment you prefer.
                        </p>

                        <div className="w-full max-w-sm flex items-center bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 text-white transition-all focus-within:ring-2 focus-within:ring-sunset-400">
                          <MdOutlineTravelExplore className="text-sunset-400 mr-3 text-xl" />
                          <select
                            value={destinationType}
                            onChange={(e) => setDestinationType(e.target.value)}
                            className="w-full bg-transparent text-white font-sans font-bold text-sm focus:outline-none cursor-pointer"
                          >
                            <option value="" className="text-sand-900 bg-white">
                              Select Environment
                            </option>
                            {destinationTypes.map((t) => (
                              <option key={t} value={t} className="text-sand-900 bg-white font-bold">
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>

                        {province && destinationType && (
                          <motion.button
                            {...springPress}
                            onClick={handleSubmit}
                            className="w-full max-w-sm bg-sunset-500 hover:bg-sunset-600 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-2xl mt-8 shadow-lg transition-all"
                          >
                            Find My Destination
                          </motion.button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            ) : (
              
              /* RESULTS DISCOVERY SCREEN */
              <motion.div
                key="results-discovery"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full flex flex-col gap-6"
              >
                
                {/* Reset Search top Header */}
                <div className="flex justify-between items-center w-full pb-4 border-b border-sand-200">
                  <h3 className="font-display font-semibold text-lg text-sand-900">
                    Recommendations for <span className="text-ocean-600 font-bold">{province} ({destinationType})</span>
                  </h3>

                  <motion.button
                    {...springPress}
                    onClick={handleResetSearch}
                    className="flex items-center gap-1.5 border border-sand-200 hover:border-sand-300 bg-white text-sand-500 hover:text-sand-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    <FaUndo className="text-[10px]" />
                    <span>Search Again</span>
                  </motion.button>
                </div>

                {/* Horizontal Discovery Stack on Mobile, Grid on Desktop */}
                <motion.div
                  variants={staggerContainer(0.06, 0.04)}
                  initial="hidden"
                  animate="visible"
                  className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory flex-nowrap md:flex-wrap md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6 md:pb-0 scrollbar-none"
                >
                  {results.map((place, index) => (
                    <motion.div
                      key={index}
                      variants={fadeUp}
                      className="w-[85vw] md:w-auto flex-shrink-0 snap-center bg-white rounded-3xl border border-sand-100/80 shadow-[0_8px_30px_rgb(20,41,57,0.015)] p-5 flex flex-col gap-4 text-left"
                    >
                      {/* Leaflet map inside card */}
                      <div className="h-44 w-full rounded-2xl overflow-hidden relative shadow-inner border border-sand-100">
                        {/* Developer Note: Mounting one full MapContainer per result card may need lazy-loading/virtualization if result counts grow. */}
                        <MapContainer
                          center={[place.latitude, place.longitude]}
                          zoom={12}
                          scrollWheelZoom={false}
                          className="h-full w-full absolute inset-0 z-0"
                        >
                          <TileLayer
                            attribution="&copy; <a href='https://carto.com/'>CARTO</a> voyager"
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                          />
                          <Marker
                            position={[place.latitude, place.longitude]}
                            icon={L.divIcon({
                              className: "custom-leaflet-marker",
                              html: `<div class="leaflet-marker-icon-animated w-8 h-8 rounded-full border-2 border-white bg-ocean-600 shadow-md flex items-center justify-center text-white text-xs font-bold font-sans">
                                📍
                              </div>`,
                              iconSize: [28, 28],
                              iconAnchor: [14, 28],
                            })}
                          >
                            <Popup>{place._key}</Popup>
                          </Marker>
                        </MapContainer>
                      </div>

                      {/* Info body */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h2 className="font-display font-bold text-lg text-sand-900 leading-snug">
                            {place._key}
                          </h2>
                          <p className="font-sans text-xs text-sand-500 line-clamp-2 mt-1.5 leading-relaxed">
                            {place.Desc}
                          </p>
                          
                          <p className="font-sans text-[10px] font-semibold text-sand-400 mt-3 uppercase tracking-wider">
                            {place.district} • Lat: {place.latitude.toFixed(2)} • Lng: {place.longitude.toFixed(2)}
                          </p>
                        </div>

                        <div className="pt-4 flex justify-end">
                          <button
                            onClick={() => openModal(place)}
                            className="text-xs font-bold text-ocean-600 hover:text-ocean-700 uppercase tracking-wider select-none focus:outline-none"
                          >
                            More Info &rarr;
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* Info details modal popup overlay */}
          <AnimatePresence>
            {selectedPlace && (
              <MoreInfoModal place={selectedPlace} onClose={closeModal} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
};

export default TravelAdvisor;
