/**
 * AuthContext — provides Firebase Auth state and user settings globally.
 * Wraps the entire app so any component can access the current user.
 */
import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { updateProfile } from "firebase/auth";
import {
  onAuthChange, signInWithGoogle, signOut,
  fsGetSettings, fsSaveSettings,
  type UserSettings, DEFAULT_SETTINGS,
} from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  settings: UserSettings;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  signOut: () => Promise<void>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        const s = await fsGetSettings(u.uid);
        setSettings(s);
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const logOut = useCallback(async () => {
    await signOut();
  }, []);

  const updateSettings = useCallback(
    async (patch: Partial<UserSettings>) => {
      if (!user) return;
      const next = { ...settings, ...patch };
      setSettings(next);
      await fsSaveSettings(user.uid, patch);
    },
    [user, settings]
  );

  const updateUserProfile = useCallback(
    async (displayName: string) => {
      if (!user) return;
      await updateProfile(user, { displayName });
      // Force re-render with updated user
      setUser({ ...user, displayName } as User);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, settings, signIn, logOut, signOut: logOut, updateSettings, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
