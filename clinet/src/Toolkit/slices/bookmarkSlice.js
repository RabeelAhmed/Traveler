import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosClient } from "../../utils/axiosClient";
import toast from "react-hot-toast";

export const getSavedPosts = createAsyncThunk(
  "bookmark/getSavedPosts",
  async () => {
    try {
      const response = await axiosClient.get("/bookmark");
      return response.data.result;
    } catch (error) {
      toast.error("Error Getting Saved Posts");
      return Promise.reject(error);
    }
  }
);

export const toggleBookmark = createAsyncThunk(
  "bookmark/toggleBookmark",
  async (postId) => {
    try {
      const response = await axiosClient.post(`/bookmark/toggle/${postId}`);
      return { postId, ...response.data.result };
    } catch (error) {
      toast.error("Error Toggling Bookmark");
      return Promise.reject(error);
    }
  }
);

const bookmarkSlice = createSlice({
  name: "bookmark",
  initialState: {
    savedPosts: [],
    savedPostIds: [],
    status: "idle",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSavedPosts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getSavedPosts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.savedPosts = action.payload.posts;
        state.savedPostIds = action.payload.posts.map((p) => p.id);
      })
      .addCase(getSavedPosts.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(toggleBookmark.fulfilled, (state, action) => {
        const { postId, isSaved } = action.payload;
        if (isSaved) {
          if (!state.savedPostIds.includes(postId)) {
            state.savedPostIds.push(postId);
          }
        } else {
          state.savedPostIds = state.savedPostIds.filter((id) => id !== postId);
          state.savedPosts = state.savedPosts.filter((post) => post.id !== postId);
        }
      });
  },
});

export default bookmarkSlice.reducer;
