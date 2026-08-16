import { createAsyncThunk } from "@reduxjs/toolkit";
import { server } from "../../constants/config";
import axios from "axios";

axios.defaults.withCredentials = true;

// ✅ ADMIN LOGIN
export const adminLogin = createAsyncThunk(
  "admin/login",
  async (secretKey, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(
        `${server}/api/v1/admin/login`, // ✅ FIXED (NOT verify)
        { secretKey },
        {
          withCredentials: true,
        }
      );

      return data.message;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

// ✅ GET ADMIN
export const getAdmin = createAsyncThunk(
  "admin/getAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(
        `${server}/api/v1/admin`,
        {
          withCredentials: true,
        }
      );

      return data.admin;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Not authorized"
      );
    }
  }
);

// ✅ LOGOUT
export const adminLogout = createAsyncThunk(
  "admin/logout",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(
        `${server}/api/v1/admin/logout`,
        {
          withCredentials: true,
        }
      );

      return data.message;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Logout failed"
      );
    }
  }
);