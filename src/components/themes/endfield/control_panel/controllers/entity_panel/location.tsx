export interface LocationIconProps {
  iconColor?: string;
  shadowColor?: string;
  rotationEnabled?: boolean;
}

export default function LocationIcon({
  iconColor = '#FDFB55',
  shadowColor = 'rgba(255, 255, 255, 0.1)',
  rotationEnabled = false,
}: LocationIconProps) {
  return (
    <div className="h-full flex items-center">
      <div className="block relative w-[2.5em]">
        <div className="relative w-full h-full shrink-0 flex flex-col items-center">
          <div
            className={`w-full h-full flex flex-col items-center relative ${
              rotationEnabled ? 'md:animate-rotate3d' : ''
            }`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Ring */}
            <div
              className="w-3.5 h-3.5 shrink-0 rounded-full border-3 bg-transparent relative"
              style={{
                borderColor: iconColor,
                backfaceVisibility: 'visible',
              }}
            />

            {/* Triangle */}
            <div
              className="w-2.5 h-2.5 relative -top-0.5"
              style={{
                backgroundColor: iconColor,
                clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                backfaceVisibility: 'visible',
              }}
            />
          </div>

          {/* Shadow */}
          <div
            className="w-4 h-1.5 rounded-full absolute bottom-0"
            style={{
              backgroundColor: shadowColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}
