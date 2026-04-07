// import React, { useState } from "react";
// import { SafeAreaView, Text, View, TouchableOpacity } from "react-native";
// import { ChevronLeft } from "lucide-react-native";
// import { useRouter } from "expo-router";
// import { useSelector } from "react-redux";
// import { InputField} from "../components/ui/InputField";
// import { FormCard } from "../components/ui/FormCard";
// import { SubmitButton} from "../components/ui/SubmitButton";

// export default function EditProfileScreen() {
//   const router = useRouter();
//   const user = useSelector((state: any) => state.auth.user);

//   const [name, setName] = useState(user?.name || "");
//   const [email, setEmail] = useState(user?.email || "");

//   return (
//     <SafeAreaView className="flex-1 bg-[#F5F7FA]">

//       {/* Header */}
//       <View className="flex-row items-center mt-10 px-4 pb-4">
//         <TouchableOpacity onPress={() => router.back()}>
//           <ChevronLeft size={22} color="#111827" />
//         </TouchableOpacity>
//         <Text className="flex-1 text-center text-lg font-bold text-gray-900">
//           Edit Profile
//         </Text>
//       </View>

//       <FormCard>
//         <InputField label="Full Name" value={name} onChangeText={setName} />
//         <InputField label="Email" value={email} onChangeText={setEmail} />
//       </FormCard>

//       <SubmitButton label="Save Changes" onPress={() => console.log("save")} />
//     </SafeAreaView>
//   );
// }

import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import { ChevronLeft, Camera } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";

import { InputField } from "../components/ui/InputField";
import { FormCard } from "../components/ui/FormCard";
import { SubmitButton } from "../components/ui/SubmitButton";

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);

  const [name, setName] = useState(user?.name || " ");
  const [phone, setPhone] = useState(user?.phone || "+21694998370");
  const [email, setEmail] = useState(user?.email || "example@gmail.com");

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]">
      {/* Header */}
      <View className="flex-row items-center mt-10 px-4 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={22} color="#111827" />
        </TouchableOpacity>

        <Text className="flex-1 text-center text-lg font-bold text-gray-900">
          Edit Profile
        </Text>
      </View>

      {/* Avatar */}
      {user.avatar ? (
        <View className="items-center mt-4">
          <View className="relative">
            <Image
              source={{ uri: user.avatar }}
              className="w-28 h-28 rounded-full"
            />
            <TouchableOpacity className="absolute bottom-1 right-1 bg-gray-500 p-2 rounded-full">
              <Camera size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="items-center mt-4">
          <View className="w-28 h-28 rounded-full bg-emerald-100 border-2 border-emerald-400 items-center justify-center">
            <Text className="text-emerald-600 text-xl font-bold">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </Text>
            <TouchableOpacity className="absolute bottom-1 right-1 bg-gray-500 p-2 rounded-full">
              <Camera size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* FORM CARD */}
      <FormCard>
        <InputField label="Name" value={name} onChangeText={setName} />

        {/* Phone with "Change" button */}
        <View className="mb-4">
          <Text className="text-gray-500 text-xs mb-1">Phone Number</Text>

          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Text className="flex-1 text-gray-900">{phone}</Text>

            <TouchableOpacity onPress={() => console.log("change phone")}>
              <Text className="text-gray-500 font-medium">Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <InputField label="Email" value={email} onChangeText={setEmail} />
      </FormCard>

      {/* SUBMIT BUTTON */}
      <SubmitButton
        label="Update"
        onPress={() => console.log("update profile")}
      />
    </SafeAreaView>
  );
}
