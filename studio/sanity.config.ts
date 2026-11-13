import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {frFRLocale} from '@sanity/locale-fr-fr'
import {schemaTypes, FIXES} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'Portfolio Pauline Yvelin',
  projectId: 'h1m9xg4z',
  dataset: 'production',
  plugins: [structureTool({structure}), frFRLocale()],
  schema: {
    types: schemaTypes,
    // Chaque fiche correspond à une page du site : pas de « Nouveau document ».
    templates: (templates) => templates.filter(({schemaType}) => !FIXES.includes(schemaType)),
  },
  document: {
    newDocumentOptions: (prev) => prev.filter(({templateId}) => !FIXES.includes(templateId)),
    actions: (actions, {schemaType}) =>
      FIXES.includes(schemaType) ? actions.filter(({action}) => action && ['publish', 'discardChanges', 'restore'].includes(action)) : actions,
  },
})
