import { useLocalSearchParams, useRouter } from "expo-router";
import ReclamationDetailScreen from "@/features/reclamations/screens/reclamationDetailScreen";

export default function ReclamationDetailRoute() {
  const params = useLocalSearchParams<{ id?: string; reclamation?: string }>();
  const router = useRouter();

  const route = {
    params: {
      id: params.id,
      reclamation: params.reclamation,
    },
  };

  const navigation = {
    goBack: () => router.back(),
  };

  return (
    <ReclamationDetailScreen route={route} navigation={navigation} />
  );
}
