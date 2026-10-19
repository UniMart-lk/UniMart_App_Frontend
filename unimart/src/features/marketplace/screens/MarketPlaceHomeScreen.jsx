import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

export default function MarketPlaceHomeScreen() {
  return (
   <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />

       {/* 1. HEADER */}
      <View style={styles.header}>
        <Text>header</Text>
      </View>

       {/* 2. SEARCH & CATEGORIES */}
      <View style={styles.searchBarContainer}>
        <Text>Search and Categories</Text>
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
    flex: 1,
    backgroundColor: '#ffffff'
  },

  searchBarContainer:{
    flex: 1

  },

  categoryChipsConatiner:{
    flex:1
  },

  resultsAndSortContainer:{
    flex:1
  },

  productGridContainer:{
    flex:1
  },

  fabContainer:{
    flex:1
  },

  bottomNavConatiner:{
    flex:1
  }





  


})