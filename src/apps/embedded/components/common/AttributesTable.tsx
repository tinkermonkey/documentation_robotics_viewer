/**
 * AttributesTable Component
 * Reusable table for displaying element attributes using Flowbite React
 */

import React from 'react';
import { Table, TableBody, TableCell, TableRow } from 'flowbite-react';

export interface AttributeRow {
  name: string;
  value: string | number | boolean | null | undefined;
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
      <div className="overflow-x-auto">
        <Table>
          <TableBody className="divide-y">
            {attributes.map((attr, index) => (
              <TableRow
                key={`${attr.name}-${index}`}
                className="bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white w-1/3">
                  {attr.name}
                </TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">
                  {attr.isObject ? (
                    <pre className="text-xs overflow-x-auto p-2 bg-gray-50 dark:bg-gray-900 rounded">
                      {formatValue(attr)}
                    </pre>
                  ) : (
                    <span className="whitespace-pre-wrap break-words">
                      {formatValue(attr)}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AttributesTable;
