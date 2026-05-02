import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import authService from "../service/authService";
import { STORAGE_KEYS } from "../utils/constants";

const AuthContext = createContext(null);

const getStoredUser = () => {
  const value = localStorage.getItem(STORAGE_KEYS.USER);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEYS.TOKEN));
  const [loading, setLoading] = useState(true);

  const syncUserState = useCallback((userData, tokenValue) => {
    setUser(userData);
    setToken(tokenValue || null);

    if (userData && tokenValue) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      localStorage.setItem(STORAGE_KEYS.TOKEN, tokenValue);
      return;
    }

    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }, []);

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);

    if (!storedToken) {
      syncUserState(null, null);
      setLoading(false);
      return null;
    }

    try {
      const userData = await authService.getCurrentUser();
      syncUserState(userData, storedToken);
      return userData;
    } catch (error) {
      console.error("Auth check failed:", error);
      syncUserState(null, null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [syncUserState]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const { user: userData, token: nextToken } = await authService.login(
      email,
      password
    );
    syncUserState(userData, nextToken);
    return userData;
  };

  const register = async (name, email, password) => {
    const { user: userData, token: nextToken } = await authService.register(
      name,
      email,
      password
    );
    syncUserState(userData, nextToken);
    return userData;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      syncUserState(null, null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
