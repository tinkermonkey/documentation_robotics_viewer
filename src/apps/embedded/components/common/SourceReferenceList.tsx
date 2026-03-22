/**
 * SourceReferenceList Component
 * Displays a list of SourceReference objects with file path, symbol, provenance badge
 * Renders file paths as hyperlinks when repository.url and repository.commit are present
 */

import React from 'react';
import { SourceReference } from '@/core/types/model';
import ProvenanceBadge from './ProvenanceBadge';
import { constructSafeUrl } from '@/core/utils/urlValidator';

export interface SourceReferenceListProps {
  references: SourceReference[];
}

const SourceReferenceList: React.FC<SourceReferenceListProps> = ({ references }) => {
  if (!references || references.length === 0) {
    return (
      <div
        className="text-sm text-gray-500 dark:text-gray-400 italic"
        data-testid="source-reference-list-empty"
      >
        No source references
      </div>
    );
  }

  return (
    <div
      className="space-y-3"
      data-testid="source-reference-list"
    >
      {references.map((reference, refIndex) => (
        <div
          key={`source-ref-${refIndex}`}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800"
          data-testid={`source-reference-${refIndex}`}
        >
          <div className="flex items-start gap-2 mb-2">
            <ProvenanceBadge provenance={reference.provenance} />
          </div>

          <div className="space-y-2">
            {reference.locations.map((location, locIndex) => {
              const safeUrl = reference.repository?.url && reference.repository?.commit
                ? constructSafeUrl(reference.repository.url, 'blob', reference.repository.commit, location.file)
                : null;

              return (
                <div
                  key={`location-${refIndex}-${locIndex}`}
                  className="text-sm"
                  data-testid={`source-location-${refIndex}-${locIndex}`}
                >
                  {safeUrl ? (
                    <a
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-600 dark:text-blue-400 hover:underline"
                      data-testid={`source-link-${refIndex}-${locIndex}`}
                    >
                      {location.file}
                    </a>
                  ) : (
                    <span
                      className="font-mono text-gray-900 dark:text-white"
                      data-testid={`source-path-${refIndex}-${locIndex}`}
                    >
                      {location.file}
                    </span>
                  )}

                  {location.symbol && (
                    <span className="text-gray-600 dark:text-gray-400">
                      {' '}
                      ({location.symbol})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SourceReferenceList;
