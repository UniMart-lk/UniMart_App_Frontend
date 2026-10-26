import React, { createContext, useContext, useState, useMemo } from 'react';

const ChatContext = createContext(null);

const DEFAULT_CONVERSATIONS = [
  {
    id: 'conv-admin-1',
    name: 'UniMart Support Desk',
    role: 'admin', // 'admin' | 'seller'
    badge: 'Official Support',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    onlineStatus: 'Online',
    item: null,
    unreadCount: 1,
    messages: [
      {
        id: 'm-adm-1',
        sender: 'admin',
        text: 'Welcome to UniMart Support! How can our campus administration team assist you today?',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        isRead: true,
      },
      {
        id: 'm-adm-2',
        sender: 'user',
        text: 'Hi, I had a question about student identity verification for vehicle rentals.',
        createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        isRead: true,
      },
      {
        id: 'm-adm-3',
        sender: 'admin',
        text: 'Sure! Please make sure your university registration number and student ID photo are submitted under Profile Settings.',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        isRead: false,
      },
    ],
  },
  {
    id: 'conv-seller-1',
    name: 'Kavindu Perera',
    role: 'seller',
    badge: 'Verified Rental Host',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
    onlineStatus: 'Online',
    item: {
      id: 'item-101',
      title: 'Honda Dio 110cc Scooter',
      category: 'Rental',
      price: 'LKR 2,500 / day',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80',
      location: 'Sabaragamuwa Uni Main Gate',
    },
    unreadCount: 0,
    messages: [
      {
        id: 'm-sel-1',
        sender: 'seller',
        text: 'Hi! Thank you for booking the Honda Dio scooter.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        isRead: true,
      },
      {
        id: 'm-sel-2',
        sender: 'user',
        text: 'Hi Kavindu, will you be near the main gate around 9:00 AM?',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        isRead: true,
      },
      {
        id: 'm-sel-3',
        sender: 'seller',
        text: 'Yes! The key and helmet will be ready at the security gate. Please bring your university student ID.',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        isRead: true,
      },
    ],
  },
  {
    id: 'conv-seller-2',
    name: 'Nimali Senanayake',
    role: 'seller',
    badge: 'Student Seller',
    isVerified: false,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    onlineStatus: 'Active 15m ago',
    item: {
      id: 'item-102',
      title: 'Calculus Early Transcendentals (8th Ed)',
      category: 'Marketplace',
      price: 'LKR 1,500',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
      location: 'Library Common Area',
    },
    unreadCount: 2,
    messages: [
      {
        id: 'm-sel2-1',
        sender: 'user',
        text: 'Hello! Is this calculus book still available? Are there any torn pages?',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        isRead: true,
      },
      {
        id: 'm-sel2-2',
        sender: 'seller',
        text: 'Hello! Yes, the textbook is in great condition, no missing or marked pages.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        isRead: false,
      },
      {
        id: 'm-sel2-3',
        sender: 'seller',
        text: 'We can meet near the library ground floor tomorrow noon if you like!',
        createdAt: new Date(Date.now() - 1200000).toISOString(),
        isRead: false,
      },
    ],
  },
  {
    id: 'conv-admin-2',
    name: 'Safety & Disputes Desk',
    role: 'admin',
    badge: 'Campus Moderator',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80',
    onlineStatus: 'Available 8am - 6pm',
    item: null,
    unreadCount: 0,
    messages: [
      {
        id: 'm-adm2-1',
        sender: 'admin',
        text: 'Official UniMart Safety and Dispute Resolution channel. If you face any issues with transactions or damaged rental items, report here.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        isRead: true,
      },
    ],
  },
];

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS);

  // Compute total unread messages
  const unreadTotal = useMemo(() => {
    return conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
  }, [conversations]);

  // Create or retrieve existing conversation with a seller or admin
  function createOrGetConversation({
    name,
    role = 'seller',
    badge,
    isVerified = false,
    avatar,
    item = null,
  }) {
    const trimmedName = (name || 'Contact').trim();

    // Check if an existing conversation exists with this person for the same item (or same name for admins)
    const existing = conversations.find((c) => {
      const sameName = c.name.toLowerCase() === trimmedName.toLowerCase();
      if (item && c.item) {
        return sameName && (c.item.id === item.id || c.item.title === item.title);
      }
      return sameName && c.role === role;
    });

    if (existing) {
      return existing.id;
    }

    const newId = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newConv = {
      id: newId,
      name: trimmedName,
      role,
      badge: badge || (role === 'admin' ? 'Official Admin' : 'Student Seller'),
      isVerified: role === 'admin' ? true : isVerified,
      avatar:
        avatar ||
        (role === 'admin'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'),
      onlineStatus: 'Online',
      item,
      unreadCount: 0,
      messages: [
        {
          id: `m-init-${Date.now()}`,
          sender: role,
          text:
            role === 'admin'
              ? `Hello! This is UniMart ${trimmedName}. How can we support your campus activities?`
              : `Hi! Thanks for reaching out regarding "${item?.title || 'my listing'}". Feel free to ask any questions.`,
          createdAt: new Date().toISOString(),
          isRead: true,
        },
      ],
    };

    setConversations((prev) => [newConv, ...prev]);
    return newId;
  }

  // Send a message
  function sendMessage(conversationId, text) {
    if (!text || !text.trim()) return;

    const userMessage = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'user',
      text: text.trim(),
      createdAt: new Date().toISOString(),
      isRead: true,
    };

    setConversations((items) => {
      const target = items.find((c) => c.id === conversationId);
      if (!target) return items;

      const updated = {
        ...target,
        messages: [...target.messages, userMessage],
      };

      // Move updated conversation to top
      return [updated, ...items.filter((c) => c.id !== conversationId)];
    });

    // Provide automated simulation replies for a rich interactive experience
    simulatePartnerReply(conversationId, text.trim());
  }

  // Simulate contextual reply from seller or admin after 1-2 seconds
  function simulatePartnerReply(conversationId, userText) {
    setTimeout(() => {
      setConversations((items) => {
        const target = items.find((c) => c.id === conversationId);
        if (!target) return items;

        let replyText = '';
        if (target.role === 'admin') {
          replyText =
            'Thank you for contacting UniMart Support. Our campus administration desk has recorded your message and will update you shortly.';
        } else {
          const lower = userText.toLowerCase();
          if (lower.includes('available') || lower.includes('have')) {
            replyText = 'Yes, it is still available! When would you like to inspect it or arrange pickup?';
          } else if (lower.includes('price') || lower.includes('discount') || lower.includes('last price')) {
            replyText = 'The price listed is student-friendly, but I could consider a small discount if we meet on campus!';
          } else if (lower.includes('where') || lower.includes('meet') || lower.includes('location')) {
            replyText = 'We can meet near the University Main Gate or Student Cafeteria during break times.';
          } else {
            replyText = 'Got it! Thanks for the message. I will check and get back to you in a few minutes.';
          }
        }

        const replyMessage = {
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sender: target.role,
          text: replyText,
          createdAt: new Date().toISOString(),
          isRead: false,
        };

        const updated = {
          ...target,
          unreadCount: (target.unreadCount || 0) + 1,
          messages: [...target.messages, replyMessage],
        };

        return [updated, ...items.filter((c) => c.id !== conversationId)];
      });
    }, 1200);
  }

  // Mark all messages as read
  function markAsRead(conversationId) {
    setConversations((items) =>
      items.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            unreadCount: 0,
            messages: c.messages.map((m) => ({ ...m, isRead: true })),
          };
        }
        return c;
      })
    );
  }

  // Delete conversation
  function deleteConversation(conversationId) {
    setConversations((items) => items.filter((c) => c.id !== conversationId));
  }

  function clearConversations() {
    setConversations([]);
  }

  return (
    <ChatContext.Provider
      value={{
        conversations,
        unreadTotal,
        createOrGetConversation,
        sendMessage,
        markAsRead,
        deleteConversation,
        clearConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
