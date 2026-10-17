import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar, Alert, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  background: "#0F1729",
  surface: "#1E293B",
  border: "#304054",
  primary: "#347FF0",
  text: "#E5E7EB",
  muted: "#8998AC",
  green: "#10B981",
  red: "#FF646B",
};

const INITIAL_LISTINGS = [
  {
    id: "1",
    title: "Calculus Textbook",
    price: 1500,
    listed: "Listed 3 days ago",
    status: "Active",
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "2",
    title: "Study Table Wooden",
    price: 8500,
    listed: "Listed 5 days ago",
    status: "Active",
    image:
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "3",
    title: "Scientific Calculator",
    price: 3200,
    listed: "Listed 1 week ago",
    status: "Active",
    image:
      "https://images.unsplash.com/photo-1574607383476-f517f260d30b?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "4",
    title: "Desk Lamp",
    price: 2200,
    listed: "Listed 2 weeks ago",
    status: "Sold",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "5",
    title: "Programming Books",
    price: 2800,
    listed: "Listed 2 weeks ago",
    status: "Sold",
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "6",
    title: "Office Chair",
    price: 6500,
    listed: "Saved yesterday",
    status: "Drafts",
    image:
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300&auto=format&fit=crop&q=80",
  },
];

const NAV_ITEMS = [
  { label: "Home", icon: "home" },
  { label: "Marketplace", icon: "storefront-outline" },
  { label: "Rentals", icon: "car-outline" },
  { label: "Messages", icon: "chatbox" },
  { label: "Profile", icon: "person" },
];

export default function MyListings({
  onBack,
  onAdd,
  onEdit,
  onNavigate,
}) {
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [activeTab, setActiveTab] = useState("Active");
  const [expandedId, setExpandedId] = useState("1");

  const visibleListings = listings.filter(
    (listing) => listing.status === activeTab
  );

  function handleAdd() {
    if (onAdd) return onAdd();
    Alert.alert("Add Listing", "Connect this button to your listing form.");
  }

  function handleEdit(item) {
    if (onEdit) return onEdit(item);
    Alert.alert("Edit Listing", `Open the edit form for ${item.title}.`);
  }

  function handleDelete(item) {
    Alert.alert(
      "Delete listing?",
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setListings((current) =>
              current.filter((listing) => listing.id !== item.id)
            );
          },
        },
      ]
    );
  }

  function changeStatus(item) {
    const nextStatus = item.status === "Active" ? "Sold" : "Active";

    setListings((current) =>
      current.map((listing) =>
        listing.id === item.id
          ? { ...listing, status: nextStatus }
          : listing
      )
    );

    setExpandedId(null);
  }

  function renderListing({ item }) {
    const expanded = expandedId === item.id;
    const statusLabel =
      item.status === "Active"
        ? "Available"
        : item.status === "Drafts"
          ? "Draft"
          : "Sold";

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Image source={{ uri: item.image }} style={styles.productImage} />

          <View style={styles.productDetails}>
            <Text style={styles.productTitle}>{item.title}</Text>

            <Text style={styles.price}>
              LKR {item.price.toLocaleString("en-US")}
            </Text>

            <View
              style={[
                styles.badge,
                item.status === "Sold" && styles.soldBadge,
                item.status === "Drafts" && styles.draftBadge,]}>
              <Text style={styles.badgeText}>{statusLabel}</Text>
            </View>
            <Text style={styles.listedDate}>{item.listed}</Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Actions for ${item.title}`}
            accessibilityState={{ expanded }}
            onPress={() =>
              setExpandedId(expanded ? null : item.id)
            }
            style={styles.moreButton}
            hitSlop={8}>
            <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.text}/>
          </TouchableOpacity>
        </View>

        {expanded && (
          <View style={styles.actions}>
            <ActionButton icon="pencil" label="Edit Listing" onPress={() => handleEdit(item)}/>

            <ActionButton
              icon="pricetag"
              label={
                item.status === "Active"
                  ? "Mark as Sold"
                  : item.status === "Drafts"
                    ? "Publish"
                    : "Relist"
              }
              onPress={() => changeStatus(item)} bordered/>

            <ActionButton icon="trash" color={COLORS.red} onPress={() => handleDelete(item)}/>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.surface}/>

      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.headerButton}
          onPress={() => {
            if (onBack) return onBack();
            Alert.alert("Back", "Connect this button to your navigation.");
          }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Listings</Text>

        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Add listing" style={styles.headerButton} onPress={handleAdd}>
          <Ionicons name="add" size={26} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {["Active", "Sold", "Drafts"].map((tab) => {
          const selected = activeTab === tab;
          const count = listings.filter(
            (listing) => listing.status === tab
          ).length;

          return (
            <TouchableOpacity
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={[styles.tab, selected && styles.selectedTab]}
              onPress={() => {
                setActiveTab(tab);
                setExpandedId(null); }} >
              <Text style={[ styles.tabText, selected && styles.selectedTabText, ]} >
                {tab} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.main}>
        <FlatList
          data={visibleListings}
          keyExtractor={(item) => item.id}
          renderItem={renderListing}
          extraData={expandedId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={42} color={COLORS.muted} />
              <Text style={styles.emptyText}> No {activeTab.toLowerCase()} listings yet </Text>
            </View>
          }
        />

        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Create a new listing" activeOpacity={0.85} style={styles.floatingButton} onPress={handleAdd}>
          <Ionicons name="add" size={32} color={COLORS.background} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomNavigation}>
        {NAV_ITEMS.map((item) => {
          const selected = item.label === "Profile";

          return (
            <TouchableOpacity key={item.label}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected }}
              style={styles.navItem}
              onPress={() => {
                if (onNavigate) return onNavigate(item.label);

                if (!selected) {
                  Alert.alert(
                    item.label,
                    `Connect this button to your ${item.label} screen.`
                  );
                }
              }}
            >
              <View style={[ styles.navIconContainer, selected && styles.selectedNavIcon,]}>
                <Ionicons name={item.icon} size={22} color={selected ? COLORS.primary : "#63748B"}/>{item.label === "Messages" && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>3</Text>
                  </View>
                )}
              </View>

              <Text numberOfLines={1} style={[ styles.navLabel, selected && styles.selectedNavLabel, ]}> {item.label} </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  color = COLORS.text,
  bordered = false,
}) {
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} style={[styles.actionButton, bordered && styles.actionBorder]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    height: 60,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  selectedTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.muted,
  },
  selectedTabText: {
    color: COLORS.primary,
  },
  main: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 7,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    padding: 12,
    alignItems: "flex-start",
  },
  productImage: {
    width: 82,
    height: 82,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 6,
  },
  price: {
    color: COLORS.primary,
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 7,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.green,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  soldBadge: {
    backgroundColor: "#94A3B8",
  },
  draftBadge: {
    backgroundColor: "#FBBF24",
  },
  badgeText: {
    color: "#06231D",
    fontSize: 12,
    fontWeight: "600",
  },
  listedDate: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
  },
  moreButton: {
    width: 28,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 10,
    gap: 5,
  },
  actionBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "500",
    flexShrink: 1,
  },
  floatingButton: {
    position: "absolute",
    right: 18,
    bottom: 16,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  bottomNavigation: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 7,
    paddingBottom: 9,
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
  },
  navIconContainer: {
    width: 58,
    height: 32,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedNavIcon: {
    backgroundColor: "#223759",
  },
  navLabel: {
    color: "#63748B",
    fontSize: 10,
    marginTop: 4,
  },
  selectedNavLabel: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 70,
  },
  emptyText: {
    color: COLORS.muted,
    marginTop: 12,
    fontSize: 15,
  },
});