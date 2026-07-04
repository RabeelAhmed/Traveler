import { configureStore } from "@reduxjs/toolkit";
import appConfigReducer from "./slices/appConfigSlice"
import feedReducer from "./slices/feedSlice";
import storyReducer from "./slices/storySlice";
import userProfileReducer from "./slices/userProfileSlice";
import journeyReducer from "./slices/journeySlice";
import bookmarkReducer from "./slices/bookmarkSlice";
import trendingReducer from "./slices/trendingSlice";
export default configureStore ({
    reducer: {
        appConfig: appConfigReducer,
        feed: feedReducer,
        userProfile: userProfileReducer,
        story:storyReducer,
        journey: journeyReducer,
        bookmark: bookmarkReducer,
        trending: trendingReducer,
    }
})