'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

interface WordData {
  text: string;
  size: number;
  frequency: number;
}

interface WordCloudProps {
  words: WordData[];
  width?: number;
  height?: number;
}

const WordCloud: React.FC<WordCloudProps> = ({
  words,
  width = 800,
  height = 400
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!words.length || !svgRef.current) return;

    setIsLoading(true);

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create the layout
    const layout = cloud()
      .size([width, height])
      .words(words.map(d => ({ ...d, size: d.size * 2 })))
      .padding(5)
      .rotate(() => ~~(Math.random() * 2) * 90)
      .font('Impact')
      .fontSize(d => d.size || 12)
      .on('end', draw);

    layout.start();

    function draw(words: Array<WordData & {x?: number; y?: number; rotate?: number}>) {
      const svg = d3.select(svgRef.current);

      const g = svg
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      const text = g
        .selectAll('text')
        .data(words)
        .enter()
        .append('text')
        .style('font-size', d => `${d.size}px`)
        .style('font-family', 'Impact')
        .style('fill', (d, i) => d3.schemeCategory10[i % 10])
        .attr('text-anchor', 'middle')
        .attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
        .text(d => d.text)
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          console.log('Clicked word:', d.text);
        })
        .on('mouseover', function() {
          d3.select(this).style('opacity', 0.7);
        })
        .on('mouseout', function() {
          d3.select(this).style('opacity', 1);
        });

      setIsLoading(false);
    }
  }, [words, width, height]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
          <div className="text-lg">Generating word cloud...</div>
        </div>
      )}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg"
      />
    </div>
  );
};

export default WordCloud;