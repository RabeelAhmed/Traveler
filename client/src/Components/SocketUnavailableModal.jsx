/**
 * SocketUnavailableModal.jsx
 *
 * A professional, animated modal displayed when a user attempts to use a
 * Socket.IO-dependent feature while the backend is hosted on Vercel serverless
 * (which does not support persistent WebSocket connections).
 *
 * ARCHITECTURE:
 * - This component listens for the "socket:unavailable" custom DOM event fired by
 *   `useSocketAvailability.js`. This decoupled approach avoids prop drilling.
 * - It renders once at the application root inside App.jsx and is therefore
 *   available on every page without needing to re-mount per-page.
 *
 * TO REMOVE IN FUTURE:
 * When Socket.IO is re-enabled (VITE_SOCKET_IO_ENABLED=true), this modal will
 * never appear because the hook will never dispatch the event. You may safely
 * delete this file and its import in App.jsx at that point.
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiX, HiLightningBolt, HiInformationCircle } from "react-icons/hi";

// ─── Animation Variants ───────────────────────────────────────────────────────
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.93, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 380, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.18 },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SocketUnavailableModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for the global "socket:unavailable" custom event dispatched by
  // useSocketAvailability.showUnavailableModal().
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("socket:unavailable", handleOpen);
    return () => window.removeEventListener("socket:unavailable", handleOpen);
  }, []);

  const handleClose = useCallback(() => setIsOpen(false), []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        // ── Backdrop ──────────────────────────────────────────────────────────
        <motion.div
          key="socket-modal-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(11, 24, 33, 0.75)", backdropFilter: "blur(6px)" }}
          aria-modal="true"
          role="dialog"
          aria-labelledby="socket-modal-title"
        >
          {/* ── Modal Panel ─────────────────────────────────────────────────── */}
          <motion.div
            key="socket-modal-panel"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(21, 42, 60, 0.97) 0%, rgba(15, 28, 41, 0.99) 100%)",
              border: "1px solid rgba(70, 134, 180, 0.25)",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(70, 134, 180, 0.1)",
            }}
          >
            {/* Subtle top gradient accent */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(70,134,180,0.6), transparent)" }}
            />

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                {/* Icon badge */}
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                  style={{ background: "rgba(70,134,180,0.15)", border: "1px solid rgba(70,134,180,0.3)" }}
                >
                  <HiLightningBolt className="text-xl" style={{ color: "#6aa1c8" }} />
                </div>

                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-widest mb-0.5"
                    style={{ color: "#6aa1c8" }}
                  >
                    Service Notice
                  </p>
                  <h2
                    id="socket-modal-title"
                    className="text-white text-lg font-bold leading-tight"
                    style={{ fontFamily: "inherit" }}
                  >
                    Feature Currently Unavailable
                  </h2>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                aria-label="Close notification"
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0 mt-0.5"
                style={{ color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                }}
              >
                <HiX className="text-lg" />
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0 24px" }} />

            {/* ── Body ──────────────────────────────────────────────────────── */}
            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
                Real-time features — including <strong className="text-white">live location sharing</strong>,{" "}
                <strong className="text-white">instant notifications</strong>, and{" "}
                <strong className="text-white">live messaging</strong> — are currently unavailable.
              </p>

              <p className="text-sm leading-relaxed mt-3" style={{ color: "rgba(255,255,255,0.72)" }}>
                These features require persistent server connections that are not supported on our
                current serverless hosting. All other functionality remains fully operational.
              </p>

              {/* Info callout */}
              <div
                className="flex items-start gap-3 mt-5 p-4 rounded-xl"
                style={{ background: "rgba(70,134,180,0.08)", border: "1px solid rgba(70,134,180,0.2)" }}
              >
                <HiInformationCircle className="text-lg flex-shrink-0 mt-0.5" style={{ color: "#6aa1c8" }} />
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                  We are actively working to migrate to a hosting solution that supports real-time
                  communication. Thank you for your patience.
                </p>
              </div>
            </div>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <div className="px-6 pb-6">
              <motion.button
                onClick={handleClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #41789f 0%, #2f5a79 100%)",
                  color: "#ffffff",
                  border: "1px solid rgba(70,134,180,0.4)",
                  boxShadow: "0 4px 15px rgba(41,90,121,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #4686b4 0%, #214259 100%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #41789f 0%, #2f5a79 100%)";
                }}
              >
                Got it, thanks
              </motion.button>
            </div>

            {/* Subtle bottom-right glow */}
            <div
              className="absolute bottom-0 right-0 w-32 h-32 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(70,134,180,0.08) 0%, transparent 70%)",
                transform: "translate(30%, 30%)",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
