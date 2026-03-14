import React from "react";
import { ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../store/AuthContext";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { useDashboard } from "../hooks/useDashboard";
import { DashboardHeader } from "../components/DashboardHeader";
import { DashboardSummarySection } from "../components/DashboardSummarySection";
import { ActiveTripSection } from "../components/ActiveTripSection";
import { QuickActionsSection } from "../components/QuickActionsSection";

export function DashboardScreen({ navigation }: any) {
  const { state: authState } = useAuth();

  const {
    activeTrip,
    vehicle,
    isLoading,
    isRefreshing,
    completedCount,
    pendingCount,
    handleRefresh,
  } = useDashboard();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top"]}>
      <ScrollView
        contentContainerClassName="px-4 py-4"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
      >
        <DashboardHeader userName={authState.user?.name} />

        <DashboardSummarySection
          completedCount={completedCount}
          pendingCount={pendingCount}
          activeTrip={activeTrip}
          vehicle={vehicle}
          navigation={navigation}
        />

        <ActiveTripSection activeTrip={activeTrip} />

        <QuickActionsSection navigation={navigation} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default DashboardScreen;
