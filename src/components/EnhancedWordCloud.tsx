'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

interface WordData {
  text: string;
  size: number;
  frequency: number;
  sentiment?: number; // -1.0 to 1.0
  emotion?: string;
  coOccurrences?: string[]; // Related words for semantic positioning
}

interface EnhancedWordCloudProps {
  words: WordData[];
  width?: number;
  height?: number;
  layoutMode?: 'classic' | 'semantic-heavy' | 'balanced';
  colorMode?: 'frequency' | 'sentiment' | 'emotion';
  enableInteractions?: boolean;
  onWordClick?: (word: WordData) => void;
  onWordHover?: (word: WordData | null) => void;
}

type LayoutMode = 'classic' | 'semantic-heavy' | 'balanced';
type ColorMode = 'frequency' | 'sentiment' | 'emotion';

const EnhancedWordCloud: React.FC<EnhancedWordCloudProps> = ({
  words,
  width = 800,
  height = 400,
  layoutMode = 'balanced',
  colorMode = 'frequency',
  enableInteractions = true,
  onWordClick,
  onWordHover
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize semantic positioning calculations
  const semanticPositions = useMemo(() => {
    if (layoutMode === 'classic') return new Map();

    return calculateSemanticPositions(words, width, height);
  }, [words, layoutMode, width, height]);

  // Memoize color scale based on color mode
  const colorScale = useMemo(() => {
    return createColorScale(words, colorMode);
  }, [words, colorMode]);

  useEffect(() => {
    if (!words.length || !svgRef.current) return;

    setIsLoading(true);

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Configure layout based on mode
    const layout = createLayout(words, width, height, layoutMode, semanticPositions);

    layout.on('end', (layoutWords) => {
      drawWordCloud(layoutWords, svgRef.current!, width, height, colorScale, enableInteractions, onWordClick, onWordHover);
      setIsLoading(false);
    });

    layout.start();
  }, [words, width, height, layoutMode, colorMode, semanticPositions, colorScale, enableInteractions, onWordClick, onWordHover]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <div className="text-sm text-gray-600">
              {layoutMode === 'semantic-heavy' ? 'Computing semantic positions...' : 'Generating word cloud...'}
            </div>
          </div>
        </div>
      )}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg bg-white"
      />

      {/* Layout Mode Indicator */}
      <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded px-2 py-1 text-xs text-gray-600">
        {layoutMode === 'classic' && '📊 Classic'}
        {layoutMode === 'semantic-heavy' && '🧠 Semantic'}
        {layoutMode === 'balanced' && '⚖️ Balanced'}
      </div>

      {/* Color Mode Indicator */}
      <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded px-2 py-1 text-xs text-gray-600">
        {colorMode === 'frequency' && '📈 Frequency'}
        {colorMode === 'sentiment' && '💭 Sentiment'}
        {colorMode === 'emotion' && '🎭 Emotion'}
      </div>
    </div>
  );
};

// Calculate semantic positions using simple co-occurrence clustering
function calculateSemanticPositions(words: WordData[], width: number, height: number): Map<string, {x: number; y: number}> {
  const positions = new Map<string, {x: number; y: number}>();

  // Create adjacency matrix based on co-occurrences
  const adjacencyMatrix = new Map<string, Map<string, number>>();

  words.forEach(word => {
    adjacencyMatrix.set(word.text, new Map());

    word.coOccurrences?.forEach(coWord => {
      const existing = adjacencyMatrix.get(word.text)!.get(coWord) || 0;
      adjacencyMatrix.get(word.text)!.set(coWord, existing + 1);
    });
  });

  // Use force simulation for semantic positioning
  const simulation = d3.forceSimulation(words as any)
    .force('charge', d3.forceManyBody().strength(-30))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius((d: any) => d.size + 5))
    .force('link', d3.forceLink()
      .id((d: any) => d.text)
      .links(createSemanticLinks(words))
      .strength(0.5)
    );

  // Run simulation
  for (let i = 0; i < 100; ++i) simulation.tick();

  // Store final positions
  words.forEach((word: any) => {
    positions.set(word.text, { x: word.x || 0, y: word.y || 0 });
  });

  return positions;
}

// Create semantic links between related words
function createSemanticLinks(words: WordData[]): Array<{source: string; target: string; strength: number}> {
  const links: Array<{source: string; target: string; strength: number}> = [];

  words.forEach(word => {
    word.coOccurrences?.forEach(coWord => {
      const targetWord = words.find(w => w.text === coWord);
      if (targetWord) {
        links.push({
          source: word.text,
          target: coWord,
          strength: Math.min(word.frequency, targetWord.frequency) / Math.max(word.frequency, targetWord.frequency)
        });
      }
    });
  });

  return links;
}

// Create color scale based on color mode
function createColorScale(words: WordData[], colorMode: ColorMode): d3.ScaleOrdinal<string, string> | d3.ScaleSequential<string> {
  switch (colorMode) {
    case 'sentiment':
      return d3.scaleSequential(d3.interpolateRdYlBu)
        .domain([-1, 1]);

    case 'emotion':
      // Plutchik color mapping (simplified)
      const emotionColors = new Map([
        ['joy', '#FFD700'],
        ['trust', '#00FF00'],
        ['fear', '#800080'],
        ['surprise', '#00FFFF'],
        ['sadness', '#0000FF'],
        ['disgust', '#FFA500'],
        ['anger', '#FF0000'],
        ['anticipation', '#FFA500'],
        ['neutral', '#808080']
      ]);

      return d3.scaleOrdinal<string, string>()
        .domain(Array.from(emotionColors.keys()))
        .range(Array.from(emotionColors.values()));

    case 'frequency':
    default:
      return d3.scaleSequential(d3.interpolateBlues)
        .domain([1, Math.max(...words.map(w => w.frequency))]);
  }
}

// Create layout configuration based on mode
function createLayout(
  words: WordData[],
  width: number,
  height: number,
  layoutMode: LayoutMode,
  semanticPositions: Map<string, {x: number; y: number}>
) {
  const layout = cloud()
    .size([width, height])
    .words(words.map(d => ({ ...d, size: Math.max(d.size * 1.5, 12) })))
    .padding(layoutMode === 'semantic-heavy' ? 8 : 5)
    .font('system-ui, -apple-system, sans-serif')
    .fontSize(d => d.size || 12);

  // Configure rotation based on layout mode
  switch (layoutMode) {
    case 'classic':
      layout.rotate(() => ~~(Math.random() * 2) * 90);
      break;

    case 'semantic-heavy':
      layout.rotate(() => 0); // No rotation for semantic positioning
      // Use semantic positions as starting points
      layout.on('word', (word: any) => {
        const semanticPos = semanticPositions.get(word.text);
        if (semanticPos) {
          word.x = semanticPos.x - width / 2;
          word.y = semanticPos.y - height / 2;
        }
      });
      break;

    case 'balanced':
      layout.rotate(() => ~~(Math.random() * 3) * 45 - 45); // -45, 0, 45 degrees
      break;
  }

  return layout;
}

// Draw the word cloud with enhanced interactions
function drawWordCloud(
  words: Array<WordData & {x?: number; y?: number; rotate?: number}>,
  svgElement: SVGSVGElement,
  width: number,
  height: number,
  colorScale: any,
  enableInteractions: boolean,
  onWordClick?: (word: WordData) => void,
  onWordHover?: (word: WordData | null) => void
) {
  const svg = d3.select(svgElement);

  const g = svg
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);

  // Add subtle background pattern
  const defs = svg.append('defs');
  const pattern = defs.append('pattern')
    .attr('id', 'background-pattern')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 4)
    .attr('height', 4);

  pattern.append('circle')
    .attr('cx', 2)
    .attr('cy', 2)
    .attr('r', 0.5)
    .attr('fill', '#f8f9fa')
    .attr('opacity', 0.3);

  // Create word elements
  const text = g
    .selectAll('text')
    .data(words)
    .enter()
    .append('text')
    .style('font-size', d => `${d.size}px`)
    .style('font-family', 'system-ui, -apple-system, sans-serif')
    .style('font-weight', d => d.frequency > 5 ? 'bold' : 'normal')
    .style('fill', d => getWordColor(d, colorScale))
    .style('stroke', d => d.frequency > 10 ? 'rgba(0,0,0,0.1)' : 'none')
    .style('stroke-width', 0.5)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
    .text(d => d.text)
    .style('opacity', 0)
    .style('cursor', enableInteractions ? 'pointer' : 'default');

  // Animate words in
  text
    .transition()
    .duration(1000)
    .delay((d, i) => i * 50)
    .style('opacity', 1);

  if (enableInteractions) {
    text
      .on('click', (event, d) => {
        onWordClick?.(d);

        // Visual feedback
        d3.select(event.target)
          .transition()
          .duration(200)
          .style('transform', 'scale(1.1)')
          .transition()
          .duration(200)
          .style('transform', 'scale(1)');
      })
      .on('mouseover', function(event, d) {
        onWordHover?.(d);

        // Highlight effect
        d3.select(this)
          .style('opacity', 0.8)
          .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');

        // Show tooltip
        showTooltip(event, d, width, height);
      })
      .on('mouseout', function(event, d) {
        onWordHover?.(null);

        d3.select(this)
          .style('opacity', 1)
          .style('filter', 'none');

        hideTooltip();
      });
  }

  // Add frequency indicators for top words
  const topWords = words
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  topWords.forEach((word, index) => {
    g.append('circle')
      .attr('cx', word.x!)
      .attr('cy', word.y! - word.size! / 2 - 8)
      .attr('r', 3)
      .style('fill', '#3b82f6')
      .style('opacity', 0.7);
  });
}

// Get word color based on mode
function getWordColor(word: WordData, colorScale: any): string {
  if (word.sentiment !== undefined) {
    return colorScale(word.sentiment);
  } else if (word.emotion) {
    return colorScale(word.emotion);
  } else {
    return colorScale(word.frequency);
  }
}

// Show tooltip on hover
function showTooltip(event: MouseEvent, word: WordData, width: number, height: number) {
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'word-cloud-tooltip')
    .style('position', 'absolute')
    .style('background', 'rgba(0,0,0,0.8)')
    .style('color', 'white')
    .style('padding', '8px 12px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('z-index', '1000')
    .style('opacity', 0);

  const content = `
    <div><strong>${word.text}</strong></div>
    <div>Frequency: ${word.frequency}</div>
    ${word.sentiment !== undefined ? `<div>Sentiment: ${word.sentiment.toFixed(2)}</div>` : ''}
    ${word.emotion ? `<div>Emotion: ${word.emotion}</div>` : ''}
    ${word.coOccurrences?.length ? `<div>Related: ${word.coOccurrences.slice(0, 3).join(', ')}</div>` : ''}
  `;

  tooltip.html(content)
    .style('left', `${event.pageX + 10}px`)
    .style('top', `${event.pageY - 10}px`)
    .transition()
    .duration(200)
    .style('opacity', 1);
}

// Hide tooltip
function hideTooltip() {
  d3.selectAll('.word-cloud-tooltip')
    .transition()
    .duration(200)
    .style('opacity', 0)
    .remove();
}

export default EnhancedWordCloud;