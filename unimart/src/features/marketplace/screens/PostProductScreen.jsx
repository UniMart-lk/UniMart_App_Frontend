import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  Switch,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { products } from '../data/mockData';

const { width } = Dimensions.get('window');

// Available categories matching mockData and marketplace
const CATEGORIES = [
  { name: 'Books', icon: 'book-open-page-variant', iconFamily: 'MaterialCommunityIcons' },
  { name: 'Electronics', icon: 'cellphone', iconFamily: 'MaterialCommunityIcons' },
  { name: 'Furniture', icon: 'table-chair', iconFamily: 'MaterialCommunityIcons' },
  { name: 'Clothing', icon: 'tshirt-crew-outline', iconFamily: 'MaterialCommunityIcons' },
  { name: 'Stationery', icon: 'pencil-ruler', iconFamily: 'MaterialCommunityIcons' },
  { name: 'Sports', icon: 'bike', iconFamily: 'MaterialCommunityIcons' },
  { name: 'Other', icon: 'view-grid-outline', iconFamily: 'MaterialCommunityIcons' },
];

// Available conditions
const CONDITIONS = [
  { label: 'New', desc: 'Unopened in original box/packaging' },
  { label: 'Like New', desc: 'Barely used, no signs of wear or defects' },
  { label: 'Good', desc: 'Used with minor cosmetic marks, fully functional' },
  { label: 'Fair', desc: 'Noticeable wear and tear, fully operational' },
  { label: 'Used', desc: 'Standard campus used condition' },
];

// Campus location quick presets
const CAMPUS_PRESETS = [
  'Sabaragamuwa Uni',
  'Belihuloya',
  'Balangoda',
  'Kandy',
  'Colombo',
];

// Suggested specifications by category to automatically provide fields for mockData `details`
const CATEGORY_DEFAULT_SPECS = {
  Books: [
    { label: 'Subject', value: '' },
    { label: 'Author', value: '' },
    { label: 'Edition', value: '' },
    { label: 'Format', value: 'Paperback' },
  ],
  Electronics: [
    { label: 'Brand', value: '' },
    { label: 'Model', value: '' },
    { label: 'Storage', value: '' },
    { label: 'Color', value: '' },
    { label: 'Battery Health', value: '' },
  ],
  Furniture: [
    { label: 'Material', value: '' },
    { label: 'Dimensions', value: '' },
    { label: 'Color', value: '' },
  ],
  Clothing: [
    { label: 'Brand', value: '' },
    { label: 'Size', value: '' },
    { label: 'Color', value: '' },
    { label: 'Material', value: '' },
  ],
  Sports: [
    { label: 'Brand', value: '' },
    { label: 'Type', value: '' },
    { label: 'Gear Count', value: '' },
    { label: 'Wheel Size', value: '' },
  ],
  Stationery: [
    { label: 'Brand', value: '' },
    { label: 'Type', value: '' },
    { label: 'Quantity', value: '' },
  ],
  Other: [
    { label: 'Brand', value: '' },
    { label: 'Color', value: '' },
  ],
};

// Preset sample photos for easy preview / photo adding in student app
const SAMPLE_PRESET_PHOTOS = [
  { label: 'Textbook', uri: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80' },
  { label: 'Notes/Study', uri: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&q=80' },
  { label: 'iPhone', uri: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80' },
  { label: 'Gadget Back', uri: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80' },
  { label: 'Study Table', uri: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80' },
  { label: 'Desk & Chair', uri: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&q=80' },
  { label: 'Mountain Bike', uri: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80' },
];

export default function PostProductScreen() {
  const router = useRouter();

  // --- FORM STATE ---
  // Default to two demo photos to match the design screenshot
  const [photos, setPhotos] = useState([
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80',
  ]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [providerType, setProviderType] = useState('student'); // 'student' or 'external'
  const [allowNegotiation, setAllowNegotiation] = useState(true);

  // Details section (specifications key-value pairs from mockData)
  const [details, setDetails] = useState([
    { label: 'Subject', value: '' },
    { label: 'Edition', value: '' },
    { label: 'Author', value: '' },
    { label: 'Format', value: '' },
  ]);

  // UI state
  const [showNotice, setShowNotice] = useState(true);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isConditionModalVisible, setIsConditionModalVisible] = useState(false);
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [isPublishSuccessVisible, setIsPublishSuccessVisible] = useState(false);
  const [publishedProductId, setPublishedProductId] = useState(null);
  const [savedDraftAlert, setSavedDraftAlert] = useState(false);

  // --- CATEGORY SELECTION ---
  const handleSelectCategory = (selectedCat) => {
    setCategory(selectedCat);
    setIsCategoryModalVisible(false);

    // Auto-suggest specifications based on category
    if (CATEGORY_DEFAULT_SPECS[selectedCat]) {
      // Keep existing non-empty details or load default template
      const defaultSpecs = CATEGORY_DEFAULT_SPECS[selectedCat].map((spec) => ({
        label: spec.label,
        value: spec.value || '',
      }));
      setDetails(defaultSpecs);
    }
  };

  // --- DETAIL / SPECIFICATION MANAGEMENT ---
  const handleDetailChange = (index, field, value) => {
    const updated = [...details];
    updated[index][field] = value;
    setDetails(updated);
  };

  const handleAddDetailRow = () => {
    setDetails([...details, { label: '', value: '' }]);
  };

  const handleRemoveDetailRow = (index) => {
    const updated = details.filter((_, i) => i !== index);
    setDetails(updated);
  };

  // --- PHOTO MANAGEMENT ---
  const handleRemovePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleAddPhotoUri = (uri) => {
    if (!uri) return;
    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload up to 5 photos.');
      return;
    }
    setPhotos([...photos, uri]);
    setCustomPhotoUrl('');
    setIsPhotoModalVisible(false);
  };

  // --- SAVE DRAFT ---
  const handleSaveDraft = () => {
    setSavedDraftAlert(true);
    Alert.alert(
      'Draft Saved',
      'Your product listing details have been saved as a draft. You can continue editing or publish later.',
      [{ text: 'OK' }]
    );
  };

  // --- VALIDATE AND PUBLISH ---
  const handlePublish = () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a Product Name.');
      return;
    }
    if (!category) {
      Alert.alert('Required Field', 'Please select a Category.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please provide a Description.');
      return;
    }
    if (!condition) {
      Alert.alert('Required Field', 'Please select the Condition of your item.');
      return;
    }
    const cleanPrice = price.replace(/[^0-9.]/g, '');
    const numPrice = parseFloat(cleanPrice);
    if (!cleanPrice || isNaN(numPrice) || numPrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price in LKR.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Required Field', 'Please specify the item location.');
      return;
    }

    // Filter valid key-value details
    const validDetails = details.filter(
      (d) => d.label.trim() !== '' && d.value.trim() !== ''
    );

    // Build product ID
    const newId = (Date.now()).toString();

    // Prepare complete product object adhering strictly to mockData.js format
    const newProduct = {
      id: newId,
      title: title.trim(),
      price: `LKR ${numPrice.toLocaleString()}`,
      numericPrice: numPrice,
      condition: condition,
      location: location.trim(),
      providerType: providerType, // 'student' or 'external'
      category: category,
      rating: '5.0',
      description: description.trim(),
      images: photos.length > 0
        ? photos
        : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80'],
      details: validDetails.length > 0 ? validDetails : [
        { label: 'Category', value: category },
        { label: 'Condition', value: condition },
      ],
      locationDetails: {
        address: detailedAddress.trim()
          ? `${detailedAddress.trim()}, ${location.trim()}`
          : `${location.trim()}, Campus Area`,
        mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80',
      },
      provider: {
        name: providerType === 'student' ? 'Dilshan Silva (Student)' : 'Campus Mart Vendor',
        type: providerType === 'student' ? 'Student Provider' : 'External Provider',
        isVerified: true,
        rating: '5.0',
        reviewsCount: 1,
        memberSince: 'Oct 2026',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
      },
      allowNegotiation: allowNegotiation,
      createdAt: new Date().toISOString(),
    };

    // Prepend to mockData products array so it instantly shows in MarketplaceHomeScreen
    products.unshift(newProduct);

    setPublishedProductId(newId);
    setIsPublishSuccessVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* --- 1. HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Sell Item</Text>

        <TouchableOpacity onPress={handleSaveDraft} style={styles.draftHeaderBtn} activeOpacity={0.7}>
          <Text style={styles.draftHeaderText}>
            {savedDraftAlert ? 'Draft ✓' : 'Draft'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* --- 2. PHOTOS SECTION --- */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.sectionSubtitle}>
              {photos.length}/5 photos
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photosScroll}
            contentContainerStyle={styles.photosScrollContainer}
          >
            {/* Uploaded Photos Thumbnails */}
            {photos.map((uri, index) => (
              <View key={index} style={styles.photoThumbnailContainer}>
                <Image source={{ uri }} style={styles.photoThumbnail} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => handleRemovePhoto(index)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}

            {/* "Add Photo" Card */}
            {photos.length < 5 && (
              <TouchableOpacity
                style={styles.addPhotoCard}
                onPress={() => setIsPhotoModalVisible(true)}
                activeOpacity={0.8}
              >
                <View style={styles.addPhotoIconCircle}>
                  <Ionicons name="images-outline" size={24} color="#2563EB" />
                </View>
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* --- 3. PRODUCT NAME --- */}
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Product Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Calculus Textbook"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />
              {title.length > 0 && (
                <TouchableOpacity onPress={() => setTitle('')}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* --- 4. CATEGORY SELECTOR --- */}
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Category <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.selectorContainer}
              onPress={() => setIsCategoryModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.selectorText,
                  !category && styles.selectorPlaceholder,
                ]}
              >
                {category || 'Select category'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* --- 5. DESCRIPTION --- */}
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Description <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={styles.textArea}
                placeholder="Describe your item... (condition, reasons for selling, what's included)"
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
            </View>
            <Text style={styles.charCounter}>{description.length}/500</Text>
          </View>

          {/* --- 6. CONDITION SELECTOR --- */}
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Condition <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.selectorContainer}
              onPress={() => setIsConditionModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.selectorText,
                  !condition && styles.selectorPlaceholder,
                ]}
                numberOfLines={1}
              >
                {condition || 'Select condition (New / Like New / Good / Fair)'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* --- 7. PRICE --- */}
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Price <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.priceInputContainer}>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyBadgeText}>LKR</Text>
              </View>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={price}
                onChangeText={(text) => setPrice(text.replace(/[^0-9]/g, ''))}
              />
            </View>
            {price !== '' && (
              <Text style={styles.priceFormattedHint}>
                Listed as: LKR {Number(price || 0).toLocaleString()}
              </Text>
            )}
          </View>

          {/* --- 8. LOCATION (Campus & Meeting Point) --- */}
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Location (Campus / City) <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="location-sharp"
                size={20}
                color="#EF4444"
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Where is the item? (e.g. Sabaragamuwa Uni)"
                placeholderTextColor="#94A3B8"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            {/* Quick campus chip suggestions */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 8 }}
              contentContainerStyle={{ gap: 6 }}
            >
              {CAMPUS_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.locationChip,
                    location === preset && styles.locationChipActive,
                  ]}
                  onPress={() => setLocation(preset)}
                >
                  <Text
                    style={[
                      styles.locationChipText,
                      location === preset && styles.locationChipTextActive,
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Specific Meeting Address (Missing field to store locationDetails.address) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>
              Specific Pickup Point / Address{' '}
              <Text style={styles.optionalTag}>(Optional)</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="business-outline"
                size={18}
                color="#64748B"
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Faculty of Applied Sciences / Hostel 3"
                placeholderTextColor="#94A3B8"
                value={detailedAddress}
                onChangeText={setDetailedAddress}
              />
            </View>
          </View>

          {/* --- 9. DETAILS & SPECIFICATIONS (Missing section from mockData.js) --- */}
          <View style={styles.fieldGroup}>
            <View style={styles.detailsHeaderRow}>
              <View>
                <Text style={styles.inputLabel}>Product Details & Specifications</Text>
                <Text style={styles.detailsHelperText}>
                  Attributes shown in the product specifications table
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addDetailBtn}
                onPress={handleAddDetailRow}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={18} color="#2563EB" />
                <Text style={styles.addDetailBtnText}>Add Spec</Text>
              </TouchableOpacity>
            </View>

            {/* Specification rows */}
            <View style={styles.detailsCard}>
              {details.map((item, index) => (
                <View key={index} style={styles.detailInputRow}>
                  <TextInput
                    style={styles.detailLabelInput}
                    placeholder="Attribute (e.g. Brand)"
                    placeholderTextColor="#94A3B8"
                    value={item.label}
                    onChangeText={(val) => handleDetailChange(index, 'label', val)}
                  />
                  <Text style={styles.detailColon}>:</Text>
                  <TextInput
                    style={styles.detailValueInput}
                    placeholder="Value (e.g. Apple)"
                    placeholderTextColor="#94A3B8"
                    value={item.value}
                    onChangeText={(val) => handleDetailChange(index, 'value', val)}
                  />
                  <TouchableOpacity
                    style={styles.detailDeleteBtn}
                    onPress={() => handleRemoveDetailRow(index)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addCustomRowBtn}
                onPress={handleAddDetailRow}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#2563EB" style={{ marginRight: 4 }} />
                <Text style={styles.addCustomRowBtnText}>Add Custom Specification</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- 10. PROVIDER TYPE (Student vs External Provider) --- */}
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Listing As (Provider Type)</Text>
            <View style={styles.providerTypeRow}>
              <TouchableOpacity
                style={[
                  styles.providerTypeOption,
                  providerType === 'student' && styles.providerTypeOptionActive,
                  providerType === 'student' && { borderColor: '#8B5CF6' },
                ]}
                onPress={() => setProviderType('student')}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.providerTypeIconWrap,
                    { backgroundColor: providerType === 'student' ? '#8B5CF6' : '#F1F5F9' },
                  ]}
                >
                  <Ionicons
                    name="school"
                    size={16}
                    color={providerType === 'student' ? '#FFFFFF' : '#64748B'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.providerTypeTitle,
                      providerType === 'student' && { color: '#8B5CF6', fontWeight: '700' },
                    ]}
                  >
                    Student Provider
                  </Text>
                  <Text style={styles.providerTypeSub}>Campus student peer-to-peer</Text>
                </View>
                {providerType === 'student' && (
                  <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.providerTypeOption,
                  providerType === 'external' && styles.providerTypeOptionActive,
                  providerType === 'external' && { borderColor: '#06B6D4' },
                ]}
                onPress={() => setProviderType('external')}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.providerTypeIconWrap,
                    { backgroundColor: providerType === 'external' ? '#06B6D4' : '#F1F5F9' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="earth"
                    size={16}
                    color={providerType === 'external' ? '#FFFFFF' : '#64748B'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.providerTypeTitle,
                      providerType === 'external' && { color: '#06B6D4', fontWeight: '700' },
                    ]}
                  >
                    External Provider
                  </Text>
                  <Text style={styles.providerTypeSub}>Local shop or external merchant</Text>
                </View>
                {providerType === 'external' && (
                  <Ionicons name="checkmark-circle" size={20} color="#06B6D4" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* --- 11. PRICE NEGOTIATION TOGGLE --- */}
          <View style={styles.toggleRowContainer}>
            <Switch
              value={allowNegotiation}
              onValueChange={setAllowNegotiation}
              trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
              thumbColor="#FFFFFF"
            />
            <Text style={styles.toggleLabel}>Allow price negotiation</Text>
          </View>

          {/* --- 12. INFO NOTICE BANNER --- */}
          {showNotice && (
            <View style={styles.infoBanner}>
              <Ionicons
                name="information-circle"
                size={22}
                color="#2563EB"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.infoBannerText}>
                Your listing will be visible to all UniMart users after publishing.
              </Text>
              <TouchableOpacity
                onPress={() => setShowNotice(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- 13. STICKY BOTTOM ACTION BAR --- */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.draftBtn}
          onPress={handleSaveDraft}
          activeOpacity={0.8}
        >
          <Text style={styles.draftBtnText}>Save as Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.publishBtn}
          onPress={handlePublish}
          activeOpacity={0.85}
        >
          <Text style={styles.publishBtnText}>Publish Listing</Text>
        </TouchableOpacity>
      </View>

      {/* --- MODAL 1: CATEGORY SELECTION --- */}
      <Modal
        visible={isCategoryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsCategoryModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalSheetTitle}>Select Category</Text>
                  <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)}>
                    <Ionicons name="close" size={22} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.name}
                      style={[
                        styles.modalListItem,
                        isSelected && styles.modalListItemActive,
                      ]}
                      onPress={() => handleSelectCategory(cat.name)}
                    >
                      <View style={styles.modalItemLeft}>
                        <MaterialCommunityIcons
                          name={cat.icon}
                          size={20}
                          color={isSelected ? '#2563EB' : '#64748B'}
                          style={{ marginRight: 12 }}
                        />
                        <Text
                          style={[
                            styles.modalItemText,
                            isSelected && styles.modalItemTextActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color="#2563EB" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* --- MODAL 2: CONDITION SELECTION --- */}
      <Modal
        visible={isConditionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsConditionModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsConditionModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalSheetTitle}>Select Condition</Text>
                  <TouchableOpacity onPress={() => setIsConditionModalVisible(false)}>
                    <Ionicons name="close" size={22} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                {CONDITIONS.map((cond) => {
                  const isSelected = condition === cond.label;
                  return (
                    <TouchableOpacity
                      key={cond.label}
                      style={[
                        styles.modalListItem,
                        isSelected && styles.modalListItemActive,
                      ]}
                      onPress={() => {
                        setCondition(cond.label);
                        setIsConditionModalVisible(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.modalItemText,
                            isSelected && styles.modalItemTextActive,
                          ]}
                        >
                          {cond.label}
                        </Text>
                        <Text style={styles.condDescText}>{cond.desc}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color="#2563EB" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* --- MODAL 3: ADD PHOTO DIALOG --- */}
      <Modal
        visible={isPhotoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPhotoModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsPhotoModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalSheetTitle}>Add Product Photo</Text>
                  <TouchableOpacity onPress={() => setIsPhotoModalVisible(false)}>
                    <Ionicons name="close" size={22} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                {/* Option A: Enter Custom Image URL */}
                <Text style={styles.photoModalSubhead}>Add via Image Web URL</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="link-outline" size={18} color="#64748B" style={{ marginRight: 6 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="https://images.unsplash.com/..."
                    placeholderTextColor="#94A3B8"
                    value={customPhotoUrl}
                    onChangeText={setCustomPhotoUrl}
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.primarySmallBtn,
                    { marginTop: 8, opacity: customPhotoUrl ? 1 : 0.6 },
                  ]}
                  onPress={() => handleAddPhotoUri(customPhotoUrl.trim())}
                  disabled={!customPhotoUrl.trim()}
                >
                  <Text style={styles.primarySmallBtnText}>Add Image URL</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* Option B: Choose from Campus Item Presets */}
                <Text style={styles.photoModalSubhead}>Or Choose From Sample Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {SAMPLE_PRESET_PHOTOS.map((preset, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.presetPhotoCard}
                        onPress={() => handleAddPhotoUri(preset.uri)}
                      >
                        <Image source={{ uri: preset.uri }} style={styles.presetPhotoImage} />
                        <Text style={styles.presetPhotoLabel} numberOfLines={1}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* --- MODAL 4: PUBLISH SUCCESS POPUP --- */}
      <Modal
        visible={isPublishSuccessVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={54} color="#10B981" />
            </View>

            <Text style={styles.successTitle}>Listing Published!</Text>
            <Text style={styles.successMessage}>
              "{title}" has been successfully added to the UniMart Marketplace and is visible to buyers.
            </Text>

            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.successPrimaryBtn}
                onPress={() => {
                  setIsPublishSuccessVisible(false);
                  router.replace('/marketplace');
                }}
              >
                <Ionicons name="grid-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.successPrimaryBtnText}>Go to Marketplace</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.successSecondaryBtn}
                onPress={() => {
                  setIsPublishSuccessVisible(false);
                  if (publishedProductId) {
                    router.replace({
                      pathname: '/productDetails',
                      params: { id: publishedProductId },
                    });
                  } else {
                    router.replace('/marketplace');
                  }
                }}
              >
                <Text style={styles.successSecondaryBtnText}>View Product Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },

  backButton: {
    padding: 6,
    marginLeft: -6,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },

  draftHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  draftHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },

  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },

  // Photos
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },

  photosScroll: {
    marginBottom: 20,
  },

  photosScrollContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },

  photoThumbnailContainer: {
    width: 86,
    height: 86,
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },

  photoThumbnail: {
    width: '100%',
    height: '100%',
  },

  removePhotoButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addPhotoCard: {
    width: 86,
    height: 86,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },

  addPhotoIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  addPhotoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },

  // Form Fields
  fieldGroup: {
    marginBottom: 18,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },

  requiredStar: {
    color: '#EF4444',
  },

  optionalTag: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94A3B8',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    minHeight: 48,
  },

  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 10,
  },

  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    minHeight: 48,
  },

  selectorText: {
    fontSize: 15,
    color: '#0F172A',
    flex: 1,
  },

  selectorPlaceholder: {
    color: '#94A3B8',
  },

  textAreaContainer: {
    minHeight: 115,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },

  textArea: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    width: '100%',
    minHeight: 95,
  },

  charCounter: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },

  // Price Input
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  currencyBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },

  currencyBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },

  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    paddingHorizontal: 14,
    height: 48,
  },

  priceFormattedHint: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
    marginTop: 4,
  },

  // Location Chips
  locationChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  locationChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },

  locationChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  locationChipTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },

  // Details / Specifications section
  detailsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  detailsHelperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: -4,
  },

  addDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  addDetailBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },

  detailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },

  detailInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },

  detailLabelInput: {
    flex: 1.1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },

  detailColon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },

  detailValueInput: {
    flex: 1.4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },

  detailDeleteBtn: {
    padding: 6,
  },

  addCustomRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },

  addCustomRowBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },

  // Provider Type Selector
  providerTypeRow: {
    gap: 10,
  },

  providerTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },

  providerTypeOptionActive: {
    backgroundColor: '#F8FAFC',
  },

  providerTypeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  providerTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },

  providerTypeSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // Toggle Row
  toggleRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },

  toggleLabel: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },

  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },

  // Sticky Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },

  draftBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  draftBtnText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '700',
  },

  publishBtn: {
    flex: 1.5,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },

  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    maxHeight: '75%',
  },

  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },

  modalSheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },

  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  modalListItemActive: {
    backgroundColor: '#EFF6FF',
  },

  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  modalItemText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },

  modalItemTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },

  condDescText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  photoModalSubhead: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 10,
    marginBottom: 6,
  },

  primarySmallBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primarySmallBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },

  presetPhotoCard: {
    width: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },

  presetPhotoImage: {
    width: '100%',
    height: 70,
  },

  presetPhotoLabel: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 4,
  },

  // Success Modal
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  successModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },

  successIconCircle: {
    marginBottom: 12,
  },

  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },

  successMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },

  successActions: {
    width: '100%',
    gap: 10,
  },

  successPrimaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  successPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  successSecondaryBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  successSecondaryBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
});
