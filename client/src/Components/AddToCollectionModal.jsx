import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPlus, FiFolder, FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";

import { getUserCollections, createCollection, togglePostInCollection } from "../Toolkit/slices/collectionSlice";
import { scaleIn } from "../utils/motion";

const AddToCollectionModal = ({ postId, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const { collections, status } = useSelector((state) => state.collection);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [localToggles, setLocalToggles] = useState({}); // { [colId]: boolean }

  useEffect(() => {
    if (isOpen && myProfile?._id) {
      dispatch(getUserCollections(myProfile._id));
    }
  }, [isOpen, myProfile, dispatch]);

  // Sync local toggles when collections load
  useEffect(() => {
    if (collections.length > 0 && postId) {
      const initialToggles = {};
      collections.forEach((col) => {
        const postIdent = (postId?._id || postId)?.toString();
        initialToggles[col._id] = col.posts?.some((p) => {
          const pid = (p?._id || p)?.toString();
          return pid === postIdent;
        });
      });
      setLocalToggles(initialToggles);
    }
  }, [collections, postId]);

  if (!isOpen) return null;

  const handleToggle = async (collectionId) => {
    try {
      const result = await dispatch(
        togglePostInCollection({ collectionId, postId: (postId?._id || postId)?.toString() })
      ).unwrap();
      
      setLocalToggles((prev) => ({
        ...prev,
        [collectionId]: result.isInCollection,
      }));

      toast.success(
        result.isInCollection
          ? "Added to collection!"
          : "Removed from collection!"
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAndToggle = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) {
      toast.error("Collection name is required");
      return;
    }

    try {
      const newCol = await dispatch(
        createCollection({
          name: newCollectionName.trim(),
          isPublic: true,
        })
      ).unwrap();

      // Clear input and hide form
      setNewCollectionName("");
      setShowCreateForm(false);

      // Auto-toggle the newly created collection
      await handleToggle(newCol._id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-[32px] border border-sand-150 shadow-2xl p-6 md:p-8 w-full max-w-sm relative text-left"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-sand-50 hover:bg-sand-100/80 text-sand-500 hover:text-sand-800 flex items-center justify-center transition-colors duration-250 focus:outline-none"
          >
            <FiX className="text-sm" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <h3 className="font-display font-black text-base text-sand-900">
              Add to Album
            </h3>
            <p className="font-sans text-[11px] text-sand-400 font-bold uppercase tracking-wider mt-1">
              Curate your favorite travel moments
            </p>
          </div>

          {/* Collections List */}
          <div className="max-h-[240px] overflow-y-auto space-y-2 mb-6 pr-1 custom-scrollbar">
            {status === "loading" && collections.length === 0 ? (
              <div className="flex justify-center py-6">
                <span className="w-5 h-5 rounded-full border-2 border-ocean-500 border-t-transparent animate-spin" />
              </div>
            ) : collections.length > 0 ? (
              collections.map((col) => {
                const isChecked = !!localToggles[col._id];
                return (
                  <label
                    key={col._id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${
                      isChecked
                        ? "bg-ocean-50/40 border-ocean-200/60 text-ocean-950 font-bold"
                        : "bg-sand-50/30 border-sand-150 hover:bg-sand-50/80 hover:border-sand-200 text-sand-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FiFolder className={`text-sm flex-shrink-0 ${isChecked ? "text-ocean-500" : "text-sand-400"}`} />
                      <span className="text-xs truncate">{col.name}</span>
                    </div>
                    
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(col._id)}
                      className="hidden"
                    />
                    
                    {/* Custom Checkbox circle */}
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isChecked
                        ? "bg-ocean-600 border-ocean-600 text-white"
                        : "border-sand-300 bg-white"
                    }`}>
                      {isChecked && <FiCheck className="text-[10px] stroke-[3]" />}
                    </div>
                  </label>
                );
              })
            ) : (
              <p className="text-xs text-sand-450 text-center py-6">
                You don't have any collections yet.
              </p>
            )}
          </div>

          {/* Create Form or Trigger Button */}
          <div className="border-t border-sand-100 pt-4">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-sand-300 hover:border-ocean-300 text-sand-500 hover:text-ocean-600 text-xs font-bold transition-all duration-300"
              >
                <FiPlus /> New Album
              </button>
            ) : (
              <form onSubmit={handleCreateAndToggle} className="space-y-3">
                <input
                  type="text"
                  placeholder="Album name..."
                  className="w-full px-3.5 py-2.5 bg-sand-50 border border-sand-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:bg-white text-sand-800"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  maxLength={60}
                  autoFocus
                  required
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-sand-500 bg-transparent hover:bg-sand-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-ocean-600 hover:bg-ocean-700 shadow-sm"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddToCollectionModal;
