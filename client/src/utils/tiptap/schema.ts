import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Extension } from '@tiptap/core';

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
                  class: 'ai-content'
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
  StarterKit,
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