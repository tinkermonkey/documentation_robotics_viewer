/**
 * RefinementActionButtons Component
 * Simple action buttons for layout refinement workflow
 */

import React from 'react';
import { Button } from 'flowbite-react';

export interface RefinementActionButtonsProps {
  onAccept: () => void;
  onReject: () => void;
  onRefine: () => void;
  onAuto: () => void;
  disabled?: boolean;
}

export const RefinementActionButtons: React.FC<RefinementActionButtonsProps> = ({
  onAccept,
  onReject,
  onRefine,
  onAuto,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        color="success"
        onClick={onAccept}
        disabled={disabled}
        data-testid="refinement-accept-button"
      >
        Accept
      </Button>
      <Button
        size="sm"
        color="failure"
        onClick={onReject}
        disabled={disabled}
        data-testid="refinement-reject-button"
      >
        Reject
      </Button>
      <Button
        size="sm"
        color="gray"
        onClick={onRefine}
        disabled={disabled}
        data-testid="refinement-refine-button"
      >
        Refine
      </Button>
      <Button
        size="sm"
        color="purple"
        onClick={onAuto}
        disabled={disabled}
        data-testid="refinement-auto-button"
      >
        Auto
      </Button>
    </div>
  );
};

export default RefinementActionButtons;
