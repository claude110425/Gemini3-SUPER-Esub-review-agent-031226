import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
});

interface Props {
  chart: string;
}

export default function Mermaid({ chart }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      mermaid.contentLoaded();
      mermaid.render(`mermaid-${Math.random().toString(36).substring(7)}`, chart).then((result) => {
        if (ref.current) {
          ref.current.innerHTML = result.svg;
        }
      }).catch((e) => {
        console.error("Mermaid rendering error", e);
      });
    }
  }, [chart]);

  return <div ref={ref} className="mermaid flex justify-center my-4 overflow-x-auto" />;
}
