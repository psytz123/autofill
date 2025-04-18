import { FC } from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | number;
}

const Logo: FC<LogoProps> = ({ className = "", size = "md" }) => {
  // Calculate size based on the prop
  let sizeClass = "w-32";
  if (size === "sm") {
    sizeClass = "w-24";
  } else if (size === "lg") {
    sizeClass = "w-40";
  } else if (typeof size === "number") {
    sizeClass = `w-[${size}px]`;
  }

  return (
    <div className={`${sizeClass} ${className}`}>
      <svg 
        viewBox="0 0 500 500" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* Dark Circle Background */}
        <circle cx="250" cy="250" r="240" fill="#002B5B" />
        
        {/* White Path for Gas Pump Icon */}
        <path d="M250 100C223 130 210 170 240 190C270 210 290 160 320 145" stroke="white" strokeWidth="15" strokeLinecap="round" />
        <path d="M245 145C245 145 260 155 275 145C290 135 295 110 280 100C265 90 250 100 245 120C240 140 245 145 245 145Z" fill="white" />
        <path d="M290 110C290 110 325 110 320 145" stroke="white" strokeWidth="8" strokeLinecap="round" />
        <circle cx="230" cy="190" r="5" fill="white" />
        <circle cx="210" cy="190" r="5" fill="white" />
        
        {/* AUTOFILL Text */}
        <path d="M110 270L130 220H160L180 270H160L155 255H135L130 270H110ZM140 240H150L145 230L140 240Z" fill="white" />
        <path d="M185 220H205V255H240V270H185V220Z" fill="white" />
        <path d="M250 220H270V245H290V220H310V270H290V260H270V270H250V220Z" fill="white" />
        <path d="M320 220H370V235H340V235H340V240H365V255H340V255H340V270H320V220Z" fill="white" />
        <path d="M380 220H400V255H420V270H380V220Z" fill="white" />
        <path d="M430 220H450V255H470V270H430V220Z" fill="white" />
        
        {/* Blue Arc (Top) */}
        <path d="M160 310C220 280 280 280 340 310" stroke="#3B82F6" strokeWidth="20" strokeLinecap="round" />
        
        {/* Orange Arc (Bottom) */}
        <path d="M140 340C220 380 280 380 360 340" stroke="#FF6B00" strokeWidth="20" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export { Logo };