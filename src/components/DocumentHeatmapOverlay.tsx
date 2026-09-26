import React, { useState } from 'react';
import { 
  Flame, 
  Layers, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Crosshair,
  Sparkles,
  Info
} from 'lucide-react';

export interface BoundingBox {
  x: number; // 0 to 100%
  y: number; // 0 to 100%
  width: number; // 0 to 100%
  height: number; // 0 to 100%
}

export interface HeatmapFinding {
  category?: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  recommendation?: string;
  boundingBox?: BoundingBox;
}

export interface DocumentHeatmapProps {
  documentName: string;
  documentType: string;
  riskScore: number;
  riskLevel: string;
  summary?: string;
  findings: HeatmapFinding[];
  keyMetrics?: {
    detectedVendor?: string;
    detectedAmount?: string;
    detectedDate?: string;
    missingFields?: string[];
  };
  imageUrl?: string;
  onFindingSelect?: (finding: HeatmapFinding, index: number) => void;
  selectedFindingIndex?: number | null;
  className?: string;
  compact?: boolean;
}

// Default fallback bounding box positions if AI didn't return an explicit bounding box
export function getResolvedBoundingBox(finding: HeatmapFinding, index: number): BoundingBox {
  if (finding.boundingBox && finding.boundingBox.width > 0) {
    return finding.boundingBox;
  }

  const title = (finding.title || '').toLowerCase();
  const desc = (finding.description || '').toLowerCase();
  const combined = title + ' ' + desc;

  if (combined.includes('wire') || combined.includes('crypto') || combined.includes('usdt') || combined.includes('bank') || combined.includes('payment') || combined.includes('account')) {
    return { x: 8, y: 72, width: 70, height: 16 };
  }
  if (combined.includes('tax') || combined.includes('vat') || combined.includes('ein') || combined.includes('tin') || combined.includes('registration')) {
    return { x: 52, y: 12, width: 40, height: 12 };
  }
  if (combined.includes('date') || combined.includes('timestamp') || combined.includes('backdat') || combined.includes('omitted')) {
    return { x: 56, y: 26, width: 36, height: 9 };
  }
  if (combined.includes('amount') || combined.includes('total') || combined.includes('arithmetic') || combined.includes('discrepancy') || combined.includes('math')) {
    return { x: 50, y: 62, width: 44, height: 11 };
  }
  if (combined.includes('urgent') || combined.includes('overdue') || combined.includes('immediate') || combined.includes('pressure')) {
    return { x: 8, y: 5, width: 84, height: 8 };
  }
  if (combined.includes('doctor') || combined.includes('practitioner') || combined.includes('licens') || combined.includes('medical') || combined.includes('clinic')) {
    return { x: 8, y: 12, width: 46, height: 14 };
  }
  if (combined.includes('deduction') || combined.includes('payroll') || combined.includes('salary') || combined.includes('pension')) {
    return { x: 8, y: 48, width: 84, height: 16 };
  }

  // Staggered fallback zones based on index
  const fallbackZones: BoundingBox[] = [
    { x: 10, y: 38, width: 80, height: 12 },
    { x: 52, y: 14, width: 40, height: 12 },
    { x: 8, y: 72, width: 68, height: 16 },
    { x: 54, y: 64, width: 38, height: 10 },
  ];

  return fallbackZones[index % fallbackZones.length];
}

export function DocumentHeatmapOverlay({
  documentName,
  documentType,
  riskScore,
  riskLevel,
  summary,
  findings,
  keyMetrics,
  imageUrl,
  onFindingSelect,
  selectedFindingIndex,
  className = '',
  compact = false
}: DocumentHeatmapProps) {
  const [heatmapVisible, setHeatmapVisible] = useState(true);
  const [heatmapMode, setHeatmapMode] = useState<'thermal' | 'boxes' | 'combined'>('combined');
  const [filterHighRiskOnly, setFilterHighRiskOnly] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Normalize findings and calculate risk severity
  const normalizedFindings = findings.map((f, i) => {
    const rawSev = (f.severity || '').toLowerCase();
    const severity: 'low' | 'medium' | 'high' | 'critical' = 
      rawSev.includes('crit') ? 'critical' :
      rawSev.includes('high') ? 'high' :
      rawSev.includes('med') ? 'medium' : 'low';

    return {
      ...f,
      normalizedSeverity: severity,
      box: getResolvedBoundingBox(f, i),
      originalIndex: i
    };
  });

  // Filter for display based on controls
  const visibleFindings = filterHighRiskOnly
    ? normalizedFindings.filter(f => f.normalizedSeverity === 'critical' || f.normalizedSeverity === 'high')
    : normalizedFindings;

  const highRiskCount = normalizedFindings.filter(f => f.normalizedSeverity === 'critical' || f.normalizedSeverity === 'high').length;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.8));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className={`flex flex-col bg-[#0F172A] text-white rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden ${className}`}>
      {/* Top Heatmap Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
            <Flame className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                AI Forensic Heatmap
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                {highRiskCount} High-Risk {highRiskCount === 1 ? 'Zone' : 'Zones'} Flagged
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-xs">
              {documentName} • {documentType}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Heatmap Visibility Toggle */}
          <button
            onClick={() => setHeatmapVisible(!heatmapVisible)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              heatmapVisible 
                ? 'bg-purple-600/30 text-purple-300 border-purple-500/40 hover:bg-purple-600/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Heatmap Overlay"
          >
            {heatmapVisible ? <Eye className="w-3.5 h-3.5 text-purple-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>Heatmap {heatmapVisible ? 'ON' : 'OFF'}</span>
          </button>

          {/* Mode Selector */}
          {heatmapVisible && (
            <div className="hidden sm:flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 text-[11px] font-bold">
              <button
                onClick={() => setHeatmapMode('combined')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  heatmapMode === 'combined' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Combined
              </button>
              <button
                onClick={() => setHeatmapMode('thermal')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  heatmapMode === 'thermal' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Thermal
              </button>
              <button
                onClick={() => setHeatmapMode('boxes')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  heatmapMode === 'boxes' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Target Grid
              </button>
            </div>
          )}

          {/* High-Risk Filter Pill */}
          <button
            onClick={() => setFilterHighRiskOnly(!filterHighRiskOnly)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
              filterHighRiskOnly 
                ? 'bg-red-500 text-white border-red-400' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Filter High-Risk Only"
          >
            Critical Only
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.8}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-slate-400">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 1 && (
              <button
                onClick={handleResetZoom}
                className="p-1.5 text-purple-400 hover:text-purple-300 border-l border-slate-700"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Document & Heatmap Canvas Stage */}
      <div className="relative w-full bg-slate-950 overflow-auto p-4 sm:p-6 flex items-center justify-center min-h-[360px] max-h-[560px]">
        <div 
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          className="relative transition-transform duration-200 ease-out shadow-2xl rounded-xl overflow-hidden max-w-full"
        >
          {/* Document Sheet Simulation or Image */}
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={documentName} 
              className="w-[540px] max-w-full h-auto object-contain bg-white block" 
            />
          ) : (
            <div className="w-[520px] max-w-full bg-white text-slate-800 font-sans p-6 rounded-lg shadow-inner select-none relative min-h-[580px] border border-slate-300">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 font-black text-6xl tracking-widest text-slate-900 rotate-[-30deg] uppercase">
                {documentType}
              </div>

              {/* Document Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                  <div className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    {keyMetrics?.detectedVendor || 'Apex Global Solutions Ltd.'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Corporate Entity Verification Reference
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Doc ID: {documentName}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block bg-slate-900 text-white font-mono font-bold text-xs px-2.5 py-1 rounded">
                    {documentType.toUpperCase()}
                  </span>
                  <div className="text-[11px] text-slate-600 mt-1 font-semibold">
                    Date: {keyMetrics?.detectedDate || 'Sep 18, 2026'}
                  </div>
                  <div className="text-[10px] text-red-500 font-bold mt-0.5">
                    {keyMetrics?.missingFields?.includes('Tax/VAT ID') ? '⚠ TAX ID MISSING' : 'TAX ID: REG-904128'}
                  </div>
                </div>
              </div>

              {/* Invoice / Document Metadata Row */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Bill To / Recipient</span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">Global Procurement Corp</div>
                  <div className="text-[11px] text-slate-500">Dept: Financial Disbursements</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Remittance Due</span>
                  <div className="font-black text-slate-900 text-base mt-0.5 font-mono">
                    {keyMetrics?.detectedAmount || '$14,850.00'}
                  </div>
                  <div className="text-[10px] text-slate-500">Terms: Immediate Settlement</div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="py-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-[10px] uppercase font-bold text-slate-400">
                      <th className="pb-1.5">Description</th>
                      <th className="pb-1.5 text-center">Qty</th>
                      <th className="pb-1.5 text-right">Rate</th>
                      <th className="pb-1.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-2 font-medium">Enterprise Security & Compliance Audit</td>
                      <td className="py-2 text-center">1.0</td>
                      <td className="py-2 text-right font-mono">$12,000.00</td>
                      <td className="py-2 text-right font-mono font-bold">$12,000.00</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Out-of-band Forensic Protocol Fee</td>
                      <td className="py-2 text-center">1.0</td>
                      <td className="py-2 text-right font-mono">$2,850.00</td>
                      <td className="py-2 text-right font-mono font-bold">$2,850.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bank Remittance & Wire Instructions (High-Risk Section) */}
              <div className="mt-4 p-3 bg-red-50/70 border border-red-200 rounded-lg text-xs">
                <div className="flex items-center justify-between text-red-900 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    Mandatory Wire Instructions (High Risk)
                  </span>
                  <span className="text-[10px] uppercase bg-red-200 text-red-800 px-1.5 py-0.5 rounded font-bold">
                    Urgent Release
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-700 space-y-0.5">
                  <div>Beneficiary Bank: Swiss Horizon Offshore Bank</div>
                  <div>Account No: CH93-0000-8812-3921-9920</div>
                  <div>Routing / Swift: SWISCHZZ801 (Non-standard remittance route)</div>
                </div>
              </div>

              {/* Official Seal and Sign-off */}
              <div className="mt-6 flex justify-between items-end text-[10px] text-slate-400">
                <div>
                  <p>Certified Under AI Forensic Observation</p>
                  <p className="font-mono text-slate-500">Checksum: 8fa92-b01c-fe94</p>
                </div>
                <div className="w-20 h-10 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] font-bold text-slate-400 uppercase">
                  Digital Seal
                </div>
              </div>
            </div>
          )}

          {/* SVG Heatmap Overlay Layer */}
          {heatmapVisible && (
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none select-none" 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none"
            >
              <defs>
                {/* Thermal Gaussian Blur Filter */}
                <filter id="thermal-blur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Soft Heat Halo Filter */}
                <filter id="heat-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" />
                </filter>

                {/* Striped Danger Pattern */}
                <pattern id="fraud-stripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#EF4444" strokeWidth="1.5" strokeOpacity="0.45" />
                </pattern>

                <pattern id="warning-stripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.4" />
                </pattern>

                {/* Radial Heat Gradient for Critical Risk */}
                <radialGradient id="critical-thermal-heat" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#DC2626" stopOpacity="0.85" />
                  <stop offset="40%" stopColor="#EF4444" stopOpacity="0.65" />
                  <stop offset="70%" stopColor="#F97316" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                </radialGradient>

                {/* Radial Heat Gradient for High Risk */}
                <radialGradient id="high-thermal-heat" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#EA580C" stopOpacity="0.8" />
                  <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.55" />
                  <stop offset="80%" stopColor="#FBBF24" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </radialGradient>

                {/* Radial Heat Gradient for Medium Risk */}
                <radialGradient id="medium-thermal-heat" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.75" />
                  <stop offset="60%" stopColor="#FBBF24" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#FCD34D" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* LAYER 1: Thermal Heat Dissipation Ellipses */}
              {(heatmapMode === 'thermal' || heatmapMode === 'combined') && (
                <g filter="url(#thermal-blur)">
                  {visibleFindings.map((finding) => {
                    const { box, normalizedSeverity, originalIndex } = finding;
                    const cx = box.x + box.width / 2;
                    const cy = box.y + box.height / 2;
                    const rx = box.width * 0.75;
                    const ry = box.height * 0.85;

                    const gradientId = 
                      normalizedSeverity === 'critical' ? 'url(#critical-thermal-heat)' :
                      normalizedSeverity === 'high' ? 'url(#high-thermal-heat)' :
                      'url(#medium-thermal-heat)';

                    const isSelected = selectedFindingIndex === originalIndex;
                    const isHovered = hoveredIndex === originalIndex;

                    return (
                      <ellipse
                        key={`thermal-${originalIndex}`}
                        cx={cx}
                        cy={cy}
                        rx={isSelected || isHovered ? rx * 1.2 : rx}
                        ry={isSelected || isHovered ? ry * 1.2 : ry}
                        fill={gradientId}
                        className="transition-all duration-300"
                      />
                    );
                  })}
                </g>
              )}

              {/* LAYER 2: Target Bounding Box Geometry & Anomaly Markers */}
              {(heatmapMode === 'boxes' || heatmapMode === 'combined') && (
                <g>
                  {visibleFindings.map((finding) => {
                    const { box, normalizedSeverity, originalIndex } = finding;
                    const isSelected = selectedFindingIndex === originalIndex;
                    const isHovered = hoveredIndex === originalIndex;

                    const isCritical = normalizedSeverity === 'critical';
                    const isHigh = normalizedSeverity === 'high';

                    const strokeColor = isCritical ? '#DC2626' : isHigh ? '#EA580C' : '#D97706';
                    const fillColor = isCritical ? 'url(#fraud-stripes)' : 'url(#warning-stripes)';

                    return (
                      <g 
                        key={`box-${originalIndex}`}
                        className="cursor-pointer pointer-events-auto"
                        onClick={() => onFindingSelect?.(finding, originalIndex)}
                        onMouseEnter={() => setHoveredIndex(originalIndex)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Highlighting Anomaly Area */}
                        <rect
                          x={box.x}
                          y={box.y}
                          width={box.width}
                          height={box.height}
                          rx={1.5}
                          ry={1.5}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={isSelected || isHovered ? 0.8 : 0.45}
                          strokeDasharray={isSelected || isHovered ? '2, 1' : 'none'}
                          className="transition-all duration-200 hover:opacity-90"
                        />

                        {/* Pulsing Radar Ring for Critical Risk Center */}
                        {(isCritical || isHigh) && (
                          <circle
                            cx={box.x + box.width - 2}
                            cy={box.y + 2}
                            r={isSelected || isHovered ? 2.5 : 1.8}
                            fill={strokeColor}
                            className="animate-ping opacity-75 origin-center"
                          />
                        )}

                        {/* Top-Right Badge Pin */}
                        <circle
                          cx={box.x + box.width - 2}
                          cy={box.y + 2}
                          r={1.8}
                          fill={strokeColor}
                          stroke="#FFFFFF"
                          strokeWidth={0.4}
                        />

                        {/* Forensic Target Crosshair Reticles on Corners */}
                        <path
                          d={`M ${box.x} ${box.y + 2} L ${box.x} ${box.y} L ${box.x + 2} ${box.y}`}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={0.5}
                        />
                        <path
                          d={`M ${box.x + box.width - 2} ${box.y} L ${box.x + box.width} ${box.y} L ${box.x + box.width} ${box.y + 2}`}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={0.5}
                        />
                        <path
                          d={`M ${box.x} ${box.y + box.height - 2} L ${box.x} ${box.y + box.height} L ${box.x + 2} ${box.y + box.height}`}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={0.5}
                        />
                        <path
                          d={`M ${box.x + box.width - 2} ${box.y + box.height} L ${box.x + box.width} ${box.y + box.height} L ${box.x + box.width} ${box.y + box.height - 2}`}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={0.5}
                        />

                        {/* Category Label Pill */}
                        <rect
                          x={box.x}
                          y={Math.max(1, box.y - 3.8)}
                          width={Math.min(box.width, 32)}
                          height={3.2}
                          rx={0.8}
                          fill={strokeColor}
                        />
                        <text
                          x={box.x + 1}
                          y={Math.max(1, box.y - 3.8) + 2.2}
                          fill="#FFFFFF"
                          fontSize="1.8"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {isCritical ? '⚡ CRITICAL FRAUD' : isHigh ? '⚠ HIGH RISK' : 'ANOMALY'}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>
          )}

          {/* Floating Hover Tooltip overlay on active zone */}
          {hoveredIndex !== null && normalizedFindings[hoveredIndex] && (
            <div 
              className="absolute z-30 bg-slate-900/95 backdrop-blur-md border border-red-500/40 text-white rounded-xl p-3 shadow-2xl max-w-xs pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
              style={{
                left: `${Math.min(Math.max(normalizedFindings[hoveredIndex].box.x, 5), 65)}%`,
                top: `${Math.min(Math.max(normalizedFindings[hoveredIndex].box.y + normalizedFindings[hoveredIndex].box.height + 2, 5), 75)}%`
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  {normalizedFindings[hoveredIndex].normalizedSeverity} Risk Detection
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Zone #{hoveredIndex + 1}
                </span>
              </div>
              <h5 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                {normalizedFindings[hoveredIndex].title}
              </h5>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed line-clamp-3">
                {normalizedFindings[hoveredIndex].description}
              </p>
              {normalizedFindings[hoveredIndex].recommendation && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-purple-300">
                  <strong>AI Directive:</strong> {normalizedFindings[hoveredIndex].recommendation}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Heatmap Legend & High-Risk Anomaly Selector */}
      <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Thermal Gradient Scale:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
              <span className="text-slate-300 font-semibold">Critical (80-100%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <span className="text-slate-300 font-semibold">High (50-79%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="text-slate-400 font-semibold">Moderate</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Click any zone on document or finding below to focus
          </div>
        </div>

        {/* Interactive Findings Zone Cards */}
        {visibleFindings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
            {visibleFindings.map((finding) => {
              const isSelected = selectedFindingIndex === finding.originalIndex;
              const isCritical = finding.normalizedSeverity === 'critical';
              const isHigh = finding.normalizedSeverity === 'high';

              return (
                <button
                  key={finding.originalIndex}
                  onClick={() => onFindingSelect?.(finding, finding.originalIndex)}
                  onMouseEnter={() => setHoveredIndex(finding.originalIndex)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`text-left p-2.5 rounded-xl border transition-all ${
                    isSelected 
                      ? 'bg-purple-900/40 border-purple-500 ring-2 ring-purple-500/30' 
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5 truncate">
                      <Crosshair className={`w-3 h-3 ${isCritical ? 'text-red-400' : isHigh ? 'text-orange-400' : 'text-amber-400'}`} />
                      {finding.title}
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      isCritical ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      isHigh ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {finding.normalizedSeverity}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                    {finding.description}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            <span>No high-risk anomaly zones flagged in this document preview.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentHeatmapOverlay;
