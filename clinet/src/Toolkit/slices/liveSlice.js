import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosClient } from "../../utils/axiosClient";
import toast from "react-hot-toast";

export const fetchLiveUsers = createAsyncThunk(
  "live/fetchLiveUsers",
  async () => {
    try {
      const response = await axiosClient.get("/live/users");
      return response.data.result?.liveUsers || [];
    } catch (error) {
      console.error("Error fetching live users:", error);
      return Promise.reject(error);
    }
  }
);

const liveSlice = createSlice({
  name: "live",
  initialState: {
    liveUsers: {}, // keyed by userId
    isLive: false,
  },
  reducers: {
    addLiveUser: (state, action) => {
      const { userId, lat, lng, username, profilePic } = action.payload;
      state.liveUsers[userId] = { userId, lat, lng, username, profilePic };
    },
    updateLiveUser: (state, action) => {
      const { userId, lat, lng } = action.payload;
      if (state.liveUsers[userId]) {
        state.liveUsers[userId].lat = lat;
        state.liveUsers[userId].lng = lng;
      }
    },
    removeLiveUser: (state, action) => {
      const userId = action.payload;
      delete state.liveUsers[userId];
    },
    setIsLive: (state, action) => {
      state.isLive = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchLiveUsers.fulfilled, (state, action) => {
      const lookup = {};
      action.payload.forEach((user) => {
        lookup[user.userId] = user;
      });
      state.liveUsers = lookup;
    });
  },
});

export const { addLiveUser, updateLiveUser, removeLiveUser, setIsLive } = liveSlice.actions;
export default liveSlice.reducer;
