import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Image } from 'react-native';

export default function ProductDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.safeArea}>
        <StatusBar style="auto" />
        <View style={styles.imgCcontainer}>
           

             <View style={styles.header}>                    
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name='arrow-back' size={25} color="#0F172A" />
                </TouchableOpacity>
                   
                <View>
                    <Text style={{fontSize: 20, fontWeight:'bold', color: '#0F172A' }}>Product Details</Text>
                </View>
            
                <View style={{width: 25, borderWidth:1, borderColor:'#ffffff'}}></View>
            
            </View>
            
        </View>
    </SafeAreaView>
   
  )
}

const styles = StyleSheet.create({
   safeArea: {
     flex: 1,
     backgroundColor: '#F8FAFC',
   },

    imgCcontainer:{
        flex:1,
    },

   header: {
    position:'absolute',
    width:'100%',
    top:24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: '#ffffff'
    
  },

})