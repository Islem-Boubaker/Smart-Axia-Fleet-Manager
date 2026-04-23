import * as ImagePicker from "expo-image-picker";
import { useCallback } from "react";
import { Alert } from "react-native";

import type { ReclamationImage } from "../types/reclamation.types";

type SetImages = React.Dispatch<React.SetStateAction<ReclamationImage[]>>;

function buildPermissionAlert(source: "camera" | "library") {
  const message =
    source === "camera"
      ? "Camera access is required to take a photo. Please allow access in your device settings."
      : "Photo library access is required to attach images. Please allow access in your device settings.";

  Alert.alert("Permission required", message);
}

export function useImagePicker(
  images: ReclamationImage[],
  setImages: SetImages,
  maxImages = 5,
) {
  const remainingSlots = Math.max(0, maxImages - images.length);

  const appendImages = useCallback(
    (nextImages: ReclamationImage[]) => {
      if (nextImages.length === 0) {
        return;
      }

      setImages((prev) => {
        const seenUris = new Set(prev.map((image) => image.uri));
        const merged = [...prev];

        for (const image of nextImages) {
          if (merged.length >= maxImages) {
            break;
          }

          if (!seenUris.has(image.uri)) {
            seenUris.add(image.uri);
            merged.push(image);
          }
        }

        return merged;
      });
    },
    [maxImages, setImages],
  );

  const removeImage = useCallback(
    (uri: string) => {
      setImages((prev) => prev.filter((image) => image.uri !== uri));
    },
    [setImages],
  );

  const pickFromGallery = useCallback(async () => {
    if (remainingSlots <= 0) {
      Alert.alert(
        "Maximum reached",
        `You can attach up to ${maxImages} photos. Remove one to add another.`,
      );
      return;
    }

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      buildPermissionAlert("library");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.8,
      exif: false,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    appendImages(
      result.assets.slice(0, remainingSlots).map((asset) => ({
        uri: asset.uri,
        name: asset.fileName ?? undefined,
        type: asset.mimeType ?? undefined,
      })),
    );
  }, [appendImages, maxImages, remainingSlots]);

  const takePhoto = useCallback(async () => {
    if (remainingSlots <= 0) {
      Alert.alert(
        "Maximum reached",
        `You can attach up to ${maxImages} photos. Remove one to add another.`,
      );
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      buildPermissionAlert("camera");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      exif: false,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    appendImages(
      result.assets.slice(0, 1).map((asset) => ({
        uri: asset.uri,
        name: asset.fileName ?? undefined,
        type: asset.mimeType ?? undefined,
      })),
    );
  }, [appendImages, maxImages, remainingSlots]);

  const showPicker = useCallback(() => {
    if (remainingSlots <= 0) {
      Alert.alert(
        "Maximum reached",
        `You can attach up to ${maxImages} photos. Remove one to add another.`,
      );
      return;
    }

    Alert.alert("Add photos", "Choose a source", [
      { text: "Camera", onPress: takePhoto },
      { text: "Photo Library", onPress: pickFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [maxImages, pickFromGallery, remainingSlots, takePhoto]);

  return {
    showPicker,
    pickFromGallery,
    takePhoto,
    removeImage,
  };
}