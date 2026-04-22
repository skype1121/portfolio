// 4-1. Robotics Multi-Joint IK Background
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let arms = [];
let mouse = { x: window.innerWidth/2, y: window.innerHeight/2 };

class Segment {
    constructor(x, y, len, angle) {
        this.baseX = x;
        this.baseY = y;
        this.len = len;
        this.angle = angle;
        this.nextX = 0;
        this.nextY = 0;
        this.calculateNext();
    }
    
    calculateNext() {
        this.nextX = this.baseX + Math.cos(this.angle) * this.len;
        this.nextY = this.baseY + Math.sin(this.angle) * this.len;
    }
    
    follow(targetX, targetY) {
        const dx = targetX - this.baseX;
        const dy = targetY - this.baseY;
        this.angle = Math.atan2(dy, dx);
        this.baseX = targetX - Math.cos(this.angle) * this.len;
        this.baseY = targetY - Math.sin(this.angle) * this.len;
    }
    
    setBase(x, y) {
        this.baseX = x;
        this.baseY = y;
        this.calculateNext();
    }
}

class IKArm {
    constructor(x, y, numJoints, jointLen, colorHex, zDepth) {
        this.anchorX = x;
        this.anchorY = y;
        this.segments = [];
        this.color = colorHex;
        this.zDepth = zDepth;
        
        let startX = x;
        let startY = y;
        for(let i=0; i<numJoints; i++) {
            let seg = new Segment(startX, startY, jointLen, 0);
            this.segments.push(seg);
            startX = seg.nextX;
            startY = seg.nextY;
        }
    }
    
    update(targetX, targetY) {
        const px = (width/2 - targetX) * (1 - this.zDepth) * 0.5;
        const py = (height/2 - targetY) * (1 - this.zDepth) * 0.5;
        const finalTx = targetX + px;
        const finalTy = targetY + py;

        if(!this.curTx) { this.curTx = finalTx; this.curTy = finalTy; }
        this.curTx += (finalTx - this.curTx) * 0.05 * this.zDepth;
        this.curTy += (finalTy - this.curTy) * 0.05 * this.zDepth;

        const time = Date.now() * 0.001;
        const offsetX = Math.cos(time + this.anchorX) * 100 * this.zDepth;
        const offsetY = Math.sin(time + this.anchorY) * 100 * this.zDepth;

        let endX = this.curTx + offsetX;
        let endY = this.curTy + offsetY;

        const maxReach = this.segments.length * this.segments[0].len;
        const distToAnchor = Math.hypot(this.anchorX - endX, this.anchorY - endY);
        
        if (distToAnchor > maxReach * 0.95) {
            const angle = Math.atan2(endY - this.anchorY, endX - this.anchorX);
            endX = this.anchorX + Math.cos(angle) * maxReach * 0.95;
            endY = this.anchorY + Math.sin(angle) * maxReach * 0.95;
        }

        let currentTargetX = endX;
        let currentTargetY = endY;

        for (let i = this.segments.length - 1; i >= 0; i--) {
            this.segments[i].follow(currentTargetX, currentTargetY);
            currentTargetX = this.segments[i].baseX;
            currentTargetY = this.segments[i].baseY;
        }

        this.segments[0].setBase(this.anchorX, this.anchorY);
        for (let i = 1; i < this.segments.length; i++) {
            this.segments[i].setBase(this.segments[i-1].nextX, this.segments[i-1].nextY);
        }
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(this.segments[0].baseX, this.segments[0].baseY);
        for(let i=0; i<this.segments.length; i++) {
            ctx.lineTo(this.segments[i].nextX, this.segments[i].nextY);
        }
        ctx.lineWidth = 14 * this.zDepth;
        ctx.strokeStyle = `rgba(${this.color}, 0.15)`;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.segments[0].baseX, this.segments[0].baseY);
        for(let i=0; i<this.segments.length; i++) {
            ctx.lineTo(this.segments[i].nextX, this.segments[i].nextY);
        }
        ctx.lineWidth = 4 * this.zDepth;
        ctx.strokeStyle = `rgba(${this.color}, 0.6)`;
        ctx.stroke();

        for(let i=0; i<this.segments.length; i++) {
            const seg = this.segments[i];
            
            ctx.beginPath();
            ctx.arc(seg.baseX, seg.baseY, 8 * this.zDepth, 0, Math.PI*2);
            ctx.fillStyle = `rgba(0,0,0, 0.8)`;
            ctx.fill();
            ctx.lineWidth = 2 * this.zDepth;
            ctx.strokeStyle = `rgba(${this.color}, 0.8)`;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(seg.baseX, seg.baseY, 3 * this.zDepth, 0, Math.PI*2);
            ctx.fillStyle = `rgba(255, 255, 255, 0.9)`;
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(seg.baseX, seg.baseY);
            ctx.lineTo(seg.baseX + Math.cos(seg.angle)*15*this.zDepth, seg.baseY + Math.sin(seg.angle)*15*this.zDepth);
            ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
            ctx.lineWidth = 1 * this.zDepth;
            ctx.stroke();
        }

        const last = this.segments[this.segments.length-1];
        ctx.beginPath();
        ctx.arc(last.nextX, last.nextY, 6 * this.zDepth, 0, Math.PI*2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2 * this.zDepth;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(last.nextX, last.nextY, 12 * this.zDepth, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(${this.color}, 0.8)`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(last.nextX, last.nextY);
        ctx.lineTo(last.nextX + Math.cos(last.angle - 0.5)*20*this.zDepth, last.nextY + Math.sin(last.angle - 0.5)*20*this.zDepth);
        ctx.moveTo(last.nextX, last.nextY);
        ctx.lineTo(last.nextX + Math.cos(last.angle + 0.5)*20*this.zDepth, last.nextY + Math.sin(last.angle + 0.5)*20*this.zDepth);
        ctx.lineWidth = 3 * this.zDepth;
        ctx.strokeStyle = `rgba(${this.color}, 0.9)`;
        ctx.stroke();
        
        ctx.restore();
    }
}

function initArms() {
    arms = [];
    const colors = ["0, 229, 255", "0, 255, 100", "0, 136, 204", "255, 255, 255"];
    
    arms.push(new IKArm(width*0.1, -100, 7, 100, colors[2], 0.4));
    arms.push(new IKArm(width*0.9, -50, 6, 120, colors[3], 0.6));
    arms.push(new IKArm(-100, height*0.8, 8, 90, colors[0], 0.8));
    arms.push(new IKArm(width*0.8, height + 100, 5, 150, colors[0], 1.2));
    arms.push(new IKArm(width + 50, height*0.4, 6, 110, colors[1], 0.7));
    
    // Sort statically once at initialization
    arms.sort((a,b) => a.zDepth - b.zDepth);

    // Restore IK state across pages if available
    const savedArms = sessionStorage.getItem('sys1_ik_arms');
    if (savedArms) {
        try {
            const parsed = JSON.parse(savedArms);
            parsed.forEach((sArm, i) => {
                if (arms[i]) {
                    arms[i].curTx = sArm.curTx;
                    arms[i].curTy = sArm.curTy;
                    sArm.seg.forEach((sSeg, j) => {
                        if (arms[i].segments[j]) {
                            arms[i].segments[j].angle = sSeg.angle;
                            arms[i].segments[j].baseX = sSeg.baseX;
                            arms[i].segments[j].baseY = sSeg.baseY;
                            arms[i].segments[j].calculateNext();
                        }
                    });
                }
            });
            const sm = sessionStorage.getItem('sys1_ik_mouse');
            if (sm) {
                const psm = JSON.parse(sm);
                mouse.x = psm.x; mouse.y = psm.y;
            }
        } catch(e) {}
    }
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initArms();
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
});
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener('touchmove', (e) => {
    if(e.touches && e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
}, { passive: true });

function animateGraph() {
    ctx.clearRect(0, 0, width, height);

    // CSS handles the grid via .overlay-grid cleanly, removing JS drawing overhead.
    
    arms.forEach(arm => {
        arm.update(mouse.x, mouse.y);
        arm.draw();
    });

    requestAnimationFrame(animateGraph);
}
resize();
animateGraph();


// Typewriter Effect
const textLines = [
    "시뮬레이션을 넘어:",
    "현실 세계의 System-1",
    "반사신경 설계"
];
const typedObj = document.getElementById('typing-slogan');
let lineIdx = 0;
let charIdx = 0;
let currentStrTyped = "";

const chars = "!<>-_\\\\/[]{}—=+*^?#________";

function typeWriter() {
    if (!typedObj) return;
    if (lineIdx < textLines.length) {
        if (charIdx === 0 && lineIdx === 0) currentStrTyped = "";
        
        if (charIdx < textLines[lineIdx].length) {
            if (charIdx === 0 && lineIdx > 0) currentStrTyped += "<br>";
            
            // Signal Decoding Effect
            let scrambleCount = 0;
            const targetChar = textLines[lineIdx].charAt(charIdx);
            
            if (targetChar === " ") {
                currentStrTyped += targetChar;
                typedObj.innerHTML = currentStrTyped + '<span class="cursor">_</span>';
                charIdx++;
                setTimeout(typeWriter, 15);
                return;
            }

            function scramble() {
                if(scrambleCount < 1) { // reduced from 3 to 1 for faster speed
                    const rChar = chars[Math.floor(Math.random() * chars.length)];
                    typedObj.innerHTML = currentStrTyped + rChar + '<span class="cursor">_</span>';
                    scrambleCount++;
                    setTimeout(scramble, 15);
                } else {
                    currentStrTyped += targetChar;
                    typedObj.innerHTML = currentStrTyped + '<span class="cursor">_</span>';
                    charIdx++;
                    setTimeout(typeWriter, 20);
                }
            }
            scramble();
        } else {
            lineIdx++;
            charIdx = 0;
            setTimeout(typeWriter, 200); // slight pause
        }
    } else {
        // End of typing, show core message and apply smooth glows (Korean initially)
        const koHtml = "시뮬레이션을 넘어:<br><span class='blue-smooth'>현실 세계의 <span class='word-smooth' style='font-weight:bold;'>System-1</span><br><span class='glow-smooth' style='font-weight:800;'>반사신경 설계</span></span>";
        const enHtml = "Beyond Simulation:<br><span class='blue-smooth'>Real-World <span class='word-smooth' style='font-weight:bold;'>System-1</span><br><span class='glow-smooth' style='font-weight:800;'>Reflex Architecture</span></span>";

        typedObj.innerHTML = koHtml;
        typedObj.setAttribute('data-ko', koHtml);
        typedObj.setAttribute('data-en', enHtml);
        typedObj.classList.add('lang-text');

        // Check if current language is English, and apply immediately if so
        const activeLangBtn = document.querySelector('.pill-btn.active');
        if (activeLangBtn && activeLangBtn.innerText.toLowerCase() === 'en') {
            typedObj.innerHTML = enHtml;
        }

        const typingDesc = document.getElementById('typing-desc');
        if (typingDesc) { typingDesc.style.opacity = 1; typingDesc.style.transform = 'translateY(0)'; }

        const qp = document.getElementById('quick-profile');
        if(qp) { qp.style.opacity = 1; qp.style.transform = 'translateY(0)'; }
        
        const cta = document.getElementById('hero-cta');
        if(cta) { cta.style.opacity = 1; cta.style.transform = 'translateY(0)'; }
    }
}
setTimeout(typeWriter, 500); // Wait 0.5s before typing

// Background subtle flow elements
for(let k=0; k<8; k++) {
    const line = document.createElement('div');
    line.className = 'can-line';
    line.style.top = (Math.random() * 100) + 'vh';
    line.style.animationDelay = (Math.random() * 5) + 's';
    line.style.animationDuration = (3 + Math.random() * 4) + 's';
    document.body.appendChild(line);
}

// Live System Monitor Stats
const hzEl = document.getElementById('monitor-hz');
const latencyEl = document.getElementById('monitor-latency');
const torqueBar = document.getElementById('torque-bar');

let logCounter = 0;
const logMsgs = ["[SYS] SYNC_OK", "[CAN] TX_RDY", "[RL] INF_ACT", "[IMU] FUSE_9D", "[RTOS] JIT_OK", "[MEM] ALLOC_D"];

function updateLiveStats() {
    if (!hzEl || !latencyEl || !torqueBar) return;
    const hz = (1.0 + (Math.random() * 0.004 - 0.002)).toFixed(3);
    hzEl.innerText = `${hz} kHz`;
    
    // Jitter latency
    let latBase = 14;
    if(Math.random() < 0.1) latBase += 2 + Math.random()*3; // jitter
    const lat = (latBase + (Math.random() * 1.0 - 0.5)).toFixed(1);
    latencyEl.innerText = `${lat} µs`;

    // Torque bar fluctuation & sudden spikes
    let tWidth = 30 + Math.random() * 20;
    if (Math.random() < 0.05) tWidth = 85 + Math.random() * 10; // spike

    // Step Slider logic
    const slider = document.getElementById('step-slider');
    if(slider) {
        let valRad = parseInt(slider.value) / 2000; // -0.05 to +0.05
        document.getElementById('slider-val').innerText = (valRad > 0 ? '+': '') + valRad.toFixed(2) + ' rad';
        tWidth += Math.abs(valRad) * 600; // React to manual input
    }

    torqueBar.style.width = `${Math.min(100, tWidth)}%`;
    torqueBar.style.transform = `translateX(${Math.random()*2 - 1}px)`;

    const sWidth = 70 + Math.random() * 10;
    document.getElementById('step-bar').style.width = `${sWidth}%`;

    // Flicker OK status
    const stateEl = document.getElementById('monitor-state');
    if (stateEl) {
        if (Math.random() < 0.03) stateEl.style.opacity = 0.5;
        else stateEl.style.opacity = 1;
    }

    // Scroll Logic Log
    if(Math.random() < 0.15) {
        const logsDiv = document.getElementById('live-logs');
        if(logsDiv) {
            const newLog = document.createElement('div');
            newLog.innerText = logMsgs[logCounter % logMsgs.length] + ' ' + Date.now().toString().slice(-4);
            logsDiv.appendChild(newLog);
            if(logsDiv.children.length > 2) logsDiv.removeChild(logsDiv.firstChild);
            logCounter++;
        }
    }
}
if (hzEl && latencyEl && torqueBar) {
    setInterval(updateLiveStats, 100);
}

// Intersection Observer (Signal Flow Scrollytelling)
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.3
};

const visibleSections = new Set();
const observer = new IntersectionObserver((entries) => {
    const lightSections = ['why-build'];

    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            visibleSections.add(entry.target.id);
        } else {
            visibleSections.delete(entry.target.id);
        }
    });

    // 2. Resolve background theme by finding which active section is closest to viewport center
    const heroEl = document.getElementById('hero');
    const flowStages = Array.from(document.querySelectorAll('.flow-stage'));
    const allStages = heroEl ? [heroEl, ...flowStages] : flowStages;
    
    const activeElements = allStages.filter(el => el && (visibleSections.has(el.id) || (el.id === 'hero' && visibleSections.has('hero'))));
                                
    // Handle the case where someone scrolled very fast
    if (activeElements.length > 0) {
        let centerEl = activeElements[0];
        let minDiff = Infinity;
        const centerY = window.innerHeight / 2;
        
        activeElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const elCenter = rect.top + (rect.height / 2);
            const diff = Math.abs(elCenter - centerY);
            if (diff < minDiff) {
                minDiff = diff;
                centerEl = el;
            }
        });
        
        // Ensure center element id correctly toggles light theme
        if (lightSections.includes(centerEl.id)) {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    } else {
        // Fallback default
        document.body.classList.remove('light-theme');
    }
}, { threshold: 0.15 }); // Further lower threshold so it triggers earlier on scroll up

document.querySelectorAll('.flow-stage').forEach(stage => {
    observer.observe(stage);
});
const heroSection = document.getElementById('hero');
if(heroSection) observer.observe(heroSection);

// Toggle Engineering Detail for Extreme Smoothness using Web Animations API
window.toggleDetail = function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    
    if (el.getAttribute('data-animating') === 'true') return;
    el.setAttribute('data-animating', 'true');
    
    const parentContainer = el.closest('.content-body');

    if (el.classList.contains('show')) {
        // Closing
        if (parentContainer) parentContainer.classList.remove('expanded');
        const height = el.offsetHeight;
        el.classList.remove('show'); // Resets immediately to final CSS state (height 0)
        
        el.animate([
            { maxHeight: height + 'px', opacity: 1, marginTop: '2rem', paddingTop: '2rem', paddingBottom: '2rem' },
            { maxHeight: '0px', opacity: 0, marginTop: '0', paddingTop: '0', paddingBottom: '0' }
        ], { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }).onfinish = () => {
            el.setAttribute('data-animating', 'false');
        };
    } else {
        // Opening
        if (parentContainer) parentContainer.classList.add('expanded');
        el.classList.add('show'); // Set to final state to measure
        const targetHeight = el.scrollHeight;
        
        el.animate([
            { maxHeight: '0px', opacity: 0, marginTop: '0', paddingTop: '0', paddingBottom: '0' },
            { maxHeight: targetHeight + 'px', opacity: 1, marginTop: '2rem', paddingTop: '2rem', paddingBottom: '2rem' }
        ], { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }).onfinish = () => {
            el.setAttribute('data-animating', 'false');
        };
    }
}

// Visualizations Logic (RL Reward Chart)

const rlCanvas = document.getElementById('rl-chart');
let rlCtx = null;
if (rlCanvas) {
    rlCtx = rlCanvas.getContext('2d');
}
let rlData = [];
for (let i = 0; i < 800; i++) rlData.push({ target: 0, actual: 0 });
let stepTimer = 0;
let currentTarget = 0.5;
let currentActual = 0.5;
let currentVel = 0;

const cycCanvas = document.getElementById('cycloid-canvas');
let cycCtx = null;
if (cycCanvas) {
    cycCtx = cycCanvas.getContext('2d');
}
let cycAngle = 0;

// Optimization: Use IntersectionObserver instead of layout-thrashing offsetParent check
let rlVisible = true;
let cycVisible = true;
if (typeof IntersectionObserver !== 'undefined') {
    const visObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.target.id === 'rl-chart') rlVisible = entry.isIntersecting;
            if (entry.target.id === 'cycloid-canvas') cycVisible = entry.isIntersecting;
        });
    }, { rootMargin: "200px" }); // Start drawing slightly before scrolling into view to avoid pop-in
    if (rlCanvas) visObserver.observe(rlCanvas);
    if (cycCanvas) visObserver.observe(cycCanvas);
}

function updateVis() {
    // 1. Motor Position Tracking (Simulated PD Control)
    if (rlCtx && rlVisible) {
        const w = rlCanvas.width / 2; // Fixed logical dimension
        const h = rlCanvas.height / 2;
        rlCtx.save();
        rlCtx.scale(2, 2);
        rlCtx.clearRect(0, 0, w, h);
        
        // Advance Timer & Generate new step target periodically
        // Run physics 2 times per visual frame for 2x speed
        for (let speedTick = 0; speedTick < 2; speedTick++) {
            stepTimer++;
            if (stepTimer > 600) {
                stepTimer = 0;
                // Target varies between -0.8 and 0.8
                currentTarget = (Math.random() * 1.6 - 0.8);
            }

            // PD Control physics simulation for motor position mapping
            let Kp = 0.003;
            let Kd = 0.04;
            let error = currentTarget - currentActual;
            let accel = Kp * error - Kd * currentVel;
            
            // Micro-disturbances (external forces)
            if (Math.random() < 0.05) accel += (Math.random() - 0.5) * 0.1;
            
            currentVel += accel;
            currentActual += currentVel;
            
            // Slide window
            rlData.shift();
            rlData.push({ target: currentTarget, actual: currentActual });
        }

        // Draw Grid and Axis (Engineering Style)
        rlCtx.lineWidth = 1;
        rlCtx.strokeStyle = 'rgba(255,255,255,0.05)';
        for(let i=0; i<w; i+=50) { rlCtx.beginPath(); rlCtx.moveTo(i,0); rlCtx.lineTo(i,h); rlCtx.stroke(); }
        for(let i=0; i<h; i+=50) { rlCtx.beginPath(); rlCtx.moveTo(0,i); rlCtx.lineTo(w,i); rlCtx.stroke(); }
        
        rlCtx.beginPath(); rlCtx.moveTo(0, h/2); rlCtx.lineTo(w, h/2); 
        rlCtx.strokeStyle = 'rgba(255,255,255,0.2)'; rlCtx.stroke();

        rlCtx.fillStyle = 'rgba(255,255,255,0.4)';
        rlCtx.font = '12px var(--font-mono)';
        rlCtx.fillText('Pos (rad)', 10, 20);
        rlCtx.fillText('Time (s)', w - 65, h - 10);

        // a. Draw Target Line (Dotted White)
        rlCtx.beginPath();
        rlCtx.setLineDash([5, 5]);
        rlCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        rlCtx.lineWidth = 2;
        for(let i=0; i<rlData.length; i++) {
            let px = (i / rlData.length) * w;
            let py = (h/2) - (rlData[i].target * (h*0.28));
            if(i===0) rlCtx.moveTo(px, py);
            else rlCtx.lineTo(px, py);
        }
        rlCtx.stroke();
        rlCtx.setLineDash([]);

        // b. Draw Actual Line (Solid Cyan)
        rlCtx.beginPath();
        rlCtx.strokeStyle = '#00e5ff';
        rlCtx.shadowBlur = 10;
        rlCtx.shadowColor = '#00e5ff';
        rlCtx.lineWidth = 3;
        for(let i=0; i<rlData.length; i++) {
            let px = (i / rlData.length) * w;
            let py = (h/2) - (rlData[i].actual * (h*0.28));
            if(i===0) rlCtx.moveTo(px, py);
            else rlCtx.lineTo(px, py);
        }
        rlCtx.stroke();
        rlCtx.shadowBlur = 0;

        // Current state marker (End of actual line)
        let endX = ((rlData.length - 1) / rlData.length) * w;
        let endY = (h/2) - (currentActual * (h*0.28));
        rlCtx.beginPath();
        rlCtx.arc(endX, endY, 6, 0, Math.PI*2);
        rlCtx.fillStyle = '#fff';
        rlCtx.fill();
        rlCtx.shadowBlur = 10;
        rlCtx.shadowColor = '#00e5ff';
        rlCtx.strokeStyle = '#00e5ff';
        rlCtx.lineWidth = 2;
        rlCtx.stroke();
        rlCtx.shadowBlur = 0;
        rlCtx.restore();
    }

    // 2. Cycloidal Kinematics (Epitrochoid Generator Trace & Drive)
    if (cycCtx && cycVisible) {
        const w = cycCanvas.width / 2; // Fixed logical dimension
        const h = cycCanvas.height / 2;
        cycCtx.save();
        cycCtx.scale(2, 2);
        cycCtx.clearRect(0, 0, w, h);
        
        const cx = w/2;
        const cy = h/2;
        
        // Desmos equation match for epitrochoid: R_pitch=135, r_pitch=9, ECC/h=4.7 (roughly 15 lobes)
        // Scaled to fit 800x400
        const R_pitch = 120;
        const r_pitch = 8;
        const ECC = 6; 
        const numLobes = R_pitch / r_pitch; // 15
        const numPins = numLobes + 1; // 16
        // Ring radius must enclose the epitrochoid: R_pitch + r_pitch (128) + ECC (6) + margin
        const R = R_pitch + r_pitch + ECC + 14; // 148 — pins now clearly outside the curves
        const pinRadius = 7; 

        cycAngle += 0.05; // Input motor rotation
        
        // Draw Cartesian Grid Background (Engineering feel)
        cycCtx.lineWidth = 1;
        cycCtx.strokeStyle = 'rgba(255,255,255,0.05)';
        for(let i=cx; i<w; i+=40) { cycCtx.beginPath(); cycCtx.moveTo(i,0); cycCtx.lineTo(i,h); cycCtx.stroke(); }
        for(let i=cx; i>0; i-=40) { cycCtx.beginPath(); cycCtx.moveTo(i,0); cycCtx.lineTo(i,h); cycCtx.stroke(); }
        for(let i=cy; i<h; i+=40) { cycCtx.beginPath(); cycCtx.moveTo(0,i); cycCtx.lineTo(w,i); cycCtx.stroke(); }
        for(let i=cy; i>0; i-=40) { cycCtx.beginPath(); cycCtx.moveTo(0,i); cycCtx.lineTo(w,i); cycCtx.stroke(); }
        cycCtx.strokeStyle = 'rgba(255,255,255,0.2)';
        cycCtx.beginPath(); cycCtx.moveTo(cx,0); cycCtx.lineTo(cx,h); cycCtx.stroke(); // Y-axis
        cycCtx.beginPath(); cycCtx.moveTo(0,cy); cycCtx.lineTo(w,cy); cycCtx.stroke(); // X-axis
        
        // Cycloidal Drive Kinematics
        const discRot = -cycAngle / numLobes;
        const ex = cx + ECC * Math.cos(cycAngle);
        const ey = cy + ECC * Math.sin(cycAngle);

        cycCtx.save();
        
        // 1. Draw Stator Pins (Outer Ring)
        cycCtx.fillStyle = 'rgba(255,255,255,0.05)';
        cycCtx.strokeStyle = 'rgba(255,255,255,0.2)';
        cycCtx.lineWidth = 1;
        for (let i = 0; i < numPins; i++) {
            let a = i * (2 * Math.PI / numPins);
            let px = cx + R * Math.cos(a);
            let py = cy + R * Math.sin(a);
            cycCtx.beginPath();
            cycCtx.arc(px, py, pinRadius, 0, Math.PI*2);
            cycCtx.fill();
            cycCtx.stroke();
            
            // Full-ring continuous highlight to completely eliminate any flashing/strobe effect
            let dx = px - ex, dy = py - ey;
            let dist = Math.sqrt(dx*dx + dy*dy);
            
            let min_dist = R - ECC;       // Closest physical contact
            let max_dist = R + ECC;       // Furthest clearance
            
            // Map the engagement smoothly across the ENTIRE cycloidal ring (12px variance).
            // This prevents discrete pins from flashing, turning it into a sweeping fluid wave.
            let rawEngagement = Math.max(0, Math.min(1.0, (max_dist - dist) / (max_dist - min_dist)));
            let engagement = Math.pow(rawEngagement, 3.5); // Steepness factor, creates a solid core with smooth long tails
            
            if (engagement > 0.01) {
                cycCtx.beginPath();
                // Smooth radius breathing
                cycCtx.arc(px, py, pinRadius + (engagement * 2.5), 0, Math.PI*2);
                
                // Alpha blended highlight with strict float clamping to prevent parsing bugs
                let fillAlpha = Math.min(1, engagement * 0.85);
                cycCtx.fillStyle = `rgba(0, 229, 255, ${fillAlpha.toFixed(3)})`;
                cycCtx.fill();
                
                // Vibrant glowing edge based on engagement
                cycCtx.shadowBlur = engagement * 15;
                cycCtx.shadowColor = '#00e5ff';
                cycCtx.strokeStyle = `rgba(0, 229, 255, ${Math.min(1, engagement).toFixed(3)})`;
                cycCtx.lineWidth = 1 + engagement * 1.5;
                cycCtx.stroke();
                cycCtx.shadowBlur = 0;
            }
        }
        
        // 2. Draw Cycloidal Epitrochoid Trace (Orange line like Desmos)
        cycCtx.translate(ex, ey);
        cycCtx.rotate(discRot);
        
        cycCtx.beginPath();
        const res = 250;
        for (let i = 0; i <= res; i++) {
            let th = i * (2 * Math.PI / res);
            // Master Epicycloid Math directly mirroring the Desmos screenshot formula aesthetics
            let px = (R_pitch + r_pitch) * Math.cos(th) - ECC * Math.cos( ((R_pitch + r_pitch) / r_pitch) * th );
            let py = (R_pitch + r_pitch) * Math.sin(th) - ECC * Math.sin( ((R_pitch + r_pitch) / r_pitch) * th );
            
            if (i === 0) cycCtx.moveTo(px, py);
            else cycCtx.lineTo(px, py);
        }
        cycCtx.closePath();
        // Keep the inner part dark, border pure mathematical orange tracing
        cycCtx.fillStyle = 'rgba(20, 10, 0, 0.4)';
        cycCtx.fill();
        cycCtx.strokeStyle = '#e67e22'; 
        cycCtx.lineWidth = 2.5;
        cycCtx.shadowBlur = 10;
        cycCtx.shadowColor = '#e67e22';
        cycCtx.stroke();
        cycCtx.shadowBlur = 0;

        // 2.5 Draw Cycloidal Hypotrochoid Trace (Inner inverted resonance line)
        cycCtx.beginPath();
        for (let i = 0; i <= res; i++) {
            let th = i * (2 * Math.PI / res);
            // Hypotrochoid Math 
            let px = (R_pitch - r_pitch) * Math.cos(th) + ECC * Math.cos( ((R_pitch - r_pitch) / r_pitch) * th );
            let py = (R_pitch - r_pitch) * Math.sin(th) - ECC * Math.sin( ((R_pitch - r_pitch) / r_pitch) * th );
            
            if (i === 0) cycCtx.moveTo(px, py);
            else cycCtx.lineTo(px, py);
        }
        cycCtx.closePath();
        cycCtx.strokeStyle = '#00e5ff'; // Cyan for contrast
        cycCtx.lineWidth = 1.5;
        cycCtx.shadowBlur = 8;
        cycCtx.shadowColor = '#00e5ff';
        cycCtx.stroke();
        cycCtx.shadowBlur = 0;
        
        // 3. Output Pin Holes within the generic geometry
        const outPinRadius = 6;
        const outHoleRadius = outPinRadius + ECC; 
        const outPinDist = 65;
        cycCtx.fillStyle = '#050a0f';
        cycCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        cycCtx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            let a = i * (2 * Math.PI / 6);
            let hx = outPinDist * Math.cos(a);
            let hy = outPinDist * Math.sin(a);
            cycCtx.beginPath();
            cycCtx.arc(hx, hy, outHoleRadius, 0, Math.PI*2);
            cycCtx.fill();
            cycCtx.stroke();
        }
        
        // Restore coordinate system for rigid bodies
        cycCtx.restore(); 
        
        // 4. Input Shaft / Eccentric Generating Vector (라인 트레이스)
        cycCtx.beginPath();
        cycCtx.moveTo(cx, cy);
        cycCtx.lineTo(ex, ey);
        cycCtx.strokeStyle = '#00e5ff';
        cycCtx.lineWidth = 2;
        cycCtx.setLineDash([4, 4]);
        cycCtx.stroke();
        cycCtx.setLineDash([]);
        
        cycCtx.beginPath();
        cycCtx.arc(ex, ey, 6, 0, Math.PI*2);
        cycCtx.fillStyle = '#fff';
        cycCtx.fill();
        
        cycCtx.beginPath();
        cycCtx.arc(cx, cy, 6, 0, Math.PI*2);
        cycCtx.fillStyle = '#111';
        cycCtx.strokeStyle = '#fff';
        cycCtx.lineWidth = 2;
        cycCtx.fill();
        cycCtx.stroke();
        
        // 5. Output Pins moving along the trajectories
        cycCtx.save();
        cycCtx.translate(cx, cy);
        cycCtx.rotate(discRot); 
        cycCtx.fillStyle = '#fff';
        for (let i = 0; i < 6; i++) {
            let a = i * (2 * Math.PI / 6);
            let px = outPinDist * Math.cos(a);
            let py = outPinDist * Math.sin(a);
            cycCtx.beginPath();
            cycCtx.arc(px, py, outPinRadius, 0, Math.PI*2);
            cycCtx.fill();
        }
        cycCtx.restore(); // Output Pins block restore
        cycCtx.restore(); // Main scaling block restore
    }
    
    // Auto loop only if there is a context to draw on
    if (rlCtx || cycCtx) {
        requestAnimationFrame(updateVis);
    }
}

if (rlCtx || cycCtx) {
    updateVis();
}

document.addEventListener('DOMContentLoaded', () => {
    const monToggle = document.getElementById('mon-toggle');
    const sysMon = document.getElementById('sys-mon');
    if(monToggle && sysMon) {
        monToggle.innerText = '>';
        monToggle.addEventListener('click', () => {
            sysMon.classList.toggle('collapsed');
            monToggle.innerText = sysMon.classList.contains('collapsed') ? '<' : '>';
        });

        // 웹사이트 켜지고 8초 후에 알아서 접히기
        setTimeout(() => {
            if (!sysMon.classList.contains('collapsed')) {
                sysMon.classList.add('collapsed');
                monToggle.innerText = '<';
            }
        }, 8000);
    }

    // Initialize Latency Wave Char
    const wave = document.getElementById('latency-wave');
    if (wave) {
        const bars = [];
        for(let i=0; i<50; i++) {
            const bar = document.createElement('div');
            bar.className = 'lat-bar';
            bar.style.height = '10px';
            wave.appendChild(bar);
            bars.push(bar);
        }
        setInterval(() => {
            bars.forEach(bar => {
                let h = 10 + Math.random() * 10;
                if(Math.random() < 0.05) h += 20 + Math.random() * 30; // Random jitter spike
                bar.style.height = h + 'px';
                bar.style.opacity = 0.5 + (h / 70);
            });
        }, 80);
    }

    // Email Copy to Clipboard Logic
    const emailCopyBtn = document.getElementById('email-copy');
    let copyCooldown = false;

    if (emailCopyBtn) {
        emailCopyBtn.addEventListener('click', () => {
            if (copyCooldown) return;

            copyCooldown = true;
            
            // Clipboard API needs secure context (HTTPS) or localhost. Fallback included just in case.
            if (navigator.clipboard) {
                navigator.clipboard.writeText('skype1121@dongyang.ac.kr').then(() => {
                    showToast('클립보드에 복사되었습니다!');
                }).catch(err => console.error('Copy failed', err));
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = 'skype1121@dongyang.ac.kr';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    showToast('클립보드에 복사되었습니다!');
                } catch (err) {
                    console.error('Fallback copy failed', err);
                }
                document.body.removeChild(textArea);
            }

            // 1 second cooldown
            setTimeout(() => {
                copyCooldown = false;
            }, 1000);
        });
    }

    function showToast(msg) {
        let toast = document.getElementById('copy-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'copy-toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '30px';
            toast.style.left = '50%';
            toast.style.transform = 'translate(-50%, 20px)';
            toast.style.background = 'rgba(0, 229, 255, 0.9)';
            toast.style.color = '#000';
            toast.style.fontWeight = 'bold';
            toast.style.padding = '10px 20px';
            toast.style.borderRadius = '8px';
            toast.style.opacity = '0';
            toast.style.pointerEvents = 'none';
            toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
            toast.style.zIndex = '9999';
            toast.style.boxShadow = '0 5px 15px rgba(0, 229, 255, 0.4)';
            toast.style.fontFamily = 'var(--font-mono)';
            document.body.appendChild(toast);
        }
        
        toast.innerText = msg;
        toast.offsetHeight; // Force reflow
        
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, 0)';
        
        if (toast.hideTimeout) clearTimeout(toast.hideTimeout);
        toast.hideTimeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translate(-50%, 20px)';
        }, 2000);
    }
});

// Language Toggle Logic
window.setLang = function(lang) {
    const btns = document.querySelectorAll('.pill-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    
    // Find the right button to activate (fallback for direct invocations)
    btns.forEach(btn => {
        if(btn.innerText.toLowerCase() === lang) {
            btn.classList.add('active');
        }
    });

    const pillBg = document.querySelector('.pill-bg');
    if (pillBg) {
        if (lang === 'en') {
            pillBg.style.transform = 'translateX(100%)';
        } else {
            pillBg.style.transform = 'translateX(0)';
        }
    }

    const els = document.querySelectorAll('.lang-text');
    
    // Prevent double fade if already initialized on load
    const activeBtn = document.querySelector('.pill-btn.active');
    const isInitLoadCall = activeBtn && activeBtn.innerText.toLowerCase() === lang && els[0] && els[0].innerHTML === els[0].getAttribute(lang === 'ko' ? 'data-ko' : 'data-en');
    
    if (isInitLoadCall) return;

    // Fade out
    els.forEach(el => {
        el.style.opacity = 0;
    });
    
    // Wait for fade out, change text, then fade in
    setTimeout(() => {
        els.forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (lang === 'ko') {
                    el.placeholder = el.getAttribute('data-ko');
                } else if (lang === 'en') {
                    el.placeholder = el.getAttribute('data-en');
                }
            } else {
                if (lang === 'ko') {
                    el.innerHTML = el.getAttribute('data-ko');
                } else if (lang === 'en') {
                    el.innerHTML = el.getAttribute('data-en');
                }
            }
            el.style.opacity = 1;
        });
        
        setTimeout(() => {
            if (window.updateNavIndicator) window.updateNavIndicator();
        }, 50);
    }, 400); // 0.4s matches CSS transition length
};

// ====== SYSTEM CORE FUNCTIONAL EXTENSIONS ====== //

// 1. Language Memory Initialization
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('sys1_lang');
    if (savedLang) {
        // Apply instantly
        const els = document.querySelectorAll('.lang-text');
        els.forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = el.getAttribute(savedLang === 'ko' ? 'data-ko' : 'data-en');
                // clear innerHTML just in case it was maliciously cached, though it shouldn't be
                el.innerHTML = '';
            } else {
                el.innerHTML = el.getAttribute(savedLang === 'ko' ? 'data-ko' : 'data-en');
            }
        });
        const btns = document.querySelectorAll('.pill-btn');
        btns.forEach(btn => {
            if(btn.innerText.toLowerCase() === savedLang) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        const pillBg = document.querySelector('.pill-bg');
        if (pillBg) pillBg.style.transform = savedLang === 'en' ? 'translateX(100%)' : 'translateX(0)';
    }
});

// Overwrite logic to append localstorage memory
const originalSetLangJS = window.setLang;
window.setLang = function(lang) {
    localStorage.setItem('sys1_lang', lang);
    if(originalSetLangJS) originalSetLangJS(lang);
};

// 2. Custom Robotics Cursor Removed per User Request

// 3. Tab Visibility (System Offline Aesthetic)
let originalTitleText = document.title;
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        document.title = '[SYS_ERR] SIGNAL LOST_';
    } else {
        document.title = 'SYSTEM REBOOTING...';
        setTimeout(() => { document.title = originalTitleText; }, 1500);
    }
});

// 4. Page Transition Interceptor (IK & Nav State Saver ONLY)
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && !link.href.startsWith('mailto:') && !link.href.startsWith('tel:') && link.target !== '_blank' && link.hostname === window.location.hostname && !link.href.includes('#')) {
        
        // Prevent click if clicking the exact SAME page
        const currentUrl = window.location.href;
        const currentPath = currentUrl.split('/').pop().split('?')[0] || 'index.html';
        const linkPath = link.href.split('/').pop().split('?')[0] || 'index.html';
        
        if (currentPath === linkPath) {
            e.preventDefault();
            return; // Ignore and do nothing, prevents double loading
        }
        
        // Save IK Arms State
        const sArms = arms.map(a => ({
            curTx: a.curTx, curTy: a.curTy,
            seg: a.segments.map(s => ({ angle: s.angle, baseX: s.baseX, baseY: s.baseY }))
        }));
        sessionStorage.setItem('sys1_ik_arms', JSON.stringify(sArms));
        sessionStorage.setItem('sys1_ik_mouse', JSON.stringify(mouse));

    }
});

// 5. Scroll Progress Bar
const sysProgBar = document.createElement('div');
sysProgBar.className = 'sys-progress-bar';
document.body.appendChild(sysProgBar);

// 6. Go to Top Button
const sysTopBtn = document.createElement('button');
sysTopBtn.className = 'sys-top-btn';
sysTopBtn.innerHTML = 'TOP';
document.body.appendChild(sysTopBtn);

let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            // Top button logic
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            if (winScroll > 400) {
                sysTopBtn.classList.add('visible');
            } else {
                sysTopBtn.classList.remove('visible');
            }

            // Scroll bar logic
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            let scrolled = 0;
            if (height > 0) scrolled = (winScroll / height) * 100;
            sysProgBar.style.width = scrolled + "%";
            ticking = false;
        });
        ticking = true;
    }
}, { passive: true });

sysTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});



document.addEventListener('DOMContentLoaded', () => {
    const navDiv = document.querySelector('nav > div');
    const navLinks = document.querySelectorAll('nav .nav-archive-btn');
    const currentUrl = window.location.href;
    const path = currentUrl.split('/').pop().split('?')[0] || 'index.html';
    
    let found = false;
    navLinks.forEach(link => {
        if (link.getAttribute('href') === path) {
            link.classList.add('current-page');
            found = true;
        }
    });

    if (!found && navLinks.length > 0 && (currentUrl.endsWith('/') || currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1'))) {
        navLinks[0].classList.add('current-page');
    }
});

/* -----------------------------------------------------------
   EXTREME SMOOTHNESS EXPERIMENT:
   1. Dynamic Custom Cursor (WebGL style)
   2. Magnetic Buttons
   3. Global Background Orbs Injection
----------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {

    // 3. Inject global ambient orbs for continuous aesthetic across all pages
    if (!document.querySelector('.bg-ambient-1')) {
        const orb1 = document.createElement('div');
        orb1.className = 'bg-ambient-1';
        document.body.appendChild(orb1);
        
        const orb2 = document.createElement('div');
        orb2.className = 'bg-ambient-2';
        document.body.appendChild(orb2);
    }

    // 1. Hover interactions (Optional if used by other elements like magnetic buttons, but keeping empty for now if no custom cursor)

    // 2. Magnetic Buttons (Removed per user request)
    const magnets = document.querySelectorAll('.cta-btn, .eng-detail-btn, .nav-logo span');
    /*
    magnets.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const h = rect.width / 2;
            const v = rect.height / 2;
            const x = e.clientX - rect.left - h;
            const y = e.clientY - rect.top - v;
            // Slightly move button towards mouse
            btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px) scale(1.05)`;
            btn.style.transition = 'none'; // remove slow transition for immediate follow
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
            btn.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        });
    });
    */
});

// Cinematic Loader Logic
document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById("intro-loading-screen");
    if (loader) {
        if (!sessionStorage.getItem("introPlayed")) {
            document.body.classList.add("loading-active");
            sessionStorage.setItem("introPlayed", "true");
            
            // Latency drop simulation
            const latencyEl = document.getElementById("loader-latency");
            if (latencyEl) {
                let lat = 999;
                const interval = setInterval(() => {
                    lat -= Math.floor(Math.random() * 50) + 20;
                    if (lat <= 14) {
                        lat = 14;
                        clearInterval(interval);
                        latencyEl.innerText = lat + 'µs [LOCKED]';
                        latencyEl.style.color = '#00ff64';
                        
                        const pulse = document.querySelector('.sys-pulse-circle');
                        if (pulse) {
                            pulse.style.animation = 'none';
                            pulse.style.boxShadow = '0 0 20px #00ff64, 0 0 40px #00ff64';
                        }
                    } else {
                        latencyEl.innerText = lat + 'µs';
                    }
                }, 30); // Rapid drop
            }

            // Door open and fade sequence
            setTimeout(() => {
                loader.classList.add("hidden");
                document.body.classList.remove("loading-active");
                setTimeout(() => {
                    loader.style.display = "none";
                }, 1500); // Wait for the transition
            }, 2000); // Display for 2 seconds before opening doors
        } else {
            loader.style.display = "none";
        }
    }
});

// ==========================================
// System-1 AI Assistant Memory & Logic Engine
// ==========================================
const sys1KnowledgeBase = [
    {
        keywords: ['안녕', '반가워', '누구', '정체', '인사', 'ㅎㅇ', '하이', 'hello'],
        response: "안녕하십니까! 저는 류승윤 엔지니어의 로봇 제어 통합 포트폴리오를 안내하는 'System-1 AI 비서'입니다. 기술 스택, 프로젝트, 혹은 제어 철학에 대해 궁금한 점을 편하게 질문해 주십시오."
    },
    {
        keywords: ['철학', '마인드', 'system-1', 'system1', '시스템1', '가치관', '생각', '모토'],
        response: "류승윤 엔지니어의 핵심 철학은 '먼저 생각하지 않고, 먼저 반응하는 로봇'입니다. 보스턴 다이내믹스와 같이 예측 불가능한 외부 외란(Disturbance)에 대해 복잡한 연산을 줄이고 딜레이 없이 즉각적으로 대응하는 System-1 수준의 모터/하드웨어 제어 최적화를 추구합니다."
    },
    {
        keywords: ['기술', '스택', '스킬', '할줄아는', '역량', '스펙', '언어', 'c', 'cpp', '파이썬', 'python', 'ros', 'c++'],
        response: "주요 기술 스택은 C/C++ 및 Python이며, ROS/ROS2 기반의 프레임워크 위에서 임베디드 펌웨어 제어(CAN, EtherCAT 통신)와 로봇 자율주행, 매니퓰레이터 제어 통합에 강점을 가지고 있습니다. 특히 소프트웨어와 하드웨어의 경계에서 작동하는 미들웨어 최적화를 다룹니다."
    },
    {
        keywords: ['프로젝트', '2026', '2025', '경험', '포트폴리오', '작업물', '뭐했어', '결과물'],
        response: "현재 포트폴리오에는 2026 프로젝트와 2025 프로젝트가 정리되어 있습니다. 험지 돌파용 사족보행 로봇 제어, 임베디드 모터 통합 제어 보드 등에 대한 구체적인 경험을 영상 및 코드로 확인하실 수 있습니다!",
        actionText: "2026 프로젝트 엿보기 →",
        actionLink: "project1.html"
    },
    {
        keywords: ['질문', 'qna', '게시판', '궁금한', '물어', '커뮤니티'],
        response: "포트폴리오 내용 외에 추가로 궁금한 점이 있으시거나 다른 사람들의 질문이 보고 싶으신가요? Q&A 게시판에서 익명으로 질문을 남기거나 추천된 글들을 읽어보실 수 있습니다.",
        actionText: "Q&A 게시판 바로가기 →",
        actionLink: "board.html"
    },
    {
        keywords: ['연락', '컨택', '채용', '면접', '번호', '이메일', '이력서', '전화', 'contact'],
        response: "채용 및 협업 제안은 언제나 대환영입니다! 제안하실 내용이나 면접 일정이 있으신 경우 즉시 확인 후 가장 빠르게 회신 드리겠습니다.",
        actionText: "제안 및 연락하기 [CONTACT] →",
        actionLink: "contact.html"
    },
    {
        keywords: ['보스턴', '다이내믹스', '보스턴다이나믹스', '목표회사', '지원', 'boston'],
        response: "맞습니다. 보스턴 다이내믹스(Boston Dynamics)에서 보여주는 압도적인 하드웨어 제어와 밸런싱 능력이 류승윤 엔지니어의 궁극적인 지향점입니다. 실환경에서의 검증과 강건한(Robust) 제어를 구현하는 엔지니어가 되기 위해 끝없이 궤적을 밟고 있습니다."
    },
    {
        keywords: ['이름', '개발자', '엔지니어', '류승윤', '승윤'],
        response: "설계자 류승윤 님은 가상 시뮬레이션을 넘어 모터 발열, 통신 지연 등 실제 하드웨어의 한계와 직접 부딪치며 시스템 전체를 통합 제어해내는 진짜 '하드웨어 최적화 엔지니어'입니다."
    }
];

window.submitAiQuery = function(btnElement, query) {
    if (btnElement.closest('#mini-agent-window')) {
        document.getElementById('mini-input').value = query;
        document.getElementById('mini-send').click();
    } else {
        document.getElementById('ai-input-field').value = query;
        document.getElementById('ai-send-btn').click();
    }
};

function getSystem1Response(input) {
    if (!input) return null;
    const text = input.replace(/\s+/g, '').toLowerCase();
    
    let finalResponse = {
        text: "앗, 시스템에 학습되지 않은 질문이네요. 😅 하지만 아래의 예시 질문들을 클릭해 보시면 답변을 들으실 수 있습니다!",
        linkHtml: `
            <div style="display:flex; flex-direction:column; gap:8px; margin-top:12px;">
                <button class="ai-suggest-btn glow-hover" style="background:#fff; color:#4a43d1; border:1px solid rgba(122,115,255,0.4); box-shadow: 0 2px 5px rgba(0,0,0,0.05); border-radius:10px; padding:10px 12px; font-weight:800; font-size:0.85rem; cursor:pointer; text-align:left; transition:all 0.2s;" onmouseover="this.style.background='#eef0ff'; this.style.borderColor='#7a73ff';" onmouseout="this.style.background='#fff'; this.style.borderColor='rgba(122,115,255,0.4)';" onclick="window.submitAiQuery(this, '기술스택 요약해줘')">💡 주요 기술 스택이 뭐야?</button>
                <button class="ai-suggest-btn glow-hover" style="background:#fff; color:#4a43d1; border:1px solid rgba(122,115,255,0.4); box-shadow: 0 2px 5px rgba(0,0,0,0.05); border-radius:10px; padding:10px 12px; font-weight:800; font-size:0.85rem; cursor:pointer; text-align:left; transition:all 0.2s;" onmouseover="this.style.background='#eef0ff'; this.style.borderColor='#7a73ff';" onmouseout="this.style.background='#fff'; this.style.borderColor='rgba(122,115,255,0.4)';" onclick="window.submitAiQuery(this, '2026 프로젝트 설명해줘')">📋 2026 프로젝트 설명해줘</button>
                <button class="ai-suggest-btn glow-hover" style="background:#fff; color:#4a43d1; border:1px solid rgba(122,115,255,0.4); box-shadow: 0 2px 5px rgba(0,0,0,0.05); border-radius:10px; padding:10px 12px; font-weight:800; font-size:0.85rem; cursor:pointer; text-align:left; transition:all 0.2s;" onmouseover="this.style.background='#eef0ff'; this.style.borderColor='#7a73ff';" onmouseout="this.style.background='#fff'; this.style.borderColor='rgba(122,115,255,0.4)';" onclick="window.submitAiQuery(this, '어떻게 연락하면 돼')">📞 면접/협업 연락 방법은?</button>
            </div>
        `
    };
    let maxMatchScore = 0;
    
    for (let i = 0; i < sys1KnowledgeBase.length; i++) {
        let matchScore = 0;
        const entry = sys1KnowledgeBase[i];
        
        entry.keywords.forEach(kw => {
            if (text.includes(kw.toLowerCase())) {
                matchScore++;
            }
        });
        
        if (matchScore > maxMatchScore) {
            maxMatchScore = matchScore;
            finalResponse.text = entry.response;
            if (entry.actionLink && entry.actionText) {
                finalResponse.linkHtml = `<a href="${entry.actionLink}" style="display:inline-block; margin-top:12px; padding:8px 16px; background:linear-gradient(135deg, #7a73ff, #00e5ff); color:#fff; border-radius:20px; text-decoration:none; font-size:0.85rem; font-weight:bold; box-shadow:0 4px 10px rgba(0,229,255,0.3); transition:transform 0.2s;">${entry.actionText}</a>`;
            } else {
                finalResponse.linkHtml = "";
            }
        }
    }
    
    return finalResponse.text + (finalResponse.linkHtml ? "<br>" + finalResponse.linkHtml : "");
}

// AI Assistant Interaction Logic
document.addEventListener("DOMContentLoaded", () => {
    const modelContainer = document.getElementById('hero-model-wrap');
    const navAssistBtn = document.getElementById('nav-assist-btn');
    const dragHintText = document.getElementById('drag-action-text');

    function openMiniAgent(onCloseCallback) {
        if (document.getElementById('mini-agent-window')) return;
        
        const win = document.createElement('div');
        win.id = 'mini-agent-window';
        win.innerHTML = `
            <div id="mini-agent-header" style="cursor: move; display:flex; justify-content:space-between; align-items:center; background: linear-gradient(135deg, rgba(235, 240, 255, 0.95), rgba(255, 235, 245, 0.95)); padding: 10px 15px; border-bottom: 1px solid rgba(255,255,255,0.7);">
                <div style="font-weight:bold; color:#223; font-family:var(--font-heading); font-size: 0.9rem; display:flex; align-items:center; gap:8px;">
                    <div style="width:10px; height:10px; border-radius:50%; background:#00e5ff; box-shadow:0 0 10px #00e5ff; animation: pulseBadge 2.5s infinite;"></div>
                    System-1 Mini Assist
                </div>
                <button id="mini-agent-close" style="background:none; border:none; color:#ff3366; font-weight:bold; cursor:pointer; font-size:1.1rem; padding:0 5px;">&times;</button>
            </div>
            <div id="mini-messages" style="flex:1; overflow-y:auto; padding: 15px; display:flex; flex-direction:column; gap:10px; background:rgba(255,255,255,0.7);">
                <div style="background:linear-gradient(135deg, #e6e9ff, #f2e6ff); color:#111; padding:10px 14px; border-radius:15px; border-bottom-left-radius:0; font-size:0.85rem; font-weight:600; box-shadow:0 4px 10px rgba(0,0,0,0.05); align-self:flex-start; max-width:85%;">진행을 도와드릴까요? 어떤 도움이 필요하신가요?</div>
            </div>
            <div style="padding:10px; background:rgba(255,255,255,0.8); border-top:1px solid rgba(255,255,255,0.9); display:flex; gap:5px;">
                <input type="text" id="mini-input" placeholder="질문을 입력하세요..." style="flex:1; border-radius:15px; border:1px solid rgba(0,0,0,0.1); padding:8px 12px; font-size:0.85rem; outline:none;">
                <button id="mini-send" style="background:linear-gradient(135deg, #7a73ff, #00e5ff); border:none; border-radius:15px; color:#fff; font-weight:bold; padding:0 15px; cursor:pointer; font-size:0.8rem; box-shadow:0 4px 10px rgba(0,229,255,0.3);">전송</button>
            </div>
        `;
        
        win.style.position = 'fixed'; win.style.bottom = '40px'; win.style.right = '40px'; win.style.width = '320px'; win.style.height = '450px';
        win.style.backgroundColor = 'rgba(255, 255, 255, 0.85)'; win.style.backdropFilter = 'blur(25px)'; win.style.border = '1px solid rgba(255,255,255,0.5)';
        win.style.borderRadius = '20px'; win.style.boxShadow = '0 15px 50px rgba(0,0,0,0.15), 0 0 40px rgba(122, 115, 255, 0.1)';
        win.style.zIndex = '999999'; win.style.display = 'flex'; win.style.flexDirection = 'column'; win.style.overflow = 'hidden';
        win.style.opacity = '0'; win.style.transform = 'translateY(30px)'; win.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        
        document.body.appendChild(win);
        
        setTimeout(() => { win.style.opacity = '1'; win.style.transform = 'translateY(0)'; }, 10);
        
        const header = document.getElementById('mini-agent-header');
        let isDragging = false, startX, startY, initialX, initialY;
        
        header.addEventListener('pointerdown', (e) => {
            isDragging = true; startX = e.clientX; startY = e.clientY;
            const rect = win.getBoundingClientRect(); initialX = rect.left; initialY = rect.top;
            win.style.bottom = 'auto'; win.style.right = 'auto'; win.style.left = initialX + 'px'; win.style.top = initialY + 'px';
            win.style.transition = 'none'; e.preventDefault();
        });
        
        window.addEventListener('pointermove', (e) => {
            if(!isDragging) return;
            win.style.left = (initialX + (e.clientX - startX)) + 'px'; win.style.top = (initialY + (e.clientY - startY)) + 'px';
        });
        
        window.addEventListener('pointerup', () => { 
            if(isDragging) { isDragging = false; win.style.transition = 'opacity 0.3s, transform 0.3s'; }
        });
        
        document.getElementById('mini-agent-close').addEventListener('click', () => {
            win.style.opacity = '0'; win.style.transform = 'scale(0.9)'; setTimeout(() => win.remove(), 300);
            if(onCloseCallback) onCloseCallback();
        });
        
        const sendMsg = () => {
            const text = document.getElementById('mini-input').value.trim();
            if(!text) return;
            const msgs = document.getElementById('mini-messages');
            const uMsg = document.createElement('div');
            uMsg.style.cssText = 'background:rgba(0,0,0,0.8); color:#fff; padding:10px 14px; border-radius:15px; border-bottom-right-radius:0; font-size:0.85rem; align-self:flex-end; max-width:85%; box-shadow:0 4px 10px rgba(0,0,0,0.1);';
            uMsg.innerText = text; msgs.appendChild(uMsg);
            document.getElementById('mini-input').value = ''; msgs.scrollTop = msgs.scrollHeight;
            
            setTimeout(() => {
                const bMsg = document.createElement('div');
                bMsg.style.cssText = 'background:linear-gradient(135deg, #e6e9ff, #f2e6ff); color:#111; padding:10px 14px; border-radius:15px; border-bottom-left-radius:0; font-size:0.85rem; font-weight:600; align-self:flex-start; max-width:85%; box-shadow:0 4px 10px rgba(0,0,0,0.05); white-space: pre-wrap; line-height: 1.5;';
                
                // Show loading indicator
                bMsg.innerHTML = '<span style="color:#7a73ff;">생각 중...</span>';
                msgs.appendChild(bMsg);
                msgs.scrollTop = msgs.scrollHeight;
                
                setTimeout(() => {
                    bMsg.innerHTML = getSystem1Response(text);
                    msgs.scrollTop = msgs.scrollHeight;
                }, 600);
            }, 300);
        };
        document.getElementById('mini-send').addEventListener('click', sendMsg);
        document.getElementById('mini-input').addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMsg(); });
    }

    if(!modelContainer) {
        const assistLinks = document.querySelectorAll('#nav-assist-btn, a[href*="#assist"]');
        assistLinks.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.innerWidth <= 768) return; 
                history.replaceState('', document.title, window.location.pathname);
                openMiniAgent();
            });
        });
        if (window.location.hash === '#assist' && window.innerWidth > 768) {
            setTimeout(() => openMiniAgent(), 500);
            history.replaceState('', document.title, window.location.pathname);
        }
        return;
    }

    let isAiMode = false;
    let pointerStartX = 0;
    let isTrackingDrop = false;
    let miniAgentMode = false;

    const setAiMode = (active) => {
        isAiMode = active;
        if (active) {
            if (window.scrollY > 200) {
                // If activated while scrolled down, bypass big UI and show mini instantly
                openMiniAgent(() => {
                    isAiMode = false;
                    miniAgentMode = false;
                });
                miniAgentMode = true;
            } else {
                document.body.classList.add('ai-mode-active');
                if (dragHintText) dragHintText.innerText = "오른쪽으로 당겨보세요!";
                miniAgentMode = false;
            }
        } else {
            document.body.classList.remove('ai-mode-active');
            if (dragHintText) dragHintText.innerText = "왼쪽으로 당겨보세요!";
            const win = document.getElementById('mini-agent-window');
            if (win) { win.style.opacity = '0'; win.style.transform = 'scale(0.9)'; setTimeout(() => win.remove(), 300); }
            miniAgentMode = false;
            // Provide a short lockout to prevent double triggers
            setTimeout(() => { if(!isAiMode && typeof isTrackingDrop !== "undefined") { } }, 1200); 
        }
    };

    window.addEventListener('scroll', () => {
        if (!isAiMode) return;
        
        if (window.scrollY > 200) {
            if (!miniAgentMode) {
                // Switch to Mini Agent
                document.body.classList.remove('ai-mode-active');
                openMiniAgent(() => {
                    isAiMode = false;
                    miniAgentMode = false;
                });
                miniAgentMode = true;
            }
        } else {
            if (miniAgentMode) {
                // Return to Big AI layout
                const win = document.getElementById('mini-agent-window');
                if (win) { win.style.opacity = '0'; win.style.transform = 'scale(0.9)'; setTimeout(() => win.remove(), 300); }
                
                document.body.classList.add('ai-mode-active');
                if (dragHintText) dragHintText.innerText = "오른쪽으로 당겨보세요!";
                miniAgentMode = false;
            }
        }
    });

    modelContainer.addEventListener('pointerdown', (e) => {
        pointerStartX = e.clientX;
        isTrackingDrop = true;
    });

    window.addEventListener('pointermove', (e) => {
        if (isTrackingDrop) {
            const dragDistX = e.clientX - pointerStartX;
            
            if (!isAiMode) {
                // Trigger AI when dragged aggressively to the left (-80px)
                if (dragDistX < -80) {
                    setAiMode(true);
                    isTrackingDrop = false; // Prevent multiple triggers
                }
            } else {
                // Trigger Normal Mode when dragged aggressively to the right (+80px)
                if (dragDistX > 80) {
                    setAiMode(false);
                    isTrackingDrop = false; // Prevent multiple triggers
                }
            }
        }
    });

    window.addEventListener('pointerup', () => {
        isTrackingDrop = false;
    });

    // Manual Trigger from ASSIST Nav Tab
    if (navAssistBtn) {
        navAssistBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isAiMode) {
                setAiMode(true);
            }
        });
    }

    // Checking if launched from another page's ASSIST link
    if (window.location.hash === '#assist') {
        const timeToWait = sessionStorage.getItem("introPlayed") ? 500 : 5500;
        setTimeout(() => {
            if (!isAiMode) {
                setAiMode(true);
                // remove hash for cleanliness
                history.replaceState('', document.title, window.location.pathname); 
            }
        }, timeToWait); // Account for loading screen
    }
    // Make "Intro" (소개) tab fully refresh the page
    const introLinks = document.querySelectorAll('nav a[data-ko="소개"]');
    introLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
                window.location.reload();
            } else {
                window.location.href = 'index.html';
            }
        });
    });

    const closeBtn = document.getElementById('ai-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
             setAiMode(false);
        });
    }

    // AI Chat Dummy Logic
    const sendBtn = document.getElementById('ai-send-btn');
    const inputField = document.getElementById('ai-input-field');
    const messagesContainer = document.getElementById('ai-messages');

    if (sendBtn && inputField && messagesContainer) {
        const sendMsg = () => {
            const text = inputField.value.trim();
            if(!text) return;
            
            // User Message
            const userMsg = document.createElement('div');
            userMsg.className = 'ai-msg ai-sent';
            userMsg.innerText = text;
            messagesContainer.appendChild(userMsg);
            
            inputField.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Mock AI Response
            setTimeout(() => {
                const botMsg = document.createElement('div');
                botMsg.className = 'ai-msg ai-received';
                botMsg.innerHTML = '<span style="color:#7a73ff; font-weight:bold;">데이터 패킷 분석 중...</span>';
                messagesContainer.appendChild(botMsg);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                setTimeout(() => {
                    botMsg.innerHTML = getSystem1Response(text);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }, 700);
            }, 300);
        };

        sendBtn.addEventListener('click', sendMsg);
        inputField.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') sendMsg();
        });
    }
});
