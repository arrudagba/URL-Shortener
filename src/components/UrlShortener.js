"use client"

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";

export default function UrlShortener() {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleShorten = async () => {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?(\?[^\s]*)?$/;
    if (!urlPattern.test(url)) {
      setShortUrl('Please enter a valid URL.');
      return;
    }
  
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://url-shortener-9o7p.onrender.com";
      const response = await fetch(`${API_URL}/shorten`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      setShortUrl(data.shortUrl);
    } catch (error) {
      console.error('Error:', error);
      setShortUrl('Failed to shorten URL. Please try again.');
    }
  };

  const handleCopy = () => {
    if (shortUrl) {
      navigator.clipboard.writeText(shortUrl).then(() => {
        setIsCopied(true); 
        setTimeout(() => setIsCopied(false), 1000); 
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg w-full max-w-2xl flex flex-col md:flex-row">
        <div className="flex-1">
          <h2 className="text-lg md:text-xl font-bold mb-4">Shorten your URL here:</h2>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter your URL"
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
          />
          <div className="w-full">
            <h2 className="text-lg md:text-xl font-bold mb-4">Short URL:</h2>
            <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-between">
              <span>{shortUrl || 'Your short URL will appear here'}</span>
              {shortUrl && (
                <button
                  onClick={handleCopy}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {isCopied ? <FontAwesomeIcon icon={faCheck} className="text-green-500"size="lg"/> : <FontAwesomeIcon icon={faCopy} className="text-gray-600"size="lg"/>}
                </button>
              )}
            </div>
          </div>
        </div>

        
        <div className="flex items-center justify-center mt-6 md:mt-0 md:ml-8">
          <button
            onClick={handleShorten}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors w-full md:w-auto"
          >
            Shorten URL
          </button>
        </div>
      </div>
    </div>
  );
}