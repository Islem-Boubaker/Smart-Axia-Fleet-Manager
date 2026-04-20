import { TouchableOpacity, Text, Alert } from "react-native";
import { LogOut } from "lucide-react-native";
import { useRouter } from "expo-router";
import { profileApi } from "../services/profile.api";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await profileApi.logout();
          } catch {}
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      className="mx-4 mt-6 py-4 rounded-2xl bg-white border border-red-200 flex-row justify-center dark:bg-slate-900 dark:border-red-400/40"
    >
      <LogOut size={18} color="#ef4444" />
      <Text className="text-red-500 ml-2 font-semibold">Log Out</Text>
    </TouchableOpacity>
  );
}