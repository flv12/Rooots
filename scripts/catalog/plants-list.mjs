// Source list for the catalog: ~100 common houseplants in France. Edit by hand.
// [id, latin name, usual French name, category]
// Run: node scripts/catalog/plants-list.mjs  → writes plants-list.json
import { writeFileSync } from 'node:fs';

const list = [
  // Already in the first batch
  ['monstera-deliciosa', 'Monstera deliciosa', 'Monstera', 'foliage'],
  ['epipremnum-aureum', 'Epipremnum aureum', 'Pothos', 'foliage'],
  ['dracaena-trifasciata', 'Dracaena trifasciata', 'Sansevieria', 'succulent'],
  ['zamioculcas-zamiifolia', 'Zamioculcas zamiifolia', 'Zamioculcas', 'foliage'],
  ['ficus-lyrata', 'Ficus lyrata', 'Figuier lyre', 'foliage'],
  ['ficus-elastica', 'Ficus elastica', 'Caoutchouc', 'foliage'],
  ['spathiphyllum-wallisii', 'Spathiphyllum wallisii', 'Spathiphyllum', 'flowering'],
  ['chlorophytum-comosum', 'Chlorophytum comosum', 'Plante araignée', 'foliage'],
  ['pilea-peperomioides', 'Pilea peperomioides', 'Pilea', 'foliage'],
  ['goeppertia-orbifolia', 'Goeppertia orbifolia', 'Calathea orbifolia', 'foliage'],
  ['aloe-vera', 'Aloe vera', 'Aloe vera', 'succulent'],
  ['strelitzia-reginae', 'Strelitzia reginae', 'Oiseau de paradis', 'flowering'],
  ['philodendron-hederaceum', 'Philodendron hederaceum', 'Philodendron grimpant', 'foliage'],
  ['phalaenopsis', 'Phalaenopsis', 'Orchidée papillon', 'flowering'],
  ['hoya-carnosa', 'Hoya carnosa', 'Fleur de porcelaine', 'flowering'],
  ['peperomia-obtusifolia', 'Peperomia obtusifolia', 'Pépéromia', 'foliage'],

  // Aroids and big foliage
  ['monstera-adansonii', 'Monstera adansonii', 'Monstera adansonii', 'foliage'],
  [
    'thaumatophyllum-bipinnatifidum',
    'Thaumatophyllum bipinnatifidum',
    'Philodendron selloum',
    'foliage',
  ],
  ['philodendron-erubescens', 'Philodendron erubescens', 'Philodendron rouge', 'foliage'],
  ['scindapsus-pictus', 'Scindapsus pictus', 'Scindapsus argenté', 'foliage'],
  ['syngonium-podophyllum', 'Syngonium podophyllum', 'Syngonium', 'foliage'],
  ['alocasia-amazonica', 'Alocasia × amazonica', 'Alocasia Polly', 'foliage'],
  ['alocasia-macrorrhizos', 'Alocasia macrorrhizos', 'Oreille d’éléphant', 'foliage'],
  ['alocasia-zebrina', 'Alocasia zebrina', 'Alocasia zebrina', 'foliage'],
  ['anthurium-andraeanum', 'Anthurium andraeanum', 'Anthurium', 'flowering'],
  ['aglaonema-commutatum', 'Aglaonema commutatum', 'Aglaonema', 'foliage'],
  ['dieffenbachia-seguine', 'Dieffenbachia seguine', 'Dieffenbachia', 'foliage'],
  ['caladium-bicolor', 'Caladium bicolor', 'Caladium', 'foliage'],

  // Ficus
  ['ficus-benjamina', 'Ficus benjamina', 'Ficus benjamina', 'foliage'],
  ['ficus-microcarpa', 'Ficus microcarpa', 'Ficus ginseng', 'foliage'],
  ['ficus-pumila', 'Ficus pumila', 'Figuier rampant', 'foliage'],

  // Dracaena and similar
  ['dracaena-marginata', 'Dracaena marginata', 'Dragonnier de Madagascar', 'foliage'],
  ['dracaena-fragrans', 'Dracaena fragrans', 'Dracaena massangeana', 'foliage'],
  ['dracaena-sanderiana', 'Dracaena sanderiana', 'Bambou de la chance', 'foliage'],
  ['cordyline-fruticosa', 'Cordyline fruticosa', 'Cordyline', 'foliage'],
  ['yucca-gigantea', 'Yucca gigantea', 'Yucca', 'foliage'],
  ['beaucarnea-recurvata', 'Beaucarnea recurvata', 'Pied d’éléphant', 'succulent'],
  ['schefflera-arboricola', 'Schefflera arboricola', 'Schefflera', 'foliage'],
  ['fatsia-japonica', 'Fatsia japonica', 'Aralia du Japon', 'foliage'],
  ['aspidistra-elatior', 'Aspidistra elatior', 'Aspidistra', 'foliage'],

  // Palms and cycads
  ['dypsis-lutescens', 'Dypsis lutescens', 'Palmier Areca', 'palm'],
  ['howea-forsteriana', 'Howea forsteriana', 'Kentia', 'palm'],
  ['chamaedorea-elegans', 'Chamaedorea elegans', 'Palmier nain', 'palm'],
  ['rhapis-excelsa', 'Rhapis excelsa', 'Palmier bambou', 'palm'],
  ['phoenix-roebelenii', 'Phoenix roebelenii', 'Palmier dattier nain', 'palm'],
  ['cycas-revoluta', 'Cycas revoluta', 'Cycas', 'palm'],

  // Marantaceae
  ['maranta-leuconeura', 'Maranta leuconeura', 'Maranta', 'foliage'],
  ['goeppertia-makoyana', 'Goeppertia makoyana', 'Calathea paon', 'foliage'],
  ['goeppertia-lancifolia', 'Goeppertia lancifolia', 'Calathea crotale', 'foliage'],
  ['stromanthe-sanguinea', 'Stromanthe sanguinea', 'Stromanthe Triostar', 'foliage'],

  // Ferns
  ['nephrolepis-exaltata', 'Nephrolepis exaltata', 'Fougère de Boston', 'fern'],
  ['asplenium-nidus', 'Asplenium nidus', 'Fougère nid d’oiseau', 'fern'],
  ['adiantum-raddianum', 'Adiantum raddianum', 'Capillaire', 'fern'],
  ['platycerium-bifurcatum', 'Platycerium bifurcatum', 'Corne de cerf', 'fern'],
  ['phlebodium-aureum', 'Phlebodium aureum', 'Fougère bleue', 'fern'],

  // Succulents and cacti
  ['crassula-ovata', 'Crassula ovata', 'Arbre de jade', 'succulent'],
  ['echeveria-elegans', 'Echeveria elegans', 'Echeveria', 'succulent'],
  ['haworthiopsis-attenuata', 'Haworthiopsis attenuata', 'Haworthia zèbre', 'succulent'],
  ['kalanchoe-blossfeldiana', 'Kalanchoe blossfeldiana', 'Kalanchoé', 'flowering'],
  ['curio-rowleyanus', 'Curio rowleyanus', 'Plante chapelet', 'succulent'],
  ['sedum-morganianum', 'Sedum morganianum', 'Queue d’âne', 'succulent'],
  ['euphorbia-trigona', 'Euphorbia trigona', 'Euphorbe trigone', 'succulent'],
  ['opuntia-microdasys', 'Opuntia microdasys', 'Oreilles de lapin', 'succulent'],
  ['schlumbergera-truncata', 'Schlumbergera truncata', 'Cactus de Noël', 'flowering'],
  ['echinocactus-grusonii', 'Echinocactus grusonii', 'Coussin de belle-mère', 'succulent'],
  ['portulacaria-afra', 'Portulacaria afra', 'Arbre à éléphant', 'succulent'],
  ['ceropegia-woodii', 'Ceropegia woodii', 'Chaîne des cœurs', 'succulent'],
  ['rhipsalis-baccifera', 'Rhipsalis baccifera', 'Rhipsalis', 'succulent'],

  // Flowering
  ['saintpaulia-ionantha', 'Saintpaulia ionantha', 'Violette du Cap', 'flowering'],
  ['begonia-maculata', 'Begonia maculata', 'Bégonia tacheté', 'flowering'],
  ['begonia-rex', 'Begonia rex', 'Bégonia rex', 'foliage'],
  ['cyclamen-persicum', 'Cyclamen persicum', 'Cyclamen', 'flowering'],
  ['guzmania-lingulata', 'Guzmania lingulata', 'Guzmania', 'flowering'],
  ['vriesea-splendens', 'Vriesea splendens', 'Vriesea', 'flowering'],
  ['aechmea-fasciata', 'Aechmea fasciata', 'Aechmea', 'flowering'],
  ['tillandsia-ionantha', 'Tillandsia ionantha', 'Fille de l’air', 'flowering'],
  ['clivia-miniata', 'Clivia miniata', 'Clivia', 'flowering'],
  ['hippeastrum', 'Hippeastrum', 'Amaryllis', 'flowering'],
  ['gardenia-jasminoides', 'Gardenia jasminoides', 'Gardénia', 'flowering'],
  ['jasminum-polyanthum', 'Jasminum polyanthum', 'Jasmin d’intérieur', 'flowering'],
  ['hibiscus-rosa-sinensis', 'Hibiscus rosa-sinensis', 'Hibiscus', 'flowering'],
  ['euphorbia-pulcherrima', 'Euphorbia pulcherrima', 'Poinsettia', 'flowering'],
  ['streptocarpus', 'Streptocarpus', 'Streptocarpus', 'flowering'],
  ['aeschynanthus-radicans', 'Aeschynanthus radicans', 'Plante rouge à lèvres', 'flowering'],
  ['oxalis-triangularis', 'Oxalis triangularis', 'Oxalis pourpre', 'foliage'],

  // Small foliage and trailing
  ['tradescantia-zebrina', 'Tradescantia zebrina', 'Misère zébrée', 'foliage'],
  ['tradescantia-pallida', 'Tradescantia pallida', 'Misère pourpre', 'foliage'],
  ['fittonia-albivenis', 'Fittonia albivenis', 'Fittonia', 'foliage'],
  ['hypoestes-phyllostachya', 'Hypoestes phyllostachya', 'Plante à taches de rousseur', 'foliage'],
  ['peperomia-argyreia', 'Peperomia argyreia', 'Pépéromia pastèque', 'foliage'],
  ['peperomia-caperata', 'Peperomia caperata', 'Pépéromia ridée', 'foliage'],
  ['pilea-cadierei', 'Pilea cadierei', 'Plante aluminium', 'foliage'],
  ['soleirolia-soleirolii', 'Soleirolia soleirolii', 'Helxine', 'foliage'],
  ['hedera-helix', 'Hedera helix', 'Lierre', 'foliage'],
  ['hoya-kerrii', 'Hoya kerrii', 'Hoya cœur', 'succulent'],
  ['plectranthus-verticillatus', 'Plectranthus verticillatus', 'Plectranthus', 'foliage'],

  // Edible and carnivorous
  ['coffea-arabica', 'Coffea arabica', 'Caféier', 'edible'],
  ['citrus-microcarpa', 'Citrus × microcarpa', 'Calamondin', 'edible'],
  ['musa-acuminata', 'Musa acuminata', 'Bananier nain', 'edible'],
  ['dionaea-muscipula', 'Dionaea muscipula', 'Dionée attrape-mouche', 'carnivorous'],
];

// Trade names that GBIF reports as synonyms (validate-gbif.mjs): the accepted name becomes the
// latin name, the familiar one is kept as a searchable synonym. Ids never change.
const accepted = {
  'alocasia-amazonica': 'Alocasia × mortfontanensis',
  'goeppertia-lancifolia': 'Goeppertia insignis',
  'stromanthe-sanguinea': 'Stromanthe thalia',
  'echinocactus-grusonii': 'Kroenleinia grusonii',
  'saintpaulia-ionantha': 'Streptocarpus ionanthus',
  'vriesea-splendens': 'Lutheria splendens',
};

const ids = new Set();
for (const [id] of list) {
  if (ids.has(id)) throw new Error(`Duplicate id ${id}`);
  ids.add(id);
}

writeFileSync(
  new URL('plants-list.json', import.meta.url),
  JSON.stringify(
    list.map(([id, latin, name_fr, category]) => ({
      id,
      latin_name: accepted[id] ?? latin,
      synonyms: accepted[id] ? [latin] : [],
      name_fr,
      category,
    })),
    null,
    2,
  ) + '\n',
);
console.log(`${list.length} plants`);
