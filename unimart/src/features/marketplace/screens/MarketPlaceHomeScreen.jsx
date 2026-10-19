import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native';

export default function MarketPlaceHomeScreen() {

  // --- MOCK DATA ---
const categories= ['All', 'Electronics', 'Books', 'Furniture', 'Clothing'];

  return (
   <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />

       {/* 1. HEADER */}
      <View style={styles.header}>                        {/* borderWidth:1, borderColor:'red'*/ } 
        <TouchableOpacity>
          <Ionicons name='arrow-back' size={25} color="#0F172A" />
        </TouchableOpacity>
       
        <View>
         <Text style={{fontSize: 20, fontWeight:'bold', color: '#0F172A' }}>Marketplace</Text>
        </View>

        <View style={{width: 25, borderWidth:1, borderColor:'#ffffff'}}></View>

      </View>

       {/* 2. SEARCH & CATEGORIES */}
      <View style={styles.searchBarContainer}>
        <View style={styles.placeholderContainer}>
          <Ionicons name='search-outline' size={20} color="#0F172A8D" />
          <TextInput placeholder="Search Products..." style={styles.placeholder} />
        </View>

        <TouchableOpacity>
          <Ionicons name="options-outline" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContainer}>
        {categories.map ((cat) =>(
          <TouchableOpacity 
              key={cat} style={styles.chip} >
            <Text style={styles.chipText}>{cat}</Text>      
          </TouchableOpacity>
        ))}
      </ScrollView>

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
    flex: 1.4,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor:'#E2E8F0',
    paddingHorizontal: 15,
  },

  searchBarContainer:{
    flexDirection: 'row',
    flex: 1,
    marginVertical: 8,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor:'#E2E8F0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 15,
  },

  placeholderContainer:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    color:"#0F172A8D"
    
  },

  placeholder:{
      fontSize: 15, 
      width:'83%', 
  },

  chipScroll: { 
    borderWidth: 1,
    borderColor:'#F8FAFC',
    marginHorizontal: 15,
    marginBottom: 15,
    flexGrow: 0
    
  },

  chipContainer: { 
    gap: 8, 
  },

  chip:{
    paddingVertical: 8,
    paddingHorizontal:16,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth:1,
    borderColor: '#E2E8F0'
  },

  chipText: { 
    fontSize: 15, 
    color: '#0F172A' 
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