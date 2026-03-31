import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../lib/firebase';
import { getUserProfile } from '../lib/firestore';
import { User, TeamId } from '../types';

// 從 Google Cloud Console 取得
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'YOUR_WEB_CLIENT_ID',
});

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [favoriteTeam, setFavoriteTeam] = useState<TeamId | null>(null);
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
        setFavoriteTeam(profile?.favoriteTeam ?? null);
      } else {
        setUser(null);
        setFavoriteTeam(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

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

  return { user, loading, favoriteTeam, setFavoriteTeam, signInWithGoogle, logout };
}
