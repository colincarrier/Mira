import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ExternalLink, ShoppingCart, Star, Calendar, Play } from 'lucide-react';
import { useState } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface LinkPreviewProps {
  href: string;
  children: React.ReactNode;
}

function LinkPreview({ href, children }: LinkPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  
  // Extract domain for favicon and branding
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

  // Detect link type based on URL
  const getLinkType = (url: string) => {
    const domain = url.toLowerCase();
    if (domain.includes('amazon.com') || domain.includes('amzn.to')) return 'shopping';
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'video';
    if (domain.includes('calendar.google.com')) return 'calendar';
    if (domain.includes('github.com')) return 'code';
    if (domain.includes('techradar.com') || domain.includes('wired.com') || domain.includes('ign.com') || domain.includes('cnet.com')) return 'review';
    return 'external';
  };

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'shopping': return <ShoppingCart className="w-3 h-3" />;
      case 'video': return <Play className="w-3 h-3" />;
      case 'calendar': return <Calendar className="w-3 h-3" />;
      case 'review': return <Star className="w-3 h-3" />;
      default: return <ExternalLink className="w-3 h-3" />;
    }
  };

  const getLinkColor = (type: string) => {
    switch (type) {
      case 'shopping': return 'text-orange-600 hover:text-orange-800 border-orange-200 hover:border-orange-300 bg-orange-50 hover:bg-orange-100';
      case 'video': return 'text-red-600 hover:text-red-800 border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100';
      case 'calendar': return 'text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100';
      case 'review': return 'text-purple-600 hover:text-purple-800 border-purple-200 hover:border-purple-300 bg-purple-50 hover:bg-purple-100';
      default: return 'text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100';
    }
  };

  const getPreviewTitle = (type: string, domain: string) => {
    switch (type) {
      case 'shopping': return 'Shop on Amazon';
      case 'video': return 'Watch on YouTube';
      case 'calendar': return 'Add to Calendar';
      case 'review': return `Expert Review - ${domain}`;
      default: return `Visit ${domain}`;
    }
  };

  const linkType = getLinkType(href);
  const linkIcon = getLinkIcon(linkType);
  const linkColor = getLinkColor(linkType);
  const domain = getDomain(href);
  const previewTitle = getPreviewTitle(linkType, domain);

  return (
    <span className="relative inline-block">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border transition-all duration-200 hover:shadow-sm ${linkColor}`}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        {linkIcon}
        <span className="text-sm font-medium">{children}</span>
      </a>
      
      {showPreview && (
        <div className="absolute bottom-full left-0 mb-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-64 max-w-80">
          <div className="flex items-start gap-3">
            {/* Favicon/Icon Section */}
            <div className="flex-shrink-0">
              <div className={`p-2 rounded-lg ${
                linkType === 'shopping' ? 'bg-orange-100' : 
                linkType === 'video' ? 'bg-red-100' : 
                linkType === 'review' ? 'bg-purple-100' :
                'bg-blue-100'
              }`}>
                {linkIcon}
              </div>
            </div>
            
            {/* Content Section */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {previewTitle}
              </div>
              <div className="text-xs text-gray-500 truncate mt-1">
                {domain}
              </div>
              
              {/* Special indicators */}
              <div className="flex items-center gap-2 mt-2">
                {linkType === 'shopping' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
                    <Star className="w-3 h-3 text-orange-600 fill-current" />
                    <span className="text-xs text-orange-700 font-medium">Trusted Store</span>
                  </div>
                )}
                {linkType === 'video' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-full">
                    <Play className="w-3 h-3 text-red-600 fill-current" />
                    <span className="text-xs text-red-700 font-medium">Video Content</span>
                  </div>
                )}
                {linkType === 'review' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-full">
                    <Star className="w-3 h-3 text-purple-600 fill-current" />
                    <span className="text-xs text-purple-700 font-medium">Expert Review</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Click indicator */}
          <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            <span>Click to open in new tab</span>
          </div>
        </div>
      )}
    </span>
  );
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Enhanced table styling with rich visuals
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-100 whitespace-nowrap hover:bg-gray-50 transition-colors">
              {children}
            </td>
          ),
          // Enhanced link styling with rich previews
          a: ({ href, children }) => (
            <LinkPreview href={href || '#'}>
              {children}
            </LinkPreview>
          ),
          // Custom heading styling
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-gray-900 mt-6 mb-3 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-gray-900 mt-5 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">
              {children}
            </h3>
          ),
          // Custom paragraph styling
          p: ({ children }) => (
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              {children}
            </p>
          ),
          // Custom list styling
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-sm text-gray-700 mb-3 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-sm text-gray-700 mb-3 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="ml-2">
              {children}
            </li>
          ),
          // Custom code styling
          code: ({ children, ...props }) => {
            const isInline = !String(props.className).includes('language-');
            if (isInline) {
              return (
                <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs">
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-100 text-gray-800 p-3 rounded text-xs overflow-x-auto">
                <code>{children}</code>
              </pre>
            );
          },
          // Custom blockquote styling
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-3">
              {children}
            </blockquote>
          ),
          // Custom strong/bold styling
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">
              {children}
            </strong>
          ),
          // Custom emphasis/italic styling
          em: ({ children }) => (
            <em className="italic text-gray-700">
              {children}
            </em>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}