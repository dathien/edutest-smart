import React, { useState, useRef } from 'react';
import {
  MousePointer,
  Circle,
  Square,
  Slash,
  ArrowRight,
  Move,
  Trash2,
  Save,
  Plus,
  RefreshCw,
  Eye,
  Check,
  X,
  Sparkles,
  Layers,
} from 'lucide-react';
import { playSound } from '../../services/sound';

export interface GeoPoint {
  id: string;
  x: number;
  y: number;
  label: string;
  labelOffset?: { dx: number; dy: number };
}

export interface GeoSegment {
  id: string;
  p1Id: string;
  p2Id: string;
  isDashed: boolean;
  hasParallelMark?: boolean;
}

export interface GeoCircle {
  id: string;
  centerId: string;
  radius: number;
}

export interface GeoVector {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
}

export interface GeoRightAngle {
  id: string;
  vertexId: string;
  p1Id: string;
  p2Id: string;
}

export interface GeometryData {
  points: GeoPoint[];
  segments: GeoSegment[];
  circles: GeoCircle[];
  vectors: GeoVector[];
  rightAngles: GeoRightAngle[];
  title?: string;
}

interface InteractiveGeometryDrawerProps {
  initialData?: string;
  onSave: (dataJson: string) => void;
  onClose?: () => void;
}

export const InteractiveGeometryDrawer: React.FC<InteractiveGeometryDrawerProps> = ({
  initialData,
  onSave,
  onClose,
}) => {
  // Parse initial data or setup standard default
  const [geoData, setGeoData] = useState<GeometryData>(() => {
    if (initialData && initialData.startsWith('{')) {
      try {
        const parsed = JSON.parse(initialData);
        if (parsed.points && parsed.segments) return parsed;
      } catch {}
    }
    // Default: Pyramid S.ABCD with hidden lines
    return {
      points: [
        { id: 'S', x: 200, y: 50, label: 'S', labelOffset: { dx: 0, dy: -14 } },
        { id: 'A', x: 100, y: 220, label: 'A', labelOffset: { dx: -14, dy: 6 } },
        { id: 'B', x: 260, y: 260, label: 'B', labelOffset: { dx: 4, dy: 14 } },
        { id: 'C', x: 340, y: 210, label: 'C', labelOffset: { dx: 14, dy: 4 } },
        { id: 'D', x: 180, y: 170, label: 'D', labelOffset: { dx: -14, dy: -10 } },
      ],
      segments: [
        { id: 'seg-1', p1Id: 'S', p2Id: 'A', isDashed: false },
        { id: 'seg-2', p1Id: 'S', p2Id: 'B', isDashed: false },
        { id: 'seg-3', p1Id: 'S', p2Id: 'C', isDashed: false },
        { id: 'seg-4', p1Id: 'A', p2Id: 'B', isDashed: false },
        { id: 'seg-5', p1Id: 'B', p2Id: 'C', isDashed: false },
        { id: 'seg-6', p1Id: 'S', p2Id: 'D', isDashed: true },
        { id: 'seg-7', p1Id: 'A', p2Id: 'D', isDashed: true },
        { id: 'seg-8', p1Id: 'C', p2Id: 'D', isDashed: true },
      ],
      circles: [],
      vectors: [],
      rightAngles: [{ id: 'ra-1', vertexId: 'A', p1Id: 'S', p2Id: 'B' }],
      title: 'Hình chóp tứ giác S.ABCD',
    };
  });

  // Tools: 'select' | 'add_point' | 'add_segment' | 'add_dashed' | 'add_circle' | 'add_vector' | 'right_angle'
  const [activeTool, setActiveTool] = useState<
    'select' | 'add_point' | 'add_segment' | 'add_dashed' | 'add_circle' | 'add_vector' | 'right_angle'
  >('select');

  // Selected points for building segments/angles
  const [selectedPointIds, setSelectedPointIds] = useState<string[]>([]);
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null);

  // SVG Canvas Click
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool !== 'add_point') return;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - svgRect.left);
    const y = Math.round(e.clientY - svgRect.top);

    // Auto-label: A, B, C, D, E, F...
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const usedLabels = new Set(geoData.points.map((p) => p.label));
    let nextLabel = 'A';
    for (let i = 0; i < letters.length; i++) {
      if (!usedLabels.has(letters[i])) {
        nextLabel = letters[i];
        break;
      }
    }

    const newPoint: GeoPoint = {
      id: `pt-${Date.now()}`,
      x,
      y,
      label: nextLabel,
      labelOffset: { dx: 10, dy: -10 },
    };

    setGeoData((prev) => ({
      ...prev,
      points: [...prev.points, newPoint],
    }));
    playSound('click');
  };

  // Click on Point
  const handlePointClick = (pId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');

    if (activeTool === 'select') {
      setSelectedPointIds([pId]);
      return;
    }

    if (activeTool === 'add_segment' || activeTool === 'add_dashed' || activeTool === 'add_vector') {
      if (selectedPointIds.length === 0) {
        setSelectedPointIds([pId]);
      } else {
        const p1 = selectedPointIds[0];
        const p2 = pId;
        if (p1 !== p2) {
          if (activeTool === 'add_vector') {
            const newVec: GeoVector = {
              id: `vec-${Date.now()}`,
              fromId: p1,
              toId: p2,
            };
            setGeoData((prev) => ({ ...prev, vectors: [...prev.vectors, newVec] }));
          } else {
            const newSeg: GeoSegment = {
              id: `seg-${Date.now()}`,
              p1Id: p1,
              p2Id: p2,
              isDashed: activeTool === 'add_dashed',
            };
            setGeoData((prev) => ({ ...prev, segments: [...prev.segments, newSeg] }));
          }
        }
        setSelectedPointIds([]);
      }
      return;
    }

    if (activeTool === 'right_angle') {
      const next = [...selectedPointIds, pId];
      if (next.length === 3) {
        const newRa: GeoRightAngle = {
          id: `ra-${Date.now()}`,
          p1Id: next[0],
          vertexId: next[1],
          p2Id: next[2],
        };
        setGeoData((prev) => ({ ...prev, rightAngles: [...prev.rightAngles, newRa] }));
        setSelectedPointIds([]);
      } else {
        setSelectedPointIds(next);
      }
    }
  };

  // Dragging Points
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedPointId) return;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - svgRect.left);
    const y = Math.round(e.clientY - svgRect.top);

    setGeoData((prev) => ({
      ...prev,
      points: prev.points.map((p) => (p.id === draggedPointId ? { ...p, x, y } : p)),
    }));
  };

  const handleSvgMouseUp = () => {
    setDraggedPointId(null);
  };

  // Presets
  const applyPreset = (presetName: string) => {
    playSound('click');
    if (presetName === 'pyramid_quad') {
      setGeoData({
        points: [
          { id: 'S', x: 200, y: 50, label: 'S', labelOffset: { dx: 0, dy: -14 } },
          { id: 'A', x: 100, y: 220, label: 'A', labelOffset: { dx: -14, dy: 6 } },
          { id: 'B', x: 260, y: 260, label: 'B', labelOffset: { dx: 4, dy: 14 } },
          { id: 'C', x: 340, y: 210, label: 'C', labelOffset: { dx: 14, dy: 4 } },
          { id: 'D', x: 180, y: 170, label: 'D', labelOffset: { dx: -14, dy: -10 } },
        ],
        segments: [
          { id: 'seg-1', p1Id: 'S', p2Id: 'A', isDashed: false },
          { id: 'seg-2', p1Id: 'S', p2Id: 'B', isDashed: false },
          { id: 'seg-3', p1Id: 'S', p2Id: 'C', isDashed: false },
          { id: 'seg-4', p1Id: 'A', p2Id: 'B', isDashed: false },
          { id: 'seg-5', p1Id: 'B', p2Id: 'C', isDashed: false },
          { id: 'seg-6', p1Id: 'S', p2Id: 'D', isDashed: true },
          { id: 'seg-7', p1Id: 'A', p2Id: 'D', isDashed: true },
          { id: 'seg-8', p1Id: 'C', p2Id: 'D', isDashed: true },
        ],
        circles: [],
        vectors: [],
        rightAngles: [{ id: 'ra-1', vertexId: 'A', p1Id: 'S', p2Id: 'B' }],
        title: 'Hình chóp tứ giác S.ABCD',
      });
    } else if (presetName === 'tetrahedron') {
      setGeoData({
        points: [
          { id: 'S', x: 200, y: 60, label: 'S', labelOffset: { dx: 0, dy: -14 } },
          { id: 'A', x: 100, y: 240, label: 'A', labelOffset: { dx: -14, dy: 6 } },
          { id: 'B', x: 220, y: 270, label: 'B', labelOffset: { dx: 4, dy: 14 } },
          { id: 'C', x: 330, y: 230, label: 'C', labelOffset: { dx: 14, dy: 4 } },
        ],
        segments: [
          { id: 'seg-1', p1Id: 'S', p2Id: 'A', isDashed: false },
          { id: 'seg-2', p1Id: 'S', p2Id: 'B', isDashed: false },
          { id: 'seg-3', p1Id: 'S', p2Id: 'C', isDashed: false },
          { id: 'seg-4', p1Id: 'A', p2Id: 'B', isDashed: false },
          { id: 'seg-5', p1Id: 'B', p2Id: 'C', isDashed: false },
          { id: 'seg-6', p1Id: 'A', p2Id: 'C', isDashed: true },
        ],
        circles: [],
        vectors: [],
        rightAngles: [],
        title: 'Tứ diện đều S.ABC',
      });
    } else if (presetName === 'cube') {
      setGeoData({
        points: [
          { id: 'A', x: 120, y: 200, label: 'A', labelOffset: { dx: -14, dy: 4 } },
          { id: 'B', x: 240, y: 200, label: 'B', labelOffset: { dx: 14, dy: 4 } },
          { id: 'C', x: 300, y: 150, label: 'C', labelOffset: { dx: 14, dy: -4 } },
          { id: 'D', x: 180, y: 150, label: 'D', labelOffset: { dx: -14, dy: -4 } },
          { id: 'A1', x: 120, y: 90, label: "A'", labelOffset: { dx: -14, dy: -6 } },
          { id: 'B1', x: 240, y: 90, label: "B'", labelOffset: { dx: 14, dy: -6 } },
          { id: 'C1', x: 300, y: 40, label: "C'", labelOffset: { dx: 14, dy: -6 } },
          { id: 'D1', x: 180, y: 40, label: "D'", labelOffset: { dx: -14, dy: -6 } },
        ],
        segments: [
          { id: 's1', p1Id: 'A', p2Id: 'B', isDashed: false },
          { id: 's2', p1Id: 'B', p2Id: 'C', isDashed: false },
          { id: 's3', p1Id: 'A', p2Id: 'D', isDashed: true },
          { id: 's4', p1Id: 'C', p2Id: 'D', isDashed: true },
          { id: 's5', p1Id: 'A1', p2Id: 'B1', isDashed: false },
          { id: 's6', p1Id: 'B1', p2Id: 'C1', isDashed: false },
          { id: 's7', p1Id: 'C1', p2Id: 'D1', isDashed: false },
          { id: 's8', p1Id: 'D1', p2Id: 'A1', isDashed: false },
          { id: 's9', p1Id: 'A', p2Id: 'A1', isDashed: false },
          { id: 's10', p1Id: 'B', p2Id: 'B1', isDashed: false },
          { id: 's11', p1Id: 'C', p2Id: 'C1', isDashed: false },
          { id: 's12', p1Id: 'D', p2Id: 'D1', isDashed: true },
        ],
        circles: [],
        vectors: [],
        rightAngles: [],
        title: "Hình lập phương ABCD.A'B'C'D'",
      });
    } else if (presetName === 'oxyz') {
      setGeoData({
        points: [
          { id: 'O', x: 200, y: 190, label: 'O', labelOffset: { dx: -14, dy: 14 } },
          { id: 'X', x: 100, y: 260, label: 'x', labelOffset: { dx: -14, dy: 14 } },
          { id: 'Y', x: 340, y: 190, label: 'y', labelOffset: { dx: 14, dy: 4 } },
          { id: 'Z', x: 200, y: 40, label: 'z', labelOffset: { dx: -4, dy: -14 } },
        ],
        segments: [],
        circles: [],
        vectors: [
          { id: 'vx', fromId: 'O', toId: 'X', label: 'x' },
          { id: 'vy', fromId: 'O', toId: 'Y', label: 'y' },
          { id: 'vz', fromId: 'O', toId: 'Z', label: 'z' },
        ],
        rightAngles: [{ id: 'ra-xyz', vertexId: 'O', p1Id: 'Z', p2Id: 'Y' }],
        title: 'Hệ toạ độ không gian Oxyz',
      });
    }
  };

  const handleSaveDiagram = () => {
    playSound('correct');
    const jsonString = JSON.stringify(geoData);
    onSave(jsonString);
    if (onClose) onClose();
  };

  const getPoint = (id: string) => geoData.points.find((p) => p.id === id);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Công cụ vẽ hình học SGK Toán THPT (SVG)
            </h3>
            <p className="text-xs text-slate-500">
              Chỉnh sửa điểm, cạnh thấy/khuất, góc vuông, vectơ và lưu dữ liệu cấu trúc
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDiagram}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" /> Chèn hình vào câu hỏi
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Preset Toolbar & Action Mode */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
        {/* Presets */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-600 text-[11px] uppercase mr-1">Mẫu hình chuẩn:</span>
          <button
            type="button"
            onClick={() => applyPreset('pyramid_quad')}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 font-semibold cursor-pointer"
          >
            Chóp S.ABCD
          </button>
          <button
            type="button"
            onClick={() => applyPreset('tetrahedron')}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 font-semibold cursor-pointer"
          >
            Tứ diện S.ABC
          </button>
          <button
            type="button"
            onClick={() => applyPreset('cube')}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 font-semibold cursor-pointer"
          >
            Hình lập phương
          </button>
          <button
            type="button"
            onClick={() => applyPreset('oxyz')}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 font-semibold cursor-pointer"
          >
            Hệ trục Oxyz
          </button>
        </div>

        {/* Clear */}
        <button
          type="button"
          onClick={() => {
            if (confirm('Xoá toàn bộ hình và vẽ lại từ đầu?')) {
              setGeoData({ points: [], segments: [], circles: [], vectors: [], rightAngles: [] });
            }
          }}
          className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> Xoá toàn bộ
        </button>
      </div>

      {/* Tool Selection */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={() => {
            setActiveTool('select');
            setSelectedPointIds([]);
          }}
          className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 cursor-pointer ${
            activeTool === 'select'
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" /> Chọn / Kéo điểm
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTool('add_point');
            setSelectedPointIds([]);
          }}
          className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 cursor-pointer ${
            activeTool === 'add_point'
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> Thêm điểm
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTool('add_segment');
            setSelectedPointIds([]);
          }}
          className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 cursor-pointer ${
            activeTool === 'add_segment'
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Slash className="w-3.5 h-3.5" /> Đoạn thẳng (Nét liền)
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTool('add_dashed');
            setSelectedPointIds([]);
          }}
          className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 cursor-pointer ${
            activeTool === 'add_dashed'
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Slash className="w-3.5 h-3.5 stroke-dashed" /> Cạnh khuất (Nét đứt)
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTool('add_vector');
            setSelectedPointIds([]);
          }}
          className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 cursor-pointer ${
            activeTool === 'add_vector'
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ArrowRight className="w-3.5 h-3.5" /> Vectơ
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTool('right_angle');
            setSelectedPointIds([]);
          }}
          className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 cursor-pointer ${
            activeTool === 'right_angle'
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Square className="w-3.5 h-3.5" /> Đánh dấu góc vuông
        </button>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative border border-slate-300 rounded-xl bg-white overflow-hidden shadow-inner flex justify-center">
        <svg
          width={450}
          height={320}
          className="bg-white select-none cursor-crosshair"
          onClick={handleSvgClick}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
        >
          <defs>
            <marker
              id="geo-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#1e293b" />
            </marker>
          </defs>

          {/* Grid Background Lines for Guidance */}
          <g opacity={0.08}>
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`h-${i}`} x1={0} y1={i * 40} x2={450} y2={i * 40} stroke="#000" />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 40} y1={0} x2={i * 40} y2={320} stroke="#000" />
            ))}
          </g>

          {/* Segments */}
          {geoData.segments.map((seg) => {
            const p1 = getPoint(seg.p1Id);
            const p2 = getPoint(seg.p2Id);
            if (!p1 || !p2) return null;
            return (
              <line
                key={seg.id}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#1e293b"
                strokeWidth={2}
                strokeDasharray={seg.isDashed ? '5 5' : 'none'}
              />
            );
          })}

          {/* Vectors */}
          {geoData.vectors.map((vec) => {
            const p1 = getPoint(vec.fromId);
            const p2 = getPoint(vec.toId);
            if (!p1 || !p2) return null;
            return (
              <line
                key={vec.id}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#4338ca"
                strokeWidth={2.2}
                markerEnd="url(#geo-arrow)"
              />
            );
          })}

          {/* Right Angles */}
          {geoData.rightAngles.map((ra) => {
            const vertex = getPoint(ra.vertexId);
            const p1 = getPoint(ra.p1Id);
            const p2 = getPoint(ra.p2Id);
            if (!vertex || !p1 || !p2) return null;

            // Unit vectors from vertex to p1 and p2
            const d1x = p1.x - vertex.x;
            const d1y = p1.y - vertex.y;
            const len1 = Math.sqrt(d1x * d1x + d1y * d1y) || 1;
            const u1x = (d1x / len1) * 12;
            const u1y = (d1y / len1) * 12;

            const d2x = p2.x - vertex.x;
            const d2y = p2.y - vertex.y;
            const len2 = Math.sqrt(d2x * d2x + d2y * d2y) || 1;
            const u2x = (d2x / len2) * 12;
            const u2y = (d2y / len2) * 12;

            const cornerX = vertex.x + u1x + u2x;
            const cornerY = vertex.y + u1y + u2y;

            return (
              <polyline
                key={ra.id}
                points={`${vertex.x + u1x},${vertex.y + u1y} ${cornerX},${cornerY} ${vertex.x + u2x},${vertex.y + u2y}`}
                fill="none"
                stroke="#475569"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Points */}
          {geoData.points.map((p) => {
            const isSelected = selectedPointIds.includes(p.id);
            return (
              <g
                key={p.id}
                onClick={(e) => handlePointClick(p.id, e)}
                onMouseDown={() => {
                  if (activeTool === 'select') setDraggedPointId(p.id);
                }}
                className="cursor-pointer"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 6 : 4.5}
                  fill={isSelected ? '#4f46e5' : '#1e293b'}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
                <text
                  x={p.x + (p.labelOffset?.dx || 10)}
                  y={p.y + (p.labelOffset?.dy || -10)}
                  fontSize={14}
                  fontWeight="bold"
                  fontFamily="serif"
                  fontStyle="italic"
                  fill="#0f172a"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="text-xs text-slate-500 italic text-center">
        * Hướng dẫn: Chọn công cụ Đoạn thẳng/Cạnh khuất rồi click lần lượt 2 điểm để nối cạnh. Kéo điểm trong chế độ "Chọn / Kéo điểm".
      </div>
    </div>
  );
};
