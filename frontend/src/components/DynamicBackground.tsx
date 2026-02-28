import { useSettings } from '../utils/SettingsContext';

export default function DynamicBackground() {
  const { totalCo2Saved, darkMode } = useSettings();

  // Scale: 0g = neutral, 5000g+ = very green, negative = smoky
  const greenIntensity = Math.min(totalCo2Saved / 5000, 1); // 0 to 1
  const isSmoky = totalCo2Saved < 0;

  if (darkMode) {
    return (
      <div className="fixed inset-0 -z-10 transition-all duration-1000"
        style={{
          background: isSmoky
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
            : `linear-gradient(135deg, rgb(${6 + greenIntensity * 10}, ${30 + greenIntensity * 20}, ${20 + greenIntensity * 15}) 0%, rgb(${15}, ${25 + greenIntensity * 10}, ${20}) 100%)`
        }}
      />
    );
  }

  return (
    <>
      {/* Green gradient background that intensifies with CO2 saved */}
      <div
        className="fixed inset-0 -z-10 transition-all duration-1000"
        style={{
          background: isSmoky
            ? 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)'
            : `linear-gradient(135deg,
                rgb(${236 - greenIntensity * 30}, ${253}, ${245 - greenIntensity * 10}) 0%,
                rgb(${240 - greenIntensity * 40}, ${253 - greenIntensity * 10}, ${244 - greenIntensity * 20}) 50%,
                rgb(${224 - greenIntensity * 50}, ${242 - greenIntensity * 10}, ${254 - greenIntensity * 30}) 100%)`
        }}
      />

      {/* Smoke particles when CO2 is high (user drives a lot) */}
      {isSmoky && (
        <div className="fixed inset-0 -z-[5] overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-10"
              style={{
                width: `${40 + Math.random() * 80}px`,
                height: `${40 + Math.random() * 80}px`,
                background: 'radial-gradient(circle, #64748b 0%, transparent 70%)',
                left: `${Math.random() * 100}%`,
                bottom: `${-20 + Math.random() * 20}%`,
                animation: `smokeRise ${8 + Math.random() * 8}s ease-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Leaf particles when CO2 saved is high */}
      {greenIntensity > 0.3 && !isSmoky && (
        <div className="fixed inset-0 -z-[5] overflow-hidden pointer-events-none">
          {[...Array(Math.floor(greenIntensity * 6))].map((_, i) => (
            <div
              key={i}
              className="absolute text-brand-400/20"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${-10}%`,
                fontSize: `${16 + Math.random() * 20}px`,
                animation: `leafFall ${10 + Math.random() * 10}s linear infinite`,
                animationDelay: `${Math.random() * 8}s`,
              }}
            >
              🍃
            </div>
          ))}
        </div>
      )}
    </>
  );
}
