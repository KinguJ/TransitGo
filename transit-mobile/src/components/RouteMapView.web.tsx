import React from "react";
import { View, Text } from "react-native";

interface RouteMapViewProps {
  line: {
    _id: string;
    name: string;
    stops: {
      _id: string;
      name: string;
      location: { coordinates: [number, number] };
    }[];
    path: [number, number][];
  };
  direction: string;
  allLines: any[];
}

export default function RouteMapView({ line, direction }: RouteMapViewProps) {
  return (
    <View
      style={{
        height: 200,
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#1F2937",
        borderWidth: 1,
        borderColor: "#374151",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View style={{ alignItems: "center" }}>
        <Text style={{ color: "#E5E7EB", fontSize: 24 }}>🗺️</Text>
        <Text style={{ color: "#E5E7EB", marginTop: 8, fontSize: 16, fontWeight: "600" }}>
          Route Map
        </Text>
        <Text style={{ color: "#9CA3AF", fontSize: 14, textAlign: "center", marginTop: 4 }}>
          {line?.name ?? "—"}
        </Text>
        <Text style={{ color: "#9CA3AF", fontSize: 12, textAlign: "center", marginTop: 2 }}>
          {line?.stops?.length || 0} stops • {direction} direction
        </Text>
        <Text style={{ color: "#6B7280", fontSize: 11, textAlign: "center", marginTop: 4 }}>
          Interactive map available on mobile app
        </Text>
      </View>
    </View>
  );
} 