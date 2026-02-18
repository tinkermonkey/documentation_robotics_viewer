/**
 * MetadataGrid Component
 * Reusable grid for displaying metadata key-value pairs using Flowbite Card
 */

import React from 'react';
import { Card } from 'flowbite-react';

export interface MetadataItem {
  label: string;
  value: string | number | undefined;
}

interface MetadataGridProps {
  title?: string;
  items: MetadataItem[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const MetadataGrid: React.FC<MetadataGridProps> = ({
  title,
  items,
  columns = 2,
  className = ''
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {title && (
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h4>
      )}
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {items.map((item, index) => (
          <Card key={`${item.label}-${index}`} className="flex flex-col shadow-none">
            <dl>
              <dt className="text-md font-medium text-gray-500 dark:text-gray-400">
                {item.label}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white font-semibold">
                {item.value !== undefined ? item.value : 'N/A'}
              </dd>
            </dl>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MetadataGrid;
