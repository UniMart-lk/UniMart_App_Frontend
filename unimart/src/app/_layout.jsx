import React from 'react';
import { Stack } from 'expo-router';
import { ChatProvider } from '@/features/chat/ChatContext';

export default function RootLayout() {
  return (
    <ChatProvider>
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    />
    </ChatProvider>
  );
}

