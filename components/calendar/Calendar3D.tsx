'use client';

import { useMemo, useEffect, useRef } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Edges, Text } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useAppStore } from '@/store/appStore';
import { MUSCLES, MUSCLE_COLORS, DAYS_ES } from '@/lib/constants';
import { daysInMonth, getCacheDayState, getCacheDayMuscle } from '@/lib/analytics';
import { makeTopTex, makeFrontTex, hexToInt } from '@/lib/cube-textures';
import type { MonthCache } from '@/lib/types';
import MonthNav from './MonthNav';

const GAP = 2.0;
const SIZE = 1.35;
const today = new Date();

interface CubeSpec {
  day: number;
  position: [number, number, number];
  height: number;
  shininess: number;
  color: number;
  topTex: THREE.CanvasTexture;
  frontTex: THREE.CanvasTexture;
  isToday: boolean;
}

interface SceneData {
  cubes: CubeSpec[];
  dayLabels: { text: string; position: [number, number, number] }[];
  weekLabels: { text: string; position: [number, number, number] }[];
  target: [number, number, number];
}

function buildScene(cache: MonthCache, curYear: number, curMonth: number): SceneData {
  const total = daysInMonth(curYear, curMonth);
  const isCurrentMonth = curMonth === today.getMonth() && curYear === today.getFullYear();
  const todayD = isCurrentMonth ? today.getDate() : -1;
  const firstDow = new Date(curYear, curMonth, 1).getDay();
  const weeks = Math.ceil((total + firstDow) / 7);
  const offX = -(6 * GAP) / 2;
  const offZ = -((weeks - 1) * GAP) / 2;

  const cubes: CubeSpec[] = [];
  for (let d = 1; d <= total; d++) {
    const dow = (firstDow + d - 1) % 7;
    const week = Math.floor((firstDow + d - 1) / 7);
    const wknd = dow === 0 || dow === 6;
    const isPast =
      curYear < today.getFullYear() ||
      (curYear === today.getFullYear() && curMonth < today.getMonth()) ||
      (curYear === today.getFullYear() && curMonth === today.getMonth() && d < todayD);
    const isToday = d === todayD;
    const state = getCacheDayState(cache, d);
    const isDone = state === 'done' || state === 'weekend_bonus';
    const isWeekendBonus = state === 'weekend_bonus';
    const isMiss = state === 'miss';
    const isAutofail = isPast && !isDone && !isMiss && !wknd;
    const muscle = getCacheDayMuscle(cache, d);

    let color: number;
    if (isDone && muscle && MUSCLE_COLORS[muscle]) color = hexToInt(MUSCLE_COLORS[muscle]);
    else if (isWeekendBonus) color = 0x1166ff;
    else if (isDone) color = 0x22aa55;
    else if (isMiss || isAutofail) color = 0xbb2222;
    else if (isToday) color = 0xffaa22;
    else if (wknd) color = 0x1a1a2e;
    else color = 0x2a2a2a;

    const height = isToday ? SIZE * 1.3 : SIZE;
    const shininess = isDone ? 90 : isToday ? 60 : 22;
    const photoCount = cache.photo_counts[String(d)];
    const setCount = cache.set_counts[String(d)];

    const topTex = makeTopTex(d, isWeekendBonus ? '3×' : null, color, isToday);

    const mObj = muscle && isDone ? MUSCLES.find((x) => x.id === muscle) : null;
    const mainIcon = mObj ? mObj.icon : '';
    const badgeParts: string[] = [];
    if (photoCount) badgeParts.push('📷' + (photoCount > 1 ? photoCount : ''));
    if (setCount) badgeParts.push('💪' + setCount);
    const frontTex = makeFrontTex(mainIcon, badgeParts.join('  '), color);

    cubes.push({
      day: d,
      position: [offX + dow * GAP, isToday ? (height - SIZE) / 2 : 0, offZ + week * GAP],
      height,
      shininess,
      color,
      topTex,
      frontTex,
      isToday,
    });
  }

  const dayLabels = DAYS_ES.map((name, i) => ({
    text: name,
    position: [offX + i * GAP, 1.9, offZ - GAP * 1.3] as [number, number, number],
  }));
  const weekLabels = Array.from({ length: weeks }, (_, w) => ({
    text: 'S' + (w + 1),
    position: [offX - GAP * 1.5, 1.4, offZ + w * GAP] as [number, number, number],
  }));

  // Initial camera target: framed on today (current month) or grid centroid
  const centroid: [number, number, number] = [offX + 3 * GAP, 0, offZ + ((weeks - 1) * GAP) / 2];
  let target = centroid;
  if (isCurrentMonth && todayD > 0) {
    const todayWeekRow = Math.floor((firstDow + todayD - 1) / 7);
    const headerZ = offZ - GAP * 1.3;
    const todayZ = offZ + todayWeekRow * GAP;
    target = [offX + 3 * GAP, 0, (headerZ + todayZ) / 2 + GAP * 0.4];
  }

  return { cubes, dayLabels, weekLabels, target };
}

function DayCube({ spec, selected, onSelect }: { spec: CubeSpec; selected: boolean; onSelect: (day: number) => void }) {
  const downRef = useRef<{ x: number; y: number } | null>(null);

  const handleDown = (e: ThreeEvent<PointerEvent>) => {
    downRef.current = { x: e.clientX, y: e.clientY };
  };
  const handleUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const d = downRef.current;
    downRef.current = null;
    if (!d) return;
    const dist = Math.hypot(e.clientX - d.x, e.clientY - d.y);
    if (dist < 8) onSelect(spec.day);
  };

  return (
    <mesh position={spec.position} onPointerDown={handleDown} onPointerUp={handleUp}>
      <boxGeometry args={[SIZE, spec.height, SIZE]} />
      {/* faces: +x,-x,+y(top),-y,+z(front),-z */}
      <meshPhongMaterial attach="material-0" color={spec.color} shininess={spec.shininess} />
      <meshPhongMaterial attach="material-1" color={spec.color} shininess={spec.shininess} />
      <meshPhongMaterial attach="material-2" map={spec.topTex} shininess={spec.shininess} specular={0x333333} />
      <meshPhongMaterial attach="material-3" color={spec.color} shininess={spec.shininess} />
      <meshPhongMaterial attach="material-4" map={spec.frontTex} shininess={spec.shininess} specular={0x333333} />
      <meshPhongMaterial attach="material-5" color={spec.color} shininess={spec.shininess} />
      {spec.isToday && <Edges scale={1.04} threshold={15} color="#ffcc44" />}
      {selected && <Edges scale={1.06} threshold={15} color="#ff00cc" />}
    </mesh>
  );
}

function CameraRig({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const key = target.join(',');

  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    c.target.set(target[0], target[1], target[2]);
    // Spherical offset from original: theta=0.35, phi=0.72, radius=24
    camera.position.set(target[0] + 5.42, target[1] + 18.05, target[2] + 14.85);
    c.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan
      enableRotate
      enableZoom
      minDistance={8}
      maxDistance={55}
      minPolarAngle={0.12}
      maxPolarAngle={1.4}
    />
  );
}

export default function Calendar3D() {
  const monthCache = useAppStore((s) => s.monthCache);
  const curYear = useAppStore((s) => s.curYear);
  const curMonth = useAppStore((s) => s.curMonth);
  const selectedDay = useAppStore((s) => s.selectedDay);
  const dayViewOpen = useAppStore((s) => s.dayViewOpen);
  const openDayView = useAppStore((s) => s.openDayView);

  const scene = useMemo(
    () => buildScene(monthCache, curYear, curMonth),
    [monthCache, curYear, curMonth],
  );

  // Dispose canvas textures when the scene rebuilds or unmounts
  useEffect(() => {
    const { cubes } = scene;
    return () => {
      cubes.forEach((c) => {
        c.topTex.dispose();
        c.frontTex.dispose();
      });
    };
  }, [scene]);

  return (
    <div className="absolute inset-0">
      <div className="absolute top-12 left-0 right-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <MonthNav />
        </div>
      </div>

      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 50, near: 0.1, far: 1000, position: [5.42, 18.05, 14.85] }}
        gl={{ antialias: true }}
        style={{ touchAction: 'none' }}
      >
        <color attach="background" args={['#0e0e0e']} />
        <fog attach="fog" args={['#0e0e0e', 40, 75]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[6, 14, 8]} intensity={1.1} />
        <pointLight position={[-12, 4, -12]} intensity={0.3} color={0x3355ff} distance={60} />

        {scene.cubes.map((spec) => (
          <DayCube
            key={spec.day}
            spec={spec}
            selected={dayViewOpen && selectedDay === spec.day}
            onSelect={openDayView}
          />
        ))}

        {scene.dayLabels.map((l, i) => (
          <Text
            key={`d-${i}`}
            position={l.position}
            fontSize={0.62}
            color="#ffffff"
            fillOpacity={0.8}
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
          >
            {l.text}
          </Text>
        ))}
        {scene.weekLabels.map((l, i) => (
          <Text
            key={`w-${i}`}
            position={l.position}
            fontSize={0.48}
            color="#ffffff"
            fillOpacity={0.5}
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
          >
            {l.text}
          </Text>
        ))}

        <CameraRig target={scene.target} />
      </Canvas>
    </div>
  );
}
