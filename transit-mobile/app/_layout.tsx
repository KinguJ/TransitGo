import { Drawer } from "expo-router/drawer";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, Platform } from "react-native";
import { ClockProvider } from "../src/context/ClockContext";
import { AuthProvider } from "../src/context/AuthContext";

// Import CSS only on web to keep native builds happy
if (Platform.OS === 'web') {
  require('../global.css');
}

export default function Layout() {
  return (
    <AuthProvider>
      <ClockProvider>
          <Drawer
      screenOptions={{
        headerShown: false, // Hide all drawer headers globally
        drawerActiveTintColor: "#B9B6D3",
        drawerInactiveTintColor: "#FFFFFFAA",
        drawerStyle: { backgroundColor: "#1E222F" }
      }}
    >
      <Drawer.Screen
        name="home"
        options={{
          title: "Home",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="routes/index"
        options={{
          title: "Routes",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bus" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="favorites"
        options={{
          title: "Favorites",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="star" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="trip-planner"
        options={{
          title: "Trip Planner",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-search" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: "Profile",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="faq"
        options={{
          title: "FAQ",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="help-circle" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="about"
        options={{
          title: "About Us",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="information" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="contact"
        options={{
          title: "Contact & Feedback",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="email" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="lost-found"
        options={{
          title: "Lost & Found",
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="flag-variant" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden routes - these exist but shouldn't appear in drawer */}
      <Drawer.Screen
        name="index"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="routes/list"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="routes/[id]"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="+not-found"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />

      {/* Auth routes - hidden from drawer */}
      <Drawer.Screen
        name="(auth)"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="(auth)/sign-in"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="(auth)/sign-up"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />

    </Drawer>
      </ClockProvider>
    </AuthProvider>
  );
}
