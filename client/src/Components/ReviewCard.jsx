import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import StarRating from "../Components/StarRating";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { FiTrash2 } from "react-icons/fi";
import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { markHelpful, deleteReview } from "../Toolkit/slices/reviewSlice";
import { fadeUp, springPress } from "../utils/motion";

const ReviewCard = ({ review }) => {
  const dispatch = useDispatch();
  const myProfile = useSelector((state) => state.appConfig.myProfile);
  const curUserId = myProfile?._id;

  const { author, rating, title, body, visitedAt, helpful = [], createdAt, _id } = review;

  // Support both populated helpful array and the _isHelpful flag from Redux
  const isHelpful =
    review._isHelpful !== undefined
      ? review._isHelpful
      : helpful.some((uid) => {
          const id = uid?._id || uid;
          return id?.toString() === curUserId?.toString();
        });

  const helpfulCount =
    review.helpfulCount !== undefined ? review.helpfulCount : helpful.length;

  const isAuthor = author?._id?.toString() === curUserId?.toString();

  const handleHelpful = () => {
    dispatch(markHelpful(_id));
  };

  const handleDelete = () => {
    if (window.confirm("Delete your review? This cannot be undone.")) {
      dispatch(deleteReview(_id));
    }
  };

  return (
    <motion.article
      variants={fadeUp}
      className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(20,41,57,0.06)] border border-sand-100/60 p-5 sm:p-6"
    >
      {/* Top row: author info */}
      <div className="flex items-start gap-3 mb-4">
        <Link to={`/profile/${author?._id}`} className="flex-shrink-0">
          <img
            src={author?.profilePicture?.url || "/default-profile.png"}
            alt={`${author?.fullname || "User"}'s profile picture`}
            loading="lazy"
            className="w-10 h-10 rounded-full object-cover border-2 border-sand-100"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            to={`/profile/${author?._id}`}
            className="font-semibold text-sm text-sand-900 hover:text-ocean-600 transition-colors"
          >
            {author?.fullname}
          </Link>
          <p className="text-xs text-sand-400 mt-0.5">
            Visited {visitedAt ? format(new Date(visitedAt), "MMM yyyy") : "—"}
            {" · "}
            <span className="text-sand-300">
              {createdAt ? format(new Date(createdAt), "MMM d, yyyy") : ""}
            </span>
          </p>
        </div>

        {/* Rating stars — top right */}
        <div className="flex-shrink-0">
          <StarRating
            count={5}
            value={rating}
            edit={false}
            size={18}
            activeColor="#41789f"
          />
        </div>
      </div>

      {/* Title & body */}
      <h3 className="font-display font-semibold text-sand-900 text-base mb-1.5">{title}</h3>
      <p className="text-sm text-sand-700 leading-relaxed">{body}</p>

      {/* Bottom row: helpful + delete */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-sand-50">
        <motion.button
          {...springPress}
          onClick={handleHelpful}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
            isHelpful
              ? "bg-jade-50 text-jade-600 border border-jade-200"
              : "bg-sand-50 text-sand-500 border border-sand-200 hover:bg-jade-50 hover:text-jade-600 hover:border-jade-200"
          }`}
        >
          {isHelpful ? (
            <AiFillLike className="text-base" />
          ) : (
            <AiOutlineLike className="text-base" />
          )}
          Helpful {helpfulCount > 0 && `(${helpfulCount})`}
        </motion.button>

        {isAuthor && (
          <motion.button
            {...springPress}
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors ml-auto"
          >
            <FiTrash2 className="text-sm" />
            Delete
          </motion.button>
        )}
      </div>
    </motion.article>
  );
};

export default ReviewCard;
