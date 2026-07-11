import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { springPress, scaleIn } from "../utils/motion";

const MoreInfoModal = ({ place, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ocean-950/20 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card container */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="relative bg-white rounded-[2rem] border border-sand-100 p-6 md:p-8 max-w-2xl w-full shadow-[0_8px_30px_rgb(20,41,57,0.12)] z-10 origin-center text-left"
      >
        {/* Close button icon */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-2xl text-sand-400 hover:text-sand-600 transition-colors focus:outline-none"
        >
          &times;
        </button>

        {/* Modal content body */}
        <div className="space-y-4">
          <div>
            <h2 className="font-display font-bold text-xl md:text-2xl text-sand-900 leading-snug">
              {place._key}
            </h2>
            <p className="font-sans text-[10px] font-bold text-ocean-600 uppercase tracking-widest mt-1">
              {place.district}
            </p>
          </div>

          <p className="font-sans text-xs md:text-sm text-sand-600 leading-relaxed max-h-36 overflow-y-auto pr-1">
            {place.Desc}
          </p>

          <p className="font-sans text-[10px] font-semibold text-sand-400">
            Coordinates: Lat {place.latitude.toFixed(4)} • Lng {place.longitude.toFixed(4)}
          </p>

          {/* Leaflet map Container */}
          <div className="relative h-60 w-full rounded-2xl overflow-hidden shadow-inner border border-sand-100">
            <MapContainer
              center={[place.latitude, place.longitude]}
              zoom={13}
              className="h-full w-full absolute inset-0 z-0"
            >
              <TileLayer
                attribution="&copy; <a href='https://carto.com/'>CARTO</a> voyager"
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <Marker
                position={[place.latitude, place.longitude]}
                icon={L.divIcon({
                  className: "custom-leaflet-modal-marker",
                  html: `<div class="w-8 h-8 rounded-full border-2 border-white bg-sunset-500 shadow-md flex items-center justify-center text-white text-xs font-bold font-sans animate-bounce">
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
        </div>
      </motion.div>
    </div>
  );
};

export default MoreInfoModal;
