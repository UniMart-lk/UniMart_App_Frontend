import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

export default function MarketPlaceHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.headerContainer}>headline</Text>
      <Text style={styles.bodyContainer}>MarketPlaceHomeScreen</Text>
      <Text style={styles.bottomNavConatiner}>Bottom Navigation</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    backgroundColor: 'black',
  },

  headerContainer:{
    marginTop: 35,
    flex:1,
    backgroundColor: '#FFFFFF',
  },

  bodyContainer:{
    flex:1,
    backgroundColor: '#FFFFFF',
  }, 

  bottomNavConatiner: {
    flex:1,
    backgroundColor: '#FFFFFF',
  }
})