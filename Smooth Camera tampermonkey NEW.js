// ==UserScript==
// @name         GeoFS Smooth Cinematic Camera
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Adds a cinematic smooth camera to GeoFS
// @author       ChatGPT, Gemini, and L Movies
// @match        https://www.geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
// ==============================
// 💾 SETTINGS MANAGER
// ==============================
const STORAGE_KEY = 'geofs-smooth-cam-settings';

const defaultSettings = {
    enabled: true,
    masterSmooth: 75,
    rotSmooth: 0.06,
    transSmooth: 0.035,
    fovSmooth: 0.1,
    fastSmooth: 0.18,
    dragSmooth: 0.12,
    mouseSens: 1.5 // Added Mouse Sensitivity
};

let settings = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { ...defaultSettings };

// Ensure new settings exist in old saved data
if (typeof settings.enabled === 'undefined') settings.enabled = true;
if (typeof settings.mouseSens === 'undefined') settings.mouseSens = 1.5;

function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function waitForGeoFS() {
    if (!window.geofs || !geofs.camera || !geofs.camera.update || !geofs.camera.setFOV) {
        requestAnimationFrame(waitForGeoFS);
        return;
    }
    init();
    injectUI();
}

// ==============================
// 🎨 UI INJECTION
// ==============================
function injectUI() {
    const prefList = document.querySelector('.geofs-preference-list');
    if (!prefList) {
        setTimeout(injectUI, 1000);
        return;
    }

    const graphicsLi = Array.from(prefList.querySelectorAll('li')).find(li => li.innerText.includes('Graphics'));
    if (!graphicsLi) return;

    const container = graphicsLi.querySelector('.geofs-collapsible');
    if (!container || document.getElementById('geofs-smooth-cam-settings')) return;

    const fieldset = document.createElement('fieldset');
    fieldset.id = 'geofs-smooth-cam-settings';
    fieldset.innerHTML = `
        <legend>Cinematic Camera Settings</legend>
        <div style="padding: 10px 5px;">

            <div style="margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #444; padding-bottom: 10px;">
                <label style="font-weight: bold; font-size: 14px; cursor: pointer;" for="cam-enabled">Enable Smooth Camera</label>
                <input type="checkbox" id="cam-enabled" ${settings.enabled ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer;">
            </div>

            <div style="margin-bottom: 15px; background: rgba(0,0,0,0.1); padding: 10px; border-radius: 5px;">
                <label style="display:flex; justify-content:space-between; font-weight:bold; font-size:13px; margin-bottom: 5px;">
                    Master Smoothness <span id="val-masterSmooth">${settings.masterSmooth}%</span>
                </label>
                <p style="font-size: 10px; color: #888; margin-top: 0; margin-bottom: 5px;">Higher % = Heavier, more cinematic camera.</p>
                <input type="range" id="cam-masterSmooth" min="1" max="100" step="1" value="${settings.masterSmooth}" style="width: 100%;">
            </div>

            <details style="margin-bottom: 12px; cursor: pointer;">
                <summary style="font-size: 13px; font-weight: bold; margin-bottom: 8px; color: #ccc;">Advanced Tweaks</summary>
                <div style="padding: 10px; border-left: 2px solid #555; margin-left: 5px;">

                    <div style="margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">
                        <label style="display:flex; justify-content:space-between; font-size:12px; font-weight: bold; color: #fff;">
                            Mouse Sensitivity <span id="val-mouseSens">${settings.mouseSens.toFixed(1)}</span>
                        </label>
                        <input type="range" id="cam-mouseSens" min="0.1" max="5.0" step="0.1" value="${settings.mouseSens}" style="width: 100%;">
                    </div>

                    <p style="font-size: 11px; color: #aaa; margin-bottom: 12px; line-height: 1.3;">
                        <i><b>Note:</b> For these manual sliders, <b>lower values</b> mean a smoother camera. Adjusting these overrides the Master slider.</i>
                    </p>

                    <div style="margin-bottom: 12px;">
                        <label style="display:flex; justify-content:space-between; font-size:12px;">
                            Rotation <span id="val-rotSmooth">${settings.rotSmooth.toFixed(3)}</span>
                        </label>
                        <input type="range" id="cam-rotSmooth" min="0.01" max="0.30" step="0.01" value="${settings.rotSmooth}" style="width: 100%;">
                    </div>

                    <div style="margin-bottom: 12px;">
                        <label style="display:flex; justify-content:space-between; font-size:12px;">
                            Translation <span id="val-transSmooth">${settings.transSmooth.toFixed(3)}</span>
                        </label>
                        <input type="range" id="cam-transSmooth" min="0.01" max="0.30" step="0.01" value="${settings.transSmooth}" style="width: 100%;">
                    </div>

                    <div style="margin-bottom: 12px;">
                        <label style="display:flex; justify-content:space-between; font-size:12px;">
                            Zoom/FOV <span id="val-fovSmooth">${settings.fovSmooth.toFixed(3)}</span>
                        </label>
                        <input type="range" id="cam-fovSmooth" min="0.01" max="0.50" step="0.01" value="${settings.fovSmooth}" style="width: 100%;">
                    </div>

                    <div style="margin-bottom: 12px;">
                        <label style="display:flex; justify-content:space-between; font-size:12px;">
                            Snap Responsiveness <span id="val-fastSmooth">${settings.fastSmooth.toFixed(3)}</span>
                        </label>
                        <input type="range" id="cam-fastSmooth" min="0.01" max="1.00" step="0.01" value="${settings.fastSmooth}" style="width: 100%;">
                    </div>

                    <div style="margin-bottom: 12px;">
                        <label style="display:flex; justify-content:space-between; font-size:12px;">
                            Drag Smoothing <span id="val-dragSmooth">${settings.dragSmooth.toFixed(3)}</span>
                        </label>
                        <input type="range" id="cam-dragSmooth" min="0.01" max="0.30" step="0.01" value="${settings.dragSmooth}" style="width: 100%;">
                    </div>
                </div>
            </details>

            <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="cam-reset" style="width:100%; margin-top:5px;">
                Reset to Cinematic Defaults
            </button>
        </div>
    `;

    container.appendChild(fieldset);

    const updateAdvancedUI = () => {
        ['rotSmooth', 'transSmooth', 'fovSmooth', 'fastSmooth', 'dragSmooth', 'mouseSens'].forEach(id => {
            const el = document.getElementById(`cam-${id}`);
            const valEl = document.getElementById(`val-${id}`);
            if (el && valEl) {
                el.value = settings[id];
                valEl.innerText = id === 'mouseSens' ? settings[id].toFixed(1) : settings[id].toFixed(3);
            }
        });
    };

    document.getElementById('cam-enabled').addEventListener('change', (e) => {
        settings.enabled = e.target.checked;
        saveSettings();
    });

    document.getElementById('cam-masterSmooth').addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        settings.masterSmooth = val;
        document.getElementById('val-masterSmooth').innerText = `${val}%`;

        const t = val / 100;
        settings.rotSmooth = parseFloat((0.25 - (t * 0.24)).toFixed(3));
        settings.transSmooth = parseFloat((0.15 - (t * 0.14)).toFixed(3));
        settings.fovSmooth = parseFloat((0.40 - (t * 0.38)).toFixed(3));
        settings.fastSmooth = parseFloat((0.80 - (t * 0.75)).toFixed(3));
        settings.dragSmooth = parseFloat((0.25 - (t * 0.23)).toFixed(3));

        updateAdvancedUI();
        saveSettings();
    });

    const bindSlider = (id, isFloat = true) => {
        const slider = document.getElementById(`cam-${id}`);
        const valDisplay = document.getElementById(`val-${id}`);
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            settings[id] = val;
            valDisplay.innerText = id === 'mouseSens' ? val.toFixed(1) : val.toFixed(3);
            if (id !== 'mouseSens') document.getElementById('val-masterSmooth').innerText = "Custom";
            saveSettings();
        });
    };

    ['rotSmooth', 'transSmooth', 'fovSmooth', 'fastSmooth', 'dragSmooth', 'mouseSens'].forEach(id => bindSlider(id));

    document.getElementById('cam-reset').addEventListener('click', () => {
        settings = { ...defaultSettings };
        saveSettings();

        document.getElementById('cam-enabled').checked = settings.enabled;
        document.getElementById('cam-masterSmooth').value = settings.masterSmooth;
        document.getElementById('val-masterSmooth').innerText = `${settings.masterSmooth}%`;
        updateAdvancedUI();
    });
}

// ==============================
// 🎬 CAMERA ENGINE
// ==============================
function init() {
    const cam = geofs.camera;
    console.log("GeoFS Smooth Camera loaded");

    const state = {};

    function getViewState(mode) {
        if (!state[mode]) {
            const def = cam.definitions[mode] || {
                orientations:{current:[0,0,0]},
                offsets:{current:[0,0,0]},
                distance: 10
            };

            state[mode] = {
                targetRot: [...def.orientations.current],
                currentRot: [...def.orientations.current],
                targetOff: [...def.offsets.current],
                currentOff: [...def.offsets.current],
                targetDist: def.distance || 10,
                currentDist: def.distance || 10,
                targetFOV: cam.currentFOV || cam.defaultFOV,
                currentFOV: cam.currentFOV || cam.defaultFOV,
                initialized: false,
                isDragging: false,
                isSnapping: false
            };
        }
        return state[mode];
    }

    function applyState(mode, s, forceSnap = false) {
        const def = cam.definitions[mode];
        if (!def) return;

        if (forceSnap || !settings.enabled) {
            s.currentRot = [...s.targetRot];
            s.currentOff = [...s.targetOff];
            s.currentDist = s.targetDist;
            s.currentFOV = s.targetFOV;
        } else {
            const rFactor = s.isSnapping ? settings.fastSmooth : settings.rotSmooth;
            const tFactor = s.isDragging ? settings.dragSmooth : settings.transSmooth;

            for (let i = 0; i < 3; i++) {
                let diff = s.targetRot[i] - s.currentRot[i];
                while (diff < -180) diff += 360;
                while (diff > 180) diff -= 360;
                s.currentRot[i] += diff * rFactor;

                s.currentOff[i] += (s.targetOff[i] - s.currentOff[i]) * tFactor;
            }

            s.currentDist += (s.targetDist - s.currentDist) * tFactor;
            s.currentFOV += (s.targetFOV - s.currentFOV) * settings.fovSmooth;
        }

        def.orientations.current[0] = s.currentRot[0];
        def.orientations.current[1] = s.currentRot[1];
        def.orientations.current[2] = s.currentRot[2];

        def.offsets.current[0] = s.currentOff[0];
        def.offsets.current[1] = s.currentOff[1];
        def.offsets.current[2] = s.currentOff[2];

        if (mode === 'follow' && s.initialized) {
            def.distance = s.currentDist;
        }

        geofs.api.setFOV(cam.cam, s.currentFOV);
    }

    if (!cam.__smoothCameraHooked) {
        cam.__smoothCameraHooked = true;

        cam.setFOV = function(value) {
            const s = getViewState(cam.currentModeName);
            s.targetFOV = value || cam.defaultFOV;
            cam.currentFOV = s.targetFOV;
        };

        cam.lookAround = function (pitch, tilt) {
            const s = getViewState(cam.currentModeName);
            if (pitch != null) s.targetRot[0] = pitch;
            if (tilt != null) s.targetRot[1] = tilt;
            applyState(cam.currentModeName, s);
            return true;
        };

        cam.rotate = function (dx = 0, dy = 0, dz = 0) {
            const s = getViewState(cam.currentModeName);
            s.targetRot[0] -= (dx * settings.mouseSens);
            s.targetRot[1] += (dy * settings.mouseSens);
            s.targetRot[2] += (dz * settings.mouseSens);
            applyState(cam.currentModeName, s);
            return true;
        };

        cam.translate = function (e = 0, t = 0, a = 0) {
            const mode = cam.currentModeName;
            const s = getViewState(mode);

            s.isDragging = true;
            clearTimeout(s.dragTimer);
            s.dragTimer = setTimeout(() => s.isDragging = false, 120);

            if (mode === "follow") {
                s.targetDist += t;
                s.targetOff[0] += e;
                s.targetOff[2] += a;
            } else {
                const r = geofs.aircraft.instance.object3d.getWorldFrame();
                const rotM = M33.rotationXYZ(M33.identity(), [
                    -cam.htr[1] * (Math.PI / 180),
                    0,
                    cam.htr[0] * (Math.PI / 180)
                ]);
                let o = M33.transform(rotM, [e, t, a]);
                o = M33.transformByTranspose(r, o);

                s.targetOff[0] += o[0];
                s.targetOff[1] += o[1];
                s.targetOff[2] += o[2];
            }

            applyState(mode, s);
            return true;
        };

        cam.setRotation = function (e, t, a) {
            const s = getViewState(cam.currentModeName);
            const old = [...s.targetRot];

            if (e != null) s.targetRot[0] = e;
            if (t != null) s.targetRot[1] = t;
            if (a != null) s.targetRot[2] = a;

            const dist = Math.abs(s.targetRot[0] - old[0]) +
                         Math.abs(s.targetRot[1] - old[1]);

            if (dist > 20) {
                s.isSnapping = true;
                setTimeout(() => s.isSnapping = false, 250);
            }

            applyState(cam.currentModeName, s);
            return true;
        };
    }

    function mainLoop() {
        const mode = cam.currentModeName;
        const def = cam.definitions[mode];

        if (def && def.orientations) {
            const s = getViewState(mode);

            if (!s.initialized) {
                s.targetRot = [...def.orientations.current];
                s.currentRot = [...def.orientations.current];
                s.targetOff = [...def.offsets.current];
                s.currentOff = [...def.offsets.current];
                s.targetDist = def.distance || 0;
                s.currentDist = def.distance || 0;
                s.targetFOV = cam.currentFOV || cam.defaultFOV;
                s.currentFOV = cam.currentFOV || cam.defaultFOV;
                s.initialized = true;
            }

            applyState(mode, s);
        }

        requestAnimationFrame(mainLoop);
    }

    $(document).on("cameraChange", () => {
        const mode = cam.currentModeName;
        const s = getViewState(mode);
        const def = cam.definitions[mode];

        if (def) {
            s.targetRot = [...def.orientations.current];
            s.targetOff = [...def.offsets.current];
            s.targetDist = def.distance || 0;
            s.targetFOV = cam.currentFOV || cam.defaultFOV;
            applyState(mode, s, true);
        }
    });

    mainLoop();
}

setTimeout(waitForGeoFS, 1000);

})();