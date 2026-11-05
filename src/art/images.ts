// Illustrations aquarelle (générées avec ComfyUI), servies depuis public/art/<clé>.webp.
// config.js -> art peut toujours remplacer une image ; sans image, on garde le dessin vectoriel.
import { getConfig } from '../lib/config'
import { SHOP } from '../domain/shop'
import { ITEMS } from '../domain/catalog'

const ESPECES = ['chat', 'lapin', 'nuage', 'creature', 'pousse']
const TENUES = ['tshirt', 'sport', 'pull-raye', 'chemise-jean', 'yoga', 'robe-ete', 'doudoune', 'kimono', 'abaya', 'robe-doree', 'sport-premium', 'manteau-etoile']
const COIFFURES = ['queue', 'tresse', 'frange', 'afro', 'carre-plongeant', 'couettes', 'ondules', 'chignon-fleuri', 'turban', 'meches-roses']
const ACCESSOIRES = ['lunettes', 'boucles', 'foulard', 'casque', 'sac', 'couronne']
/** Objets de la boutique des mascottes (tout sauf les coiffures a une image « objet seul »). */
const OBJETS_MASCOTTE = SHOP.filter(i => i.target === 'compagnon')

/** Toutes les images fournies avec l'appli : un test vérifie que chaque fichier existe dans public/art. */
export const ART_KEYS: string[] = [
  'avatar',
  // Le Refuge : le décor et chaque objet (fond transparent, bas de l'image = point de contact)
  'refuge-decor',
  ...ITEMS.map(i => `objet-${i.id}`),
  ...ESPECES.map(s => `compagnon-${s}`),
  // Avatar en pied, une image par tenue
  ...TENUES.map(t => `avatar-av-${t}`),
  // Portrait : coiffure ou accessoire porté
  ...[...COIFFURES, ...ACCESSOIRES].map(id => `portrait-av-${id}`),
  // Vignette de la boutique : l'objet seul
  ...[...TENUES, ...ACCESSOIRES].map(id => `article-av-${id}`),
  // Mascottes : chaque objet porté par chaque espèce, et les vêtements/accessoires seuls
  ...ESPECES.flatMap(e => OBJETS_MASCOTTE.map(i => `compagnon-${e}-${i.id}`)),
  ...OBJETS_MASCOTTE.filter(i => i.slot !== 'coiffure').map(i => `article-${i.id}`),
]
const BUNDLED = new Set(ART_KEYS)

/** Adresse de l'illustration `key`, ou undefined s'il n'y en a pas (le dessin vectoriel prend le relais). */
export function artUrl(key: string): string | undefined {
  return getConfig().art?.[key] ?? (BUNDLED.has(key) ? `art/${key}.webp` : undefined)
}

/**
 * Image de la mascotte : celle de son dernier objet de boutique porté (la liste garde l'ordre d'équipement),
 * sinon l'aquarelle de base de l'espèce. Les accessoires gagnés (nœud, cape…) n'ont pas d'image à eux.
 */
export function companionUrl(species: string, accessories: string[]): string | undefined {
  for (let i = accessories.length - 1; i >= 0; i--) {
    const url = artUrl(`compagnon-${species}-${accessories[i]}`)
    if (url) return url
  }
  return artUrl(`compagnon-${species}`)
}
