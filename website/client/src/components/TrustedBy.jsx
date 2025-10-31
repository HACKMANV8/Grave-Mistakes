import LogoLoop from './LogoLoop';

const TrustedBy = () => {
  // Company logos - using text-based logos for now
  const companies = [
    { 
      node: <span className="text-2xl font-bold text-gray-400">Google</span>, 
      title: "Google",
    },
    { 
      node: <span className="text-2xl font-bold text-gray-400">Microsoft</span>, 
      title: "Microsoft",
    },
    { 
      node: <span className="text-2xl font-bold text-gray-400">Amazon</span>, 
      title: "Amazon",
    },
    { 
      node: <span className="text-2xl font-bold text-gray-400">Meta</span>, 
      title: "Meta",
    },
    { 
      node: <span className="text-2xl font-bold text-gray-400">Apple</span>, 
      title: "Apple",
    },
    { 
      node: <span className="text-2xl font-bold text-gray-400">Netflix</span>, 
      title: "Netflix",
    },
    { 
      node: <span className="text-2xl font-bold text-gray-400">Tesla</span>, 
      title: "Tesla",
    },
    { 
      node: <span className="text-2xl font-bold text-gray-400">Spotify</span>, 
      title: "Spotify",
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-sm text-gray-500 mb-8 uppercase tracking-wider font-medium">
          Trusted by developers at
        </p>
        
        <div className="relative">
          <LogoLoop
            logos={companies}
            speed={60}
            direction="left"
            logoHeight={32}
            gap={80}
            pauseOnHover={true}
            scaleOnHover={true}
            fadeOut={true}
            fadeOutColor="#000000"
            ariaLabel="Trusted by leading companies"
          />
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
