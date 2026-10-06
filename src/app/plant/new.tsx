import { router, useLocalSearchParams } from 'expo-router';

import { getCatalogPlant } from '@/catalog';
import { PlantForm } from '@/components/plant-form';
import { useToast } from '@/components/toast';
import { fr } from '@/i18n/fr';
import { usePlantsStore } from '@/store/plants-store';

export default function NewPlantScreen() {
  const { catalogId } = useLocalSearchParams<{ catalogId?: string }>();
  const catalog = catalogId ? getCatalogPlant(catalogId) : undefined;
  const { addPlant } = usePlantsStore();
  const toast = useToast();

  return (
    <PlantForm
      catalog={catalog}
      submitLabel={fr.form.add}
      initial={{
        catalogId: catalog?.id ?? null,
        name: '',
        species: catalog ? catalog.latin_name : null,
        location: null,
        photoPath: null,
        waterEveryDays: catalog ? null : 7,
        notes: null,
      }}
      onSubmit={async (values) => {
        const id = await addPlant(values);
        toast.show({ message: `${values.name} a rejoint vos plantes 🌱` });
        router.dismissTo('/');
        router.push({ pathname: '/plant/[id]', params: { id } });
      }}
    />
  );
}
