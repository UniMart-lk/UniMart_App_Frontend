import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useChat } from './ChatContext';

function BackButton() {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" style={styles.iconButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}><Ionicons name="arrow-back" size={24} color="#0F172A" /></TouchableOpacity>;
}
function Notice() {
  return <Text style={styles.notice}>Chat preview: messages stay in this session and are not delivered to other users.</Text>;
}
function Empty({ title, description }) {
  return <View style={styles.empty}><Ionicons name="chatbubbles-outline" size={48} color="#2563EB" /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.subtitle}>{description}</Text></View>;
}
export function ConversationList() {
  const insets = useSafeAreaInsets();
  const { conversations, createConversation } = useChat();
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  function open(id) { router.push({ pathname: '/chat/[id]', params: { id } }); }
  function start() {
    if (!name.trim()) return;
    const id = createConversation(name);
    setName('');
    open(id);
  }
  const filtered = conversations.filter(item => item.name.toLowerCase().includes(search.trim().toLowerCase()));
  return <KeyboardAvoidingView style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={styles.header}><BackButton /><View style={styles.flex}><Text style={styles.title}>Messages</Text><Text style={styles.subtitle}>Your UniMart conversations</Text></View></View>
    <Notice />
    <TextInput style={styles.input} placeholder="Search conversations" accessibilityLabel="Search conversations" value={search} onChangeText={setSearch} placeholderTextColor="#64748B" />
    <View style={styles.newChat}><Text style={styles.sectionTitle}>Start a conversation</Text><Text style={styles.subtitle}>Enter a name to try the chat preview.</Text><View style={styles.row}><TextInput style={[styles.input, styles.flex, styles.inlineInput]} placeholder="Contact name" accessibilityLabel="Contact name" maxLength={80} value={name} onChangeText={setName} onSubmitEditing={start} returnKeyType="go" placeholderTextColor="#64748B" /><TouchableOpacity accessibilityRole="button" accessibilityLabel="Start conversation" disabled={!name.trim()} onPress={start} style={[styles.send, !name.trim() && styles.disabled]}><Ionicons name="add" size={24} color="#FFFFFF" /></TouchableOpacity></View></View>
    <FlatList data={filtered} keyExtractor={item => item.id} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" ListEmptyComponent={<Empty title={search.trim() ? 'No conversations found' : 'No messages yet'} description={search.trim() ? 'Try searching for another name.' : 'Start a conversation above to try messaging.'} />} renderItem={({ item }) => {
      const last = item.messages[item.messages.length - 1];
      return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open conversation with ${item.name}`} style={styles.conversation} onPress={() => open(item.id)}><View style={styles.avatar}><Text style={styles.initial}>{item.name.charAt(0).toUpperCase()}</Text></View><View style={styles.flex}><Text style={styles.sectionTitle} numberOfLines={1}>{item.name}</Text><Text style={styles.subtitle} numberOfLines={1}>{last ? `You: ${last.text}` : 'Start your conversation'}</Text></View><Ionicons name="chevron-forward" size={20} color="#64748B" /></TouchableOpacity>;
    }} />
  </KeyboardAvoidingView>;
}
export function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { conversations, sendMessage } = useChat();
  const conversation = conversations.find(item => item.id === id);
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  function send() {
    if (!draft.trim() || !conversation) return;
    sendMessage(conversation.id, draft);
    setDraft('');
  }
  return <KeyboardAvoidingView style={[styles.screen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={styles.header}><BackButton /><View style={styles.flex}><Text numberOfLines={1} style={styles.title}>{conversation?.name || 'Conversation unavailable'}</Text><Text style={styles.subtitle}>UniMart chat preview</Text></View></View>
    <Notice />
    {conversation ? <><FlatList ref={listRef} data={conversation.messages} keyExtractor={item => item.id} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })} ListEmptyComponent={<Empty title="Say hello" description="Ask about availability, pricing, or pickup arrangements." />} renderItem={({ item }) => <View style={styles.bubble}><Text style={styles.messageText} selectable>{item.text}</Text><Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Local only</Text></View>} />
    <View style={styles.composer}><TextInput accessibilityLabel="Message" style={styles.messageInput} placeholder="Type a message..." placeholderTextColor="#64748B" value={draft} onChangeText={setDraft} multiline maxLength={2000} /><TouchableOpacity accessibilityRole="button" accessibilityLabel="Send message" accessibilityState={{ disabled: !draft.trim() }} disabled={!draft.trim()} style={[styles.send, !draft.trim() && styles.disabled]} onPress={send}><Ionicons name="send" size={20} color="#FFFFFF" /></TouchableOpacity></View></> : <Empty title="Conversation unavailable" description="Go back to Messages and start a new conversation. Chat previews reset when the app restarts." />}
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#0F172A', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#64748B', fontSize: 14, lineHeight: 21 },
  notice: { margin: 16, padding: 12, borderRadius: 10, backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: 12, lineHeight: 18 },
  input: { marginHorizontal: 16, marginBottom: 16, padding: 14, minHeight: 48, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: 15 },
  newChat: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', gap: 6 },
  sectionTitle: { color: '#0F172A', fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'center' },
  inlineInput: { marginHorizontal: 0, marginBottom: 0 },
  send: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB' },
  disabled: { opacity: 0.4 },
  list: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  emptyTitle: { color: '#0F172A', fontSize: 20, fontWeight: '600', textAlign: 'center' },
  conversation: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 20, fontWeight: '700', color: '#2563EB' },
  messages: { flexGrow: 1, padding: 16, gap: 12 },
  bubble: { alignSelf: 'flex-end', maxWidth: '85%', borderRadius: 16, borderBottomRightRadius: 4, padding: 14, backgroundColor: '#2563EB' },
  messageText: { fontSize: 16, lineHeight: 23, color: '#FFFFFF' },
  time: { color: '#DBEAFE', fontSize: 11, marginTop: 7, alignSelf: 'flex-end' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  messageInput: { flex: 1, minHeight: 48, maxHeight: 120, padding: 12, borderRadius: 14, backgroundColor: '#F1F5F9', color: '#0F172A', fontSize: 16 },
});
