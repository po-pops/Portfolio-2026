import type {StructureResolver} from 'sanity/structure'
import {HomeIcon} from '@sanity/icons/Home'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {UserIcon} from '@sanity/icons/User'
import {DocumentsIcon} from '@sanity/icons/Documents'

// Le menu suit le site : l'accueil, les quatre projets, à propos, contact.
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Portfolio')
    .items([
      S.listItem().id('accueil').title('Accueil').icon(HomeIcon).child(S.document().schemaType('accueil').documentId('accueil').title('Accueil')),
      S.listItem()
        .id('projets')
        .title('Projets')
        .icon(DocumentsIcon)
        .child(S.documentList().title('Projets').schemaType('projet').filter('_type == "projet"').defaultOrdering([{field: 'page', direction: 'asc'}]).canHandleIntent(() => false)),
      S.listItem().id('aPropos').title('À propos').icon(UserIcon).child(S.document().schemaType('aPropos').documentId('aPropos').title('À propos')),
      S.listItem().id('contact').title('Contact').icon(EnvelopeIcon).child(S.document().schemaType('contact').documentId('contact').title('Contact')),
    ])
