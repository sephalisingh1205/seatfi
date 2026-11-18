// src/components/3d/HardwareRig3D.jsx
'use client';
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  RoundedBox,
  Cylinder,
  Cone,
  ContactShadows,
  Grid,
  Billboard,
  Text,
} from '@react-three/drei';
import { useSeatStore, computeNodeStatus, isNoiseViolation } from '@/store/useSeatStore';
import { Cpu, Layers, Clock } from 'lucide-react';

// Pure 3D WebGL Floating Pill Badge (Zero React 19 root unmount race conditions)
function FloatingBadge3D({
  position = [0, 1, 0],
  text,
  subText,
  bgColor = '#1e293b',
  textColor = '#ffffff',
  onClick,
}) {
  return (
    <Billboard position={position} follow={true}>
      <group
        onClick={(e) => {
          if (onClick) {
            e.stopPropagation();
            onClick();
          }
        }}
      >
        <RoundedBox args={[1.38, 0.3, 0.02]} radius={0.12}>
          <meshBasicMaterial color={bgColor} />
        </RoundedBox>
        <Text
          position={[0, subText ? 0.045 : 0, 0.02]}
          fontSize={0.09}
          color={textColor}
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>
        {subText && (
          <Text
            position={[0, -0.065, 0.02]}
            fontSize={0.068}
            color="#e2e8f0"
            anchorX="center"
            anchorY="middle"
          >
            {subText}
          </Text>
        )}
      </group>
    </Billboard>
  );
}

// 1. MOLDED 4-LEGGED NORMAL PLASTIC CHAIR COMPONENT
function PlasticChairNode({ seat, position, rotationY, isSelected, onSelect }) {
  const holoRef = useRef();
  const soundWaveRef = useRef();

  const status = computeNodeStatus(seat.irDistance, seat.pressureWeight, seat.prebookedUntil);
  const loud = isNoiseViolation(seat);

  const statusColor =
    status === 'Occupied'
      ? '#e11d48'
      : status === 'Bag Hogging'
      ? '#d97706'
      : status === 'Pre-booked'
      ? '#7c3aed'
      : '#059669';

  const shellColor = isSelected ? '#1d4ed8' : '#3b82f6';

  let countdownText = '';
  if (status === 'Pre-booked' && seat.prebookedUntil) {
    const rem = Math.max(0, seat.prebookedUntil - Date.now());
    const mins = Math.floor(rem / 60000);
    const secs = Math.floor((rem % 60000) / 1000);
    countdownText = ` (${mins}:${secs.toString().padStart(2, '0')})`;
  }

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (holoRef.current && status === 'Pre-booked') {
      holoRef.current.rotation.y = t * 1.8;
      holoRef.current.position.y = 0.68 + Math.sin(t * 3) * 0.04;
    }
    if (soundWaveRef.current && loud) {
      const s = 1 + (t % 1) * 1.6;
      soundWaveRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(seat.id);
      }}
    >
      {/* 4 Normal Plastic/Tubular Chair Legs */}
      {[
        [-0.22, 0.22, -0.22],
        [0.22, 0.22, -0.22],
        [-0.22, 0.22, 0.22],
        [0.22, 0.22, 0.22],
      ].map((legPos, idx) => (
        <Cylinder key={idx} args={[0.025, 0.02, 0.44, 12]} position={legPos}>
          <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
        </Cylinder>
      ))}

      {/* Molded Plastic Seat Pan */}
      <RoundedBox args={[0.56, 0.05, 0.54]} radius={0.02} position={[0, 0.45, 0]}>
        <meshStandardMaterial color={shellColor} roughness={0.35} />
      </RoundedBox>

      {/* Molded Plastic Curved Backrest */}
      <RoundedBox
        args={[0.54, 0.48, 0.04]}
        radius={0.02}
        position={[0, 0.72, 0.25]}
        rotation={[-0.08, 0, 0]}
      >
        <meshStandardMaterial color={shellColor} roughness={0.35} />
      </RoundedBox>

      {/* FSR Pressure Sensor Film Mounted on Plastic Seat */}
      <Cylinder args={[0.2, 0.2, 0.015, 24]} position={[0, 0.485, 0]}>
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.55} />
      </Cylinder>

      {/* Under-Table IR Sensor + Scanning Beam Aimed at Chair */}
      <group position={[0, 0.68, -0.45]}>
        <RoundedBox args={[0.16, 0.06, 0.08]} radius={0.01}>
          <meshStandardMaterial color="#0f172a" />
        </RoundedBox>
        <Cone args={[0.22, 0.65, 16]} position={[0, -0.1, 0.32]} rotation={[Math.PI / 2.2, 0, 0]}>
          <meshStandardMaterial
            color={seat.irDistance <= 65 ? '#e11d48' : '#0284c7'}
            transparent
            opacity={isSelected ? 0.42 : 0.18}
          />
        </Cone>
      </group>

      {/* Student Avatar when Occupied */}
      {status === 'Occupied' && (
        <group position={[0, 0.82, 0]}>
          <Cylinder args={[0.18, 0.22, 0.55, 20]}>
            <meshStandardMaterial color="#1e293b" />
          </Cylinder>
          <mesh position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.15, 20, 20]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
        </group>
      )}

      {/* Unattended Backpack when Bag Hogging */}
      {status === 'Bag Hogging' && (
        <RoundedBox args={[0.34, 0.28, 0.26]} radius={0.04} position={[0, 0.62, 0]}>
          <meshStandardMaterial color="#d97706" />
        </RoundedBox>
      )}

      {/* Rotating Violet Hologram Token when Pre-booked for 5 Mins */}
      {status === 'Pre-booked' && (
        <group ref={holoRef} position={[0, 0.68, 0]}>
          <Cylinder args={[0.18, 0.18, 0.04, 6]}>
            <meshStandardMaterial
              color="#8b5cf6"
              emissive="#7c3aed"
              emissiveIntensity={0.9}
              wireframe={false}
            />
          </Cylinder>
        </group>
      )}

      {/* Red Acoustic Alert Ring if Noise > Zone Limit */}
      {loud && (
        <mesh ref={soundWaveRef} position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.38, 32]} />
          <meshBasicMaterial color="#dc2626" side={2} />
        </mesh>
      )}

      {/* Pure 3D Floating Label */}
      <FloatingBadge3D
        position={[0, 1.44, 0]}
        text={`${seat.id} • ${status}${countdownText}`}
        subText={`IR:${seat.irDistance}cm | ${seat.pressureWeight}kg | ${seat.noiseDb}dB`}
        bgColor={loud ? '#dc2626' : isSelected ? '#2563eb' : statusColor}
        onClick={() => onSelect(seat.id)}
      />
    </group>
  );
}

// 2. LONG SHARED LIBRARY TABLE SCENE (6 PLASTIC CHAIRS, NO PARTITIONS)
function SharedLongTableScene({ seats, selectedSeatId, onSelectSeat, visible }) {
  const xOffsets = [-1.8, 0, 1.8];

  return (
    <group position={[0, -0.5, 0]} visible={visible}>
      <Grid
        position={[0, 0.01, 0]}
        args={[14, 14]}
        cellSize={0.6}
        cellThickness={0.6}
        cellColor="#cbd5e1"
        sectionSize={2.4}
        sectionThickness={1.2}
        sectionColor="#94a3b8"
        fadeDistance={14}
      />

      {/* Long Open Shared Wooden Table Top (ZERO Dividers/Partitions) */}
      <RoundedBox args={[5.4, 0.1, 1.7]} radius={0.03} position={[0, 0.78, 0]}>
        <meshStandardMaterial color="#d97706" roughness={0.35} />
      </RoundedBox>

      {/* 4 Corner Steel Table Legs */}
      {[
        [-2.5, 0.39, -0.72],
        [2.5, 0.39, -0.72],
        [-2.5, 0.39, 0.72],
        [2.5, 0.39, 0.72],
      ].map((pos, i) => (
        <Cylinder key={i} args={[0.05, 0.05, 0.78, 16]} position={pos}>
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </Cylinder>
      ))}

      {/* Central Shared ESP32 Gateway Hub Under the Middle of the Table */}
      <RoundedBox args={[0.5, 0.06, 0.35]} radius={0.02} position={[0, 0.71, 0]}>
        <meshStandardMaterial color="#059669" />
      </RoundedBox>

      {/* North Row: 3 Plastic Chairs (S-01, S-02, S-03) Facing South */}
      {seats.slice(0, 3).map((seat, idx) => (
        <PlasticChairNode
          key={seat.id}
          seat={seat}
          position={[xOffsets[idx], 0, -1.15]}
          rotationY={Math.PI}
          isSelected={seat.id === selectedSeatId}
          onSelect={onSelectSeat}
        />
      ))}

      {/* South Row: 3 Plastic Chairs (S-04, S-05, S-06) Facing North */}
      {seats.slice(3, 6).map((seat, idx) => (
        <PlasticChairNode
          key={seat.id}
          seat={seat}
          position={[xOffsets[idx], 0, 1.15]}
          rotationY={0}
          isSelected={seat.id === selectedSeatId}
          onSelect={onSelectSeat}
        />
      ))}

      <ContactShadows position={[0, 0.02, 0]} opacity={0.3} scale={12} blur={2} far={4} />
    </group>
  );
}

// 3. DEDICATED 3D HARDWARE WORKBENCH (ESP32 + IR MODULE + FSR PAD + LIVE PULSES)
function HardwareWorkbenchScene({ seat, visible }) {
  const irPulseRef = useRef();
  const fsrPulseRef = useRef();
  const wifiRingRef = useRef();

  const status = computeNodeStatus(seat.irDistance, seat.pressureWeight, seat.prebookedUntil);
  const statusHex =
    status === 'Occupied'
      ? '#e11d48'
      : status === 'Bag Hogging'
      ? '#d97706'
      : status === 'Pre-booked'
      ? '#7c3aed'
      : '#059669';

  useFrame((state) => {
    if (!visible) return;
    const t = state.clock.getElapsedTime();
    if (irPulseRef.current) {
      const progress = (t * 1.4) % 1;
      irPulseRef.current.position.x = -1.9 + progress * 1.6;
    }
    if (fsrPulseRef.current) {
      const progress = (t * 1.4) % 1;
      fsrPulseRef.current.position.x = 1.9 - progress * 1.6;
    }
    if (wifiRingRef.current) {
      const s = 1 + (t % 1.2) * 1.8;
      wifiRingRef.current.scale.set(s, s, 1);
      wifiRingRef.current.material.opacity = Math.max(0, 0.75 - (t % 1.2) * 0.6);
    }
  });

  return (
    <group position={[0, -0.4, 0]} visible={visible}>
      <Grid
        position={[0, 0.01, 0]}
        args={[14, 14]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#cbd5e1"
        sectionSize={2}
        sectionThickness={1.2}
        sectionColor="#94a3b8"
        fadeDistance={14}
      />

      {/* Lab Anti-Static Workbench Mat */}
      <RoundedBox args={[6.2, 0.08, 3.2]} radius={0.04} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </RoundedBox>

      {/* CENTER: ESP32-WROOM-32 DEV BOARD */}
      <group position={[0, 0.25, 0]}>
        <RoundedBox args={[1.6, 0.12, 2.2]} radius={0.03} position={[0, -0.08, 0]}>
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </RoundedBox>
        <RoundedBox args={[1.1, 0.08, 1.8]} radius={0.02} position={[0, 0.02, 0]}>
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </RoundedBox>
        <RoundedBox args={[0.75, 0.08, 0.85]} radius={0.01} position={[0, 0.09, -0.2]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
        </RoundedBox>
        <RoundedBox args={[0.32, 0.07, 0.22]} radius={0.01} position={[0, 0.08, 0.82]}>
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </RoundedBox>
        <mesh position={[0.35, 0.08, 0.55]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial color={statusHex} emissive={statusHex} emissiveIntensity={1.2} />
        </mesh>
        <mesh ref={wifiRingRef} position={[0, 0.35, -0.55]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.22, 32]} />
          <meshBasicMaterial color="#2563eb" transparent opacity={0.7} side={2} />
        </mesh>

        <FloatingBadge3D
          position={[0, 0.85, 0]}
          text="ESP32-WROOM-32"
          subText={`Active Node: ${seat.id} (${status})`}
          bgColor="#0f172a"
        />
      </group>

      {/* LEFT: IR OBSTACLE SENSOR MODULE */}
      <group position={[-2.1, 0.25, 0]}>
        <RoundedBox args={[0.95, 0.07, 1.3]} radius={0.02}>
          <meshStandardMaterial color="#0284c7" roughness={0.35} />
        </RoundedBox>
        <RoundedBox args={[0.25, 0.14, 0.25]} radius={0.01} position={[0, 0.09, 0.2]}>
          <meshStandardMaterial color="#1d4ed8" />
        </RoundedBox>
        <Cylinder args={[0.08, 0.08, 0.25, 16]} position={[-0.2, 0.08, -0.68]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.5} />
        </Cylinder>
        <Cylinder args={[0.08, 0.08, 0.25, 16]} position={[0.2, 0.08, -0.68]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#1e293b" />
        </Cylinder>
        <Cone args={[0.38, 1.1, 20]} position={[0, 0.08, -1.25]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshStandardMaterial
            color={seat.irDistance <= 65 ? '#e11d48' : '#0ea5e9'}
            transparent
            opacity={0.35}
          />
        </Cone>

        <FloatingBadge3D
          position={[0, 0.75, 0]}
          text={`IR Sensor: ${seat.irDistance} cm`}
          subText="GPIO 34 Digital/ADC Input"
          bgColor="#0369a1"
        />
      </group>

      {/* RIGHT: FSR 406 PRESSURE SENSOR PAD */}
      <group position={[2.1, 0.22, 0]}>
        <Cylinder args={[0.72, 0.72, 0.05, 32]}>
          <meshStandardMaterial color="#0d9488" roughness={0.3} />
        </Cylinder>
        <Cylinder args={[0.56, 0.56, 0.06, 32]} position={[0, 0.01, 0]}>
          <meshStandardMaterial color={statusHex} emissive={statusHex} emissiveIntensity={0.45} />
        </Cylinder>
        {seat.pressureWeight > 0 && (
          <Cylinder
            args={[0.38, 0.38, Math.min(0.65, 0.12 + (seat.pressureWeight / 95) * 0.5), 24]}
            position={[0, 0.25, 0]}
          >
            <meshStandardMaterial color={seat.pressureWeight >= 25 ? '#2563eb' : '#d97706'} />
          </Cylinder>
        )}

        <FloatingBadge3D
          position={[0, 0.8, 0]}
          text={`FSR Pad: ${seat.pressureWeight} kg`}
          subText="GPIO 35 Analog Voltage Divider"
          bgColor="#4338ca"
        />
      </group>

      {/* JUMPER WIRES & ANIMATED SIGNAL PULSES */}
      <RoundedBox args={[1.1, 0.03, 0.04]} position={[-1.05, 0.24, 0]}>
        <meshStandardMaterial color="#0284c7" />
      </RoundedBox>
      <mesh ref={irPulseRef} position={[-1.5, 0.27, 0]}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={1} />
      </mesh>

      <RoundedBox args={[1.1, 0.03, 0.04]} position={[1.05, 0.24, 0]}>
        <meshStandardMaterial color="#4f46e5" />
      </RoundedBox>
      <mesh ref={fsrPulseRef} position={[1.5, 0.27, 0]}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshStandardMaterial color="#6366f1" emissive="#4f46e5" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

export default function HardwareRig3D() {
  const {
    seats,
    selectedSeatId,
    setSelectedSeat,
    workspaceMode,
    setWorkspaceMode,
    updateActiveSeatHardware,
    applyPreset,
  } = useSeatStore();

  const activeSeat = seats.find((s) => s.id === selectedSeatId) || seats[0];
  const status = computeNodeStatus(
    activeSeat.irDistance,
    activeSeat.pressureWeight,
    activeSeat.prebookedUntil
  );

  return (
    <div className="h-full w-full relative bg-gradient-to-b from-slate-100 via-blue-50/40 to-slate-200/70">
      {/* Floating Control Card */}
      <div className="absolute top-3 left-6 z-20 w-92 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 text-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-100 text-blue-700">
              {workspaceMode === 'table' ? <Layers size={16} /> : <Cpu size={16} />}
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {workspaceMode === 'table' ? '3D Open Table Simulator' : '3D ESP32 Hardware Lab'}
              </h2>
              <p className="text-[11px] italic text-slate-500">
                Active Chair <strong className="not-italic text-blue-700">{activeSeat.id}</strong> ({activeSeat.zone})
              </p>
            </div>
          </div>

          <button
            onClick={() => setWorkspaceMode(workspaceMode === 'table' ? 'workbench' : 'table')}
            className="text-[10px] font-bold italic text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 rounded-full shadow-xs cursor-pointer"
          >
            {workspaceMode === 'table' ? 'Open 3D Hardware Lab →' : '← Back to 3D Table'}
          </button>
        </div>

        {/* Chair Selector Pills */}
        <div className="grid grid-cols-6 gap-1 mb-2 bg-slate-100 p-1 rounded-full border border-slate-200/70">
          {seats.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSeat(s.id)}
              className={`text-[10px] py-1 rounded-full transition-all cursor-pointer ${
                s.id === selectedSeatId
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 italic hover:text-slate-900'
              }`}
            >
              {s.id}
            </button>
          ))}
        </div>

        {/* 4-State Scenario Pill Selector (Includes 5-Min Pre-book!) */}
        <div className="bg-slate-100 p-1 rounded-full grid grid-cols-4 gap-1 mb-2.5 border border-slate-200/70">
          <button
            onClick={() => applyPreset('vacant')}
            className={`text-[10px] py-1 rounded-full transition-all cursor-pointer ${
              status === 'Vacant'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-xs'
                : 'text-slate-600 italic'
            }`}
          >
            1. Vacant
          </button>
          <button
            onClick={() => applyPreset('prebook')}
            className={`text-[10px] py-1 rounded-full transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
              status === 'Pre-booked'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold shadow-xs'
                : 'text-slate-600 italic'
            }`}
          >
            <Clock size={10} /> 2. Hold 5m
          </button>
          <button
            onClick={() => applyPreset('studying')}
            className={`text-[10px] py-1 rounded-full transition-all cursor-pointer ${
              status === 'Occupied'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs'
                : 'text-slate-600 italic'
            }`}
          >
            3. Sit
          </button>
          <button
            onClick={() => applyPreset('hogging')}
            className={`text-[10px] py-1 rounded-full transition-all cursor-pointer ${
              status === 'Bag Hogging'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-xs'
                : 'text-slate-600 italic'
            }`}
          >
            4. Bag
          </button>
        </div>

        {/* 3 Live Sensor Sliders (IR + FSR + Acoustic dB) */}
        <div className="space-y-1.5 text-xs">
          <div className="bg-slate-50 px-2.5 py-1.5 rounded-2xl border border-slate-200/70">
            <div className="flex justify-between text-[11px]">
              <span className="font-bold text-slate-700">
                IR Obstacle Sensor <span className="font-normal italic text-slate-500">(GPIO 34)</span>
              </span>
              <span className="text-blue-700 font-bold italic">{activeSeat.irDistance} cm</span>
            </div>
            <input
              type="range"
              min="15"
              max="180"
              value={activeSeat.irDistance}
              onChange={(e) => updateActiveSeatHardware({ irDistance: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer h-1.5"
            />
          </div>

          <div className="bg-slate-50 px-2.5 py-1.5 rounded-2xl border border-slate-200/70">
            <div className="flex justify-between text-[11px]">
              <span className="font-bold text-slate-700">
                FSR Pressure Pad <span className="font-normal italic text-slate-500">(GPIO 35)</span>
              </span>
              <span className="text-indigo-700 font-bold italic">{activeSeat.pressureWeight} kg</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              value={activeSeat.pressureWeight}
              onChange={(e) => updateActiveSeatHardware({ pressureWeight: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer h-1.5"
            />
          </div>

          <div className="bg-slate-50 px-2.5 py-1.5 rounded-2xl border border-slate-200/70">
            <div className="flex justify-between text-[11px]">
              <span className="font-bold text-slate-700">
                Zone Mic Decibels <span className="font-normal italic text-slate-500">(Limit {activeSeat.maxDb}dB)</span>
              </span>
              <span
                className={`font-bold italic ${
                  activeSeat.noiseDb > activeSeat.maxDb ? 'text-red-600' : 'text-teal-700'
                }`}
              >
                {activeSeat.noiseDb} dB
              </span>
            </div>
            <input
              type="range"
              min="28"
              max="82"
              value={activeSeat.noiseDb}
              onChange={(e) => updateActiveSeatHardware({ noiseDb: Number(e.target.value) })}
              className="w-full accent-teal-600 cursor-pointer h-1.5"
            />
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 3.2, 5.2], fov: 42 }}>
        <ambientLight intensity={1.7} />
        <hemisphereLight args={['#ffffff', '#cbd5e1', 1.2]} />
        <directionalLight position={[6, 10, 6]} intensity={1.8} />
        <directionalLight position={[-6, 6, -4]} intensity={0.9} />

        <SharedLongTableScene
          seats={seats}
          selectedSeatId={selectedSeatId}
          onSelectSeat={setSelectedSeat}
          visible={workspaceMode === 'table'}
        />
        <HardwareWorkbenchScene
          seat={activeSeat}
          visible={workspaceMode === 'workbench'}
        />

        <OrbitControls makeDefault enablePan={false} minDistance={2.4} maxDistance={8.5} />
      </Canvas>
    </div>
  );
}