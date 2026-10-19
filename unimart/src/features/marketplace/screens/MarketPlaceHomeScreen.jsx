import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

export default function MarketPlaceHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.headerContainer}>MarketPlaceHomeScreen</Text>
      <Text >MarketPlaceHomeScreen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    borderWidth: 1,
    borderColor: 'red',
    backgroundColor: 'black',
  },
  headerContainer:{
    flex:1,
  },
})