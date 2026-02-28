import React, { memo } from 'react';
import { Breadcrumb, BreadcrumbItem, Badge, Button } from 'flowbite-react';
import { HiHome, HiX } from 'react-icons/hi';

export interface BreadcrumbSegment {
  id: string;
  label: string;
  type?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface BreadcrumbNavProps {
  segments: BreadcrumbSegment[];
  currentLevel?: string;
  onNavigate: (segmentId: string) => void;
  onClear?: () => void;
  showLevelBadge?: boolean;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = memo(
  ({
    segments,
    currentLevel,
    onNavigate,
    onClear,
    showLevelBadge = true,
  }: BreadcrumbNavProps) => {
    if (segments.length === 0) return null;

    return (
      <div
        className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        data-testid="breadcrumb-nav"
      >
        <Breadcrumb aria-label="Navigation breadcrumb">
          <BreadcrumbItem
            icon={HiHome}
            onClick={() => onNavigate('root')}
          >
            Root
          </BreadcrumbItem>

          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;

            return (
              <BreadcrumbItem
                key={segment.id}
                onClick={!isLast ? () => onNavigate(segment.id) : undefined}
              >
                <span className="flex items-center gap-2">
                  {segment.icon}
                  {segment.type && (
                    <Badge color="purple" size="xs">
                      {segment.type}
                    </Badge>
                  )}
                  <span className={isLast ? 'font-semibold' : ''}>{segment.label}</span>
                </span>
              </BreadcrumbItem>
            );
          })}
        </Breadcrumb>

        <div className="flex items-center gap-2">
          {showLevelBadge && currentLevel && (
            <Badge color="indigo" size="sm">
              {currentLevel}
            </Badge>
          )}

          {onClear && (
            <Button
              color="gray"
              size="xs"
              pill
              onClick={onClear}
              data-testid="clear-breadcrumb-btn"
              aria-label="Clear breadcrumb"
            >
              <HiX className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }
);

BreadcrumbNav.displayName = 'BreadcrumbNav';
