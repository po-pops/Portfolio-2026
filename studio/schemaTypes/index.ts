import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {HomeIcon} from '@sanity/icons/Home'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {UserIcon} from '@sanity/icons/User'

/* Une image avec sa description (lue par les lecteurs d'écran et Google). */
const photo = defineType({
  name: 'photo',
  title: 'Image',
  type: 'image',
  options: {accept: 'image/*'},
  fields: [
    defineField({
      name: 'alt',
      title: "Description de l'image",
      type: 'string',
      description: "Une phrase courte : ce qu'on voit sur l'image.",
    }),
  ],
})

/* ---------- Accueil ---------- */
const accueil = defineType({
  name: 'accueil',
  title: 'Accueil',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'texteRond',
      title: 'Texte qui tourne autour du smiley',
      type: 'string',
      description: 'Mène à la page À propos. Il est écrit deux fois autour du rond.',
      validation: (r) => r.max(24),
    }),
    defineField({name: 'boutonCafe', title: 'Bouton vers le contact', type: 'string', validation: (r) => r.max(32)}),
  ],
  preview: {prepare: () => ({title: 'Accueil'})},
})

/* ---------- Projets : autant qu'on veut. Les quatre premiers ont leur page project-1 à project-4.html,
   les suivants s'affichent sur projet.html?p=<adresse>. ---------- */
const projet = defineType({
  name: 'projet',
  title: 'Projet',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    {name: 'fiche', title: 'Fiche', default: true},
    {name: 'images', title: 'Images'},
    {name: 'accueil', title: "Sur l'accueil"},
  ],
  fields: [
    defineField({name: 'nom', title: 'Nom du projet', type: 'string', group: 'fiche', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      title: 'Adresse de la page',
      type: 'slug',
      group: 'fiche',
      options: {source: 'nom', maxLength: 60},
      description: 'Cliquer sur « Générer » : la page du projet sera …/projet.html?p=cette-adresse.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'etiquettes',
      title: 'Étiquettes',
      type: 'array',
      group: 'fiche',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
      description: 'Ex. : Product Design, Branding, 2026.',
    }),
    defineField({
      name: 'lien',
      title: 'Bouton en haut à droite',
      type: 'object',
      group: 'fiche',
      fields: [
        defineField({name: 'texte', title: 'Texte', type: 'string', initialValue: 'Voir le site'}),
        defineField({name: 'url', title: 'Adresse', type: 'url', description: 'Laisser vide pour cacher le bouton.'}),
      ],
    }),
    defineField({
      name: 'introduction',
      title: 'Le projet',
      type: 'array',
      group: 'fiche',
      of: [defineArrayMember({type: 'text', rows: 4})],
      description: 'Un bloc par paragraphe.',
    }),
    defineField({
      name: 'etapes',
      title: 'La conception',
      type: 'array',
      group: 'fiche',
      description: 'Quatre étapes au plus (les chiffres 1 à 4 sont dessinés).',
      validation: (r) => r.max(4),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'etape',
          title: 'Étape',
          fields: [
            defineField({name: 'titre', title: 'Titre', type: 'string'}),
            defineField({name: 'texte', title: 'Texte', type: 'text', rows: 4}),
          ],
          preview: {select: {title: 'titre', subtitle: 'texte'}},
        }),
      ],
    }),
    defineField({name: 'grandeImage', title: 'Grande image (en haut)', type: 'photo', group: 'images'}),
    defineField({
      name: 'petitesImages',
      title: 'Deux images (en dessous)',
      type: 'array',
      group: 'images',
      of: [defineArrayMember({type: 'photo'})],
      validation: (r) => r.max(2),
    }),
    defineField({
      name: 'nomCourt',
      title: 'Étiquette sur la carte',
      type: 'string',
      group: 'accueil',
      description: 'Le nom court posé sur la carte qui défile.',
    }),
    defineField({name: 'vignette', title: 'Image de la carte', type: 'photo', group: 'accueil', validation: (r) => r.required()}),
    defineField({
      name: 'ordre',
      title: "Position sur l'accueil",
      type: 'number',
      group: 'accueil',
      description: "1 = la carte qu'on voit en arrivant sur le site, puis 2, 3… Les projets sans numéro passent après, du plus récent au plus ancien.",
      validation: (r) => r.integer().min(1),
    }),
    defineField({name: 'page', title: 'Page', type: 'number', hidden: true, readOnly: true}),
  ],
  orderings: [{title: "Ordre sur l'accueil", name: 'ordre', by: [{field: 'ordre', direction: 'asc'}, {field: '_createdAt', direction: 'desc'}]}],
  preview: {
    select: {title: 'nom', media: 'vignette', ordre: 'ordre'},
    prepare: ({title, media, ordre}) => ({title, media, subtitle: ordre ? `Carte n° ${ordre} sur l'accueil` : "Après les cartes numérotées"}),
  },
})

/* ---------- À propos ---------- */
const aPropos = defineType({
  name: 'aPropos',
  title: 'À propos',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({name: 'titre', title: 'Grand titre', type: 'string'}),
    defineField({name: 'sousTitre', title: 'Sous-titre', type: 'string'}),
    defineField({
      name: 'paragraphes',
      title: 'Texte',
      type: 'array',
      of: [defineArrayMember({type: 'text', rows: 4})],
      description: 'Un bloc par paragraphe.',
    }),
    defineField({name: 'photo', title: 'Photo', type: 'photo'}),
    defineField({name: 'boutonCv', title: 'Bouton du CV', type: 'string'}),
    defineField({name: 'cv', title: 'CV (PDF)', type: 'file', options: {accept: 'application/pdf'}}),
    defineField({
      name: 'musique',
      title: 'Musique',
      type: 'object',
      fields: [
        defineField({name: 'texte', title: 'Texte du bouton', type: 'string'}),
        defineField({name: 'url', title: 'Lien (playlist)', type: 'url'}),
        defineField({name: 'image1', title: 'Carte de gauche', type: 'photo'}),
        defineField({name: 'image2', title: 'Carte de droite', type: 'photo'}),
      ],
    }),
  ],
  preview: {prepare: () => ({title: 'À propos'})},
})

/* ---------- Contact ---------- */
const contact = defineType({
  name: 'contact',
  title: 'Contact',
  type: 'document',
  icon: EnvelopeIcon,
  fields: [
    defineField({
      name: 'email',
      title: 'Adresse qui reçoit les messages',
      type: 'string',
      validation: (r) => r.required().email(),
    }),
    defineField({name: 'nom', title: 'Nom sur la carte postale', type: 'string'}),
    defineField({name: 'metier', title: 'Métier sur la carte postale', type: 'string'}),
    defineField({name: 'exemple', title: 'Texte d’exemple dans le message', type: 'text', rows: 2}),
    defineField({name: 'timbre', title: 'Photo du timbre', type: 'photo'}),
  ],
  preview: {prepare: () => ({title: 'Contact'})},
})

export const schemaTypes = [photo, accueil, projet, aPropos, contact]
// Pages uniques : rien ne se crée ni ne se supprime. Les projets, eux, s'ajoutent librement.
export const FIXES = ['accueil', 'aPropos', 'contact']
