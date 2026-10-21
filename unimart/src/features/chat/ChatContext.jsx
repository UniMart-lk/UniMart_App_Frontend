import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext(null);
export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  function createConversation(name) {
    const existing = conversations.find(item => item.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing.id;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setConversations(items => [{ id, name: name.trim(), messages: [] }, ...items]);
    return id;
  }
  function sendMessage(id, text) {
    if (!text.trim()) return;
    const message = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text: text.trim(), createdAt: new Date().toISOString() };
    setConversations(items => {
      const conversation = items.find(item => item.id === id);
      if (!conversation) return items;
      return [{ ...conversation, messages: [...conversation.messages, message] }, ...items.filter(item => item.id !== id)];
    });
  }
  function clearConversations() { setConversations([]); }
  return <ChatContext.Provider value={{ conversations, createConversation, sendMessage, clearConversations }}>{children}</ChatContext.Provider>;
}
export function useChat() { return useContext(ChatContext); }
