import { Link, useLocation } from "wouter";
import { prefetchRouteData } from "@/lib/prefetch";
import { useCallback } from "react";

interface PreloadLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  prefetch?: boolean;
  onClick?: () => void;
}

/**
 * Enhanced Link component that prefetches data when hovered
 * and adds active styling when the current route matches the link
 */
export function PreloadLink({
  href,
  children,
  className = "",
  activeClassName = "text-primary font-medium",
  prefetch = true,
  onClick,
  ...props
}: PreloadLinkProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const [location] = useLocation();
  const isActive = location === href;
  
  // Handle mouse enter for prefetching
  const handleMouseEnter = useCallback(() => {
    if (prefetch) {
      prefetchRouteData(href);
    }
  }, [href, prefetch]);
  
  return (
    <Link href={href}>
      <a 
        className={`${className} ${isActive ? activeClassName : ""}`}
        onMouseEnter={handleMouseEnter}
        onClick={onClick}
        {...props}
      >
        {children}
      </a>
    </Link>
  );
}