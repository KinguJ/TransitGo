// Web-specific layout for TransitGo mobile app
import { Drawer } from 'expo-router/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { ClockProvider } from '../src/context/ClockContext';
import { AuthProvider } from '../src/context/AuthContext';

export default function WebLayout() {
  return (
    <AuthProvider>
      <ClockProvider>
        <Drawer
          screenOptions={{
            headerShown: false, 
            drawerActiveTintColor: "#B9B6D3",
            drawerInactiveTintColor: "#FFFFFFAA",
            drawerStyle: { backgroundColor: "#1E222F" },
          }}
        >
          <Drawer.Screen
            name="home"
            options={{
              drawerLabel: "Home",
              title: "Home",
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="home-variant" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="routes/index"
            options={{
              drawerLabel: "Routes",
              title: "Routes",
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="bus" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="favorites"
            options={{
              drawerLabel: "Favorites",
              title: "Favorites",
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="star" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="trip-planner"
            options={{
              drawerLabel: "Trip Planner",
              title: "Trip Planner",
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="map-search" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="profile"
            options={{
              drawerLabel: "Profile",
              title: "Profile",
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="account" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="faq"
            options={{
              drawerLabel: "FAQ",
              title: "FAQ",
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="help-circle" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="about"
            options={{
              drawerLabel: "About Us",
              title: "About Us",
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="information" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="contact"
            options={{
              drawerLabel: "Contact & Feedback",
              title: "Contact & Feedback",
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="email" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="lost-found"
            options={{
              drawerLabel: "Lost & Found",
              title: "Lost & Found",
              drawerIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="flag-variant" size={size} color={color} />
              ),
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
          
          {/* Hidden screens */}
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
              title: "Route List",
            }}
          />
          <Drawer.Screen
            name="routes/[id]"
            options={{
              drawerItemStyle: { display: 'none' },
              title: "Route Details",
            }}
          />
          <Drawer.Screen
            name="+not-found"
            options={{
              drawerItemStyle: { display: 'none' },
            }}
          />
        </Drawer>
      </ClockProvider>
    </AuthProvider>
  );
} 