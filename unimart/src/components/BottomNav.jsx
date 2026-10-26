import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <View style={styles.bottomNavContainer}>
      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
        <View style={activeTab === 'home' ? styles.activeIconBg : styles.inactiveIconBg}>
          <Ionicons name="home-sharp" size={22} color={activeTab === 'home' ? '#2563EB' : '#64748B'} />
        </View>
        <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('marketplace')}>
         <View style={activeTab === 'marketplace' ? styles.activeIconBg : styles.inactiveIconBg}>
           <Ionicons name="storefront" size={22} color={activeTab === 'marketplace' ? '#2563EB' : '#64748B'} />
        </View>
        <Text style={[styles.navText, activeTab === 'marketplace' && styles.navTextActive]}>Marketplace</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('rentals')}>
        <View style={activeTab === 'rentals' ? styles.activeIconBg : styles.inactiveIconBg}>
          <Ionicons name="car" size={22} color={activeTab === 'rentals' ? '#2563EB' : '#64748B'} />
        </View>
        <Text style={[styles.navText, activeTab === 'rentals' && styles.navTextActive]}>Rentals</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('messages')}>
        <View style={activeTab === 'messages' ? styles.activeIconBg : styles.inactiveIconBg}>
          <View style={{ position: 'relative' }}>
            <Ionicons name="chatbox" size={22} color={activeTab === 'messages' ? '#2563EB' : '#64748B'} />
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>3</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.navText, activeTab === 'messages' && styles.navTextActive]}>Messages</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
         <View style={activeTab === 'profile' ? styles.activeIconBg : styles.inactiveIconBg}>
              <Ionicons name="person" size={22} color={activeTab === 'profile' ? '#2563EB' : '#64748B'} />
         </View>
        <Text style={[styles.navText, activeTab === 'profile' && styles.navTextActive]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer:{
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    paddingHorizontal:15,
  },

  navItem: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
   
  },

  activeIconBg: {
  backgroundColor: '#E0E7FF', 
  paddingHorizontal: 16,      
  paddingVertical: 5,
  borderRadius: 20,

},

inactiveIconBg: {
  paddingHorizontal: 16,
  paddingVertical: 5,
  backgroundColor: 'transparent',
},

  navText: { fontSize: 12, color: '#0F172A', fontWeight: '500' },

  navTextActive: {
  color: '#2563EB',
  fontWeight: 'bold',
},

  navBadge: {
    position: 'absolute',
    top: -3,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5, 
    borderColor: '#FFFFFF'
  },

  navBadgeText: { fontSize: 9, color: '#FFFFFF', fontWeight: 'bold' },
});