// ─── DatePickerModal ──────────────────────────────────────────────────────────
// A clean custom calendar modal for date selection.
// Uses pure React Native (no external calendar library needed).

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: Date | null;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // Returns 0=Sun, shift to 0=Mon
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  selectedDate,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const today = new Date();
  const [viewYear, setViewYear] = useState(
    selectedDate ? selectedDate.getFullYear() : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selectedDate ? selectedDate.getMonth() : today.getMonth()
  );
  const [pickedDate, setPickedDate] = useState<Date | null>(selectedDate);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayPress = (day: number) => {
    setPickedDate(new Date(viewYear, viewMonth, day));
  };

  const handleConfirm = () => {
    if (pickedDate) onConfirm(pickedDate);
  };

  const isToday = (day: number) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear();

  const isPicked = (day: number) =>
    pickedDate !== null &&
    day === pickedDate.getDate() &&
    viewMonth === pickedDate.getMonth() &&
    viewYear === pickedDate.getFullYear();

  // Build grid cells
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {/* Backdrop */}
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onCancel}
      >
        <Pressable
          className="bg-white dark:bg-slate-900 rounded-t-3xl px-5 pt-6 pb-8"
          onPress={() => {}}
        >
          {/* Handle bar */}
          <View className="w-12 h-1 bg-gray-200 dark:bg-slate-700 rounded-full self-center mb-5" />

          {/* Header: month/year navigation */}
          <View className="flex-row items-center justify-between mb-5">
            <TouchableOpacity
              onPress={prevMonth}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 items-center justify-center"
            >
              <Text className="text-gray-600 dark:text-slate-200 font-bold text-base">‹</Text>
            </TouchableOpacity>

            <View className="items-center">
              <Text className="text-base font-bold text-gray-800 dark:text-gray-50">
                {t(`shared.months.${MONTH_KEYS[viewMonth]}`)}
              </Text>
              <Text className="text-xs text-gray-400 dark:text-slate-400 font-medium">{viewYear}</Text>
            </View>

            <TouchableOpacity
              onPress={nextMonth}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 items-center justify-center"
            >
              <Text className="text-gray-600 dark:text-slate-200 font-bold text-base">›</Text>
            </TouchableOpacity>
          </View>

          {/* Day-of-week headers */}
          <View className="flex-row mb-3">
            {DAY_KEYS.map((d, i) => (
              <View key={i} className="flex-1 items-center">
                <Text className="text-xs font-bold text-gray-400">{t(`shared.daysShort.${d}`)}</Text>
                
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View className="flex-wrap flex-row">
            {cells.map((day, idx) => {
              const active = day !== null && isPicked(day);
              const todayCell = day !== null && isToday(day);

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => day !== null && handleDayPress(day)}
                  disabled={day === null}
                  className={`items-center justify-center mb-2 ${
                    active
                      ? 'bg-rose-500 rounded-full'
                      : todayCell
                      ? 'bg-rose-100 rounded-full'
                      : ''
                  }`}
                  style={{ width: `${100 / 7}%`, aspectRatio: 1 }}
                >
                  {day !== null && (
                    <Text
                      className={`text-sm font-semibold ${
                        active
                          ? 'text-white'
                          : todayCell
                          ? 'text-rose-500'
                          : 'text-gray-700 dark:text-slate-200'
                      }`}
                    >
                      {day}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action buttons */}
          <View className="flex-row mt-4 gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 items-center"
            >
              <Text className="text-gray-500 dark:text-slate-300 font-semibold text-sm">{t("shared.cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!pickedDate}
              className={`flex-1 py-3.5 rounded-2xl items-center ${
                pickedDate ? 'bg-rose-500' : 'bg-rose-200'
              }`}
            >
              <Text className="text-white font-bold text-sm">{t("shared.confirm")}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
