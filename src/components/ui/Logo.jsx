

const Logo = ({ className = "h-12 md:h-16 w-auto scale-125 origin-left" }) => {
  return (
    <img 
      src="/logo.webp" 
      alt="CHASHMALAY.IN" 
      className={className}
      loading="eager"
    />
  );
};

export default Logo;
