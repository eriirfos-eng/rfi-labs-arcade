import * as THREE from 'three';
import { init } from 'recast-navigation';

// Initialize the application
async function start() {
    // 0. Initialize Recast (WASM)
    await init();
    console.log("Recast Navigation Initialized");

    // 1. Setup Scene
    const scene = new THREE.Scene();
    // Orthographic Camera for Isometric View
    // Frustum size adjusted for better visibility
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 40;
    const camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        1,
        1000
    );

    // Set Isometric Angle
    camera.position.set(20, 20, 20);
    camera.lookAt(scene.position);

    // Renderer
    const canvas = document.getElementById('gameCanvas');
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // 2. The Ground (NavMesh visual)
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50),
        new THREE.MeshStandardMaterial({ color: 0x44aa44 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // 3. The Unit (InstancedMesh)
    // Capacity for 100 units
    const unitGeometry = new THREE.BoxGeometry(1, 2, 1);
    const unitMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const unitMesh = new THREE.InstancedMesh(unitGeometry, unitMaterial, 100);
    
    // Initialize first unit position
    const dummy = new THREE.Object3D();
    dummy.position.set(0, 1, 0); // Sit on top of ground
    dummy.updateMatrix();
    unitMesh.setMatrixAt(0, dummy.matrix);
    unitMesh.instanceMatrix.needsUpdate = true;
    
    scene.add(unitMesh);

    // 4. Raycaster (The Mouse Click)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let targetPos = new THREE.Vector3(0, 1, 0);
    let currentPos = new THREE.Vector3(0, 1, 0);

    window.addEventListener('mousedown', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(ground);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            console.log("Move Command to:", point);
            
            // In a full implementation, send 'point' to Recast Agent here.
            // For vertical slice, we verify coordinates and visual update:
            targetPos.copy(point);
            targetPos.y = 1; // Keep unit height constant
        }
    });

    // Handle Resize
    window.addEventListener('resize', () => {
        const aspect = window.innerWidth / window.innerHeight;
        camera.left = -frustumSize * aspect / 2;
        camera.right = frustumSize * aspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 5. Game Loop
    function animate() {
        requestAnimationFrame(animate);

        // Simple Lerp for Visual Feedback (simulating agent movement)
        if (currentPos.distanceTo(targetPos) > 0.1) {
            const dir = new THREE.Vector3().subVectors(targetPos, currentPos).normalize();
            currentPos.add(dir.multiplyScalar(0.2)); // Speed
            
            dummy.position.copy(currentPos);
            dummy.lookAt(targetPos);
            dummy.updateMatrix();
            unitMesh.setMatrixAt(0, dummy.matrix);
            unitMesh.instanceMatrix.needsUpdate = true;
        }

        renderer.render(scene, camera);
    }
    
    animate();
}

start();
