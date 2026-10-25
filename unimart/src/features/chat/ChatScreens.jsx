import React, { useState, useRef, useEffect, useMemo } from 'react';
import {View,Text,StyleSheet,FlatList,TouchableOpacity,TextInput,Image,KeyboardAvoidingView,Platform,Modal,Alert, ScrollView,} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from './ChatContext';

const COLORS = {
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryBorder: '#BFDBFE',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  adminBg: '#F0F9FF',
  adminBorder: '#BAE6FD',
  adminText: '#0369A1',
  sellerBg: '#F0FDF4',
  sellerBorder: '#BBF7D0',
  sellerText: '#15803D',
  danger: '#EF4444',
  warning: '#F59E0B',
};

// Formatter for timestamps
function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffHours = (now - date) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffHours < 48) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// -------------------------------------------------------------
// 1. CONVERSATIONS LIST SCREEN
// -------------------------------------------------------------
export function ConversationList() {
  const insets = useSafeAreaInsets();
  const { conversations, createOrGetConversation } = useChat();

  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Sellers' | 'Admins'
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newSellerName, setNewSellerName] = useState('');

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((item) => {
      // Tab filter
      if (activeTab === 'Sellers' && item.role !== 'seller') return false;
      if (activeTab === 'Admins' && item.role !== 'admin') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchItem = item.item?.title.toLowerCase().includes(query);
        const matchLastMsg = item.messages[item.messages.length - 1]?.text.toLowerCase().includes(query);
        return matchName || matchItem || matchLastMsg;
      }
      return true;
    });
  }, [conversations, activeTab, searchQuery]);

  function handleOpenChat(id) {
    router.push({ pathname: '/chat/[id]', params: { id } });
  }

  function handleStartAdminChat(topic) {
    const id = createOrGetConversation({
      name: `UniMart Support (${topic})`,
      role: 'admin',
      badge: 'Official Support',
      isVerified: true,
    });
    setIsNewChatModalOpen(false);
    handleOpenChat(id);
  }

  function handleStartSellerChat() {
    if (!newSellerName.trim()) return;
    const id = createOrGetConversation({
      name: newSellerName.trim(),
      role: 'seller',
      badge: 'Student Seller',
      isVerified: false,
    });
    setNewSellerName('');
    setIsNewChatModalOpen(false);
    handleOpenChat(id);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.iconButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/home');
            }
          }}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.flex}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>
            Chat with Campus Sellers & UniMart Admins
          </Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Start new conversation"
          style={styles.newChatIconButton}
          onPress={() => setIsNewChatModalOpen(true)}
        >
          <Ionicons name="create-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* 2. Search Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, item, or message..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* 3. Filter Tabs (All, Sellers, Admins) */}
      <View style={styles.tabsRow}>
        {[
          { label: 'All', icon: 'chatbubbles' },
          { label: 'Sellers', icon: 'storefront' },
          { label: 'Admins', icon: 'shield-checkmark' },
        ].map((tab) => {
          const isSelected = activeTab === tab.label;
          let count = conversations.length;
          if (tab.label === 'Sellers') count = conversations.filter((c) => c.role === 'seller').length;
          if (tab.label === 'Admins') count = conversations.filter((c) => c.role === 'admin').length;

          return (
            <TouchableOpacity
              key={tab.label}
              style={[styles.filterTab, isSelected && styles.filterTabActive]}
              onPress={() => setActiveTab(tab.label)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={isSelected ? '#FFFFFF' : COLORS.textSecondary}
              />
              <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                {tab.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="chatbubbles-outline" size={44} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No messages found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No conversations matching "${searchQuery}"`
                : activeTab === 'Admins'
                ? 'No inquiries with administrators yet.'
                : 'Connect with sellers about products or message UniMart admins for support.'}
            </Text>

            <TouchableOpacity
              style={styles.emptyCtaButton}
              onPress={() => setIsNewChatModalOpen(true)}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyCtaButtonText}>Start a New Chat</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const lastMessage = item.messages[item.messages.length - 1];
          const hasUnread = (item.unreadCount || 0) > 0;
          const isAdmin = item.role === 'admin';

          return (
            <TouchableOpacity
              style={[styles.conversationCard, hasUnread && styles.conversationCardUnread]}
              onPress={() => handleOpenChat(item.id)}
              activeOpacity={0.8}
            >
              {/* Avatar + Status Indicator */}
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                <View
                  style={[
                    styles.onlineDot,
                    { backgroundColor: item.onlineStatus === 'Online' ? '#10B981' : '#94A3B8' },
                  ]}
                />
              </View>

              {/* Main Content */}
              <View style={styles.flex}>
                <View style={styles.cardTopRow}>
                  <View style={styles.nameContainer}>
                    <Text style={[styles.contactName, hasUnread && styles.contactNameUnread]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.isVerified && (
                      <Ionicons
                        name="checkmark-circle"
                        size={15}
                        color={isAdmin ? COLORS.primary : '#10B981'}
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </View>
                  <Text style={[styles.timestamp, hasUnread && styles.timestampUnread]}>
                    {formatTime(lastMessage?.createdAt)}
                  </Text>
                </View>

                {/* Role and Item Tags */}
                <View style={styles.tagRow}>
                  <View
                    style={[
                      styles.roleBadge,
                      isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeSeller,
                    ]}
                  >
                    <Ionicons
                      name={isAdmin ? 'shield-checkmark' : 'storefront-outline'}
                      size={11}
                      color={isAdmin ? COLORS.adminText : COLORS.sellerText}
                    />
                    <Text
                      style={[
                        styles.roleBadgeText,
                        isAdmin ? styles.roleBadgeTextAdmin : styles.roleBadgeTextSeller,
                      ]}
                    >
                      {item.badge || (isAdmin ? 'Admin' : 'Seller')}
                    </Text>
                  </View>

                  {item.item && (
                    <View style={styles.itemRefTag}>
                      <Ionicons name="pricetag-outline" size={11} color={COLORS.primary} />
                      <Text style={styles.itemRefText} numberOfLines={1}>
                        {item.item.title}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Last Message Preview */}
                <View style={styles.lastMessageRow}>
                  <Text
                    style={[styles.lastMessageText, hasUnread && styles.lastMessageTextUnread]}
                    numberOfLines={1}
                  >
                    {lastMessage ? (
                      lastMessage.sender === 'user' ? (
                        `You: ${lastMessage.text}`
                      ) : (
                        lastMessage.text
                      )
                    ) : (
                      'Tap to send a message'
                    )}
                  </Text>

                  {hasUnread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* 5. Start New Chat Modal */}
      <Modal
        visible={isNewChatModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsNewChatModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>New Conversation</Text>
                <Text style={styles.modalSubtitle}>Connect with UniMart sellers or campus administration</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setIsNewChatModalOpen(false)}
              >
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
              {/* Option A: Admin Support Inquiries */}
              <Text style={styles.modalSectionTitle}>Official Admin Desks</Text>
              <View style={styles.adminOptionsContainer}>
                {[
                  { topic: 'General Support', desc: 'Queries regarding UniMart features & services', icon: 'headset-outline' },
                  { topic: 'Identity Verification', desc: 'Student card & vehicle license verification', icon: 'id-card-outline' },
                  { topic: 'Disputes & Refunds', desc: 'Resolution for cancelled or damaged rentals', icon: 'shield-alert-outline' },
                  { topic: 'Report Inappropriate Listing', desc: 'Safety team moderation desk', icon: 'flag-outline' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.topic}
                    style={styles.adminOptionCard}
                    onPress={() => handleStartAdminChat(item.topic)}
                  >
                    <View style={styles.adminOptionIcon}>
                      <Ionicons name={item.icon} size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.flex}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.adminOptionTitle}>{item.topic}</Text>
                        <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                      </View>
                      <Text style={styles.adminOptionDesc}>{item.desc}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Option B: Message a Seller by Name */}
              <Text style={[styles.modalSectionTitle, { marginTop: 20 }]}>Message a Campus Seller</Text>
              <View style={styles.sellerInputBox}>
                <Text style={styles.sellerInputLabel}>Enter Seller / Provider Name:</Text>
                <View style={styles.sellerInputRow}>
                  <TextInput
                    style={styles.sellerTextInput}
                    placeholder="e.g. Sahan Silva, Bike Provider..."
                    placeholderTextColor={COLORS.textMuted}
                    value={newSellerName}
                    onChangeText={setNewSellerName}
                  />
                  <TouchableOpacity
                    style={[styles.startSellerBtn, !newSellerName.trim() && styles.disabledBtn]}
                    disabled={!newSellerName.trim()}
                    onPress={handleStartSellerChat}
                  >
                    <Text style={styles.startSellerBtnText}>Chat</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// -------------------------------------------------------------
// 2. CHAT CONVERSATION SCREEN
// -------------------------------------------------------------
export function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { conversations, sendMessage, markAsRead } = useChat();
  const insets = useSafeAreaInsets();

  const conversation = conversations.find((c) => c.id === id);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  const isAdmin = conversation?.role === 'admin';

  // Mark unread messages as read upon entering
  useEffect(() => {
    if (conversation && conversation.unreadCount > 0) {
      markAsRead(conversation.id);
    }
  }, [conversation?.id]);

  function handleSend() {
    if (!inputText.trim() || !conversation) return;
    sendMessage(conversation.id, inputText);
    setInputText('');
  }

  function handleQuickPrompt(text) {
    if (!conversation) return;
    sendMessage(conversation.id, text);
  }

  // Quick inquiry chips based on role
  const quickChips = isAdmin
    ? [
        'How do I verify my student account?',
        'What is the rental cancellation policy?',
        'How do refunds work?',
        'I want to report an issue',
      ]
    : [
        'Is this still available?',
        'Can we meet near the Main Gate?',
        'Is the price negotiable?',
        'What is the condition?',
      ];

  if (!conversation) {
    return (
      <View style={[styles.screen, styles.centerEmpty, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={styles.emptyTitle}>Conversation Not Found</Text>
        <Text style={styles.emptySubtitle}>The requested chat thread is no longer available.</Text>
        <TouchableOpacity style={styles.emptyCtaButton} onPress={() => router.back()}>
          <Text style={styles.emptyCtaButtonText}>Back to Messages</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 8) }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* 1. Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.iconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        {/* User / Admin Avatar & Info */}
        <Image source={{ uri: conversation.avatar }} style={styles.chatHeaderAvatar} />

        <View style={styles.flex}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.chatHeaderName} numberOfLines={1}>
              {conversation.name}
            </Text>
            {conversation.isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={15}
                color={isAdmin ? COLORS.primary : '#10B981'}
              />
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={[
                styles.roleBadgeHeader,
                isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeSeller,
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeHeaderText,
                  isAdmin ? styles.roleBadgeTextAdmin : styles.roleBadgeTextSeller,
                ]}
              >
                {isAdmin ? 'UniMart Admin' : 'Seller'}
              </Text>
            </View>
            <Text style={styles.chatHeaderStatus}>{conversation.onlineStatus || 'Online'}</Text>
          </View>
        </View>

        {/* Call / Action Icon */}
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => {
            Alert.alert(
              conversation.role === 'admin' ? 'UniMart Helpdesk' : 'Call Partner',
              `Simulate calling ${conversation.name}?`
            );
          }}
        >
          <Ionicons
            name={isAdmin ? 'shield-outline' : 'call-outline'}
            size={20}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {/* 2. Item Banner (if chatting with a seller about a product or rental) */}
      {conversation.item && (
        <View style={styles.itemBanner}>
          <Image source={{ uri: conversation.item.image }} style={styles.itemBannerImg} />
          <View style={styles.flex}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.categoryMiniPill}>
                <Text style={styles.categoryMiniPillText}>{conversation.item.category}</Text>
              </View>
              <Text style={styles.itemBannerPrice}>{conversation.item.price}</Text>
            </View>
            <Text style={styles.itemBannerTitle} numberOfLines={1}>
              {conversation.item.title}
            </Text>
            {conversation.item.location && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                <Ionicons name="location-outline" size={11} color={COLORS.textSecondary} />
                <Text style={styles.itemBannerLocation} numberOfLines={1}>
                  {conversation.item.location}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.itemBannerAction}
            onPress={() => {
              Alert.alert('Item Details', `Opening listing for ${conversation.item.title}`);
            }}
          >
            <Text style={styles.itemBannerActionText}>View</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Messages List */}
      <FlatList
        ref={flatListRef}
        data={conversation.messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMe = item.sender === 'user';
          const isSenderAdmin = item.sender === 'admin';

          return (
            <View
              style={[
                styles.messageRow,
                isMe ? styles.messageRowMe : styles.messageRowPartner,
              ]}
            >
              {!isMe && (
                <Image
                  source={{ uri: conversation.avatar }}
                  style={styles.messagePartnerAvatar}
                />
              )}

              <View
                style={[
                  styles.messageBubble,
                  isMe
                    ? styles.messageBubbleMe
                    : isSenderAdmin
                    ? styles.messageBubbleAdmin
                    : styles.messageBubblePartner,
                ]}
              >
                {/* Admin Header if sender is admin */}
                {isSenderAdmin && (
                  <View style={styles.adminMessageHeader}>
                    <Ionicons name="shield-checkmark" size={12} color={COLORS.adminText} />
                    <Text style={styles.adminMessageHeaderText}>Official UniMart Admin</Text>
                  </View>
                )}

                <Text
                  style={[
                    styles.messageText,
                    isMe
                      ? styles.messageTextMe
                      : isSenderAdmin
                      ? styles.messageTextAdmin
                      : styles.messageTextPartner,
                  ]}
                  selectable
                >
                  {item.text}
                </Text>

                <View style={styles.messageFooter}>
                  <Text
                    style={[
                      styles.messageTime,
                      isMe ? styles.messageTimeMe : styles.messageTimePartner,
                    ]}
                  >
                    {formatTime(item.createdAt)}
                  </Text>
                  {isMe && (
                    <Ionicons
                      name={item.isRead ? 'checkmark-done' : 'checkmark'}
                      size={13}
                      color="#BFDBFE"
                      style={{ marginLeft: 3 }}
                    />
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* 4. Quick Suggestion Chips */}
      <View style={styles.quickChipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickChipsContent}
        >
          {quickChips.map((chip, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.quickChip}
              onPress={() => handleQuickPrompt(chip)}
            >
              <Text style={styles.quickChipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 5. Message Input Composer */}
      <View style={styles.composerContainer}>
        <TouchableOpacity
          style={styles.composerAttachBtn}
          onPress={() => {
            Alert.alert('Attach File/Photo', 'Take photo or choose from gallery to send.');
          }}
        >
          <Ionicons name="camera-outline" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TextInput style={styles.composerInput} placeholder={isAdmin ? 'Message UniMart Support...' : 'Message seller...'} placeholderTextColor={COLORS.textMuted} value={inputText} onChangeText={setInputText} multiline maxLength={1000}/>

        <TouchableOpacity style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} disabled={!inputText.trim()} onPress={handleSend} accessibilityRole="button" accessibilityLabel="Send message">
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  centerEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  newChatIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    padding: 0,
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  conversationCard: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  conversationCardUnread: {
    borderColor: '#93C5FD',
    backgroundColor: '#FAFCFF',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  contactNameUnread: {
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  timestampUnread: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  roleBadgeAdmin: {
    backgroundColor: COLORS.adminBg,
    borderColor: COLORS.adminBorder,
    borderWidth: 1,
  },
  roleBadgeSeller: {
    backgroundColor: COLORS.sellerBg,
    borderColor: COLORS.sellerBorder,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  roleBadgeTextAdmin: {
    color: COLORS.adminText,
  },
  roleBadgeTextSeller: {
    color: COLORS.sellerText,
  },
  itemRefTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
    maxWidth: '65%',
  },
  itemRefText: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.primary,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  lastMessageText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  lastMessageTextUnread: {
    color: COLORS.text,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 6,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyCtaButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  adminOptionsContainer: {
    gap: 8,
  },
  adminOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  adminOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  adminOptionDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sellerInputBox: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sellerInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  sellerInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sellerTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text,
  },
  startSellerBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startSellerBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  disabledBtn: {
    opacity: 0.5,
  },

  // -------------------------
  // Chat Detail Screen Styles
  // -------------------------
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  chatHeaderName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  roleBadgeHeader: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeHeaderText: {
    fontSize: 9,
    fontWeight: '700',
  },
  chatHeaderStatus: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Item Banner in Chat
  itemBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  itemBannerImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  categoryMiniPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  categoryMiniPillText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  itemBannerPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  itemBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 1,
  },
  itemBannerLocation: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  itemBannerAction: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  itemBannerActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Messages List
  messagesList: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowPartner: {
    justifyContent: 'flex-start',
  },
  messagePartnerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
  },
  messageBubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageBubblePartner: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  messageBubbleAdmin: {
    backgroundColor: COLORS.adminBg,
    borderWidth: 1,
    borderColor: COLORS.adminBorder,
    borderBottomLeftRadius: 4,
  },
  adminMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  adminMessageHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.adminText,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextPartner: {
    color: COLORS.text,
  },
  messageTextAdmin: {
    color: '#0C4A6E',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  messageTimeMe: {
    color: '#BFDBFE',
  },
  messageTimePartner: {
    color: COLORS.textMuted,
  },

  // Quick Chips
  quickChipsWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quickChipsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Composer
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  composerAttachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
