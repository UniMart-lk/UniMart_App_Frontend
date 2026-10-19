import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons';

export default function MarketPlaceHomeScreen() {
  return (
   <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />

       {/* 1. HEADER */}
      <View style={styles.header}>                        {/* borderWidth:1, borderColor:'red'*/ } 
        <TouchableOpacity>
          <Ionicons name='arrow-back' size={30} color="#0F172A" />
        </TouchableOpacity>
       
        <View>
         <Text style={{fontSize: 24, fontWeight:'bold', color: '#0F172A' }}>Marketplace</Text>
        </View>

        <View style={{width: 30, borderWidth:1, borderColor:'#ffffff'}}></View>

      </View>

       {/* 2. SEARCH & CATEGORIES */}
      <View style={styles.searchBarContainer}>
        <View style={styles.placeholderContainer}>
          <Ionicons name='search-outline' size={24} color="#0F172A8D" />
          <TextInput placeholder="Search Products..." style={{fontSize: 15}} />
        </View>

        <TouchableOpacity>
          <Ionicons name="options-outline" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Category Chips */}
       <View style={styles.categoryChipsConatiner}>
        <Text>Category Chips</Text>
      </View>

       {/* Results & Sort */}
      <View style={styles.resultsAndSortContainer}>
        <Text>Results & Sort</Text>
      </View>

      {/* 3. PRODUCT GRID */}
      <View style={styles.productGridContainer}>
        <Text>PRODUCT GRID</Text>
      </View>

      {/* 4. FLOATING ACTION BUTTON (FAB) */}
      <View style={styles.fabContainer}>
        <Text>FLOATING ACTION BUTTON </Text>
      </View>

       {/* 5. BOTTOM NAVIGATION */}
        <View>
        <Text>BOTTOM NAVIGATION</Text>
      </View>

   </SafeAreaView>
 
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
     backgroundColor: '#F8FAFC'
  },

  header:{
    flex: 1.5,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor:'#E2E8F0',
    paddingHorizontal: 20,
  },

  searchBarContainer:{
    flexDirection: 'row',
    flex: 1,
    marginVertical: 8,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor:'#E2E8F0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 10,
  },

  placeholderContainer:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },

  categoryChipsConatiner:{
    flex:1

  },

  resultsAndSortContainer:{
    flex:1
  },

  productGridContainer:{
    flex:10
  },

  fabContainer:{
    flex:1
  },

  bottomNavConatiner:{
    flex:1
  }





  


})