import { StyleSheet, Text, TouchableOpacity, View, Image , Dimensions } from 'react-native'
import React, { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { products } from '../data/mockData'; 

 const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [activeImageIndex, setActiveImageIndex] = useState(0);

     // Find the product based on the ID passed from the ProductCard
     const product = products.find((p) => p.id === id);

       if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Product not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'center', marginTop: 20 }}>
          <Text style={{ color: '#2563EB' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

    // Update dots when user swipes images
  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveImageIndex(index);
  };

   // Render individual image in the carousel
  const renderImage = ({ item }) => (
    <Image 
      source={{ uri: item }} 
      style={styles.productImage} 
      resizeMode="cover" 
    />
  );
   

  return (
    <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
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

    productImage: {
    width: width, // Takes full width of screen
    height: 400,
  },

})