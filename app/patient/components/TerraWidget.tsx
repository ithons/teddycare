'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export const getWidgetAsync = async (props: { onSuccess: (url: string) => void }) => {
  try {
    const response = await fetch('/api/terra/generateWidgetSession', { method: 'GET' });
    const json = await response.json();
    if (json.url) {
      props.onSuccess(json.url);
    } else {
      console.error('Terra API: No URL in response');
    }
  } catch (error) {
    console.error('Terra API: Failed to fetch widget session', error);
  }
};

export const Widget = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePressButton = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await getWidgetAsync({ 
        onSuccess: (newUrl: string) => {
          if (newUrl) {
            window.open(newUrl, '_blank');
          } else {
            setError('Received empty URL from Terra API');
          }
        }
      });
    } catch (error) {
      console.error('Terra Widget: Failed to open', error);
      setError('Failed to open widget');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button 
        onClick={handlePressButton} 
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Open Widget'}
      </Button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};
