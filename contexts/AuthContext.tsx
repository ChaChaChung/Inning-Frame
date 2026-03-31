import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../lib/firebase';
import { getUserProfile, setFavoriteTeam as saveFavoriteTeam, setNickname as saveNickname } from '../lib/firestore';
import { User, TeamId } from '../types';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'YOUR_WEB_CLIENT_ID',
});

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  favoriteTeam: TeamId | null;
  nickname: string | null;
  setFavoriteTeam: (teamId: TeamId | null) => void;
  setNickname: (nickname: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favoriteTeam, setFavoriteTeamState] = useState<TeamId | null>(null);
  const [nickname, setNicknameState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          displayName: firebaseUser.displayName ?? '球迷',
          photoURL: firebaseUser.photoURL ?? undefined,
        });
        const profile = await getUserProfile(firebaseUser.uid);
        setFavoriteTeamState(profile?.favoriteTeam ?? null);
        setNicknameState(profile?.nickname ?? null);
      } else {
        setUser(null);
        setFavoriteTeamState(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const setFavoriteTeam = (teamId: TeamId | null) => {
    setFavoriteTeamState(teamId);
    if (user && teamId) saveFavoriteTeam(user.uid, teamId);
  };

  const setNickname = async (name: string) => {
    setNicknameState(name);
    if (user) await saveNickname(user.uid, name);
  };

  const signInWithGoogle = async () => {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (response.type === 'success') {
      const { idToken } = response.data;
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    }
  };

  const logout = async () => {
    await signOut(auth);
    await GoogleSignin.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, favoriteTeam, nickname, setFavoriteTeam, setNickname, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
