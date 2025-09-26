import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Link } from '@tiptap/extension-link';
import { Extension } from '@tiptap/core';
import { featureFlags } from '@shared/featureFlags';

// Author mark extension to track who wrote what
const AuthorMark = Extension.create({
  name: 'author',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'listItem'],
        attributes: {
          author: {
            default: 'user',
            parseHTML: element => element.getAttribute('data-author') || 'user',
            renderHTML: attributes => {
              if (attributes.author === 'ai') {
                return {
                  'data-author': 'ai',
                  // Only add ai-content class if SHOW_AI_DIFF flag is enabled
                  ...(featureFlags.SHOW_AI_DIFF && { class: 'ai-content' })
                };
              }
              return {};
            }
          }
        }
      }
    ];
  }
});

export const extensions = [
  StarterKit.configure({
    // Exclude 'link' since we add our custom Link extension below
    link: false,
    paragraph: { HTMLAttributes: { class: 'mb-4' } },
    bulletList: { HTMLAttributes: { class: 'list-disc pl-6 mb-4' } },
    listItem: { HTMLAttributes: { class: 'mb-1' } },
  }),
  Link.configure({
    autolink: true,
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-blue-600 underline hover:text-blue-800 dark:text-blue-400',
    },
  }),
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === 'heading' && node.attrs.level === 1) {
        return 'Enter a title...';
      }
      return 'Start typing or paste your note...';
    }
  }),
  AuthorMark
];