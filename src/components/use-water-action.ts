import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

import type { Plant } from '@/domain/types';
import { fr } from '@/i18n/fr';
import { usePlantsStore } from '@/store/plants-store';

import { useToast } from './toast';

/** Logs a watering with haptic feedback and an undo toast. */
export function useWaterAction() {
  const { logCare, removeLog } = usePlantsStore();
  const toast = useToast();
  return useCallback(
    (plant: Plant) => {
      const logId = logCare(plant.id, 'water');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast.show({
        message: fr.home.watered(plant.name),
        actionLabel: fr.home.undo,
        onAction: () => removeLog(logId),
      });
    },
    [logCare, removeLog, toast],
  );
}
