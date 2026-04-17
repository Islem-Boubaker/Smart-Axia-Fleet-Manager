// ─── ImageUploader ────────────────────────────────────────────────────────────
// Displays a grid of selected image thumbnails with remove buttons,
// plus an "Add photos" trigger button.

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import type { ReclamationImage } from '../types/reclamation.types';

interface ImageUploaderProps {
  images: ReclamationImage[];
  onPickImages: () => void;
  onRemoveImage: (uri: string) => void;
  maxImages?: number;
}

const THUMB_SIZE = 80;

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onPickImages,
  onRemoveImage,
  maxImages = 5,
}) => {
  const canAddMore = images.length < maxImages;

  return (
    <View className="mb-5">
      {/* Label */}
      <Text className="text-sm font-semibold text-gray-700 tracking-wide mb-2">
        Attachments{' '}
        <Text className="text-gray-400 font-normal">
          ({images.length}/{maxImages})
        </Text>
      </Text>

      {/* Thumbnail row */}
      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          <View className="flex-row gap-3">
            {images.map((img, index) => (
              <View
                key={img.uri}
                style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                className="relative rounded-2xl overflow-hidden"
              >
                <Image
                  source={{ uri: img.uri }}
                  style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                  className="rounded-2xl"
                  resizeMode="cover"
                />

                {/* Remove button */}
                <TouchableOpacity
                  onPress={() => onRemoveImage(img.uri)}
                  className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full items-center justify-center"
                  style={{
                    shadowColor: '#111',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.3,
                    shadowRadius: 2,
                    elevation: 3,
                  }}
                >
                  <Text className="text-white font-bold" style={{ fontSize: 9, lineHeight: 12 }}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Add button */}
      {canAddMore && (
        <TouchableOpacity
          onPress={onPickImages}
          className="flex-row items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl py-4 bg-gray-50"
          style={{
            shadowColor: '#111',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <View className="w-7 h-7 rounded-full bg-blue-500 items-center justify-center mr-2">
            <Text className="text-white font-bold text-base leading-none">+</Text>
          </View>
          <Text className="text-gray-500 font-semibold text-sm">
            {images.length === 0 ? 'Attach photos' : 'Add more photos'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Max reached */}
      {!canAddMore && (
        <View className="py-2 px-3 bg-amber-50 rounded-xl border border-amber-200">
          <Text className="text-amber-600 text-xs font-medium text-center">
            Maximum {maxImages} photos reached
          </Text>
        </View>
      )}
    </View>
  );
};