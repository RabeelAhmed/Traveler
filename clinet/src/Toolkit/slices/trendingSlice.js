import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosClient } from "../../utils/axiosClient";
import toast from "react-hot-toast";

export const getTrendingDestinations = createAsyncThunk(
  "trending/getDestinations",
  async () => {
    try {
      const response = await axiosClient.get("/post/trending-destinations");
      return response.data.result;
    } catch (error) {
      toast.error("Error fetching trending destinations");
      return Promise.reject(error);
    }
  }
);

const trendingSlice = createSlice({
  name: "trending",
  initialState: {
    destinations: [],
    status: "idle",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getTrendingDestinations.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getTrendingDestinations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.destinations = action.payload.destinations;
      })
      .addCase(getTrendingDestinations.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default trendingSlice.reducer;
