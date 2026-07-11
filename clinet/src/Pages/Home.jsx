import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiChat,
  HiLocationMarker,
  HiSparkles,
  HiPlus,
  HiTrash,
  HiCloud,
} from "react-icons/hi";
import { useSocket } from "../context/SocketContext";
import { setIsLive } from "../Toolkit/slices/liveSlice";
import toast from "react-hot-toast";
import Loader from "../Components/Loader";
import logo from "../assets/Images/traveler_logo_animated.gif";
import {
  staggerContainer,
  fadeUp,
  scaleIn,
  springPress,
} from "../utils/motion";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

// Animated temperature count-up helper
const TempCounter = ({ target }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(target);
    if (start === end) {
      setCount(end);
      return;
    }
    const duration = 1200; // ms
    const range = end - start;
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressFraction = Math.min(progress / duration, 1);
      const current = Math.round(start + range * progressFraction);
      setCount(current);
      if (progressFraction < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target]);

  return <span>{count}</span>;
};

function Home() {
  const dispatch = useDispatch();
  const socket = useSocket();
  const isLive = useSelector((state) => state.live.isLive);
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString()
  );

  const watchIdRef = useRef(null);
  const isLiveRef = useRef(isLive);

  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleLiveToggle = () => {
    if (!isLive) {
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        return;
      }
      toast.success("Going live...");
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          if (socket) {
            if (!isLiveRef.current) {
              socket.emit("goLive", {
                lat,
                lng,
                userInfo: {
                  username: myProfile?.username,
                  profilePic: myProfile?.profilePicture?.url,
                },
              });
              dispatch(setIsLive(true));
              toast.success("You are now live! 🗺️");
            } else {
              socket.emit("updateLocation", { lat, lng });
            }
          }
        },
        (err) => {
          console.error(err);
          toast.error("Failed to get your location");
        },
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
      watchIdRef.current = watchId;
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (socket) {
        socket.emit("goOffline");
      }
      dispatch(setIsLive(false));
      toast.success("You are now offline");
    }
  };

  // States
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [newItem, setNewItem] = useState("");

  const isFirstLoad = useRef(true);

  // Update current time every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Load wishlist from localStorage
  useEffect(() => {
    const storedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    setWishlist(storedWishlist);
  }, []);

  // Save wishlist to localStorage (ignore initial load)
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // Add wishlist item
  const addWishlistItem = () => {
    if (!newItem.trim()) return;
    const newEntry = {
      id: Date.now(),
      title: newItem.trim(),
    };
    setWishlist((prev) => [...prev, newEntry]);
    setNewItem("");
  };

  // Delete item from wishlist
  const deleteItem = (id) => {
    const updated = wishlist.filter((item) => item.id !== id);
    setWishlist(updated);
  };

  // Fetch weather data
  useEffect(() => {
    const getWeatherData = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              const response = await fetch(
                `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${latitude},${longitude}`
              );
              if (!response.ok) throw new Error("Weather API error");

              const data = await response.json();
              setWeatherData(data);
              setLoading(false);
            },
            (error) => {
              console.error("Geolocation error:", error);
              setLoading(false);
            }
          );
        } else {
          console.log("Geolocation not supported.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Weather fetch error:", err);
        setLoading(false);
      }
    };

    getWeatherData();
  }, []);

  return (
    <div
      className="min-h-screen bg-center bg-no-repeat bg-cover flex flex-col justify-between relative overflow-x-hidden pt-28"
      style={{
        backgroundImage:
          "url('https://res.cloudinary.com/djiqzvcev/image/upload/v1735323187/Profile_Pictures/z85wimxtvordqrr9u3sd.png')",
      }}
    >
      {/* Immersive Dark Glass Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/95 via-ocean-950/35 to-transparent z-0" />

      <div className="relative z-10 w-full flex flex-col flex-1">
        
        {/* Greetings Panel */}
        <div className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-10 text-left">
          <motion.div
            variants={staggerContainer(0.08, 0.1)}
            initial="hidden"
            animate="visible"
          >
            <motion.p
              variants={fadeUp}
              className="text-white/80 text-lg md:text-xl font-sans tracking-wide"
            >
              Welcome back,
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="text-white text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight mt-1"
            >
              {myProfile?.fullname}
            </motion.h1>
          </motion.div>
        </div>

        {/* Bento Grid */}
        <motion.div
          variants={staggerContainer(0.06, 0.08)}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-6 md:px-12 max-w-7xl mx-auto w-full pb-28"
        >
          {/* Bento Item 1: Weather Tile (Spans 2 columns on sm+) */}
          <motion.div
            variants={fadeUp}
            className="sm:col-span-2 lg:col-span-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(20,41,57,0.08)] flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                Live Weather Update
              </span>
              <span className="text-white/60 text-xs font-mono">{currentTime}</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <img src={logo} alt="Loading..." className="w-24 opacity-80" />
              </div>
            ) : weatherData ? (
              <div className="mt-6 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-4">
                  <img
                    src={weatherData.current.condition.icon}
                    alt="Weather Icon"
                    className="w-16 h-16 object-contain"
                  />
                  <div>
                    <h2 className="text-white text-4xl md:text-5xl font-display font-bold tracking-tight">
                      <TempCounter target={weatherData.current.temp_c} />°C
                    </h2>
                    <p className="text-white/80 text-sm font-sans font-medium">
                      {weatherData.current.condition.text}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-left">
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-semibold">Location</p>
                    <p className="text-white text-sm font-medium truncate">
                      {weatherData.location.name}, {weatherData.location.region}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-semibold">Humidity</p>
                    <p className="text-white text-sm font-medium">
                      {weatherData.current.humidity}%
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-white/80 py-8 text-sm">Unable to load weather data.</p>
            )}
          </motion.div>

          {/* Bento Item 2: Wishlist Tile (Spans 2 columns on sm+) */}
          <motion.div
            variants={fadeUp}
            className="sm:col-span-2 lg:col-span-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(20,41,57,0.08)] flex flex-col justify-between"
          >
            <div>
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-4">
                Travel Wishlist
              </span>

              {wishlist.length === 0 ? (
                <p className="text-white/60 text-sm py-4">
                  No locations saved. Add some places to explore below!
                </p>
              ) : (
                <ul className="space-y-2 mb-6 max-h-[120px] overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {wishlist.map((item) => (
                      <motion.li
                        key={item.id}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, x: -10 }}
                        className="flex justify-between items-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl px-4 py-2 transition-colors duration-200"
                      >
                        <span className="text-sm font-sans text-sand-100">{item.title}</span>
                        <motion.button
                          {...springPress}
                          onClick={() => deleteItem(item.id)}
                          className="text-white/40 hover:text-red-400 p-1 transition-colors duration-200"
                        >
                          <HiTrash className="text-base" />
                        </motion.button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Input Field */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Enter destination..."
                className="px-4 py-2.5 rounded-xl text-white bg-white/10 placeholder:text-sand-400 border border-white/20 outline-none focus:ring-2 focus:ring-ocean-300 focus:bg-white/15 transition-all text-sm flex-1"
              />
              <motion.button
                {...springPress}
                onClick={addWishlistItem}
                className="text-white bg-ocean-600 hover:bg-ocean-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center shadow-sm"
              >
                <HiPlus className="text-lg" />
              </motion.button>
            </div>
          </motion.div>

          {/* Bento Item 3: Forum Quick Launch (1 Column) */}
          <Link to="/forum" className="block sm:col-span-1 lg:col-span-1">
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="bg-black/30 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-3xl p-6 shadow-lg h-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:bg-black/40 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-ocean-500/20 flex items-center justify-center text-ocean-400 mb-4">
                <HiChat className="text-2xl" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white">Forum</h3>
              <p className="font-sans text-xs text-sand-300 mt-1 max-w-[150px]">
                Join conversations with world explorers.
              </p>
            </motion.div>
          </Link>

          {/* Bento Item 4: Story (Spans 1 column) */}
          <Link to="/story" className="block sm:col-span-1 lg:col-span-1">
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="relative overflow-hidden bg-gradient-to-br from-sunset-500/80 to-sunset-700/80 backdrop-blur-md border border-sunset-400/20 rounded-3xl p-6 shadow-[0_8px_30px_rgba(241,102,58,0.15)] h-full flex flex-col justify-between cursor-pointer transition-all duration-300 hover:from-sunset-500/90 hover:to-sunset-700/90"
            >
              <div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white mb-4">
                  <HiLocationMarker className="text-xl animate-pulse" />
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-1">Travel Stories</h3>
                <p className="font-sans text-xs text-white/80 leading-relaxed">
                  Interactive map stories around the world.
                </p>
              </div>
              <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider mt-4">
                Explore Map →
              </span>
            </motion.div>
          </Link>

          {/* Bento Item 5: Travel Advisor Quick Launch (1 Column) */}
          <Link to="/traveladvisor" className="block sm:col-span-1 lg:col-span-1">
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="bg-black/30 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-3xl p-6 shadow-lg h-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:bg-black/40 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-jade-500/20 flex items-center justify-center text-jade-400 mb-4">
                <HiSparkles className="text-2xl" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white">Advisor</h3>
              <p className="font-sans text-xs text-sand-300 mt-1 max-w-[150px]">
                Get personalized AI recommendations.
              </p>
            </motion.div>
          </Link>

          {/* Bento Item 6: Go Live Toggle (1 Column) */}
          <div className="block sm:col-span-1 lg:col-span-1">
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4 }}
              onClick={handleLiveToggle}
              className={`backdrop-blur-md border rounded-3xl p-6 shadow-lg h-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 text-center select-none relative overflow-hidden group ${
                isLive
                  ? "bg-sunset-500/25 border-sunset-400/50 shadow-[0_8px_30px_rgba(241,102,58,0.25)]"
                  : "bg-black/30 border-white/10 hover:border-white/20 hover:bg-black/40"
              }`}
            >
              {/* Pulsing glow ring in live mode */}
              {isLive && (
                <div className="absolute inset-0 rounded-3xl border-2 border-sunset-500 animate-pulse pointer-events-none" />
              )}
              
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                isLive
                  ? "bg-sunset-500 text-white shadow-[0_0_15px_rgba(241,102,58,0.5)]"
                  : "bg-sunset-500/20 text-sunset-400"
              }`}>
                <HiLocationMarker className={`text-2xl ${isLive ? "animate-bounce" : ""}`} />
              </div>

              <h3 className="font-display font-semibold text-lg text-white flex items-center gap-1.5 justify-center">
                {isLive && <span className="w-2.5 h-2.5 rounded-full bg-sunset-500 animate-ping inline-block" />}
                {isLive ? "● Live" : "Go Live"}
              </h3>
              
              <p className="font-sans text-xs text-sand-300 mt-1 max-w-[150px]">
                {isLive ? "Sharing your live travel location." : "Broadcast your travel live to followers."}
              </p>
            </motion.div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}

export default Home;
