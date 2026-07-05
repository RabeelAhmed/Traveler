import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { axiosClient } from "../utils/axiosClient";
import { CiLocationOn } from "react-icons/ci";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const VisitedMap = ({ userId }) => {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);

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
              {
                headers: {
                  "Accept-Language": "en",
                  // Nominatim requires a User-Agent for production use
                  "User-Agent": "TravelerApp/1.0",
                },
              }
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
          // Respect Nominatim's 1 req/sec rate limit
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

  if (loading) {
    return (
      <div className="h-64 md:h-80 w-full rounded-3xl bg-sand-100 border border-sand-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <CiLocationOn className="text-4xl text-sand-300" />
          <p className="text-xs font-semibold text-sand-400">
            Loading travel map…
          </p>
        </div>
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div className="h-40 w-full rounded-3xl bg-sand-50 border border-sand-100 flex items-center justify-center">
        <p className="text-xs text-sand-400 font-semibold">
          No geocodeable locations found yet.
        </p>
      </div>
    );
  }

  return (
    <div className="h-64 md:h-80 w-full rounded-3xl overflow-hidden border border-sand-100 shadow-[0_8px_30px_rgb(20,41,57,0.02)]">
      <MapContainer
        center={[30, 70]}
        zoom={4}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pins.map((pin, index) => (
          <CircleMarker
            key={`${pin.location}-${index}`}
            center={[pin.lat, pin.lng]}
            radius={Math.min(8 + pin.count * 2, 28)}
            pathOptions={{
              fillColor: "#41789f",
              fillOpacity: 0.7,
              color: "#2a5a7c",
              weight: 1.5,
            }}
          >
            <Popup>
              <div className="text-xs font-semibold text-gray-700">
                <p className="font-bold text-sm mb-0.5">{pin.location}</p>
                <p className="text-gray-500">
                  {pin.count} {pin.count === 1 ? "post" : "posts"}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default VisitedMap;
