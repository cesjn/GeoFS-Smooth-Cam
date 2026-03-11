// ==UserScript==
// @name         GeoFS Smooth Cinematic Camera
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Adds a cinematic smooth camera to GeoFS with non-refreshing reset
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
        mouseSens: 1.5,
        dynamicZoom: true,
        zoomScale: 5.0
    };

    let settings = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { ...defaultSettings };

    Object.keys(defaultSettings).forEach(key => {
        if (typeof settings[key] === 'undefined') settings[key] = defaultSettings[key];
    });

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
    // 🎨 UI INJECTION (GEOfS NATIVE)
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

        // Visual helper to move sliders to specific values
        const updateSliderVisuals = (id, val) => {
            const wrap = document.getElementById(`wrapper-${id}`);
            if (wrap) {
                const fill = document.getElementById(`fill-${id}`);
                const min = parseFloat(wrap.getAttribute('data-min'));
                const max = parseFloat(wrap.getAttribute('data-max'));
                const percent = ((val - min) / (max - min)) * 100;
                if (fill) fill.style.width = percent + "%";
                wrap.querySelector('.slider-input').value = val;
                wrap.setAttribute('value', val);
            }
        };

        // Bridge function: Crucial for making sliders actually change camera values
        window.smoothCamUpdate = function(key, value) {
            const val = parseFloat(value);
            settings[key] = val;

            if (key === 'masterSmooth') {
                const t = val / 100;
                settings.rotSmooth = parseFloat((0.25 - (t * 0.24)).toFixed(3));
                settings.transSmooth = parseFloat((0.15 - (t * 0.14)).toFixed(3));
                settings.fovSmooth = parseFloat((0.40 - (t * 0.38)).toFixed(3));
                settings.fastSmooth = parseFloat((0.80 - (t * 0.75)).toFixed(3));
                settings.dragSmooth = parseFloat((0.25 - (t * 0.23)).toFixed(3));
                
                ['rotSmooth', 'transSmooth', 'fovSmooth', 'fastSmooth', 'dragSmooth'].forEach(id => {
                    updateSliderVisuals(id, settings[id]);
                });
            }
            saveSettings();
        };

        function createSliderHTML(id, label, min, max, precision, value) {
            const percent = ((value - min) / (max - min)) * 100;
            return `
                <div class="slider" data-type="slider" id="wrapper-${id}" 
                     data-update="{window.smoothCamUpdate('${id}', value)}" 
                     value="${value}" data-min="${min}" data-max="${max}" 
                     data-precision="${precision}" tabindex="0">
                    <div class="slider-rail">
                        <div class="slider-selection" id="fill-${id}" style="width: ${percent}%;">
                            <div class="slider-grippy">
                                <input class="slider-input" value="${value}" readonly>
                            </div>
                        </div>
                    </div>
                    <label>${label}</label>
                </div>`;
        }

        const wrapper = document.createElement('div');
        wrapper.id = 'geofs-smooth-cam-settings';
        
        wrapper.innerHTML = `
            <fieldset style="border-top: 1px solid #ccc; margin-top: 10px;">
                <legend class="geofs-hideForMobile">Cinematic Camera - Smoothness Master</legend>
                <legend class="geofs-onlyForMobile">Smooth Camera Master</legend>
                
                <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect is-upgraded ${settings.enabled ? 'is-checked' : ''}" for="cam-enabled" style="margin-bottom: 10px;">
                    <input type="checkbox" id="cam-enabled" class="mdl-switch__input" ${settings.enabled ? 'checked' : ''}>
                    <span class="mdl-switch__label">Enable Smooth Camera</span>
                    <div class="mdl-switch__track"></div>
                    <div class="mdl-switch__thumb"><span class="mdl-switch__focus-helper"></span></div>
                </label>

                ${createSliderHTML('masterSmooth', 'Master Smoothness (%)', 1, 100, 0, settings.masterSmooth)}
            </fieldset>

            <fieldset class="geofs-advancedGraphics geofs-advanced geofs-expanded">
                <span class="geofs-advancedToggle">Advanced Tweaks</span>
                <div class="geofs-stopMousePropagation">
                    ${createSliderHTML('mouseSens', 'Mouse Sensitivity', 0.1, 5.0, 1, settings.mouseSens)}
                    
                    <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect is-upgraded ${settings.dynamicZoom ? 'is-checked' : ''}" for="cam-dynamicZoom">
                        <input type="checkbox" id="cam-dynamicZoom" class="mdl-switch__input" ${settings.dynamicZoom ? 'checked' : ''}>
                        <span class="mdl-switch__label">Dynamic Zoom (Follow)</span>
                        <div class="mdl-switch__track"></div>
                        <div class="mdl-switch__thumb"><span class="mdl-switch__focus-helper"></span></div>
                    </label>

                    ${createSliderHTML('zoomScale', 'Zoom Strength', 1.0, 20.0, 1, settings.zoomScale)}
                    
                    <p style="font-size: 10px; opacity: 0.6; margin: 10px 0;">Individual Smooth Constants</p>
                    ${['rotSmooth', 'transSmooth', 'fovSmooth', 'fastSmooth', 'dragSmooth'].map(id => 
                        createSliderHTML(id, id.replace('Smooth', ''), 0.01, (id === 'fastSmooth' ? 1.0 : 0.5), 3, settings[id])
                    ).join('')}

                    <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="cam-reset" style="width:100%; margin-top:10px;">
                        Reset Defaults
                    </button>
                </div>
            </fieldset>
        `;

        container.appendChild(wrapper);

        // UI EVENT HOOKS
        $(wrapper).find('.slider').each(function() {
            const id = this.id.replace('wrapper-', '');
            $(this).on('change', (e, value) => {
                window.smoothCamUpdate(id, value);
            });
        });

        const toggleEnabled = (id, key) => {
            const el = document.getElementById(id);
            el.addEventListener('change', (e) => { 
                settings[key] = e.target.checked; 
                e.target.parentElement.classList.toggle('is-checked', settings[key]);
                saveSettings(); 
            });
        };

        toggleEnabled('cam-enabled', 'enabled');
        toggleEnabled('cam-dynamicZoom', 'dynamicZoom');

        // FIXED RESET BUTTON: No reload, just sync
        document.getElementById('cam-reset').addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Reset cinematic camera to defaults?")) {
                // 1. Reset Settings Object
                settings = Object.assign({}, defaultSettings);
                saveSettings();

                // 2. Sync Checkboxes
                const enBox = document.getElementById('cam-enabled');
                enBox.checked = settings.enabled;
                enBox.parentElement.classList.toggle('is-checked', settings.enabled);

                const dynBox = document.getElementById('cam-dynamicZoom');
                dynBox.checked = settings.dynamicZoom;
                dynBox.parentElement.classList.toggle('is-checked', settings.dynamicZoom);

                // 3. Sync all Sliders
                const allSliderKeys = ['masterSmooth', 'mouseSens', 'zoomScale', 'rotSmooth', 'transSmooth', 'fovSmooth', 'fastSmooth', 'dragSmooth'];
                allSliderKeys.forEach(key => updateSliderVisuals(key, settings[key]));
            }
        });
    }

    // ==============================
    // 🎬 CAMERA ENGINE
    // ==============================
    function init() {
        const cam = geofs.camera;
        const state = {};

        function getViewState(mode) {
            if (!state[mode]) {
                const def = cam.definitions[mode] || { orientations:{current:[0,0,0]}, offsets:{current:[0,0,0]}, distance: 10 };
                state[mode] = {
                    targetRot: [...def.orientations.current], currentRot: [...def.orientations.current],
                    targetOff: [...def.offsets.current], currentOff: [...def.offsets.current],
                    targetDist: def.distance || 10, currentDist: def.distance || 10,
                    targetFOV: cam.currentFOV || cam.defaultFOV, currentFOV: cam.currentFOV || cam.defaultFOV,
                    lastFOV: cam.currentFOV || cam.defaultFOV, zoomVelocity: 0,
                    initialized: false, isDragging: false, isSnapping: false
                };
            }
            return state[mode];
        }

        function applyState(mode, s, forceSnap = false) {
            const def = cam.definitions[mode];
            if (!def) return;

            if (forceSnap || !settings.enabled) {
                s.currentRot = [...s.targetRot]; s.currentOff = [...s.targetOff];
                s.currentDist = s.targetDist; s.currentFOV = s.targetFOV;
            } else {
                const rFactor = s.isSnapping ? settings.fastSmooth : settings.rotSmooth;
                const tFactor = s.isDragging ? settings.dragSmooth : settings.transSmooth;

                for (let i = 0; i < 3; i++) {
                    let diff = s.targetRot[i] - s.currentRot[i];
                    while (diff < -180) diff += 360; while (diff > 180) diff -= 360;
                    s.currentRot[i] += diff * rFactor;
                    s.currentOff[i] += (s.targetOff[i] - s.currentOff[i]) * tFactor;
                }
                s.currentDist += (s.targetDist - s.currentDist) * tFactor;
                s.currentFOV += (s.targetFOV - s.currentFOV) * settings.fovSmooth;

                if (mode === 'follow' && s.initialized && settings.dynamicZoom) {
                    const fovDelta = s.currentFOV - s.lastFOV;
                    s.zoomVelocity += (fovDelta * settings.zoomScale);
                    s.zoomVelocity *= 0.85;
                    s.targetDist += s.zoomVelocity;
                }
                s.lastFOV = s.currentFOV;
            }

            def.orientations.current = [...s.currentRot];
            def.offsets.current = [...s.currentOff];
            if (mode === 'follow' && s.initialized) def.distance = s.currentDist;
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
                return true;
            };

            cam.rotate = function (dx = 0, dy = 0, dz = 0) {
                const s = getViewState(cam.currentModeName);
                s.targetRot[0] -= (dx * settings.mouseSens);
                s.targetRot[1] += (dy * settings.mouseSens);
                s.targetRot[2] += (dz * settings.mouseSens);
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
                    s.targetOff[0] += e; s.targetOff[2] += a;
                } else {
                    const r = geofs.aircraft.instance.object3d.getWorldFrame();
                    const rotM = M33.rotationXYZ(M33.identity(), [-cam.htr[1] * (Math.PI / 180), 0, cam.htr[0] * (Math.PI / 180)]);
                    let o = M33.transform(rotM, [e, t, a]);
                    o = M33.transformByTranspose(r, o);
                    s.targetOff[0] += o[0]; s.targetOff[1] += o[1]; s.targetOff[2] += o[2];
                }
                return true;
            };

            cam.setRotation = function (e, t, a) {
                const s = getViewState(cam.currentModeName);
                const old = [...s.targetRot];
                if (e != null) s.targetRot[0] = e;
                if (t != null) s.targetRot[1] = t;
                if (a != null) s.targetRot[2] = a;

                if (Math.abs(s.targetRot[0] - old[0]) + Math.abs(s.targetRot[1] - old[1]) > 20) {
                    s.isSnapping = true;
                    setTimeout(() => s.isSnapping = false, 300);
                }
                return true;
            };

            const originalReset = cam.reset;
            cam.reset = function() {
                const mode = cam.currentModeName;
                originalReset.apply(this, arguments);

                Object.keys(cam.definitions).forEach(m => {
                    const stateObj = state[m];
                    const def = cam.definitions[m];
                    if (stateObj && def) {
                        if (def.orientation) stateObj.targetRot = [...def.orientation];
                        if (def.distance) stateObj.targetDist = def.distance;
                        stateObj.isSnapping = true;
                        setTimeout(() => { if (stateObj) stateObj.isSnapping = false; }, 500);
                    }
                });
            };

            const originalSetToNeutral = cam.setToNeutral;
            cam.setToNeutral = function() {
                originalSetToNeutral.apply(cam, arguments);
                const mode = cam.currentModeName;
                const s = getViewState(mode);
                const def = cam.definitions[mode];
                if (def && s) {
                    s.targetRot = [...def.orientations.neutral];
                    s.targetOff = [...def.offsets.neutral];
                    s.targetDist = def.distance || 10;
                    s.targetFOV = def.FOV || cam.defaultFOV;
                    s.isSnapping = true;
                    setTimeout(() => s.isSnapping = false, 400);
                }
            };
        }

        function mainLoop() {
            const mode = cam.currentModeName;
            const def = cam.definitions[mode];
            if (def && def.orientations) {
                const s = getViewState(mode);
                if (!s.initialized) {
                    s.targetRot = [...def.orientations.current]; s.currentRot = [...def.orientations.current];
                    s.targetOff = [...def.offsets.current]; s.currentOff = [...def.offsets.current];
                    s.targetDist = def.distance || 0; s.currentDist = def.distance || 0;
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
                applyState(mode, s, true);
            }
        });

        mainLoop();
    }

    setTimeout(waitForGeoFS, 1000);

})();
