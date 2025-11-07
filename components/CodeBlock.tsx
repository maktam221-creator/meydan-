
import React, { useState } from 'react';
import ClipboardIcon from './icons/ClipboardIcon';

interface CodeBlockProps {
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div className="relative bg-gray-900 rounded-lg group">
      <button
        onClick={copyToClipboard}
        className="absolute top-3 right-3 p-2 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-200 opacity-50 group-hover:opacity-100"
        aria-label="Copy to clipboard"
      >
        {copied ? (
            <span className="text-sm px-2">Copied!</span>
        ) : (
            <ClipboardIcon className="h-5 w-5" />
        )}
      </button>
      <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
