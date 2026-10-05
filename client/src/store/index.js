import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice.js';
import authReducer from './slices/authSlice.js';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer
  }
});

export default store;
