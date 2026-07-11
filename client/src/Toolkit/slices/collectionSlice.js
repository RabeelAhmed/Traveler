import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosClient } from "../../utils/axiosClient";
import toast from "react-hot-toast";

export const getUserCollections = createAsyncThunk(
  "collection/getUserCollections",
  async (userId) => {
    try {
      const response = await axiosClient.get(`/collection/user/${userId}`);
      return response.data.result.collections;
    } catch (error) {
      toast.error("Error fetching collections");
      return Promise.reject(error);
    }
  }
);

export const getCollectionById = createAsyncThunk(
  "collection/getCollectionById",
  async (id) => {
    try {
      const response = await axiosClient.get(`/collection/${id}`);
      return response.data.result.collection;
    } catch (error) {
      toast.error("Error retrieving collection");
      return Promise.reject(error);
    }
  }
);

export const createCollection = createAsyncThunk(
  "collection/createCollection",
  async (body) => {
    try {
      const response = await axiosClient.post("/collection", body);
      toast.success("Collection created!");
      return response.data.result.collection;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create collection");
      return Promise.reject(error);
    }
  }
);

export const updateCollection = createAsyncThunk(
  "collection/updateCollection",
  async ({ id, body }) => {
    try {
      const response = await axiosClient.put(`/collection/${id}`, body);
      toast.success("Collection updated!");
      return response.data.result.collection;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update collection");
      return Promise.reject(error);
    }
  }
);

export const deleteCollection = createAsyncThunk(
  "collection/deleteCollection",
  async (id) => {
    try {
      await axiosClient.delete(`/collection/${id}`);
      toast.success("Collection deleted successfully");
      return id;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete collection");
      return Promise.reject(error);
    }
  }
);

export const togglePostInCollection = createAsyncThunk(
  "collection/togglePostInCollection",
  async ({ collectionId, postId }) => {
    try {
      const response = await axiosClient.post(`/collection/${collectionId}/toggle`, { postId });
      return { collectionId, postId, isInCollection: response.data.result.isInCollection };
    } catch (error) {
      toast.error("Error updating collection");
      return Promise.reject(error);
    }
  }
);

const collectionSlice = createSlice({
  name: "collection",
  initialState: {
    collections: [],
    activeCollection: null,
    status: "idle",
  },
  reducers: {
    clearActiveCollection: (state) => {
      state.activeCollection = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUserCollections.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getUserCollections.fulfilled, (state, action) => {
        state.collections = action.payload;
        state.status = "succeeded";
      })
      .addCase(getUserCollections.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(getCollectionById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getCollectionById.fulfilled, (state, action) => {
        state.activeCollection = action.payload;
        state.status = "succeeded";
      })
      .addCase(getCollectionById.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(createCollection.fulfilled, (state, action) => {
        state.collections.unshift(action.payload);
      })
      .addCase(updateCollection.fulfilled, (state, action) => {
        const updated = action.payload;
        if (state.activeCollection && state.activeCollection._id === updated._id) {
          state.activeCollection = {
            ...state.activeCollection,
            name: updated.name,
            description: updated.description,
            isPublic: updated.isPublic,
          };
        }
        const index = state.collections.findIndex((c) => c._id === updated._id);
        if (index !== -1) {
          state.collections[index] = {
            ...state.collections[index],
            name: updated.name,
            description: updated.description,
            isPublic: updated.isPublic,
          };
        }
      })
      .addCase(deleteCollection.fulfilled, (state, action) => {
        state.collections = state.collections.filter((c) => c._id !== action.payload);
        if (state.activeCollection?._id === action.payload) {
          state.activeCollection = null;
        }
      })
      .addCase(togglePostInCollection.fulfilled, (state, action) => {
        const { collectionId, postId, isInCollection } = action.payload;
        // Update local collections list counts and post lists if needed
        const index = state.collections.findIndex((c) => c._id === collectionId);
        if (index !== -1) {
          const col = state.collections[index];
          if (isInCollection) {
            if (!col.posts.includes(postId)) {
              col.posts.push(postId);
              col.postCount = (col.postCount || col.posts.length) + 1;
            }
          } else {
            col.posts = col.posts.filter((id) => id !== postId);
            col.postCount = Math.max(0, (col.postCount || col.posts.length) - 1);
          }
        }
      });
  },
});

export const { clearActiveCollection } = collectionSlice.actions;
export default collectionSlice.reducer;
