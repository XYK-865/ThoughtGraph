import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function makeLabel(text, pos, radius) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(245,245,245,0.92)';
    ctx.font = '600 44px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let t = text || '';
    while (ctx.measureText(t).width > 244 && t.length > 1) t = t.slice(0, -1);
    if (t !== (text || '')) t = t.slice(0, -1) + '…';
    ctx.fillText(t, 128, 34);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(pos);
    sprite.position.y += radius + 0.7;
    const s = 2.4;
    sprite.scale.set(s, s * 0.25, 1);
    sprite.userData.isLabel = true;
    return sprite;
}

export default function UniverseGraph({ nodes, edges, onSelect, selectedId }) {
    const mountRef = useRef(null);
    const [hoveredId, setHoveredId] = useState(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount || nodes.length === 0) return;

        const width = mount.clientWidth || 800;
        const height = mount.clientHeight || 600;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
        camera.position.set(0, 0, 30);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        mount.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.65));
        const pLight = new THREE.PointLight(0xfacc15, 1.1, 300);
        pLight.position.set(22, 24, 30);
        scene.add(pLight);
        const p2 = new THREE.PointLight(0xa855f7, 0.5, 300);
        p2.position.set(-20, -10, -20);
        scene.add(p2);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.55;
        controls.minDistance = 6;
        controls.maxDistance = 80;

        // degree
        const degree = new Map();
        nodes.forEach((n) => degree.set(n.id, 0));
        edges.forEach((e) => {
            if (degree.has(e.fromNodeId)) degree.set(e.fromNodeId, degree.get(e.fromNodeId) + 1);
            if (degree.has(e.toNodeId)) degree.set(e.toNodeId, degree.get(e.toNodeId) + 1);
        });

        // initial positions on a sphere
        const pos = new Map();
        nodes.forEach((n) => {
            const r = 9 + Math.random() * 4;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos.set(n.id, new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            ));
        });

        // force simulation
        const N = nodes.length;
        const ideal = 4.2;
        for (let iter = 0; iter < 260; iter++) {
            for (let i = 0; i < N; i++) {
                for (let j = i + 1; j < N; j++) {
                    const pa = pos.get(nodes[i].id);
                    const pb = pos.get(nodes[j].id);
                    const dx = pa.x - pb.x, dy = pa.y - pb.y, dz = pa.z - pb.z;
                    let d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01;
                    const f = 9 / (d * d);
                    const ux = dx / d, uy = dy / d, uz = dz / d;
                    pa.x += ux * f; pa.y += uy * f; pa.z += uz * f;
                    pb.x -= ux * f; pb.y -= uy * f; pb.z -= uz * f;
                }
            }
            edges.forEach((e) => {
                const pa = pos.get(e.fromNodeId);
                const pb = pos.get(e.toNodeId);
                if (!pa || !pb) return;
                const dx = pb.x - pa.x, dy = pb.y - pa.y, dz = pb.z - pa.z;
                const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01;
                const f = (d - ideal) * 0.12;
                const ux = dx / d, uy = dy / d, uz = dz / d;
                pa.x += ux * f; pa.y += uy * f; pa.z += uz * f;
                pb.x -= ux * f; pb.y -= uy * f; pb.z -= uz * f;
            });
            pos.forEach((p) => p.multiplyScalar(0.985));
        }

        // node meshes
        const entityColor = new THREE.Color('#facc15');
        const keyColor = new THREE.Color('#a855f7');
        const nodeMeshes = new Map();
        const labelSprites = [];
        nodes.forEach((n) => {
            const deg = degree.get(n.id) || 0;
            const radius = Math.max(0.2, 0.3 + deg * 0.07);
            const color = n.kind === 'keypoint' ? keyColor : entityColor;
            const geo = new THREE.SphereGeometry(radius, 20, 20);
            const mat = new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: 0.28,
                roughness: 0.45,
                metalness: 0.2,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos.get(n.id));
            mesh.userData = { nodeId: n.id, baseEmissive: 0.28 };
            scene.add(mesh);
            nodeMeshes.set(n.id, mesh);
            const label = makeLabel(n.label, mesh.position, radius);
            scene.add(label);
            labelSprites.push(label);
        });

        // edges
        const edgeMat = new THREE.LineBasicMaterial({ color: 0x6b7280, transparent: true, opacity: 0.32 });
        edges.forEach((e) => {
            const pa = pos.get(e.fromNodeId);
            const pb = pos.get(e.toNodeId);
            if (!pa || !pb) return;
            const g = new THREE.BufferGeometry().setFromPoints([pa.clone(), pb.clone()]);
            scene.add(new THREE.Line(g, edgeMat));
        });

        // interaction
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        let curHover = null;
        function setHover(id) {
            if (curHover === id) return;
            if (curHover) {
                const m = nodeMeshes.get(curHover);
                if (m) m.material.emissiveIntensity = m.userData.baseEmissive;
            }
            curHover = id;
            if (id) {
                const m = nodeMeshes.get(id);
                if (m) m.material.emissiveIntensity = 0.7;
                renderer.domElement.style.cursor = 'pointer';
            } else {
                renderer.domElement.style.cursor = 'default';
            }
            setHoveredId(id);
        }
        function pick(ev) {
            const rect = renderer.domElement.getBoundingClientRect();
            pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);
            const hits = raycaster.intersectObjects([...nodeMeshes.values()]);
            return hits.length ? hits[0].object.userData.nodeId : null;
        }
        function onMove(ev) { setHover(pick(ev)); }
        function onClick(ev) {
            const id = pick(ev);
            if (id) {
                const node = nodes.find((n) => n.id === id);
                if (node && onSelect) onSelect(node);
            }
        }
        renderer.domElement.addEventListener('pointermove', onMove);
        renderer.domElement.addEventListener('click', onClick);

        // resize
        const ro = new ResizeObserver(() => {
            const w = mount.clientWidth, h = mount.clientHeight;
            if (w > 0 && h > 0) {
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            }
        });
        ro.observe(mount);

        // selected highlight
        if (selectedId && nodeMeshes.has(selectedId)) {
            const m = nodeMeshes.get(selectedId);
            m.userData.baseEmissive = 0.55;
            m.material.emissiveIntensity = 0.55;
        }

        let raf;
        const animate = () => {
            raf = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            renderer.domElement.removeEventListener('pointermove', onMove);
            renderer.domElement.removeEventListener('click', onClick);
            controls.dispose();
            scene.traverse((o) => {
                if (o.geometry) o.geometry.dispose();
                if (o.material) {
                    if (o.material.map) o.material.map.dispose();
                    Array.isArray(o.material) ? o.material.forEach((m) => m.dispose()) : o.material.dispose();
                }
            });
            renderer.dispose();
            if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        };
    }, [nodes, edges]);

    return (
        <div className="absolute inset-0">
            <div ref={mountRef} className="absolute inset-0" />
            {hoveredId && (
                <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-border bg-card/80 px-2.5 py-1 text-[11px] text-foreground/90 backdrop-blur-md">
                    {nodes.find((n) => n.id === hoveredId)?.label}
                </div>
            )}
        </div>
    );
}