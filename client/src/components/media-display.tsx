import { useState } from "react";
import { Maximize2, Download, Share2, FileText, Image as ImageIcon, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface MediaDisplayProps {
  mediaUrl: string;
  filename?: string;
  className?: string;
  showControls?: boolean;
}

export default function MediaDisplay({ mediaUrl, filename, className = "", showControls = true }: MediaDisplayProps) {
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  
  if (!mediaUrl) return null;

  const isImage = mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = mediaUrl.match(/\.pdf$/i);
  const isAudio = mediaUrl.match(/\.(mp3|wav|webm|ogg)$/i);
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = filename || 'media-file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: filename || 'Media from Mira',
          url: mediaUrl
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(mediaUrl);
    }
  };

  const renderThumbnail = () => {
    if (isImage) {
      return (
        <div className="relative group">
          <img 
            src={mediaUrl} 
            alt={filename || "Media"} 
            className={`rounded-lg object-cover cursor-pointer ${className}`}
            style={{ maxHeight: '200px', width: 'auto' }}
            onClick={() => setIsFullScreenOpen(true)}
          />
          {showControls && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullScreenOpen(true);
                }}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:bg-red-100" onClick={() => window.open(mediaUrl, '_blank')}>
          <FileText className="h-8 w-8 text-red-600" />
          <div className="flex-1">
            <div className="font-medium text-sm">{filename || 'PDF Document'}</div>
            <div className="text-xs text-gray-500">Click to open</div>
          </div>
          {showControls && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">♪</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{filename || 'Audio Recording'}</div>
            </div>
            {showControls && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <audio controls className="w-full">
            <source src={mediaUrl} type="audio/webm" />
            <source src={mediaUrl} type="audio/mp3" />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    // Generic file
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-100" onClick={() => window.open(mediaUrl, '_blank')}>
        <File className="h-8 w-8 text-gray-600" />
        <div className="flex-1">
          <div className="font-medium text-sm">{filename || 'File'}</div>
          <div className="text-xs text-gray-500">Click to open</div>
        </div>
        {showControls && (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {renderThumbnail()}
      
      {/* Full Screen Modal for Images */}
      {isImage && (
        <Dialog open={isFullScreenOpen} onOpenChange={setIsFullScreenOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90">
            <div className="relative flex items-center justify-center min-h-[400px]">
              <img 
                src={mediaUrl} 
                alt={filename || "Media"} 
                className="max-w-full max-h-[90vh] object-contain"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-black/50 hover:bg-black/70 text-white border-0"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-black/50 hover:bg-black/70 text-white border-0"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}