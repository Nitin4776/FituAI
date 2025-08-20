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
      <defs>
        <filter id="shiny" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" floodColor="hsl(var(--accent) / 0.5)" />
        </filter>
      </defs>
      <style>
        {`
          .logo-text {
            font-family: 'Montserrat', serif;
            font-size: 24px;
            font-weight: 700;
          }
          .f-char {
            font-size: 28px;
            fill: hsl(var(--primary));
          }
          .it-chars {
            fill: hsl(var(--primary));
          }
          .u-char {
            font-size: 20px;
            fill: hsl(var(--accent));
            filter: url(#shiny);
          }
          .ai-chars {
            fill: hsl(var(--primary));
          }
        `}
      </style>
      <text x="0" y="22" className="logo-text">
        <tspan className="f-char">f</tspan>
        <tspan className="it-chars">it</tspan>
        <tspan className="u-char" dy="-2">U</tspan>
        <tspan className="ai-chars">AI</tspan>
      </text>
    </svg>
  );
}
