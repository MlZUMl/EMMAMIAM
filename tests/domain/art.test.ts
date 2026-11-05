// Chaque illustration annoncée par src/art/images.ts doit exister dans public/art (sinon : image cassée dans l'appli).
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ART_KEYS, companionUrl } from '../../src/art/images'

const DIR = join(__dirname, '..', '..', 'public', 'art')

describe('illustrations aquarelle', () => {
  it('chaque clé annoncée a son fichier WebP', () => {
    const manquantes = ART_KEYS.filter(k => !existsSync(join(DIR, `${k}.webp`)))
    expect(manquantes).toEqual([])
  })
  it('aucun fichier orphelin dans public/art (hors logo)', () => {
    const connus = new Set(ART_KEYS.map(k => `${k}.webp`))
    const orphelins = readdirSync(DIR).filter(f => f !== 'logo.webp' && !connus.has(f))
    expect(orphelins).toEqual([])
  })
  it('la mascotte prend l\'image du dernier objet de boutique porté, ignore les accessoires gagnés', () => {
    expect(companionUrl('chat', [])).toBe('art/compagnon-chat.webp')
    expect(companionUrl('chat', ['noeud'])).toBe('art/compagnon-chat.webp')
    expect(companionUrl('chat', ['sweat', 'halo'])).toBe('art/compagnon-chat-halo.webp')
    expect(companionUrl('pousse', ['halo', 'sweat', 'noeud'])).toBe('art/compagnon-pousse-sweat.webp')
  })
})
