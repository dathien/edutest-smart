import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RotateCcw, Eye, Compass, Maximize2 } from 'lucide-react';

export interface Point3DData {
  id: string;
  x: number;
  y: number;
  z: number;
  label: string;
  color?: string;
  radius?: number;
  showProjections?: boolean;
  showVectorOM?: boolean;
}

export interface Plane3DData {
  id: string;
  // Ax + By + Cz + D = 0
  A: number;
  B: number;
  C: number;
  D: number;
  color?: string;
  opacity?: number;
  size?: number;
  label?: string;
}

export interface Line3DData {
  id: string;
  // Passes through (x0, y0, z0) with direction (u1, u2, u3)
  x0: number;
  y0: number;
  z0: number;
  u1: number;
  u2: number;
  u3: number;
  color?: string;
  label?: string;
}

export interface PolyhedronData {
  type: 'pyramid' | 'prism' | 'box';
  apex?: [number, number, number]; // S(x, y, z)
  baseVertices: [number, number, number][]; // e.g. A, B, C, D
  topVertices?: [number, number, number][]; // for prism / box
  color?: string;
  showAltitude?: boolean;
  altitudeFoot?: [number, number, number]; // H(x, y, z)
}

export interface SlicingPlaneData {
  heightZ: number; // z = heightZ or tilted
  tiltDeg: number;
  rotDeg: number;
  color?: string;
  showSectionPolygon?: boolean;
}

export interface Geometry3DEngineProps {
  points?: Point3DData[];
  planes?: Plane3DData[];
  lines?: Line3DData[];
  polyhedron?: PolyhedronData;
  slicingPlane?: SlicingPlaneData;
  showGrid?: boolean;
  showAxes?: boolean;
  axesSize?: number;
  height?: number | string;
  onIntersectionCalculated?: (intersection: { x: number; y: number; z: number } | null) => void;
  onCrossSectionAreaCalculated?: (area: number, verticesCount: number) => void;
}

export const Geometry3DEngine: React.FC<Geometry3DEngineProps> = ({
  points = [],
  planes = [],
  lines = [],
  polyhedron,
  slicingPlane,
  showGrid = true,
  showAxes = true,
  axesSize = 7,
  height = 500,
  onIntersectionCalculated,
  onCrossSectionAreaCalculated,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);

  // Camera Orbit State (Spherical coordinates)
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraRadiusRef = useRef(16);
  const cameraThetaRef = useRef(Math.PI / 4); // Azimuth
  const cameraPhiRef = useRef(Math.PI / 3);   // Polar (elevation)
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 1.5));

  const [cameraViewBadge, setCameraViewBadge] = useState('Phối cảnh 3D');

  // Update Camera position from spherical coordinates
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const r = cameraRadiusRef.current;
    const phi = Math.max(0.05, Math.min(Math.PI - 0.05, cameraPhiRef.current));
    const theta = cameraThetaRef.current;

    // Convert spherical to Cartesian: Math coordinates where Z is up, X is right, Y is deep
    // In Three.js: X=X, Y=Z (up), Z=-Y
    const cx = r * Math.sin(phi) * Math.sin(theta);
    const cz = r * Math.sin(phi) * Math.cos(theta);
    const cy = r * Math.cos(phi);

    cameraRef.current.position.set(cx, cy, cz);
    cameraRef.current.lookAt(targetLookAtRef.current);
  }, []);

  // View Preset angles
  const setPresetView = (preset: 'iso' | 'top' | 'front' | 'side') => {
    switch (preset) {
      case 'iso':
        cameraThetaRef.current = Math.PI / 4;
        cameraPhiRef.current = Math.PI / 3;
        setCameraViewBadge('Góc chuẩn (Isometric 45°)');
        break;
      case 'top':
        cameraThetaRef.current = 0.001;
        cameraPhiRef.current = 0.01;
        setCameraViewBadge('Chiếu bằng (Oxy)');
        break;
      case 'front':
        cameraThetaRef.current = 0;
        cameraPhiRef.current = Math.PI / 2;
        setCameraViewBadge('Chiếu đứng (Oxz)');
        break;
      case 'side':
        cameraThetaRef.current = Math.PI / 2;
        cameraPhiRef.current = Math.PI / 2;
        setCameraViewBadge('Chiếu cạnh (Oyz)');
        break;
    }
    updateCameraPosition();
  };

  const handleResetCamera = () => {
    cameraRadiusRef.current = 16;
    setPresetView('iso');
  };

  // 1. Initialize Three.js Scene, Camera, Renderer
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const hVal = typeof height === 'number' ? height : container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Slate-50 clean background
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / hVal, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, hVal);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight1.position.set(10, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xc7d2fe, 0.4);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    // Container group for dynamic geometric objects
    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

    updateCameraPosition();

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Responsive resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = typeof height === 'number' ? height : container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [height, updateCameraPosition]);

  // 2. Mouse & Touch Orbit Interactions
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraThetaRef.current -= deltaX * 0.008;
      cameraPhiRef.current -= deltaY * 0.008;

      // Clamp polar angle to avoid gimbal flip
      cameraPhiRef.current = Math.max(0.05, Math.min(Math.PI - 0.05, cameraPhiRef.current));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      updateCameraPosition();
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.92 : 1.08;
      cameraRadiusRef.current = Math.max(4, Math.min(50, cameraRadiusRef.current * zoomFactor));
      updateCameraPosition();
    };

    // Touch support for mobile/tablets
    let initialTouchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialTouchDist = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDraggingRef.current) {
        const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
        const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

        cameraThetaRef.current -= deltaX * 0.008;
        cameraPhiRef.current -= deltaY * 0.008;
        cameraPhiRef.current = Math.max(0.05, Math.min(Math.PI - 0.05, cameraPhiRef.current));

        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        updateCameraPosition();
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (initialTouchDist > 0) {
          const factor = initialTouchDist / dist;
          cameraRadiusRef.current = Math.max(4, Math.min(50, cameraRadiusRef.current * factor));
          updateCameraPosition();
        }
        initialTouchDist = dist;
      }
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
      initialTouchDist = 0;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);

      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [updateCameraPosition]);

  // Helper to create 3D text label sprite
  const createTextSprite = (text: string, color = '#1e293b', scale = 1.0) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(scale * 1.6, scale * 0.8, 1);
    return sprite;
  };

  // Convert Math Coordinate (x, y, z) where Z is up
  // to Three.js Coordinate (X, Y, Z) where Y is up
  const mathToThreeVec = (mx: number, my: number, mz: number): THREE.Vector3 => {
    return new THREE.Vector3(mx, mz, my);
  };

  // 3. Render Geometry Objects into dynamicGroup
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    // Clear previous geometries
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    // 1. Grid Plane (Oxy, where z = 0)
    if (showGrid) {
      const gridHelper = new THREE.GridHelper(axesSize * 2, axesSize * 2, 0xcbd5e1, 0xe2e8f0);
      gridHelper.position.set(0, 0, 0);
      group.add(gridHelper);
    }

    // 2. Coordinate Axes Oxyz
    if (showAxes) {
      const axisLen = axesSize;

      // Ox (Math X -> Three X): Red
      const oxGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-axisLen, 0, 0),
        new THREE.Vector3(axisLen, 0, 0),
      ]);
      const oxLine = new THREE.Line(oxGeom, new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 }));
      group.add(oxLine);

      // Ox Arrow
      const oxCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.6, 16),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      oxCone.position.set(axisLen, 0, 0);
      oxCone.rotation.z = -Math.PI / 2;
      group.add(oxCone);

      const xLabel = createTextSprite('x', '#ef4444', 0.8);
      xLabel.position.set(axisLen + 0.6, 0, 0);
      group.add(xLabel);

      // Oy (Math Y -> Three Z): Green
      const oyGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -axisLen),
        new THREE.Vector3(0, 0, axisLen),
      ]);
      const oyLine = new THREE.Line(oyGeom, new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 }));
      group.add(oyLine);

      // Oy Arrow
      const oyCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.6, 16),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      oyCone.position.set(0, 0, axisLen);
      oyCone.rotation.x = Math.PI / 2;
      group.add(oyCone);

      const yLabel = createTextSprite('y', '#10b981', 0.8);
      yLabel.position.set(0, 0, axisLen + 0.6);
      group.add(yLabel);

      // Oz (Math Z -> Three Y): Blue
      const ozGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -axisLen, 0),
        new THREE.Vector3(0, axisLen, 0),
      ]);
      const ozLine = new THREE.Line(ozGeom, new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 }));
      group.add(ozLine);

      // Oz Arrow
      const ozCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.6, 16),
        new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
      );
      ozCone.position.set(0, axisLen, 0);
      group.add(ozCone);

      const zLabel = createTextSprite('z', '#3b82f6', 0.8);
      zLabel.position.set(0, axisLen + 0.6, 0);
      group.add(zLabel);

      // Origin O
      const oLabel = createTextSprite('O', '#64748b', 0.75);
      oLabel.position.set(-0.35, -0.35, -0.35);
      group.add(oLabel);
    }

    // 3. Points and Projections
    points.forEach((pt) => {
      const pos = mathToThreeVec(pt.x, pt.y, pt.z);
      const color = pt.color ? parseInt(pt.color.replace('#', '0x')) : 0x6366f1;

      // Sphere
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(pt.radius ?? 0.28, 24, 24),
        new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.2 })
      );
      sphere.position.copy(pos);
      group.add(sphere);

      // Label
      const sprite = createTextSprite(`${pt.label}(${pt.x},${pt.y},${pt.z})`, '#1e1b4b', 0.9);
      sprite.position.copy(pos).add(new THREE.Vector3(0.4, 0.4, 0));
      group.add(sprite);

      // Projections & Projection Box
      if (pt.showProjections) {
        // Projections in Math coords:
        // M_xy = (x, y, 0)
        // M_xz = (x, 0, z)
        // M_yz = (0, y, z)
        const pXY = mathToThreeVec(pt.x, pt.y, 0);
        const pXZ = mathToThreeVec(pt.x, 0, pt.z);
        const pYZ = mathToThreeVec(0, pt.y, pt.z);

        const pX = mathToThreeVec(pt.x, 0, 0);
        const pY = mathToThreeVec(0, pt.y, 0);
        const pZ = mathToThreeVec(0, 0, pt.z);

        // Dashed lines helper
        const createDashed = (start: THREE.Vector3, end: THREE.Vector3, lColor = 0x94a3b8) => {
          const geom = new THREE.BufferGeometry().setFromPoints([start, end]);
          const line = new THREE.Line(
            geom,
            new THREE.LineDashedMaterial({ color: lColor, dashSize: 0.25, gapSize: 0.15 })
          );
          line.computeLineDistances();
          return line;
        };

        // Box lines connecting origin to M
        group.add(createDashed(pos, pXY, 0x6366f1));
        group.add(createDashed(pos, pXZ, 0x6366f1));
        group.add(createDashed(pos, pYZ, 0x6366f1));

        group.add(createDashed(pXY, pX, 0x94a3b8));
        group.add(createDashed(pXY, pY, 0x94a3b8));
        group.add(createDashed(pXZ, pX, 0x94a3b8));
        group.add(createDashed(pXZ, pZ, 0x94a3b8));
        group.add(createDashed(pYZ, pY, 0x94a3b8));
        group.add(createDashed(pYZ, pZ, 0x94a3b8));

        // Sub-point dots
        const dotGeom = new THREE.SphereGeometry(0.12, 16, 16);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0x475569 });

        const sXY = new THREE.Mesh(dotGeom, dotMat);
        sXY.position.copy(pXY);
        group.add(sXY);
        const lXY = createTextSprite(`M_xy(${pt.x},${pt.y},0)`, '#475569', 0.65);
        lXY.position.copy(pXY).add(new THREE.Vector3(0.2, -0.2, 0.2));
        group.add(lXY);

        const sXZ = new THREE.Mesh(dotGeom, dotMat);
        sXZ.position.copy(pXZ);
        group.add(sXZ);
        const lXZ = createTextSprite(`M_xz(${pt.x},0,${pt.z})`, '#475569', 0.65);
        lXZ.position.copy(pXZ).add(new THREE.Vector3(0.2, 0.2, 0));
        group.add(lXZ);

        const sYZ = new THREE.Mesh(dotGeom, dotMat);
        sYZ.position.copy(pYZ);
        group.add(sYZ);
        const lYZ = createTextSprite(`M_yz(0,${pt.y},${pt.z})`, '#475569', 0.65);
        lYZ.position.copy(pYZ).add(new THREE.Vector3(0, 0.2, 0.2));
        group.add(lYZ);
      }

      // Vector OM Arrow
      if (pt.showVectorOM) {
        const origin = new THREE.Vector3(0, 0, 0);
        const dir = pos.clone().normalize();
        const len = pos.length();
        const arrow = new THREE.ArrowHelper(dir, origin, len, 0xd97706, 0.5, 0.25);
        group.add(arrow);
      }
    });

    // 4. Planes (P): Ax + By + Cz + D = 0
    planes.forEach((pl) => {
      const size = pl.size ?? 10;
      const geom = new THREE.PlaneGeometry(size, size);
      const color = pl.color ? parseInt(pl.color.replace('#', '0x')) : 0x0284c7;
      const mat = new THREE.MeshStandardMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: pl.opacity ?? 0.45,
        roughness: 0.5,
      });
      const mesh = new THREE.Mesh(geom, mat);

      // Normal vector in Math: (A, B, C) -> in Three: (A, C, B)
      const normalThree = new THREE.Vector3(pl.A, pl.C, pl.B).normalize();
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normalThree);

      // Point on plane closest to origin: -D / (A^2 + B^2 + C^2) * normal
      const normSq = pl.A * pl.A + pl.B * pl.B + pl.C * pl.C;
      if (normSq > 0.0001) {
        const scale = -pl.D / normSq;
        const ptMath = [pl.A * scale, pl.B * scale, pl.C * scale];
        mesh.position.copy(mathToThreeVec(ptMath[0], ptMath[1], ptMath[2]));
      }

      group.add(mesh);

      // Normal Vector Arrow n
      const nDir = normalThree.clone();
      const nArrow = new THREE.ArrowHelper(nDir, mesh.position, 2.5, 0xe11d48, 0.4, 0.2);
      group.add(nArrow);
    });

    // 5. Lines (d): Point (x0, y0, z0) + t*(u1, u2, u3)
    lines.forEach((ln) => {
      const tMin = -10;
      const tMax = 10;
      const p1 = mathToThreeVec(ln.x0 + tMin * ln.u1, ln.y0 + tMin * ln.u2, ln.z0 + tMin * ln.u3);
      const p2 = mathToThreeVec(ln.x0 + tMax * ln.u1, ln.y0 + tMax * ln.u2, ln.z0 + tMax * ln.u3);

      const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const color = ln.color ? parseInt(ln.color.replace('#', '0x')) : 0x9333ea;
      const line = new THREE.Line(geom, new THREE.LineBasicMaterial({ color, linewidth: 3 }));
      group.add(line);

      // Calculate intersection if exactly 1 plane and 1 line exist
      if (planes.length === 1 && onIntersectionCalculated) {
        const pl = planes[0];
        const denom = pl.A * ln.u1 + pl.B * ln.u2 + pl.C * ln.u3;
        if (Math.abs(denom) > 0.0001) {
          const t = -(pl.A * ln.x0 + pl.B * ln.y0 + pl.C * ln.z0 + pl.D) / denom;
          const ix = ln.x0 + t * ln.u1;
          const iy = ln.y0 + t * ln.u2;
          const iz = ln.z0 + t * ln.u3;

          const intPos = mathToThreeVec(ix, iy, iz);
          const intSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.24, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xe11d48 })
          );
          intSphere.position.copy(intPos);
          group.add(intSphere);

          const intLabel = createTextSprite(`I(${ix.toFixed(2)}, ${iy.toFixed(2)}, ${iz.toFixed(2)})`, '#e11d48', 0.85);
          intLabel.position.copy(intPos).add(new THREE.Vector3(0.3, 0.3, 0));
          group.add(intLabel);

          onIntersectionCalculated({ x: ix, y: iy, z: iz });
        } else {
          onIntersectionCalculated(null);
        }
      }
    });

    // 6. Polyhedron (Pyramid / Prism / Box)
    if (polyhedron) {
      const { apex, baseVertices, color = '#6366f1', showAltitude, altitudeFoot } = polyhedron;
      const polyColor = parseInt(color.replace('#', '0x'));

      // Draw Base Polygon
      const baseThreePoints = baseVertices.map((v) => mathToThreeVec(v[0], v[1], v[2]));
      const baseLabels = ['A', 'B', 'C', 'D', 'E'];
      baseThreePoints.forEach((pt, idx) => {
        const s = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0x1e293b })
        );
        s.position.copy(pt);
        group.add(s);
        const lbl = createTextSprite(baseLabels[idx] || `P${idx}`, '#0f172a', 0.75);
        lbl.position.copy(pt).add(new THREE.Vector3(0.2, -0.2, 0.2));
        group.add(lbl);
      });

      // Base Edges
      const baseEdgePoints = [...baseThreePoints, baseThreePoints[0]];
      const baseGeom = new THREE.BufferGeometry().setFromPoints(baseEdgePoints);
      const baseLine = new THREE.Line(
        baseGeom,
        new THREE.LineBasicMaterial({ color: 0x334155, linewidth: 2.5 })
      );
      group.add(baseLine);

      // Base fill semi-transparent
      const baseShape = new THREE.Shape();
      // project to 2D
      baseShape.moveTo(baseVertices[0][0], baseVertices[0][1]);
      for (let i = 1; i < baseVertices.length; i++) {
        baseShape.lineTo(baseVertices[i][0], baseVertices[i][1]);
      }
      baseShape.closePath();
      const basePolyGeom = new THREE.ShapeGeometry(baseShape);
      // rotate shape geometry to lie on Oxy (Math Oxy = Three XZ)
      basePolyGeom.rotateX(Math.PI / 2);
      const basePolyMesh = new THREE.Mesh(
        basePolyGeom,
        new THREE.MeshStandardMaterial({ color: polyColor, opacity: 0.25, transparent: true, side: THREE.DoubleSide })
      );
      group.add(basePolyMesh);

      // Apex S for Pyramid
      if (polyhedron.type === 'pyramid' && apex) {
        const apexThree = mathToThreeVec(apex[0], apex[1], apex[2]);
        const sApex = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0xef4444 })
        );
        sApex.position.copy(apexThree);
        group.add(sApex);

        const lblS = createTextSprite('S', '#ef4444', 0.85);
        lblS.position.copy(apexThree).add(new THREE.Vector3(0, 0.4, 0));
        group.add(lblS);

        // Lateral Edges from S to base vertices
        baseThreePoints.forEach((bPt) => {
          const lateralGeom = new THREE.BufferGeometry().setFromPoints([apexThree, bPt]);
          const lateralLine = new THREE.Line(
            lateralGeom,
            new THREE.LineBasicMaterial({ color: 0x475569, linewidth: 2 })
          );
          group.add(lateralLine);
        });

        // Altitude SH
        if (showAltitude && altitudeFoot) {
          const footThree = mathToThreeVec(altitudeFoot[0], altitudeFoot[1], altitudeFoot[2]);
          const altGeom = new THREE.BufferGeometry().setFromPoints([apexThree, footThree]);
          const altLine = new THREE.Line(
            altGeom,
            new THREE.LineDashedMaterial({ color: 0xdc2626, dashSize: 0.3, gapSize: 0.15 })
          );
          altLine.computeLineDistances();
          group.add(altLine);

          const hDot = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xdc2626 })
          );
          hDot.position.copy(footThree);
          group.add(hDot);

          const lblH = createTextSprite('H', '#dc2626', 0.7);
          lblH.position.copy(footThree).add(new THREE.Vector3(0.2, 0.1, 0.2));
          group.add(lblH);
        }
      }
    }

    // 7. Dynamic Slicing Plane & Cross-section Polygon
    if (slicingPlane && polyhedron && polyhedron.type === 'pyramid' && polyhedron.apex) {
      const { heightZ, tiltDeg, rotDeg } = slicingPlane;
      const tiltRad = (tiltDeg * Math.PI) / 180;
      const rotRad = (rotDeg * Math.PI) / 180;

      // Slicing plane equation: n = (sin(tilt)*cos(rot), sin(tilt)*sin(rot), cos(tilt))
      const nX = Math.sin(tiltRad) * Math.cos(rotRad);
      const nY = Math.sin(tiltRad) * Math.sin(rotRad);
      const nZ = Math.cos(tiltRad);
      // Plane passes through point (0, 0, heightZ)
      const D = -(nX * 0 + nY * 0 + nZ * heightZ);

      // Draw the slicing plane as a subtle translucent disk or rectangle
      const planeSize = 9;
      const planeGeom = new THREE.PlaneGeometry(planeSize, planeSize);
      const planeMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4, // Cyan
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const planeMesh = new THREE.Mesh(planeGeom, planeMat);

      const nThree = new THREE.Vector3(nX, nZ, nY).normalize();
      planeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nThree);
      planeMesh.position.copy(mathToThreeVec(0, 0, heightZ));
      group.add(planeMesh);

      // Find intersection points with each lateral edge of the pyramid: SA, SB, SC, SD
      const S = polyhedron.apex;
      const base = polyhedron.baseVertices;
      const sectionPoints: [number, number, number][] = [];

      base.forEach((B) => {
        // Line from S to B: P(t) = S + t*(B - S) for t in [0, 1]
        const dX = B[0] - S[0];
        const dY = B[1] - S[1];
        const dZ = B[2] - S[2];

        const denom = nX * dX + nY * dY + nZ * dZ;
        if (Math.abs(denom) > 0.0001) {
          const t = -(nX * S[0] + nY * S[1] + nZ * S[2] + D) / denom;
          if (t >= 0 && t <= 1) {
            sectionPoints.push([S[0] + t * dX, S[1] + t * dY, S[2] + t * dZ]);
          }
        }
      });

      // If at least 3 intersection points, draw the cross section polygon
      if (sectionPoints.length >= 3) {
        const sectionThreePts = sectionPoints.map((p) => mathToThreeVec(p[0], p[1], p[2]));

        // Perimeter line
        const loopPts = [...sectionThreePts, sectionThreePts[0]];
        const sectionLineGeom = new THREE.BufferGeometry().setFromPoints(loopPts);
        const sectionLine = new THREE.Line(
          sectionLineGeom,
          new THREE.LineBasicMaterial({ color: 0xe11d48, linewidth: 3.5 })
        );
        group.add(sectionLine);

        // Highlight intersection vertices
        sectionThreePts.forEach((pt, idx) => {
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xe11d48 })
          );
          dot.position.copy(pt);
          group.add(dot);

          const lbl = createTextSprite(`M${idx + 1}`, '#be123c', 0.65);
          lbl.position.copy(pt).add(new THREE.Vector3(0.2, 0.2, 0));
          group.add(lbl);
        });

        // Approximate section area using polygon triangulation from centroid
        let totalArea = 0;
        const cX = sectionPoints.reduce((acc, p) => acc + p[0], 0) / sectionPoints.length;
        const cY = sectionPoints.reduce((acc, p) => acc + p[1], 0) / sectionPoints.length;
        const cZ = sectionPoints.reduce((acc, p) => acc + p[2], 0) / sectionPoints.length;

        for (let i = 0; i < sectionPoints.length; i++) {
          const p1 = sectionPoints[i];
          const p2 = sectionPoints[(i + 1) % sectionPoints.length];
          // cross product of (p1 - C) and (p2 - C)
          const v1 = [p1[0] - cX, p1[1] - cY, p1[2] - cZ];
          const v2 = [p2[0] - cX, p2[1] - cY, p2[2] - cZ];
          const cross = [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0],
          ];
          const triArea = 0.5 * Math.hypot(cross[0], cross[1], cross[2]);
          totalArea += triArea;
        }

        if (onCrossSectionAreaCalculated) {
          onCrossSectionAreaCalculated(Math.round(totalArea * 100) / 100, sectionPoints.length);
        }
      } else if (onCrossSectionAreaCalculated) {
        onCrossSectionAreaCalculated(0, sectionPoints.length);
      }
    }
  }, [
    points,
    planes,
    lines,
    polyhedron,
    slicingPlane,
    showGrid,
    showAxes,
    axesSize,
    onIntersectionCalculated,
    onCrossSectionAreaCalculated,
  ]);

  return (
    <div className="relative w-full rounded-2xl bg-slate-50 border border-slate-200 shadow-sm overflow-hidden select-none">
      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        className="w-full cursor-grab active:cursor-grabbing"
        style={{ height }}
      />

      {/* Floating Camera View Indicator */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
        <Compass className="w-4 h-4 text-indigo-600 animate-spin-slow" />
        <span className="text-xs font-semibold text-slate-700">{cameraViewBadge}</span>
      </div>

      {/* Camera View Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-wrap items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/80 shadow-sm">
        <button
          type="button"
          onClick={() => setPresetView('iso')}
          className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
          title="Góc nhìn phối cảnh chuẩn 45°"
        >
          Chuẩn (45°)
        </button>
        <button
          type="button"
          onClick={() => setPresetView('top')}
          className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
          title="Mặt phẳng Oxy (nhìn từ trên)"
        >
          Mặt Oxy
        </button>
        <button
          type="button"
          onClick={() => setPresetView('front')}
          className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
          title="Mặt phẳng Oxz (nhìn chính diện)"
        >
          Mặt Oxz
        </button>
        <button
          type="button"
          onClick={() => setPresetView('side')}
          className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
          title="Mặt phẳng Oyz (nhìn từ bên)"
        >
          Mặt Oyz
        </button>
        <button
          type="button"
          onClick={handleResetCamera}
          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
          title="Đặt lại camera"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Axis color legend bar at bottom */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-3 bg-white/85 backdrop-blur-sm px-3 py-1 rounded-lg border border-slate-200/60 text-[11px] font-mono text-slate-600 shadow-xs">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Ox
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Oy
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Oz
        </span>
      </div>

      {/* Gesture Help */}
      <div className="absolute bottom-3 left-3 z-10 text-[11px] text-slate-500 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200/60 pointer-events-none hidden sm:block">
        Kéo chuột trái / chạm: Xoay 360° | Cuộn chuột: Phóng to / Thu nhỏ
      </div>
    </div>
  );
};
