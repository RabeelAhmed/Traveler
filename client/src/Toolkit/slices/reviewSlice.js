import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosClient } from "../../utils/axiosClient";
import toast from "react-hot-toast";

// ── Thunks ───────────────────────────────────────────────────────────────────

export const getReviewsForLocation = createAsyncThunk(
  "review/getReviewsForLocation",
  async (location, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get("/review/location", {
        params: { location },
      });
      return response.data.result; // { reviews, summary }
    } catch (err) {
      toast.error("Failed to load reviews");
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getMyReview = createAsyncThunk(
  "review/getMyReview",
  async (location, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get("/review/mine", {
        params: { location },
      });
      return response.data.result.review; // review | null
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createOrUpdateReview = createAsyncThunk(
  "review/createOrUpdateReview",
  async (body, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/review", body);
      toast.success("Review saved!");
      return response.data.result.review;
    } catch (err) {
      toast.error("Failed to save review");
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteReview = createAsyncThunk(
  "review/deleteReview",
  async (id, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/review/${id}`);
      toast.success("Review deleted");
      return id;
    } catch (err) {
      toast.error("Failed to delete review");
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const markHelpful = createAsyncThunk(
  "review/markHelpful",
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(`/review/${reviewId}/helpful`);
      return { reviewId, ...response.data.result }; // { reviewId, isHelpful, helpfulCount }
    } catch (err) {
      toast.error("Failed to mark helpful");
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const reviewSlice = createSlice({
  name: "review",
  initialState: {
    reviews: [],
    summary: null,
    myReview: null,
    status: "idle",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // getReviewsForLocation
      .addCase(getReviewsForLocation.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getReviewsForLocation.fulfilled, (state, action) => {
        state.reviews = action.payload.reviews;
        state.summary = action.payload.summary;
        state.status = "succeeded";
      })
      .addCase(getReviewsForLocation.rejected, (state) => {
        state.status = "failed";
      })

      // getMyReview
      .addCase(getMyReview.fulfilled, (state, action) => {
        state.myReview = action.payload;
      })

      // createOrUpdateReview
      .addCase(createOrUpdateReview.fulfilled, (state, action) => {
        const updated = action.payload;
        state.myReview = updated;
        const idx = state.reviews.findIndex((r) => r._id === updated._id);
        if (idx !== -1) {
          state.reviews[idx] = updated;
        } else {
          state.reviews.unshift(updated);
        }
      })

      // deleteReview
      .addCase(deleteReview.fulfilled, (state, action) => {
        const id = action.payload;
        state.reviews = state.reviews.filter((r) => r._id !== id);
        if (state.myReview?._id === id) state.myReview = null;
      })

      // markHelpful
      .addCase(markHelpful.fulfilled, (state, action) => {
        const { reviewId, isHelpful, helpfulCount } = action.payload;
        const review = state.reviews.find((r) => r._id === reviewId);
        if (review) {
          review.helpfulCount = helpfulCount;
          review._isHelpful = isHelpful;
        }
      });
  },
});

export default reviewSlice.reducer;
