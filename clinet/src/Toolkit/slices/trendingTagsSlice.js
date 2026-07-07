import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosClient } from "../../utils/axiosClient";

export const getTrendingTags = createAsyncThunk(
  "tags/getTrendingTags",
  async () => {
    const response = await axiosClient.get("/post/trending-tags");
    return response.data.result.tags; // [{ tag, count }]
  }
);

const trendingTagsSlice = createSlice({
  name: "trendingTags",
  initialState: {
    tags: [],
    status: "idle",
  },
  reducers: {
    // Called by socket newPost listener to refresh tags
    refreshTags: (state) => {
      state.status = "idle"; // triggers re-fetch on next render
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTrendingTags.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getTrendingTags.fulfilled, (state, action) => {
        state.tags = action.payload;
        state.status = "succeeded";
      })
      .addCase(getTrendingTags.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export const { refreshTags } = trendingTagsSlice.actions;
export default trendingTagsSlice.reducer;
