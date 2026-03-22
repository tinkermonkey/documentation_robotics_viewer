/**
 * AttributesTable Component
 * Reusable table for displaying element attributes using Flowbite React
 */

import React from 'react';

export interface AttributeRow {
  name: string;
  value: string | number | boolean | null | undefined | Record<string, unknown> | unknown[];
  isObject?: boolean;
}

interface AttributesTableProps {
  attributes: AttributeRow[];
  title?: string;
  className?: string;
}

const AttributesTable: React.FC<AttributesTableProps> = ({
  attributes,
  title = 'Attributes',
  className = ''
}) => {
  const formatValue = (attr: AttributeRow): string => {
    if (attr.value === null || attr.value === undefined) {
      return '';
    }
    
    if (attr.isObject || typeof attr.value === 'object') {
      return JSON.stringify(attr.value, null, 2);
    }
    
    if (typeof attr.value === 'boolean') {
      return attr.value ? 'true' : 'false';
    }
    
    return String(attr.value);
  };

  if (attributes.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {title && (
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h4>
      )}
      <div className="overflow-x-auto" role="region" aria-label={title} tabIndex={0}>
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 whitespace-nowrap w-1/3">
                Name
              </th>
              <th scope="col" className="px-6 py-3">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {attributes.map((attr, index) => (
              <tr
                key={`${attr.name}-${index}`}
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-white w-1/3">
                  {attr.name}
                </td>
                <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                  {attr.isObject ? (
                    <pre className="text-xs overflow-x-auto p-2 bg-gray-50 dark:bg-gray-900 rounded">
                      {formatValue(attr)}
                    </pre>
                  ) : (
                    <span className="whitespace-pre-wrap break-words">
                      {formatValue(attr)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttributesTable;
