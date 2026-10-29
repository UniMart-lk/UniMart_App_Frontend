import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  ScrollView, TouchableWithoutFeedback, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const { height } = Dimensions.get('window');

export default function FilterModal({ visible, onClose, onApply, currentFilters }) {
  // --- FILTER STATES ---
  const [selectedCategory, setSelectedCategory] = useState(currentFilters?.category || '');
  const [priceRange, setPriceRange] = useState(currentFilters?.maxPrice || 100000);
  const [conditions, setConditions] = useState(currentFilters?.conditions || []);
  const [providerType, setProviderType] = useState(currentFilters?.providerType || 'All');
  const [minRating, setMinRating] = useState(currentFilters?.minRating || 0);

  const categories = ['Electronics', 'Books', 'Furniture', 'Bicycles', 'Clothing', 'Academic', 'Other'];
  const conditionOptions = ['New', 'Like New', 'Good', 'Fair'];

  const toggleCondition = (cond) => {
    if (conditions.includes(cond)) {
      setConditions(conditions.filter(c => c !== cond));
    } else {
      setConditions([...conditions, cond]);
    }
  };

  const handleClearAll = () => {
    setSelectedCategory('');
    setPriceRange(100000);
    setConditions([]);
    setProviderType('All');
    setMinRating(0);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.bottomSheet}>
          {/* Header */}
          <View style={styles.dragHandle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filters</Text>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* 1. CATEGORY */}
            <Text style={styles.sectionTitle}>CATEGORY</Text>
            <View style={styles.chipGrid}>
              {categories.map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                  onPress={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                >
                  <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 2. PRICE RANGE */}
            <Text style={styles.sectionTitle}>PRICE RANGE</Text>
            <Slider
              style={{ width: '100%', height: 40, marginTop: 10 }}
              minimumValue={0}
              maximumValue={100000}
              step={1000}
              value={priceRange}
              onValueChange={setPriceRange}
              minimumTrackTintColor="#2563EB"
              maximumTrackTintColor="#E2E8F0"
              thumbTintColor="#2563EB"
            />
            <View style={styles.priceLabels}>
              <Text style={styles.priceLabelText}>LKR 0</Text>
              <Text style={styles.priceLabelText}>LKR {priceRange.toLocaleString()}</Text>
            </View>

            {/* 3. CONDITION */}
            <Text style={styles.sectionTitle}>CONDITION</Text>
            <View style={styles.checkboxGrid}>
              {conditionOptions.map(cond => {
                const isChecked = conditions.includes(cond);
                return (
                  <TouchableOpacity key={cond} style={styles.checkboxRow} onPress={() => toggleCondition(cond)}>
                    <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                      {isChecked && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                    <Text style={styles.checkboxLabel}>{cond}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. PROVIDER TYPE */}
            <Text style={styles.sectionTitle}>PROVIDER TYPE</Text>
            {['All', 'Student Provider', 'External Provider'].map(type => (
              <TouchableOpacity key={type} style={styles.radioRow} onPress={() => setProviderType(type)}>
                <View style={[styles.radioOuter, providerType === type && styles.radioOuterActive]}>
                  {providerType === type && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>{type}</Text>
              </TouchableOpacity>
            ))}

            {/* 5. RATING */}
            <Text style={styles.sectionTitle}>RATING</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setMinRating(star)}>
                  <Ionicons 
                    name="star" 
                    size={28} 
                    color={star <= minRating ? "#F59E0B" : "#E2E8F0"} 
                    style={{ marginRight: 8 }}
                  />
                </TouchableOpacity>
              ))}
              <Text style={styles.ratingLabel}>{minRating > 0 ? `${minRating}★ & above` : 'Any'}</Text>
            </View>

          </ScrollView>

          {/* Bottom Action Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyBtn} 
              onPress={() => {
                onApply({ 
                  category: selectedCategory, 
                  maxPrice: priceRange, 
                  conditions, 
                  providerType, 
                  minRating 
                });
                onClose();
              }}
            >
              <Text style={styles.applyBtnText}>Show results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.85,
  },
  dragHandle: {
    width: 40, height: 4, backgroundColor: '#CBD5E1',
    borderRadius: 2, alignSelf: 'center', marginTop: 10,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#F1F5F9'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  resetText: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 20, marginBottom: 12, letterSpacing: 0.5 },
  
  // Chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#475569' },
  chipTextActive: { color: '#FFF', fontWeight: '600' },

  // Price
  priceLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  priceLabelText: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  // Conditions
  checkboxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', width: '45%', marginBottom: 8 },
  checkbox: { width: 20, height: 20, borderWidth: 2, borderColor: '#CBD5E1', borderRadius: 4, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  checkboxLabel: { fontSize: 14, color: '#0F172A' },

  // Radio
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E1', marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: '#2563EB' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563EB' },
  radioLabel: { fontSize: 14, color: '#0F172A' },

  // Rating
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingLabel: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginLeft: 8 },

  // Bottom Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: 20, paddingBottom: 30,
    backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#F1F5F9', gap: 12
  },
  clearBtn: { flex: 1, height: 50, borderRadius: 10, borderWidth: 1, borderColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { color: '#2563EB', fontSize: 16, fontWeight: '600' },
  applyBtn: { flex: 2, height: 50, borderRadius: 10, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});