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
    <div className="block">
      <div className="block relative w-[2.5em] aspect-[0.75]">
        <div className="relative w-full h-full shrink-0 flex flex-col items-center">
          <div
            className={`w-full h-full flex flex-col items-center relative ${
              rotationEnabled ? 'md:animate-rotate3d' : ''
            }`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Ring */}
            <div
              className="w-[1.5em] h-[1.5em] shrink-0 rounded-full border-[0.4em] bg-transparent relative z-3"
              style={{
                borderColor: iconColor,
                backfaceVisibility: 'visible',
              }}
            />

            {/* Triangle */}
            <div
              className="w-[1.25em] h-[1.25em] relative -top-[10%] z-2"
              style={{
                backgroundColor: iconColor,
                clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                backfaceVisibility: 'visible',
              }}
            />
          </div>

          {/* Shadow */}
          <div
            className="w-[2em] h-[0.7em] rounded-full absolute bottom-[0.6em] z-1"
            style={{
              backgroundColor: shadowColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}
