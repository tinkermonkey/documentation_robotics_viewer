import React, { useEffect, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';

interface SpaceMouseHandlerProps {
  sensitivity?: number;
  deadzone?: number;
  pollInterval?: number;
  debug?: boolean;
}

/**
 * SpaceMouseHandler Component
 * Handles 3D mouse input (SpaceMouse) for React Flow navigation.
 * Must be rendered inside a ReactFlow provider (e.g. inside <ReactFlow>).
 */
export const SpaceMouseHandler: React.FC<SpaceMouseHandlerProps> = ({
  sensitivity = 10,
  deadzone = 0.05,
  debug = false, // Default to false for silent operation
}) => {
  const { getViewport, setViewport } = useReactFlow();
  const requestRef = useRef<number>(0);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const update = () => {
    const gamepads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
    
    // Find a SpaceMouse or similar 6DOF controller
    // Usually they have "3Dconnexion" in the ID, but we can also check for axis count
    let spaceMouse: Gamepad | null = null;
    let debugText = 'Scanning for gamepads...\n';
    let foundDevices = 0;
    
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp) {
        foundDevices++;
        const isSpaceMouse = gp.id.toLowerCase().includes('3dconnexion') || gp.axes.length >= 6;
        
        if (debug) {
            debugText += `[${i}] ${gp.id}\n    Axes: ${gp.axes.length} Buttons: ${gp.buttons.length}\n`;
            if (isSpaceMouse) debugText += "    -> MATCHED as SpaceMouse\n";
            
            // Show first 6 axes
            for(let a=0; a < Math.min(gp.axes.length, 6); a++) {
                debugText += `    Ax${a}: ${gp.axes[a].toFixed(3)} `;
                if (a % 2 === 1) debugText += "\n";
            }
            debugText += "\n";
        }

        if (isSpaceMouse && !spaceMouse) {
          spaceMouse = gp;
        }
      }
    }

    if (foundDevices === 0) {
        debugText += "No gamepads detected.\nTry pressing a button on the device to wake it up.";
    }

    if (debug) {
        setDebugInfo(debugText);
    }

    if (spaceMouse) {
      const { x, y, zoom } = getViewport();
      
      // Axis mapping for SpaceMouse (standard mapping)
      // Axis 0: Pan Left/Right
      // Axis 1: Pan Up/Down
      // Axis 2: Zoom (Pull/Push)
      // Note: Axis indices might vary by OS/Driver. This is a common mapping.
      
      const panX = Math.abs(spaceMouse.axes[0]) > deadzone ? spaceMouse.axes[0] : 0;
      const panY = Math.abs(spaceMouse.axes[1]) > deadzone ? spaceMouse.axes[1] : 0;
      const zoomAxis = Math.abs(spaceMouse.axes[2]) > deadzone ? spaceMouse.axes[2] : 0;

      if (panX !== 0 || panY !== 0 || zoomAxis !== 0) {
        // Calculate new viewport
        // Invert Y for intuitive panning (push forward to move view up/content down)
        // Or push forward to move camera forward (content moves up)?
        // Standard 2D pan: push right -> view moves right -> content moves left.
        // Let's try standard pan behavior first.
        
        const newX = x - panX * sensitivity;
        const newY = y - panY * sensitivity;
        
        // Zoom logic
        // Pull up (negative) -> Zoom In
        // Push down (positive) -> Zoom Out
        const zoomFactor = 1 + (zoomAxis * sensitivity * 0.001);
        const newZoom = Math.max(0.1, Math.min(4, zoom * zoomFactor));

        setViewport({ x: newX, y: newY, zoom: newZoom });
      }
    }

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    const onConnect = (e: GamepadEvent) => {
        console.log("Gamepad connected:", e.gamepad);
    };
    const onDisconnect = (e: GamepadEvent) => {
        console.log("Gamepad disconnected:", e.gamepad);
    };

    window.addEventListener("gamepadconnected", onConnect);
    window.addEventListener("gamepaddisconnected", onDisconnect);

    requestRef.current = requestAnimationFrame(update);
    
    return () => {
      window.removeEventListener("gamepadconnected", onConnect);
      window.removeEventListener("gamepaddisconnected", onDisconnect);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [sensitivity, deadzone, getViewport, setViewport, debug]);

  if (!debug) return null;

  return (
    <div style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        background: 'rgba(0,0,0,0.85)',
        color: '#00ff00',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '11px',
        whiteSpace: 'pre-wrap',
        zIndex: 9999,
        pointerEvents: 'none',
        maxWidth: '400px',
        border: '1px solid #333',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
    }}>
        <div style={{ borderBottom: '1px solid #444', marginBottom: '8px', paddingBottom: '4px', fontWeight: 'bold' }}>
            SpaceMouse Debugger
        </div>
        {debugInfo}
    </div>
  );
};
