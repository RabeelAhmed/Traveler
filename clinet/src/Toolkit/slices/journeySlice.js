import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosClient } from "../../utils/axiosClient";
import toast from "react-hot-toast";

export const getJourney = createAsyncThunk(
  "journey/getJourney",
  async (id) => {
    try {
      const response = await axiosClient.get(`/journey/${id}`);
      return response.data.result.journey;
    } catch (error) {
      toast.error("Error retrieving journey details");
      return Promise.reject(error);
    }
  }
);

export const startJourney = createAsyncThunk(
  "journey/startJourney",
  async (body) => {
    try {
      const response = await axiosClient.post("/journey/start", body);
      toast.success(response.data.message || "Journey started!");
      return response.data.result.journey;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start journey");
      return Promise.reject(error);
    }
  }
);

export const addStep = createAsyncThunk(
  "journey/addStep",
  async ({ id, body }) => {
    try {
      const response = await axiosClient.post(`/journey/${id}/addstep`, body);
      toast.success(response.data.message || "Step added successfully!");
      return response.data.result.post;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add step");
      return Promise.reject(error);
    }
  }
);

export const endJourney = createAsyncThunk(
  "journey/endJourney",
  async (id) => {
    try {
      const response = await axiosClient.post(`/journey/${id}/end`);
      toast.success(response.data.message || "Journey completed!");
      return response.data.result.journey;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete journey");
      return Promise.reject(error);
    }
  }
);

export const inviteCollaborator = createAsyncThunk(
  "journey/inviteCollaborator",
  async ({ journeyId, userId }) => {
    try {
      const response = await axiosClient.post(`/journey/${journeyId}/invite`, { userId });
      toast.success("Invite sent!");
      return response.data.result;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send invite");
      return Promise.reject(error);
    }
  }
);

export const respondToInvite = createAsyncThunk(
  "journey/respondToInvite",
  async ({ journeyId, accept }) => {
    try {
      const response = await axiosClient.post(`/journey/${journeyId}/invite/respond`, { accept });
      return { ...response.data.result, journeyId, accept };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to respond to invite");
      return Promise.reject(error);
    }
  }
);

export const removeCollaborator = createAsyncThunk(
  "journey/removeCollaborator",
  async ({ journeyId, userId }) => {
    try {
      await axiosClient.delete(`/journey/${journeyId}/collaborator/${userId}`);
      toast.success("Collaborator removed");
      return { journeyId, userId };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove collaborator");
      return Promise.reject(error);
    }
  }
);

const journeySlice = createSlice({
  name: "journey",
  initialState: {
    currentJourney: null,
    status: "idle",
  },
  reducers: {
    clearCurrentJourney: (state) => {
      state.currentJourney = null;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getJourney.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getJourney.fulfilled, (state, action) => {
        state.currentJourney = action.payload;
        state.status = "succeeded";
      })
      .addCase(getJourney.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(startJourney.fulfilled, (state, action) => {
        state.currentJourney = action.payload;
        state.status = "succeeded";
      })
      .addCase(addStep.fulfilled, (state, action) => {
        if (state.currentJourney) {
          state.currentJourney.steps.push(action.payload);
        }
      })
      .addCase(endJourney.fulfilled, (state, action) => {
        state.currentJourney = action.payload;
      })
      .addCase(respondToInvite.fulfilled, (state, action) => {
        // If user accepted, they are now a collaborator on this journey
        // (The journey page will refetch; this handles invite notifications)
      })
      .addCase(removeCollaborator.fulfilled, (state, action) => {
        if (state.currentJourney) {
          const { userId } = action.payload;
          state.currentJourney.collaborators = state.currentJourney.collaborators.filter(
            (c) => (c._id || c).toString() !== userId.toString()
          );
        }
      })
      .addMatcher(
        (action) => action.type === "post/likeAndUnlike/fulfilled",
        (state, action) => {
          const post = action.payload.post;
          if (state.currentJourney && state.currentJourney.steps) {
            const stepIndex = state.currentJourney.steps.findIndex(
              (s) => s.id === post._id || s.id === post.id
            );
            if (stepIndex !== -1) {
              const currentStep = state.currentJourney.steps[stepIndex];
              currentStep.likes = post.likes;
              currentStep.likesCount = post.likes.length;
              currentStep.isLikedByUser = post.isLikedByUser;
            }
          }
        }
      )
      .addMatcher(
        (action) => action.type === "post/addComment/fulfilled",
        (state, action) => {
          const post = action.payload.responsePost;
          if (state.currentJourney && state.currentJourney.steps) {
            const stepIndex = state.currentJourney.steps.findIndex(
              (s) => s.id === post._id || s.id === post.id
            );
            if (stepIndex !== -1) {
              const currentStep = state.currentJourney.steps[stepIndex];
              currentStep.comments = post.comments;
            }
          }
        }
      );
  },
});

export const { clearCurrentJourney } = journeySlice.actions;
export default journeySlice.reducer;
