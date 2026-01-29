import { useState } from 'react';
import { Maximize2, X } from 'lucide-react';

/**
 * ExpandButton - A reusable component that adds expand/fullscreen functionality to any content
 * 
 * @param {ReactNode} children - The content to be displayed in expanded view
 * @param {string} className - Optional className for the expand button
 * @param {string} modalClassName - Optional className for the modal container
 */
export default function ExpandButton({ children, className = '', modalClassName = '' }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Expand Button */}
      <button
        onClick={() => setIsExpanded(true)}
        aria-label="Expand to fullscreen"
        className={`p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors ${className}`}
      >
        <Maximize2 className="w-5 h-5" />
      </button>

      {/* Expanded Modal View */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-auto relative ${modalClassName}`}>
            {/* Close Button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors shadow-md"
              aria-label="Close expanded view"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Expanded Content */}
            <div className="p-8">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}