import '../global.css';
import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

function RootNavigator() {
  const { user, loading, favoriteTeam } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ticket/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="ticket/[id]" options={{ presentation: 'modal' }} />
      </Stack>
      {!user && <Redirect href="/(auth)/login" />}
      {user && favoriteTeam === null && <Redirect href="/onboarding" />}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
