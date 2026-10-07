import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  Calendar, 
  Download, 
  Layers, 
  Sparkles, 
  Info, 
  Eye, 
  CheckCircle2, 
  ChevronRight,
  Filter,
  BarChart2,
  Activity
} from 'lucide-react';
import { AuditLogItem } from './AuditDashboard';

interface D3AnomalyTrendChartProps {
  audits: AuditLogItem[];
  onSelectAudit?: (audit: AuditLogItem) => void;
}

export type TrendMetricMode = 'anomalies_and_risk' | 'severity_breakdown' | 'cumulative';
export type TimeFilterRange = 'all' | '30d' | '14d' | '7d';

interface AnomalyDataPoint {
  index: number;
  id: string;
  date: Date;
  timeLabel: string;
  documentName: string;
  documentType: string;
  riskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  findingsCount: number;
  lowCount: number;
  moderateCount: number;
  highCount: number;
  criticalCount: number;
  cumulativeAnomalies: number;
  cumulativeExposure: number;
  findings: Array<{
    category?: string;
    title: string;
    description: string;
    severity: string;
  }>;
  rawAudit?: AuditLogItem;
}

export function D3AnomalyTrendChart({ audits, onSelectAudit }: D3AnomalyTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [metricMode, setMetricMode] = useState<TrendMetricMode>('anomalies_and_risk');
  const [timeRange, setTimeRange] = useState<TimeFilterRange>('all');
  const [selectedPoint, setSelectedPoint] = useState<AnomalyDataPoint | null>(null);
  const [chartWidth, setChartWidth] = useState<number>(800);

  // Prepare and normalize data points chronologically
  const chartData = useMemo<AnomalyDataPoint[]>(() => {
    // If no audits or very few, generate realistic sample baseline so chart is instantly rich
    let sourceAudits = audits && audits.length > 0 ? [...audits] : [];
    
    if (sourceAudits.length === 0) {
      const now = Date.now();
      const mockNames = [
        'Vendor_Acme_Supplies_Oct26.pdf',
        'Global_Logistics_Freight_Oct26.pdf',
        'Vertex_Cloud_Services_Inv881.pdf',
        'Caterpillar_Equipment_Lease.pdf',
        'Apex_Consulting_Q3_Wire.pdf',
        'Bavaria_Import_Machinery.pdf',
        'Starlight_Enterprise_AP_902.pdf',
        'Horizon_Media_Retainer.pdf',
        'Quantum_Tech_Hardware_PO.pdf',
        'Titan_Steel_Contract_098.pdf',
        'Pacifica_Shipping_Customs.pdf',
        'Vanguard_Legal_Advisory.pdf'
      ];

      sourceAudits = mockNames.map((name, i) => {
        const daysAgo = (mockNames.length - 1 - i) * 2;
        const time = new Date(now - daysAgo * 24 * 60 * 60 * 1000 - (i % 5) * 3600 * 1000);
        const score = [15, 24, 78, 35, 92, 18, 64, 45, 88, 30, 85, 20][i];
        const level: 'Low' | 'Moderate' | 'High' | 'Critical' = 
          score > 75 ? 'Critical' : score > 50 ? 'High' : score > 25 ? 'Moderate' : 'Low';
        const findingsCount = score > 75 ? 3 : score > 50 ? 2 : score > 25 ? 1 : 0;
        
        return {
          id: `sample_audit_${i}`,
          timestamp: time.toISOString(),
          documentName: name,
          documentType: i % 3 === 0 ? 'Tax Invoice' : i % 3 === 1 ? 'Commercial Contract' : 'Receipt',
          riskScore: score,
          riskLevel: level,
          summary: score > 50 
            ? 'Forensic audit detected potential wire diversion and arithmetic discrepancy.' 
            : 'Standard commercial invoice with valid tax identifiers.',
          findingsCount,
          findings: Array.from({ length: findingsCount }).map((_, fIdx) => ({
            category: fIdx === 0 ? 'Arithmetic & Ledger' : 'Wire Diversion',
            title: fIdx === 0 ? 'Subtotal Mismatch ($1,250 overstatement)' : 'Offshore wire instructions flagged',
            description: 'Discrepancy identified under SAS 99 forensic auditing protocols.',
            severity: level.toLowerCase()
          })),
          keyMetrics: {
            detectedVendor: name.split('_')[0] + ' Corp',
            detectedAmount: `$${(score * 185 + 1200).toLocaleString()}.00`,
            detectedDate: time.toLocaleDateString(),
            missingFields: score > 60 ? ['Tax ID'] : []
          }
        };
      });
    }

    // Sort chronologically ascending
    const sorted = [...sourceAudits].sort((a, b) => {
      const tA = new Date(a.timestamp).getTime();
      const tB = new Date(b.timestamp).getTime();
      return tA - tB;
    });

    // Apply Time Filter
    const now = Date.now();
    const filtered = sorted.filter(a => {
      if (timeRange === 'all') return true;
      const t = new Date(a.timestamp).getTime();
      const diffDays = (now - t) / (1000 * 3600 * 24);
      if (timeRange === '7d') return diffDays <= 7;
      if (timeRange === '14d') return diffDays <= 14;
      if (timeRange === '30d') return diffDays <= 30;
      return true;
    });

    // Compute cumulative metrics
    let runningAnomalies = 0;
    let runningExposure = 0;

    return filtered.map((audit, idx) => {
      const date = new Date(audit.timestamp);
      const findingsCount = audit.findingsCount ?? (audit.findings ? audit.findings.length : 0);
      runningAnomalies += findingsCount;

      const amountVal = audit.keyMetrics?.detectedAmount 
        ? parseFloat(audit.keyMetrics.detectedAmount.replace(/[^0-9.-]+/g, '')) || 0
        : 0;
      if (audit.riskScore > 50) {
        runningExposure += amountVal;
      }

      const findings = audit.findings || [];
      const lowCount = findings.filter(f => f.severity === 'low').length;
      const moderateCount = findings.filter(f => f.severity === 'medium' || f.severity === 'moderate').length;
      const highCount = findings.filter(f => f.severity === 'high').length;
      const criticalCount = findings.filter(f => f.severity === 'critical').length + (audit.riskScore > 75 && findings.length === 0 ? 1 : 0);

      return {
        index: idx,
        id: audit.id,
        date,
        timeLabel: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        documentName: audit.documentName,
        documentType: audit.documentType || 'Invoice',
        riskScore: audit.riskScore,
        riskLevel: audit.riskLevel,
        findingsCount,
        lowCount: lowCount || (audit.riskLevel === 'Low' ? 1 : 0),
        moderateCount: moderateCount || (audit.riskLevel === 'Moderate' ? 1 : 0),
        highCount: highCount || (audit.riskLevel === 'High' ? 1 : 0),
        criticalCount: criticalCount || (audit.riskLevel === 'Critical' ? 1 : 0),
        cumulativeAnomalies: runningAnomalies,
        cumulativeExposure: runningExposure,
        findings,
        rawAudit: audit
      };
    });
  }, [audits, timeRange]);

  // Handle ResizeObserver for SVG responsiveness
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setChartWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Main D3 Render Effect
  useEffect(() => {
    if (!svgRef.current || chartData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const margin = { top: 30, right: 48, bottom: 45, left: 52 };
    const width = Math.max(320, chartWidth);
    const height = 340;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    // Defs & Linear Gradients
    const defs = svg.append('defs');

    // Purple Gradient for Anomaly Area
    const anomalyGrad = defs.append('linearGradient')
      .attr('id', 'd3-anomaly-area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    anomalyGrad.append('stop').attr('offset', '0%').attr('stop-color', '#7C3AED').attr('stop-opacity', 0.45);
    anomalyGrad.append('stop').attr('offset', '100%').attr('stop-color', '#7C3AED').attr('stop-opacity', 0.02);

    // Red Gradient for Critical Risk Line
    const riskGrad = defs.append('linearGradient')
      .attr('id', 'd3-risk-line-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');
    riskGrad.append('stop').attr('offset', '0%').attr('stop-color', '#7C3AED');
    riskGrad.append('stop').attr('offset', '70%').attr('stop-color', '#F59E0B');
    riskGrad.append('stop').attr('offset', '100%').attr('stop-color', '#DC2626');

    // Glow Filter for high-risk anomalies
    const filter = defs.append('filter')
      .attr('id', 'd3-glow')
      .attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    filter.append('feGaussianBlur').attr('stdDeviation', '3.5').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: index or chronological time
    const xScale = d3.scaleLinear()
      .domain([0, Math.max(1, chartData.length - 1)])
      .range([0, innerWidth]);

    // Primary Y Scale (Left): Detected Anomalies count
    const maxValFound = d3.max(chartData, (d: AnomalyDataPoint) => d.findingsCount);
    const maxAnomalies = Math.max(4, typeof maxValFound === 'number' ? maxValFound : 4);
    const yScaleLeft = d3.scaleLinear()
      .domain([0, maxAnomalies])
      .nice()
      .range([innerHeight, 0]);

    // Secondary Y Scale (Right): Risk Score (0-100) or Cumulative
    const maxCumVal = d3.max(chartData, (d: AnomalyDataPoint) => d.cumulativeAnomalies);
    const maxRight = metricMode === 'cumulative'
      ? Math.max(10, typeof maxCumVal === 'number' ? maxCumVal : 10)
      : 100;
    const yScaleRight = d3.scaleLinear()
      .domain([0, maxRight])
      .nice()
      .range([innerHeight, 0]);

    // Background horizontal grid lines
    const yGrid = d3.axisLeft(yScaleLeft)
      .ticks(5)
      .tickSize(-innerWidth)
      .tickFormat(() => '');

    g.append('g')
      .attr('class', 'grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#F1F5F9')
      .attr('stroke-width', 1);
    g.select('.grid .domain').remove();

    // SAS 99 High-Risk Anomaly Threshold Line (at Risk Score 70 or 3 anomalies)
    const thresholdY = metricMode === 'anomalies_and_risk' 
      ? yScaleRight(70) 
      : yScaleLeft(Math.min(maxAnomalies, 3));

    const thresholdGroup = g.append('g').attr('class', 'threshold-guide');
    thresholdGroup.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', thresholdY)
      .attr('y2', thresholdY)
      .attr('stroke', '#EF4444')
      .attr('stroke-dasharray', '4 4')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6);

    thresholdGroup.append('text')
      .attr('x', innerWidth - 6)
      .attr('y', thresholdY - 6)
      .attr('text-anchor', 'end')
      .attr('fill', '#DC2626')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('letter-spacing', '0.04em')
      .text('SAS 99 CRITICAL THRESHOLD');

    // 1. Draw Paths & Areas based on metricMode
    if (metricMode === 'anomalies_and_risk') {
      // Area generator for anomalies
      const areaGen = d3.area<AnomalyDataPoint>()
        .x((d, i) => xScale(i))
        .y0(innerHeight)
        .y1(d => yScaleLeft(d.findingsCount))
        .curve(d3.curveMonotoneX);

      // Line generator for anomalies
      const lineGen = d3.line<AnomalyDataPoint>()
        .x((d, i) => xScale(i))
        .y(d => yScaleLeft(d.findingsCount))
        .curve(d3.curveMonotoneX);

      // Risk score line generator
      const riskLineGen = d3.line<AnomalyDataPoint>()
        .x((d, i) => xScale(i))
        .y(d => yScaleRight(d.riskScore))
        .curve(d3.curveMonotoneX);

      // Render Anomaly Area
      g.append('path')
        .datum(chartData)
        .attr('fill', 'url(#d3-anomaly-area-gradient)')
        .attr('d', areaGen);

      // Render Anomaly Line
      g.append('path')
        .datum(chartData)
        .attr('fill', 'none')
        .attr('stroke', '#7C3AED')
        .attr('stroke-width', 2.5)
        .attr('d', lineGen);

      // Render Risk Score Trajectory Line
      g.append('path')
        .datum(chartData)
        .attr('fill', 'none')
        .attr('stroke', 'url(#d3-risk-line-gradient)')
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '6 3')
        .attr('opacity', 0.85)
        .attr('d', riskLineGen);

    } else if (metricMode === 'severity_breakdown') {
      // Stacked Bar / Multi-line for Critical, High, Moderate, Low
      const stack = d3.stack<AnomalyDataPoint>()
        .keys(['criticalCount', 'highCount', 'moderateCount', 'lowCount'])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const series = stack(chartData);
      const colorMap: Record<string, string> = {
        criticalCount: '#DC2626',
        highCount: '#EA580C',
        moderateCount: '#F59E0B',
        lowCount: '#10B981'
      };

      const areaStackGen = d3.area<any>()
        .x((d, i) => xScale(i))
        .y0(d => yScaleLeft(d[0]))
        .y1(d => yScaleLeft(d[1]))
        .curve(d3.curveMonotoneX);

      series.forEach(s => {
        g.append('path')
          .datum(s)
          .attr('fill', colorMap[s.key])
          .attr('opacity', 0.5)
          .attr('d', areaStackGen);

        const lineStackGen = d3.line<any>()
          .x((d, i) => xScale(i))
          .y(d => yScaleLeft(d[1]))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(s)
          .attr('fill', 'none')
          .attr('stroke', colorMap[s.key])
          .attr('stroke-width', 1.8)
          .attr('d', lineStackGen);
      });

    } else {
      // Cumulative Anomaly Growth
      const cumAreaGen = d3.area<AnomalyDataPoint>()
        .x((d, i) => xScale(i))
        .y0(innerHeight)
        .y1(d => yScaleRight(d.cumulativeAnomalies))
        .curve(d3.curveMonotoneX);

      const cumLineGen = d3.line<AnomalyDataPoint>()
        .x((d, i) => xScale(i))
        .y(d => yScaleRight(d.cumulativeAnomalies))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(chartData)
        .attr('fill', 'url(#d3-anomaly-area-gradient)')
        .attr('d', cumAreaGen);

      g.append('path')
        .datum(chartData)
        .attr('fill', 'none')
        .attr('stroke', '#7C3AED')
        .attr('stroke-width', 3)
        .attr('d', cumLineGen);
    }

    // 2. Interactive Crosshair & Tooltip Overlay Base
    const crosshair = g.append('line')
      .attr('class', 'crosshair pointer-events-none')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#7C3AED')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 3')
      .attr('opacity', 0);

    const overlay = g.append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair');

    // Tooltip display logic shared between timeline hover and circle hover
    const showTooltipForPoint = (point: AnomalyDataPoint, posX: number) => {
      crosshair
        .attr('x1', posX)
        .attr('x2', posX)
        .attr('opacity', 0.85);

      setSelectedPoint(point);

      if (tooltipRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (svgRect) {
          const leftOffset = margin.left + posX + (svgRect.left - containerRect.left);
          const tooltipWidth = 270;
          const finalLeft = leftOffset + tooltipWidth > containerRect.width 
            ? leftOffset - tooltipWidth - 15 
            : leftOffset + 15;

          tooltipRef.current.style.left = `${Math.max(10, finalLeft)}px`;
          tooltipRef.current.style.top = `${margin.top + 8}px`;
          tooltipRef.current.style.opacity = '1';
        }
      }
    };

    const hideTooltip = () => {
      crosshair.attr('opacity', 0);
      if (tooltipRef.current) {
        tooltipRef.current.style.opacity = '0';
      }
    };

    overlay
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const ratio = mx / innerWidth;
        const index = Math.min(chartData.length - 1, Math.max(0, Math.round(ratio * (chartData.length - 1))));
        const point = chartData[index];
        if (!point) return;

        const posX = xScale(index);
        showTooltipForPoint(point, posX);
      })
      .on('mouseleave', hideTooltip)
      .on('click', () => {
        if (selectedPoint?.rawAudit && onSelectAudit) {
          onSelectAudit(selectedPoint.rawAudit);
        }
      });

    // 3. Render Scatter Data Dots with Color Coding & Direct Hover Interaction
    const dotsGroup = g.append('g').attr('class', 'anomaly-dots pointer-events-auto');

    chartData.forEach((d, i) => {
      const cx = xScale(i);
      const cy = metricMode === 'cumulative'
        ? yScaleRight(d.cumulativeAnomalies)
        : yScaleLeft(d.findingsCount);

      const isHighOrCritical = d.riskLevel === 'High' || d.riskLevel === 'Critical';
      const color = d.riskLevel === 'Critical' 
        ? '#DC2626' 
        : d.riskLevel === 'High' 
        ? '#EA580C' 
        : d.riskLevel === 'Moderate' 
        ? '#F59E0B' 
        : '#10B981';

      // Pulse ring for Critical/High findings
      if (isHighOrCritical && d.findingsCount > 0) {
        dotsGroup.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 8)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.5)
          .attr('class', 'animate-ping pointer-events-none')
          .style('transform-origin', `${cx}px ${cy}px`);
      }

      // Main dot
      const circle = dotsGroup.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', isHighOrCritical ? 6 : 4.5)
        .attr('fill', color)
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 2)
        .attr('cursor', 'pointer')
        .attr('filter', isHighOrCritical ? 'url(#d3-glow)' : null);

      circle
        .on('mouseenter', () => {
          circle.transition().duration(150).attr('r', 9);
          showTooltipForPoint(d, cx);
        })
        .on('mouseleave', () => {
          circle.transition().duration(150).attr('r', isHighOrCritical ? 6 : 4.5);
        })
        .on('click', (e) => {
          e.stopPropagation();
          if (d.rawAudit && onSelectAudit) {
            onSelectAudit(d.rawAudit);
          }
        });
    });

    // 4. Axes
    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(chartData.length, Math.floor(innerWidth / 80)))
      .tickFormat((d) => {
        const item = chartData[Math.round(d as number)];
        if (!item) return '';
        const dObj = item.date;
        return `${dObj.getMonth() + 1}/${dObj.getDate()}`;
      });

    const xAxisGroup = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#CBD5E1');
    xAxisGroup.selectAll('text')
      .attr('fill', '#64748B')
      .attr('font-size', '10px')
      .attr('font-weight', '600');
    xAxisGroup.selectAll('line').attr('stroke', '#CBD5E1');

    // Left Y Axis (Anomalies)
    const yAxisLeft = d3.axisLeft(yScaleLeft)
      .ticks(5)
      .tickFormat(d => `${d}`);

    const yAxisGroup = g.append('g').call(yAxisLeft);
    yAxisGroup.select('.domain').remove();
    yAxisGroup.selectAll('text')
      .attr('fill', '#7C3AED')
      .attr('font-size', '10px')
      .attr('font-weight', '700');
    yAxisGroup.selectAll('line').remove();

    // Left Axis Title Label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -36)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#7C3AED')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('letter-spacing', '0.05em')
      .text(metricMode === 'cumulative' ? 'CUMULATIVE ANOMALIES' : 'ANOMALIES COUNT');

    // Right Y Axis (Risk Score)
    if (metricMode === 'anomalies_and_risk') {
      const yAxisRight = d3.axisRight(yScaleRight)
        .ticks(5)
        .tickFormat(d => `${d}`);

      const yRightGroup = g.append('g')
        .attr('transform', `translate(${innerWidth},0)`)
        .call(yAxisRight);

      yRightGroup.select('.domain').remove();
      yRightGroup.selectAll('text')
        .attr('fill', '#EA580C')
        .attr('font-size', '10px')
        .attr('font-weight', '700');
      yRightGroup.selectAll('line').remove();

      g.append('text')
        .attr('transform', 'rotate(90)')
        .attr('y', -innerWidth - 36)
        .attr('x', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#EA580C')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('letter-spacing', '0.05em')
        .text('RISK SCORE (/100)');
    }

  }, [chartData, chartWidth, metricMode]);

  // Export Chart as SVG or PNG
  const handleExportChart = (format: 'svg' | 'png') => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);

    if (format === 'svg') {
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Audit_Anomaly_Trend_${Date.now()}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const img = new Image();
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = svgEl.clientWidth * 2 || 1600;
        canvas.height = svgEl.clientHeight * 2 || 700;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pngUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `Audit_Anomaly_Trend_${Date.now()}.png`;
          link.click();
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  // High-level aggregate anomaly metrics
  const totalAnomalies = useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.findingsCount, 0);
  }, [chartData]);

  const avgAnomaliesPerDoc = useMemo(() => {
    if (chartData.length === 0) return 0;
    return (totalAnomalies / chartData.length).toFixed(1);
  }, [totalAnomalies, chartData]);

  const highSeverityCount = useMemo(() => {
    return chartData.filter(d => d.riskLevel === 'High' || d.riskLevel === 'Critical').length;
  }, [chartData]);

  const peakAnomalyPoint = useMemo(() => {
    if (chartData.length === 0) return null;
    return [...chartData].sort((a, b) => b.findingsCount - a.findingsCount)[0];
  }, [chartData]);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E2E8F0] shadow-sm space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-200 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              D3.js Forensic Engine
            </span>
            <span className="text-xs text-slate-400 font-medium">
              SAS 99 / AU-C 240 / FRE 902 Chronological Stream
            </span>
          </div>
          <h3 className="font-extrabold text-[#1E293B] text-xl mt-1.5 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#7C3AED]" />
            Detected Anomaly & Forensic Risk Trajectory
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 max-w-2xl">
            Interactive D3 visualization mapping itemized accounting discrepancies, wire diversion patterns, and mathematical anomalies over time.
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold text-slate-600">
            <button
              onClick={() => setMetricMode('anomalies_and_risk')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                metricMode === 'anomalies_and_risk' 
                  ? 'bg-white text-[#7C3AED] shadow-xs' 
                  : 'hover:text-slate-900'
              }`}
            >
              Anomalies & Risk
            </button>
            <button
              onClick={() => setMetricMode('severity_breakdown')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                metricMode === 'severity_breakdown' 
                  ? 'bg-white text-[#7C3AED] shadow-xs' 
                  : 'hover:text-slate-900'
              }`}
            >
              Severity Breakdown
            </button>
            <button
              onClick={() => setMetricMode('cumulative')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                metricMode === 'cumulative' 
                  ? 'bg-white text-[#7C3AED] shadow-xs' 
                  : 'hover:text-slate-900'
              }`}
            >
              Cumulative Trend
            </button>
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value as TimeFilterRange)}
              className="bg-transparent outline-none cursor-pointer text-xs font-bold text-[#1E293B]"
            >
              <option value="all">All Audits ({chartData.length})</option>
              <option value="30d">Last 30 Days</option>
              <option value="14d">Last 14 Days</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>

          {/* Export Dropdown */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExportChart('png')}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-[#7C3AED] text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
              title="Export as PNG for reports"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG</span>
            </button>
            <button
              onClick={() => handleExportChart('svg')}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-[#7C3AED] text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
              title="Export vector SVG"
            >
              <span>SVG</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Total Anomalies</span>
          <div className="text-xl sm:text-2xl font-black text-purple-950 mt-1">{totalAnomalies}</div>
          <span className="text-[10px] text-purple-600 font-medium mt-0.5">Identified across pipeline</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Avg per Document</span>
          <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1">{avgAnomaliesPerDoc}</div>
          <span className="text-[10px] text-amber-600 font-medium mt-0.5">Expected anomaly density</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">High / Critical Flags</span>
          <div className="text-xl sm:text-2xl font-black text-rose-950 mt-1">{highSeverityCount}</div>
          <span className="text-[10px] text-rose-600 font-medium mt-0.5">Requiring formal review</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Peak Anomaly Volume</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {peakAnomalyPoint ? `${peakAnomalyPoint.findingsCount} findings` : '0'}
          </div>
          <span className="text-[10px] text-slate-500 font-medium truncate mt-0.5" title={peakAnomalyPoint?.documentName}>
            {peakAnomalyPoint ? peakAnomalyPoint.documentName : 'Baseline clean'}
          </span>
        </div>
      </div>

      {/* D3 Canvas Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden bg-white pt-2">
        <svg ref={svgRef} className="w-full overflow-visible select-none" />

        {/* Rich Interactive D3 Tooltip */}
        <div
          ref={tooltipRef}
          className="absolute z-30 pointer-events-none transition-opacity duration-150 opacity-0 bg-[#0F172A] text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 w-72 max-w-[90vw] text-xs backdrop-blur-md"
          style={{ transform: 'translateY(-15%)' }}
        >
          {selectedPoint && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 gap-2">
                <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[10px]">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-bold text-slate-200">Date: {selectedPoint.timeLabel}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedPoint.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  selectedPoint.riskLevel === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                  selectedPoint.riskLevel === 'Moderate' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {selectedPoint.riskLevel} ({selectedPoint.riskScore}/100)
                </span>
              </div>

              <div>
                <p className="font-extrabold text-white text-xs truncate" title={selectedPoint.documentName}>
                  {selectedPoint.documentName}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">{selectedPoint.documentType}</p>
              </div>

              {/* Specific Anomaly Count Highlight */}
              <div className="bg-purple-950/80 border border-purple-500/30 p-2.5 rounded-xl flex items-center justify-between">
                <span className="text-[11px] text-purple-200 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Specific Anomaly Count:
                </span>
                <span className="font-black text-white text-xs sm:text-sm bg-[#7C3AED] px-2.5 py-0.5 rounded-lg shadow-xs">
                  {selectedPoint.findingsCount} {selectedPoint.findingsCount === 1 ? 'anomaly' : 'anomalies'}
                </span>
              </div>

              {selectedPoint.findings.length > 0 && (
                <div className="space-y-1 pt-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Top Detected Flags:</span>
                  {selectedPoint.findings.slice(0, 2).map((f, fIdx) => (
                    <div key={fIdx} className="text-[10px] text-slate-300 truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      <span className="truncate">{f.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {onSelectAudit && selectedPoint.rawAudit && (
                <div className="pt-1.5 text-center border-t border-slate-800 text-[10px] text-purple-400 font-semibold flex items-center justify-center gap-1">
                  <span>Click data point to inspect full audit</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legend & Guidance Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-[#64748B]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-3 h-3 rounded-full bg-[#7C3AED]" />
            <span>Detected Anomalies Volume</span>
          </div>

          {metricMode === 'anomalies_and_risk' && (
            <div className="flex items-center gap-2 font-medium">
              <span className="w-4 h-0.5 bg-[#EA580C] border-t-2 border-dashed border-[#EA580C]" />
              <span>Risk Score Curve (0-100)</span>
            </div>
          )}

          {metricMode === 'severity_breakdown' && (
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Critical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Moderate
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-red-600 font-bold">
            <span className="w-3.5 h-0.5 bg-red-500 border-t border-dashed border-red-500" />
            <span>SAS 99 Critical Boundary</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span>Hover data points to inspect audit metadata or click to open deep forensic scan.</span>
        </div>
      </div>

    </div>
  );
}

export default D3AnomalyTrendChart;
