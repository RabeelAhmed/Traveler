import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit2, FiTrash2, FiEye, FiEyeOff, FiFolderPlus, FiFileText } from "react-icons/fi";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

import { getCollectionById, updateCollection, deleteCollection, clearActiveCollection } from "../Toolkit/slices/collectionSlice";
import PostCard from "../Components/PostCard";
import Header from "../Components/Header";
import Loader from "../Components/Loader";
import PageTransition from "../Components/PageTransition";
import SEO from "../Components/SEO";
import { staggerContainer, fadeUp, springPress } from "../utils/motion";

const CollectionView = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const { activeCollection, status } = useSelector((state) => state.collection);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);

  useEffect(() => {
    dispatch(getCollectionById(id));
    return () => {
      dispatch(clearActiveCollection());
    };
  }, [id, dispatch]);

  // Populate edit fields when collection loads
  useEffect(() => {
    if (activeCollection) {
      setEditName(activeCollection.name || "");
      setEditDesc(activeCollection.description || "");
      setEditIsPublic(activeCollection.isPublic !== undefined ? activeCollection.isPublic : true);
    }
  }, [activeCollection]);

  if (status === "loading" && !activeCollection) {
    return <Loader />;
  }

  if (!activeCollection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-sand-500 font-sans p-8">
        <h2 className="text-xl font-bold mb-4">Collection Not Found</h2>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-ocean-600 text-white rounded-xl">
          Go Back
        </button>
      </div>
    );
  }

  const ownerId = activeCollection.owner?._id || activeCollection.owner;
  const isOwner = myProfile?._id === ownerId;

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await dispatch(
        updateCollection({
          id,
          body: {
            name: editName.trim(),
            description: editDesc.trim(),
            isPublic: editIsPublic,
          },
        })
      ).unwrap();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = () => {
    Swal.fire({
      title: "Delete Collection?",
      text: "Are you sure you want to delete this collection? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f1663a",
      cancelButtonColor: "#2f5a79",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await dispatch(deleteCollection(id)).unwrap();
          navigate(`/profile/${myProfile?._id}`);
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  return (
    <PageTransition>
      <SEO title="Collection | Traveler" noindex={true} path={`/collection/${id}`} />
      <div className="bg-sand-50 min-h-screen pb-24 pt-20">
        <Header
          title={activeCollection.name}
          subtitle={`Curated by traveler`}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 text-left">
          {/* Metadata & Actions Card */}
          <div className="bg-white rounded-[32px] border border-sand-150 shadow-[0_12px_40px_rgba(20,41,57,0.03)] p-6 relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-ocean-50/20 to-sand-50/10 rounded-full blur-2xl pointer-events-none" />

            <AnimatePresence mode="wait">
              {!isEditing ? (
                <motion.div
                  key="view"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-sand-100 text-sand-500">
                        Album
                      </span>
                      {activeCollection.isPublic ? (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-ocean-50 text-ocean-600 flex items-center gap-1">
                          <FiEye className="text-xs" /> Public
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-sunset-50 text-sunset-600 flex items-center gap-1">
                          <FiEyeOff className="text-xs" /> Private
                        </span>
                      )}
                    </div>
                    {activeCollection.description && (
                      <p className="font-sans text-xs md:text-sm text-sand-600 leading-relaxed max-w-2xl mt-3">
                        {activeCollection.description}
                      </p>
                    )}
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-2 self-start md:self-center">
                      <motion.button
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black text-sand-700 bg-sand-50 border border-sand-200 hover:bg-sand-100 transition-all duration-300"
                      >
                        <FiEdit2 /> Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleDelete}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-sunset-500 to-sunset-400 hover:from-sunset-600 hover:to-sunset-500 shadow-md shadow-sunset-500/20 transition-all duration-300"
                      >
                        <FiTrash2 /> Delete
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.form
                  key="edit"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  onSubmit={handleSaveEdit}
                  className="space-y-4 relative z-10"
                >
                  <div>
                    <label className="block text-[10px] font-black text-sand-400 uppercase tracking-widest mb-1.5 pl-1">
                      Collection Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-sand-50/50 border border-sand-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:bg-white text-sand-800 font-bold"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={60}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-sand-400 uppercase tracking-widest mb-1.5 pl-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-3 bg-sand-50/50 border border-sand-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:bg-white text-sand-800 resize-none"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      maxLength={200}
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-sand-100 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editIsPublic}
                        onChange={(e) => setEditIsPublic(e.target.checked)}
                        className="rounded text-ocean-600 focus:ring-ocean-500 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-sand-700">Make this collection public</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-sand-500 bg-transparent hover:bg-sand-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 rounded-xl text-xs font-black text-white bg-ocean-600 hover:bg-ocean-700 shadow-sm"
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Posts list grid */}
          <div className="mt-12">
            {activeCollection.posts && activeCollection.posts.length > 0 ? (
              <motion.div
                variants={staggerContainer(0.08, 0.05)}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {activeCollection.posts.map((post) => (
                  <motion.div key={post.id || post._id} variants={fadeUp}>
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-8 bg-white border border-sand-150 rounded-[32px] text-center shadow-[0_8px_30px_rgb(20,41,57,0.01)] max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-sand-50 border border-sand-150 flex items-center justify-center mb-4">
                  <FiFileText className="text-sand-400 text-2xl" />
                </div>
                <h3 className="font-display font-extrabold text-base text-sand-800">
                  Empty Collection
                </h3>
                <p className="font-sans text-xs text-sand-400 mt-2 leading-relaxed">
                  No posts have been added to this collection yet. Hit the add folder icon on any post card to curate it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default CollectionView;
