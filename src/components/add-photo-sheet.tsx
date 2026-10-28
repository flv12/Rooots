import { pickPhoto, type PhotoSource } from '@/files/pick-photo';
import { fr } from '@/i18n/fr';

import { ActionSheet } from './action-sheet';
import { useToast } from './toast';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Receives the temporary URI of the photo that was taken or picked. */
  onPicked: (uri: string) => void | Promise<void>;
};

/** « Prendre une photo / Depuis la galerie » sheet. Photos are not cropped: growth is easier to compare uncut. */
export function AddPhotoSheet({ visible, onClose, onPicked }: Props) {
  const toast = useToast();

  const pick = async (source: PhotoSource) => {
    const result = await pickPhoto(source, false);
    if (result === 'denied') toast.show({ message: fr.photos.cameraDenied });
    else if (result) await onPicked(result.uri);
  };

  return (
    <ActionSheet
      visible={visible}
      title={fr.photos.add}
      actions={[
        { label: fr.form.takePhoto, icon: 'camera-outline', onPress: () => pick('camera') },
        { label: fr.form.fromLibrary, icon: 'images-outline', onPress: () => pick('library') },
      ]}
      onClose={onClose}
    />
  );
}
