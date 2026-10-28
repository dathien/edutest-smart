import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair } from 'lucide-react';

export interface CurveDefinition {
  id: string;
  fn: (x: number) => number;
  color: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  label?: string;
  domain?: [number, number];
}

export interface Point2D {
  id: string;
  x: number;
  y: number;
  label: string;
  color?: string;
  radius?: number;
  draggable?: boolean;
  onDrag?: (x: number, y: number) => void;
}

export interface RegionPolygon {
  id: string;
  points: [number, number][]; // in math coordinates
  color: string;
  fillOpacity?: number;
  label?: string;
}

export interface InequalityHalfPlane {
  id: string;
  a: number; // ax + by <= c or >= c
  b: number;
  c: number;
  op: '<=' | '>=' | '<' | '>';
  color: string;
  fillOpacity?: number;
}

export interface Graph2DEngineProps {
  curves?: CurveDefinition[];
  points?: Point2D[];
  polygons?: RegionPolygon[];
  halfPlanes?: InequalityHalfPlane[];
  tangentLine?: {
    x0: number;
    y0: number;
    slope: number;
    color?: string;
    label?: string;
  };
  initialXRange?: [number, number];
  initialYRange?: [number, number];
  height?: number | string;
  showGrid?: boolean;
  showAxes?: boolean;
  gridStep?: number;
  onPointClick?: (x: number, y: number) => void;
}

export const Graph2DEngine: React.FC<Graph2DEngineProps> = ({
  curves = [],
  points = [],
  polygons = [],
  halfPlanes = [],
  tangentLine,
  initialXRange = [-8, 8],
  initialYRange = [-6, 6],
  height = 460,
  showGrid = true,
  showAxes = true,
  gridStep = 1,
  onPointClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 460 });

  // Math viewport bounds
  const [xMin, setXMin] = useState(initialXRange[0]);
  const [xMax, setXMax] = useState(initialXRange[1]);
  const [yMin, setYMin] = useState(initialYRange[0]);
  const [yMax, setYMax] = useState(initialYRange[1]);

  // Dragging state for canvas pan
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; xMin: number; xMax: number; yMin: number; yMax: number } | null>(null);

  // Active dragging math point
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth || 700;
        const h = typeof height === 'number' ? height : containerRef.current.clientHeight || 460;
        setDimensions({ width: w, height: h });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  // Coordinate transformations
  const toSvgX = useCallback(
    (x: number) => {
      return ((x - xMin) / (xMax - xMin)) * dimensions.width;
    },
    [xMin, xMax, dimensions.width]
  );

  const toSvgY = useCallback(
    (y: number) => {
      return dimensions.height - ((y - yMin) / (yMax - yMin)) * dimensions.height;
    },
    [yMin, yMax, dimensions.height]
  );

  const toMathX = useCallback(
    (svgX: number) => {
      return xMin + (svgX / dimensions.width) * (xMax - xMin);
    },
    [xMin, xMax, dimensions.width]
  );

  const toMathY = useCallback(
    (svgY: number) => {
      return yMax - (svgY / dimensions.height) * (yMax - yMin);
    },
    [yMin, yMax, dimensions.height]
  );

  // Reset View
  const handleResetView = () => {
    setXMin(initialXRange[0]);
    setXMax(initialXRange[1]);
    setYMin(initialYRange[0]);
    setYMax(initialYRange[1]);
  };

  // Zoom
  const handleZoom = (factor: number) => {
    const xMid = (xMin + xMax) / 2;
    const yMid = (yMin + yMax) / 2;
    const xHalf = ((xMax - xMin) * factor) / 2;
    const yHalf = ((yMax - yMin) * factor) / 2;
    setXMin(xMid - xHalf);
    setXMax(xMid + xHalf);
    setYMin(yMid - yHalf);
    setYMax(yMid + yHalf);
  };

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (draggingPointId) return;
    setIsPanning(true);
    panStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      xMin,
      xMax,
      yMin,
      yMax,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. If dragging a math point
    if (draggingPointId) {
      const pt = points.find((p) => p.id === draggingPointId);
      if (pt && pt.onDrag && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const svgX = e.clientX - rect.left;
        const svgY = e.clientY - rect.top;
        const mathX = Math.round(toMathX(svgX) * 10) / 10;
        const mathY = Math.round(toMathY(svgY) * 10) / 10;
        pt.onDrag(mathX, mathY);
      }
      return;
    }

    // 2. If panning
    if (isPanning && panStartRef.current) {
      const dxPx = e.clientX - panStartRef.current.clientX;
      const dyPx = e.clientY - panStartRef.current.clientY;
      const xRange = panStartRef.current.xMax - panStartRef.current.xMin;
      const yRange = panStartRef.current.yMax - panStartRef.current.yMin;

      const dxMath = (dxPx / dimensions.width) * xRange;
      const dyMath = (dyPx / dimensions.height) * yRange;

      setXMin(panStartRef.current.xMin - dxMath);
      setXMax(panStartRef.current.xMax - dxMath);
      setYMin(panStartRef.current.yMin + dyMath);
      setYMax(panStartRef.current.yMax + dyMath);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingPointId(null);
    panStartRef.current = null;
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 0.9 : 1.1;
    handleZoom(factor);
  };

  // Generate grid ticks
  const { xTicks, yTicks } = useMemo(() => {
    const xT: number[] = [];
    const yT: number[] = [];

    const effectiveGridStep = (xMax - xMin > 25) ? gridStep * 2 : (xMax - xMin < 6) ? gridStep * 0.5 : gridStep;

    const startX = Math.floor(xMin / effectiveGridStep) * effectiveGridStep;
    for (let x = startX; x <= xMax; x += effectiveGridStep) {
      if (Math.abs(x) < 0.0001) x = 0;
      xT.push(Math.round(x * 100) / 100);
    }

    const startY = Math.floor(yMin / effectiveGridStep) * effectiveGridStep;
    for (let y = startY; y <= yMax; y += effectiveGridStep) {
      if (Math.abs(y) < 0.0001) y = 0;
      yT.push(Math.round(y * 100) / 100);
    }

    return { xTicks: xT, yTicks: yT };
  }, [xMin, xMax, yMin, yMax, gridStep]);

  // Compute curve paths
  const curvePaths = useMemo(() => {
    const samples = 350;
    const dx = (xMax - xMin) / samples;

    return curves.map((curve) => {
      const dParts: string[] = [];
      let isDrawing = false;
      const [startDom, endDom] = curve.domain || [xMin, xMax];

      for (let i = 0; i <= samples; i++) {
        const x = xMin + i * dx;
        if (x < startDom || x > endDom) {
          isDrawing = false;
          continue;
        }

        try {
          const y = curve.fn(x);
          if (isNaN(y) || !isFinite(y) || Math.abs(y) > 1000) {
            isDrawing = false;
            continue;
          }

          const sx = toSvgX(x);
          const sy = toSvgY(y);

          // Clamped drawing window with padding
          if (sy < -200 || sy > dimensions.height + 200) {
            isDrawing = false;
            continue;
          }

          if (!isDrawing) {
            dParts.push(`M ${sx.toFixed(1)} ${sy.toFixed(1)}`);
            isDrawing = true;
          } else {
            dParts.push(`L ${sx.toFixed(1)} ${sy.toFixed(1)}`);
          }
        } catch {
          isDrawing = false;
        }
      }

      return {
        ...curve,
        pathData: dParts.join(' '),
      };
    });
  }, [curves, xMin, xMax, dimensions.height, toSvgX, toSvgY]);

  // Compute tangent line segment across viewport
  const tangentPath = useMemo(() => {
    if (!tangentLine) return null;
    const { x0, y0, slope, color = '#f59e0b', label } = tangentLine;

    // Line eq: y = slope * (x - x0) + y0
    const xLeft = xMin;
    const yLeft = slope * (xLeft - x0) + y0;
    const xRight = xMax;
    const yRight = slope * (xRight - x0) + y0;

    return {
      x1: toSvgX(xLeft),
      y1: toSvgY(yLeft),
      x2: toSvgX(xRight),
      y2: toSvgY(yRight),
      color,
      label,
    };
  }, [tangentLine, xMin, xMax, toSvgX, toSvgY]);

  // SVG Origin (0, 0)
  const originSvgX = toSvgX(0);
  const originSvgY = toSvgY(0);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden select-none"
      style={{ height }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Interactive Controls Overlay */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-200/80 shadow-sm">
        <button
          type="button"
          onClick={() => handleZoom(0.8)}
          title="Phóng to"
          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(1.25)}
          title="Thu nhỏ"
          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          title="Đặt lại khung nhìn"
          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Viewport Range Badge */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/85 backdrop-blur-sm text-[11px] font-mono text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-xs pointer-events-none">
        x: [{xMin.toFixed(1)}, {xMax.toFixed(1)}] | y: [{yMin.toFixed(1)}, {yMax.toFixed(1)}]
      </div>

      {/* SVG Canvas */}
      <svg
        className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onClick={(e) => {
          if (onPointClick && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const mathX = Math.round(toMathX(e.clientX - rect.left) * 10) / 10;
            const mathY = Math.round(toMathY(e.clientY - rect.top) * 10) / 10;
            onPointClick(mathX, mathY);
          }
        }}
      >
        <defs>
          <marker
            id="arrowhead-x"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 Z" fill="#64748b" />
          </marker>
          <marker
            id="arrowhead-y"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M 0 8 L 4 0 L 8 8 Z" fill="#64748b" />
          </marker>
        </defs>

        {/* 1. Grid Lines */}
        {showGrid && (
          <g className="grid-lines" stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="3 3">
            {xTicks.map((x) => {
              const sx = toSvgX(x);
              return <line key={`gx-${x}`} x1={sx} y1={0} x2={sx} y2={dimensions.height} />;
            })}
            {yTicks.map((y) => {
              const sy = toSvgY(y);
              return <line key={`gy-${y}`} x1={0} y1={sy} x2={dimensions.width} y2={sy} />;
            })}
          </g>
        )}

        {/* 2. Shaded Polygon Regions (Inequalities) */}
        {polygons.map((poly) => {
          if (poly.points.length < 3) return null;
          const svgPts = poly.points.map(([px, py]) => `${toSvgX(px)},${toSvgY(py)}`).join(' ');
          return (
            <polygon
              key={poly.id}
              points={svgPts}
              fill={poly.color}
              fillOpacity={poly.fillOpacity ?? 0.25}
              stroke={poly.color}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          );
        })}

        {/* 3. Coordinate Axes */}
        {showAxes && (
          <g className="axes">
            {/* Ox Axis */}
            {originSvgY >= 0 && originSvgY <= dimensions.height && (
              <>
                <line
                  x1={0}
                  y1={originSvgY}
                  x2={dimensions.width}
                  y2={originSvgY}
                  stroke="#475569"
                  strokeWidth="1.6"
                />
                <polygon
                  points={`${dimensions.width},${originSvgY} ${dimensions.width - 9},${originSvgY - 4.5} ${dimensions.width - 9},${originSvgY + 4.5}`}
                  fill="#475569"
                />
                <text
                  x={dimensions.width - 16}
                  y={originSvgY - 8}
                  fill="#1e293b"
                  fontSize="13"
                  fontWeight="bold"
                  fontStyle="italic"
                >
                  x
                </text>
              </>
            )}

            {/* Oy Axis */}
            {originSvgX >= 0 && originSvgX <= dimensions.width && (
              <>
                <line
                  x1={originSvgX}
                  y1={dimensions.height}
                  x2={originSvgX}
                  y2={0}
                  stroke="#475569"
                  strokeWidth="1.6"
                />
                <polygon
                  points={`${originSvgX},0 ${originSvgX - 4.5},9 ${originSvgX + 4.5},9`}
                  fill="#475569"
                />
                <text
                  x={originSvgX + 8}
                  y={18}
                  fill="#1e293b"
                  fontSize="13"
                  fontWeight="bold"
                  fontStyle="italic"
                >
                  y
                </text>
              </>
            )}

            {/* Origin Label O */}
            {originSvgX >= 0 &&
              originSvgX <= dimensions.width &&
              originSvgY >= 0 &&
              originSvgY <= dimensions.height && (
                <text
                  x={originSvgX - 14}
                  y={originSvgY + 16}
                  fill="#64748b"
                  fontSize="12"
                  fontStyle="italic"
                  fontWeight="bold"
                >
                  O
                </text>
              )}

            {/* Axis Tick Numbers */}
            {xTicks.map((x) => {
              if (x === 0) return null;
              const sx = toSvgX(x);
              const sy = Math.max(16, Math.min(dimensions.height - 10, originSvgY));
              return (
                <g key={`lbl-x-${x}`}>
                  <line x1={sx} y1={sy - 3} x2={sx} y2={sy + 3} stroke="#475569" strokeWidth="1" />
                  <text
                    x={sx}
                    y={sy + 15}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    {x}
                  </text>
                </g>
              );
            })}

            {yTicks.map((y) => {
              if (y === 0) return null;
              const sy = toSvgY(y);
              const sx = Math.max(20, Math.min(dimensions.width - 20, originSvgX));
              return (
                <g key={`lbl-y-${y}`}>
                  <line x1={sx - 3} y1={sy} x2={sx + 3} y2={sy} stroke="#475569" strokeWidth="1" />
                  <text
                    x={sx - 8}
                    y={sy + 4}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    {y}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* 4. Function Curves */}
        {curvePaths.map((cp) => (
          <path
            key={cp.id}
            d={cp.pathData}
            fill="none"
            stroke={cp.color}
            strokeWidth={cp.strokeWidth ?? 2.8}
            strokeDasharray={cp.strokeDasharray}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* 5. Dynamic Tangent Line */}
        {tangentPath && (
          <g className="tangent-line">
            <line
              x1={tangentPath.x1}
              y1={tangentPath.y1}
              x2={tangentPath.x2}
              y2={tangentPath.y2}
              stroke={tangentPath.color}
              strokeWidth="2.2"
              strokeDasharray="5 3"
            />
            {tangentPath.label && (
              <text
                x={toSvgX(tangentLine?.x0 ?? 0) + 12}
                y={toSvgY(tangentLine?.y0 ?? 0) - 12}
                fill={tangentPath.color}
                fontSize="12"
                fontWeight="600"
                className="bg-white/90"
              >
                {tangentPath.label}
              </text>
            )}
          </g>
        )}

        {/* 6. Points and Draggable Handles */}
        {points.map((pt) => {
          const sx = toSvgX(pt.x);
          const sy = toSvgY(pt.y);
          const r = pt.radius ?? 5.5;
          const color = pt.color ?? '#4f46e5';

          return (
            <g
              key={pt.id}
              className={pt.draggable ? 'cursor-grab active:cursor-grabbing' : ''}
              onMouseDown={(e) => {
                if (pt.draggable) {
                  e.stopPropagation();
                  setDraggingPointId(pt.id);
                }
              }}
            >
              {/* Outer glow for draggable point */}
              {pt.draggable && (
                <circle
                  cx={sx}
                  cy={sy}
                  r={r + 6}
                  fill={color}
                  fillOpacity="0.2"
                  className="animate-pulse"
                />
              )}
              {/* Main Point Circle */}
              <circle
                cx={sx}
                cy={sy}
                r={r}
                fill={color}
                stroke="#ffffff"
                strokeWidth="2"
              />
              {/* Point Label & Coordinates */}
              <text
                x={sx + 8}
                y={sy - 8}
                fill="#0f172a"
                fontSize="12"
                fontWeight="bold"
                filter="drop-shadow(0px 1px 2px rgba(255,255,255,0.9))"
              >
                {pt.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
