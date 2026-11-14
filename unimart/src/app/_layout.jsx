import React from 'react';
import { Stack } from 'expo-router';
import { ChatProvider } from '@/features/chat/ChatContext';
import { RentalDraftProvider } from '@/features/rentals/context/RentalDraftContext';

export default function RootLayout() {
  return (
    <ChatProvider>
    <RentalDraftProvider>
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    />
    </RentalDraftProvider>
    </ChatProvider>
  );
}

