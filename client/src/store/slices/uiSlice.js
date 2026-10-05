import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'dark',
  sidebarOpen: false,
  apiStatus: 'checking' // 'checking' | 'connected' | 'disconnected'
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setApiStatus: (state, action) => {
      state.apiStatus = action.payload;
    }
  }
});

export const { toggleTheme, setSidebarOpen, setApiStatus } = uiSlice.actions;
export default uiSlice.reducer;
