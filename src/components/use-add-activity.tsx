import Ionicons from '@expo/vector-icons/Ionicons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';

import { careDate, type CareDateChoice } from '@/domain/care-date';
import type { CareType } from '@/domain/types';
import { fr } from '@/i18n/fr';
import { usePlantsStore } from '@/store/plants-store';

import { ActionSheet, type SheetAction } from './action-sheet';
import { AddPhotoSheet } from './add-photo-sheet';
import { useToast } from './toast';

export const careIcons: Record<CareType, keyof typeof Ionicons.glyphMap> = {
  water: 'water',
  fertilize: 'flask',
  repot: 'cube',
  prune: 'cut',
  other: 'ellipsis-horizontal',
};

// null = closed, 'menu' = photo / note / care, 'type' = choosing the care,
// { type } = choosing when it was done.
type Step = null | 'menu' | 'type' | { type: CareType };

/**
 * Everything you can add to a plant's timeline: a photo, a note or a care. Returns the sheets to
 * render (`element`) and the functions that open them.
 */
export function useAddActivity(plantId: string): {
  element: ReactNode;
  openMenu: () => void;
  openPhoto: () => void;
} {
  const toast = useToast();
  const { logCare, removeLog, addPhoto } = usePlantsStore();
  const [step, setStep] = useState<Step>(null);
  const [addingPhoto, setAddingPhoto] = useState(false);

  const saveCare = (type: CareType, choice: CareDateChoice) => {
    const doneAt = careDate(choice, new Date());
    const logId = logCare(plantId, type, null, doneAt);
    toast.show({
      message: fr.plant.careSaved(
        fr.care[type],
        format(doneAt, 'EEEE d MMMM', { locale: frLocale }),
      ),
      actionLabel: fr.home.undo,
      onAction: () => removeLog(logId),
    });
  };

  const pickCareDate = (type: CareType) =>
    DateTimePickerAndroid.open({
      value: new Date(),
      mode: 'date',
      maximumDate: new Date(),
      onValueChange: (_event, date) => saveCare(type, date),
    });

  // The sheet closes itself before an action's onPress, so setting the next step here reopens it.
  const actions: SheetAction[] =
    step === 'menu'
      ? [
          {
            label: fr.timeline.addPhoto,
            icon: 'camera-outline',
            onPress: () => setAddingPhoto(true),
          },
          {
            label: fr.timeline.addNote,
            icon: 'document-text-outline',
            onPress: () => router.push({ pathname: '/plant/[id]/note', params: { id: plantId } }),
          },
          { label: fr.timeline.addCare, icon: 'water-outline', onPress: () => setStep('type') },
        ]
      : step === 'type'
        ? (['water', 'fertilize', 'repot', 'prune'] as const).map((t) => ({
            label: fr.care[t],
            icon: careIcons[t],
            onPress: () => setStep({ type: t }),
          }))
        : step
          ? [
              {
                label: fr.plant.when.today,
                icon: 'today-outline',
                onPress: () => saveCare(step.type, 'today'),
              },
              {
                label: fr.plant.when.yesterday,
                icon: 'arrow-undo-outline',
                onPress: () => saveCare(step.type, 'yesterday'),
              },
              {
                label: fr.plant.when.pick,
                icon: 'calendar-outline',
                onPress: () => pickCareDate(step.type),
              },
            ]
          : [];

  const title =
    step === 'menu' || step === null
      ? fr.timeline.addTitle
      : step === 'type'
        ? fr.plant.logCare
        : fr.care[step.type];

  const element = (
    <>
      <AddPhotoSheet
        visible={addingPhoto}
        onClose={() => setAddingPhoto(false)}
        onPicked={async (uri) => {
          await addPhoto(plantId, uri);
          toast.show({ message: fr.photos.added });
        }}
      />
      <ActionSheet
        visible={step != null}
        title={title}
        message={step && typeof step === 'object' ? fr.plant.when.question : undefined}
        actions={actions}
        onClose={() => setStep(null)}
      />
    </>
  );

  return { element, openMenu: () => setStep('menu'), openPhoto: () => setAddingPhoto(true) };
}
