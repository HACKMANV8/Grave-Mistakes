// Component added by Ansh - github.com/ansh-dhanani

const GradualBlur = ({
  target = "parent",
  position = "bottom",
  height = "6rem",
  strength = 2,
  divCount = 5,
  curve = "bezier",
  exponential = true,
  opacity = 1,
}) => {
  const getBlurValue = (index) => {
    if (curve === "linear") {
      return (strength * index) / divCount;
    } else if (curve === "bezier") {
      const t = index / divCount;
      const bezier = exponential ? t * t : t;
      return strength * bezier;
    }
    return 0;
  };

  const getOpacityValue = (index) => {
    return opacity * (1 - index / divCount);
  };

  const blurDivs = Array.from({ length: divCount }, (_, i) => {
    const blurAmount = getBlurValue(i);
    const opacityValue = getOpacityValue(i);
    
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          [position]: `${(i * 100) / divCount}%`,
          left: 0,
          right: 0,
          height: `${100 / divCount}%`,
          backdropFilter: `blur(${blurAmount}px)`,
          WebkitBackdropFilter: `blur(${blurAmount}px)`,
          opacity: opacityValue,
          pointerEvents: 'none',
        }}
      />
    );
  });

  return (
    <div
      style={{
        position: 'absolute',
        [position]: 0,
        left: 0,
        right: 0,
        height: height,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {blurDivs}
    </div>
  );
};

export default GradualBlur;
