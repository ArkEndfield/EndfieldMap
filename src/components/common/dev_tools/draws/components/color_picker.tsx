import { useCallback, useMemo } from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const parseColor = (color: string): { hex: string; alpha: number } => {
  // Handle rgba format
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    return { hex, alpha: a };
  }

  // Handle hex format
  if (color.startsWith('#')) {
    return { hex: color.slice(0, 7), alpha: 1 };
  }

  // Default
  return { hex: '#3388ff', alpha: 1 };
};

export const ColorPicker = ({ label, value, onChange }: ColorPickerProps) => {
  const { hex, alpha } = useMemo(() => parseColor(value), [value]);

  const handleHexChange = useCallback(
    (newHex: string) => {
      if (alpha < 1) {
        onChange(hexToRgba(newHex, alpha));
      } else {
        onChange(newHex);
      }
    },
    [alpha, onChange]
  );

  const handleAlphaChange = useCallback(
    (newAlpha: number) => {
      if (newAlpha < 1) {
        onChange(hexToRgba(hex, newAlpha));
      } else {
        onChange(hex);
      }
    },
    [hex, onChange]
  );

  return (
    <div className="space-y-1">
      <label className="text-gray-400">{label}</label>
      <div className="flex gap-2 items-center">
        <div
          className="w-6 h-6 rounded border border-white/20 shrink-0"
          style={{
            background: `linear-gradient(45deg, #808080 25%, transparent 25%),
                         linear-gradient(-45deg, #808080 25%, transparent 25%),
                         linear-gradient(45deg, transparent 75%, #808080 75%),
                         linear-gradient(-45deg, transparent 75%, #808080 75%)`,
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
          }}
        >
          <div className="w-full h-full rounded" style={{ backgroundColor: value }} />
        </div>
        <input
          type="color"
          className="w-8 h-6 bg-transparent shrink-0 cursor-pointer"
          value={hex}
          onChange={(e) => handleHexChange(e.target.value)}
        />
        <input
          type="range"
          className="flex-1 h-1 bg-white/20 rounded appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          min="0"
          max="1"
          step="0.01"
          value={alpha}
          onChange={(e) => handleAlphaChange(parseFloat(e.target.value))}
          title={`透明度: ${Math.round(alpha * 100)}%`}
        />
        <span className="text-[10px] text-gray-500 w-8 text-right">{Math.round(alpha * 100)}%</span>
      </div>
    </div>
  );
};
