import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import { axiosClient } from "../utils/axiosClient";
import { CiLocationOn } from "react-icons/ci";
import { TbMapPin2 } from "react-icons/tb";
import { HiOutlineGlobeAlt } from "react-icons/hi";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* Auto-fit map bounds to all pins */
const FitBounds = ({ pins }) => {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 6, { animate: true });
      return;
    }
    const bounds = pins.map((p) => [p.lat, p.lng]);
    map.fitBounds(bounds, { padding: [32, 32], animate: true });
  }, [pins, map]);
  return null;
};

/* Animated loading skeleton */
const MapSkeleton = () => (
  <div className="relative h-72 md:h-80 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-ocean-50 via-sand-50 to-ocean-100 border border-ocean-100/60 flex flex-col items-center justify-center gap-4">
    {/* Shimmer sweep */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
      initial={{ x: "-100%" }}
      animate={{ x: "100%" }}
      transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
    />
    {/* Faint grid lines like a map */}
    <div className="absolute inset-0 opacity-10"
      style={{
        backgroundImage: "linear-gradient(#41789f 1px, transparent 1px), linear-gradient(90deg, #41789f 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    />
    <motion.div
      animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      className="relative z-10 flex flex-col items-center gap-3"
    >
      <div className="w-14 h-14 rounded-full bg-ocean-100 border-2 border-ocean-200 flex items-center justify-center shadow-lg">
        <HiOutlineGlobeAlt className="text-2xl text-ocean-500" />
      </div>
      <p className="text-xs font-bold text-ocean-500 tracking-wide uppercase">
        Geocoding your travels…
      </p>
      <div className="flex gap-1.5 mt-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-ocean-400"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  </div>
);

const VisitedMap = ({ userId }) => {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePin, setActivePin] = useState(null);
  const totalPosts = pins.reduce((sum, p) => sum + p.count, 0);

  useEffect(() => {
    if (!userId) return;

    const fetchAndGeocode = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/user/visited/${userId}`);
        const locations = response.data?.result?.locations || [];

        const results = [];
        for (const loc of locations) {
          if (!loc.location) continue;
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                loc.location
              )}&format=json&limit=1`,
              { headers: { "Accept-Language": "en" } }
            );
            const geoData = await geoRes.json();
            if (geoData && geoData.length > 0) {
              results.push({
                location: loc.location,
                count: loc.count,
                lat: parseFloat(geoData[0].lat),
                lng: parseFloat(geoData[0].lon),
              });
            }
          } catch (geoErr) {
            console.warn(`Failed to geocode: ${loc.location}`, geoErr);
          }
          await sleep(300);
        }

        setPins(results);
      } catch (err) {
        console.error("VisitedMap fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndGeocode();
  }, [userId]);

  return (
    <div className="bg-white rounded-3xl border border-sand-100/80 shadow-[0_8px_40px_rgb(20,41,57,0.05)] overflow-hidden">

      {/* ── Premium Header Strip ── */}
      <div className="relative bg-gradient-to-r from-ocean-700 via-ocean-600 to-ocean-500 px-6 py-5 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5 blur-xl" />
        <div className="absolute bottom-0 left-1/3 w-20 h-20 rounded-full bg-ocean-400/30 blur-lg" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <HiOutlineGlobeAlt className="text-white text-xl" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-white text-base leading-tight">
                Travel Footprint
              </h3>
              <p className="text-ocean-200 text-[11px] font-medium mt-0.5">
                Everywhere you've posted from
              </p>
            </div>
          </div>

          {/* Stats pills */}
          {!loading && pins.length > 0 && (
            <div className="flex gap-2">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5 text-center">
                <p className="font-display font-extrabold text-white text-sm leading-none">
                  {pins.length}
                </p>
                <p className="text-ocean-200 text-[9px] font-semibold uppercase tracking-wider mt-0.5">
                  Places
                </p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5 text-center">
                <p className="font-display font-extrabold text-white text-sm leading-none">
                  {totalPosts}
                </p>
                <p className="text-ocean-200 text-[9px] font-semibold uppercase tracking-wider mt-0.5">
                  Posts
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Map Body ── */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MapSkeleton />
            </motion.div>
          ) : pins.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-48 w-full rounded-2xl bg-gradient-to-br from-sand-50 to-ocean-50 border border-sand-100 flex flex-col items-center justify-center gap-3"
            >
              <TbMapPin2 className="text-4xl text-sand-300" />
              <p className="text-xs font-bold text-sand-500">No locations to show yet.</p>
              <p className="text-[11px] text-sand-400">Post from places and they'll appear here!</p>
            </motion.div>
          ) : (
            <motion.div
              key="map"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Map container */}
              <div className="h-72 md:h-80 w-full rounded-2xl overflow-hidden border border-sand-100 shadow-inner">
                <MapContainer
                  center={[30, 70]}
                  zoom={4}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={false}
                  zoomControl={true}
                  attributionControl={false}
                >
                  {/* Soft CartoDB Positron tile — clean, premium look */}
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  />
                  <FitBounds pins={pins} />

                  {pins.map((pin, index) => (
                    <CircleMarker
                      key={`${pin.location}-${index}`}
                      center={[pin.lat, pin.lng]}
                      radius={Math.min(8 + pin.count * 2.5, 30)}
                      pathOptions={{
                        fillColor: activePin === index ? "#f97316" : "#41789f",
                        fillOpacity: activePin === index ? 0.9 : 0.75,
                        color: activePin === index ? "#ea580c" : "#2a5a7c",
                        weight: activePin === index ? 2.5 : 1.5,
                      }}
                      eventHandlers={{
                        mouseover: () => setActivePin(index),
                        mouseout: () => setActivePin(null),
                      }}
                    >
                      <Popup
                        closeButton={false}
                        className="visited-map-popup"
                      >
                        <div style={{
                          fontFamily: "inherit",
                          minWidth: 120,
                          padding: "4px 2px",
                        }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 4,
                          }}>
                            <span style={{
                              width: 8, height: 8, borderRadius: "50%",
                              background: "#41789f", display: "inline-block", flexShrink: 0,
                            }} />
                            <span style={{
                              fontWeight: 800, fontSize: 13,
                              color: "#1a2e3b", lineHeight: 1.2,
                            }}>
                              {pin.location}
                            </span>
                          </div>
                          <p style={{
                            fontSize: 11, color: "#7a9ab0", margin: 0,
                            paddingLeft: 14, fontWeight: 600,
                          }}>
                            {pin.count} {pin.count === 1 ? "post" : "posts"} here
                          </p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>

              {/* ── Location chips strip ── */}
              <div className="mt-3 flex flex-wrap gap-2">
                {pins.map((pin, index) => (
                  <motion.div
                    key={`chip-${index}`}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 cursor-default ${
                      activePin === index
                        ? "bg-ocean-600 text-white border-ocean-600 shadow-md"
                        : "bg-sand-50 text-sand-600 border-sand-100 hover:bg-ocean-50 hover:text-ocean-700 hover:border-ocean-200"
                    }`}
                    onMouseEnter={() => setActivePin(index)}
                    onMouseLeave={() => setActivePin(null)}
                  >
                    <CiLocationOn className="text-sm flex-shrink-0" />
                    <span>{pin.location}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      activePin === index ? "bg-white/25 text-white" : "bg-sand-200/60 text-sand-500"
                    }`}>
                      {pin.count}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer attribution ── */}
      {!loading && pins.length > 0 && (
        <div className="px-5 pb-4 text-[10px] text-sand-300 font-sans">
          Map data © <a href="https://carto.com/" className="hover:text-sand-500 transition-colors" target="_blank" rel="noreferrer">CARTO</a> · Geocoding by <a href="https://nominatim.org/" className="hover:text-sand-500 transition-colors" target="_blank" rel="noreferrer">Nominatim</a>
        </div>
      )}
    </div>
  );
};

export default VisitedMap;
