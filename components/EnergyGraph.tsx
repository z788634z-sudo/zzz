import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Node, Link } from '../types';

interface EnergyGraphProps {
  nodes: Node[];
  links: Link[];
}

export const EnergyGraph: React.FC<EnergyGraphProps> = ({ nodes, links }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Process data to ensure d3 doesn't mutate original props directly in a way that breaks React
  const data = useMemo(() => {
    return {
      nodes: nodes.map(n => ({ ...n })),
      links: links.map(l => ({ ...l }))
    };
  }, [nodes, links]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.nodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = 500;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto");

    // Definitions for arrowheads
    const defs = svg.append("defs");
    defs.append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25) // Position of arrow
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#64748b");

    // Color Adjustment Helper
    const adjustColor = (hex: string | undefined, score: number) => {
       const base = hex || '#cbd5e1';
       const c = d3.hsl(base);
       
       // Score 1-10
       const intensity = score / 10; // 0.1 to 1.0
       
       // Saturation: Make high influence very saturated, low influence desaturated
       // Boost saturation for high influence users to make them "vibrant"
       // Low influence users become grayer
       c.s = Math.max(c.s, 0.3) + (intensity - 0.5) * 0.8; 
       c.s = Math.max(0.1, Math.min(1, c.s));

       // Lightness: 
       // Shift L towards 0.55 (generally most vibrant) based on intensity
       // Low influence -> dimmer
       c.l = c.l + (intensity - 0.5) * 0.4;
       c.l = Math.max(0.25, Math.min(0.75, c.l));
       
       return c.toString();
    };

    // Simulation Setup
    const simulation = d3.forceSimulation(data.nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance((d: any) => 150 - (d.weight * 10)))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => (d.influence_score * 4) + 20));

    // Draw Links
    const link = svg.append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke", (d: any) => {
          if (d.type === 'conflict') return '#ef4444';
          if (d.type === 'mention') return '#8b5cf6';
          return '#475569';
      })
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: any) => Math.sqrt(d.weight) * 2)
      .attr("marker-end", "url(#arrowhead)");

    // Draw Nodes
    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(drag(simulation) as any);

    // 1. Outer Glow / Aura (Sentiment Color)
    nodeGroup.append("circle")
      .attr("r", (d: any) => (d.influence_score * 3) + 12)
      .attr("fill", (d: any) => adjustColor(d.sentiment_color, d.influence_score))
      .attr("fill-opacity", (d: any) => 0.1 + (d.influence_score / 30)) // More opaque glow for high influence
      .attr("stroke", (d: any) => adjustColor(d.sentiment_color, d.influence_score))
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,3") // Dashed ring for style
      .attr("stroke-opacity", 0.5);

    // 2. Main Node Body (Sentiment Color)
    nodeGroup.append("circle")
      .attr("r", (d: any) => (d.influence_score * 3) + 5)
      .attr("fill", (d: any) => adjustColor(d.sentiment_color, d.influence_score))
      .attr("stroke", "#ffffff") // White stroke to make color pop
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.9)
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.5))");

    // Node Labels (Name)
    nodeGroup.append("text")
      .text((d: any) => d.id)
      .attr("x", 0)
      .attr("y", (d: any) => -(d.influence_score * 3) - 8)
      .attr("text-anchor", "middle")
      .attr("fill", "#f8fafc")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .style("pointer-events", "none")
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)");

    // Role Label
    nodeGroup.append("text")
      .text((d: any) => d.role.split(' ')[1] || d.role)
      .attr("x", 0)
      .attr("y", (d: any) => (d.influence_score * 3) + 20)
      .attr("text-anchor", "middle")
      .attr("fill", (d: any) => adjustColor(d.sentiment_color, d.influence_score)) // Match text color to sentiment
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.8)");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function drag(simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-[500px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative">
       <div className="absolute top-4 left-4 z-10 bg-slate-950/80 p-3 rounded-lg text-xs text-slate-400 backdrop-blur-sm pointer-events-none border border-slate-800">
          <p className="font-bold text-slate-200 mb-2">Energy Field Legend</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-slate-500 border border-white"></span>
            Node Color = User Sentiment
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full border border-slate-500 border-dashed"></span>
            Outer Ring = Influence Aura
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-0.5 bg-slate-500"></span>
            Line Thickness = Connection Strength
          </div>
       </div>
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
    </div>
  );
};