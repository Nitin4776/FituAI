import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 130 30"
      width="130"
      height="30"
      {...props}
    >
      <style>
        {`
          .logo-text {
            font-family: 'Montserrat', serif;
            font-size: 24px;
            font-weight: 700;
            fill: hsl(var(--sidebar-foreground));
          }
          .logo-highlight {
            fill: hsl(var(--primary));
          }
        `}
      </style>
      <text x="0" y="22" className="logo-text">
        fitU
        <tspan className="logo-highlight">AI</tspan>
      </text>
    </svg>
  );
}
