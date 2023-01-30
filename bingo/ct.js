/*! Made with ct.js http://ctjs.rocks/ */

if (location.protocol === 'file:') {
    // eslint-disable-next-line no-alert
    alert('Your game won\'t work like this because\nWeb 👏 builds 👏 require 👏 a web 👏 server!\n\nConsider using a desktop build, or upload your web build to itch.io, GameJolt or your own website.\n\nIf you haven\'t created this game, please contact the developer about this issue.\n\n Also note that ct.js games do not work inside the itch app; you will need to open the game with your browser of choice.');
}

const deadPool = []; // a pool of `kill`-ed copies for delaying frequent garbage collection
const copyTypeSymbol = Symbol('I am a ct.js copy');
setInterval(function cleanDeadPool() {
    deadPool.length = 0;
}, 1000 * 60);

/**
 * The ct.js library
 * @namespace
 */
const ct = {
    /**
     * A target number of frames per second. It can be interpreted as a second in timers.
     * @type {number}
     */
    speed: [60][0] || 60,
    templates: {},
    snd: {},
    stack: [],
    fps: [60][0] || 60,
    /**
     * A measure of how long a frame took time to draw, usually equal to 1 and larger on lags.
     * For example, if it is equal to 2, it means that the previous frame took twice as much time
     * compared to expected FPS rate.
     *
     * Use ct.delta to balance your movement and other calculations on different framerates by
     * multiplying it with your reference value.
     *
     * Note that `this.move()` already uses it, so there is no need to premultiply
     * `this.speed` with it.
     *
     * **A minimal example:**
     * ```js
     * this.x += this.windSpeed * ct.delta;
     * ```
     *
     * @template {number}
     */
    delta: 1,
    /**
     * A measure of how long a frame took time to draw, usually equal to 1 and larger on lags.
     * For example, if it is equal to 2, it means that the previous frame took twice as much time
     * compared to expected FPS rate.
     *
     * This is a version for UI elements, as it is not affected by time scaling, and thus works well
     * both with slow-mo effects and game pause.
     *
     * @template {number}
     */
    deltaUi: 1,
    /**
     * The camera that outputs its view to the renderer.
     * @template {Camera}
     */
    camera: null,
    /**
     * ct.js version in form of a string `X.X.X`.
     * @template {string}
     */
    version: '2.0.1',
    meta: [{"name":"Bingo","author":"","site":"","version":"0.0.0"}][0],
    get width() {
        return ct.pixiApp.renderer.view.width;
    },
    /**
     * Resizes the drawing canvas and viewport to the given value in pixels.
     * When used with ct.fittoscreen, can be used to enlarge/shrink the viewport.
     * @param {number} value New width in pixels
     * @template {number}
     */
    set width(value) {
        ct.camera.width = ct.roomWidth = value;
        if (!ct.fittoscreen || ct.fittoscreen.mode === 'fastScale') {
            ct.pixiApp.renderer.resize(value, ct.height);
        }
        if (ct.fittoscreen) {
            ct.fittoscreen();
        }
        return value;
    },
    get height() {
        return ct.pixiApp.renderer.view.height;
    },
    /**
     * Resizes the drawing canvas and viewport to the given value in pixels.
     * When used with ct.fittoscreen, can be used to enlarge/shrink the viewport.
     * @param {number} value New height in pixels
     * @template {number}
     */
    set height(value) {
        ct.camera.height = ct.roomHeight = value;
        if (!ct.fittoscreen || ct.fittoscreen.mode === 'fastScale') {
            ct.pixiApp.renderer.resize(ct.width, value);
        }
        if (ct.fittoscreen) {
            ct.fittoscreen();
        }
        return value;
    }
};

// eslint-disable-next-line no-console
console.log(
    `%c 😺 %c ct.js game editor %c v${ct.version} %c https://ctjs.rocks/ `,
    'background: #446adb; color: #fff; padding: 0.5em 0;',
    'background: #5144db; color: #fff; padding: 0.5em 0;',
    'background: #446adb; color: #fff; padding: 0.5em 0;',
    'background: #5144db; color: #fff; padding: 0.5em 0;'
);

ct.highDensity = [true][0];
const pixiAppSettings = {
    width: [1024][0],
    height: [576][0],
    antialias: ![false][0],
    powerPreference: 'high-performance',
    sharedTicker: false,
    sharedLoader: true
};
try {
    /**
     * The PIXI.Application that runs ct.js game
     * @template {PIXI.Application}
     */
    ct.pixiApp = new PIXI.Application(pixiAppSettings);
} catch (e) {
    console.error(e);
    // eslint-disable-next-line no-console
    console.warn('[ct.js] Something bad has just happened. This is usually due to hardware problems. I\'ll try to fix them now, but if the game still doesn\'t run, try including a legacy renderer in the project\'s settings.');
    PIXI.settings.SPRITE_MAX_TEXTURES = Math.min(PIXI.settings.SPRITE_MAX_TEXTURES, 16);
    ct.pixiApp = new PIXI.Application(pixiAppSettings);
}

PIXI.settings.ROUND_PIXELS = [false][0];
ct.pixiApp.ticker.maxFPS = [60][0] || 0;
if (!ct.pixiApp.renderer.options.antialias) {
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
}
/**
 * @template PIXI.Container
 */
ct.stage = ct.pixiApp.stage;
ct.pixiApp.renderer.autoDensity = ct.highDensity;
document.getElementById('ct').appendChild(ct.pixiApp.view);

/**
 * A library of different utility functions, mainly Math-related, but not limited to them.
 * @namespace
 */
ct.u = {
    /**
     * Get the environment the game runs on.
     * @returns {string} Either 'ct.ide', or 'nw', or 'electron', or 'browser'.
     */
    getEnvironment() {
        if (window.name === 'ct.js debugger') {
            return 'ct.ide';
        }
        try {
            if (nw.require) {
                return 'nw';
            }
        } catch (oO) {
            void 0;
        }
        try {
            require('electron');
            return 'electron';
        } catch (Oo) {
            void 0;
        }
        return 'browser';
    },
    /**
     * Get the current operating system the game runs on.
     * @returns {string} One of 'windows', 'darwin' (which is MacOS), 'linux', or 'unknown'.
     */
    getOS() {
        const ua = window.navigator.userAgent;
        if (ua.indexOf('Windows') !== -1) {
            return 'windows';
        }
        if (ua.indexOf('Linux') !== -1) {
            return 'linux';
        }
        if (ua.indexOf('Mac') !== -1) {
            return 'darwin';
        }
        return 'unknown';
    },
    /**
     * Returns the length of a vector projection onto an X axis.
     * @param {number} l The length of the vector
     * @param {number} d The direction of the vector
     * @returns {number} The length of the projection
     */
    ldx(l, d) {
        return l * Math.cos(d * Math.PI / 180);
    },
    /**
     * Returns the length of a vector projection onto an Y axis.
     * @param {number} l The length of the vector
     * @param {number} d The direction of the vector
     * @returns {number} The length of the projection
     */
    ldy(l, d) {
        return l * Math.sin(d * Math.PI / 180);
    },
    /**
     * Returns the direction of a vector that points from the first point to the second one.
     * @param {number} x1 The x location of the first point
     * @param {number} y1 The y location of the first point
     * @param {number} x2 The x location of the second point
     * @param {number} y2 The y location of the second point
     * @returns {number} The angle of the resulting vector, in degrees
     */
    pdn(x1, y1, x2, y2) {
        return (Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 360) % 360;
    },
    // Point-point DistanCe
    /**
     * Returns the distance between two points
     * @param {number} x1 The x location of the first point
     * @param {number} y1 The y location of the first point
     * @param {number} x2 The x location of the second point
     * @param {number} y2 The y location of the second point
     * @returns {number} The distance between the two points
     */
    pdc(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    },
    /**
     * Convers degrees to radians
     * @param {number} deg The degrees to convert
     * @returns {number} The resulting radian value
     */
    degToRad(deg) {
        return deg * Math.PI / 180;
    },
    /**
     * Convers radians to degrees
     * @param {number} rad The radian value to convert
     * @returns {number} The resulting degree
     */
    radToDeg(rad) {
        return rad / Math.PI * 180;
    },
    /**
     * Rotates a vector (x; y) by `deg` around (0; 0)
     * @param {number} x The x component
     * @param {number} y The y component
     * @param {number} deg The degree to rotate by
     * @returns {PIXI.Point} A pair of new `x` and `y` parameters.
     */
    rotate(x, y, deg) {
        return ct.u.rotateRad(x, y, ct.u.degToRad(deg));
    },
    /**
     * Rotates a vector (x; y) by `rad` around (0; 0)
     * @param {number} x The x component
     * @param {number} y The y component
     * @param {number} rad The radian value to rotate around
     * @returns {PIXI.Point} A pair of new `x` and `y` parameters.
     */
    rotateRad(x, y, rad) {
        const sin = Math.sin(rad),
              cos = Math.cos(rad);
        return new PIXI.Point(
            cos * x - sin * y,
            cos * y + sin * x
        );
    },
    /**
     * Gets the most narrow angle between two vectors of given directions
     * @param {number} dir1 The direction of the first vector
     * @param {number} dir2 The direction of the second vector
     * @returns {number} The resulting angle
     */
    deltaDir(dir1, dir2) {
        dir1 = ((dir1 % 360) + 360) % 360;
        dir2 = ((dir2 % 360) + 360) % 360;
        var t = dir1,
            h = dir2,
            ta = h - t;
        if (ta > 180) {
            ta -= 360;
        }
        if (ta < -180) {
            ta += 360;
        }
        return ta;
    },
    /**
     * Returns a number in between the given range (clamps it).
     * @param {number} min The minimum value of the given number
     * @param {number} val The value to fit in the range
     * @param {number} max The maximum value of the given number
     * @returns {number} The clamped value
     */
    clamp(min, val, max) {
        return Math.max(min, Math.min(max, val));
    },
    /**
     * Linearly interpolates between two values by the apha value.
     * Can also be describing as mixing between two values with a given proportion `alpha`.
     * @param {number} a The first value to interpolate from
     * @param {number} b The second value to interpolate to
     * @param {number} alpha The mixing value
     * @returns {number} The result of the interpolation
     */
    lerp(a, b, alpha) {
        return a + (b - a) * alpha;
    },
    /**
     * Returns the position of a given value in a given range. Opposite to linear interpolation.
     * @param  {number} a The first value to interpolate from
     * @param  {number} b The second value to interpolate top
     * @param  {number} val The interpolated values
     * @return {number} The position of the value in the specified range.
     * When a <= val <= b, the result will be inside the [0;1] range.
     */
    unlerp(a, b, val) {
        return (val - a) / (b - a);
    },
    /**
     * Re-maps the given value from one number range to another.
     * @param  {number} val The value to be mapped
     * @param  {number} inMin Lower bound of the value's current range
     * @param  {number} inMax Upper bound of the value's current range
     * @param  {number} outMin Lower bound of the value's target range
     * @param  {number} outMax Upper bound of the value's target range
     * @returns {number} The mapped value.
     */
    map(val, inMin, inMax, outMin, outMax) {
        return (val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },
    /**
     * Translates a point from UI space to game space.
     * @param {number} x The x coordinate in UI space.
     * @param {number} y The y coordinate in UI space.
     * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
     */
    uiToGameCoord(x, y) {
        return ct.camera.uiToGameCoord(x, y);
    },
    /**
     * Translates a point from fame space to UI space.
     * @param {number} x The x coordinate in game space.
     * @param {number} y The y coordinate in game space.
     * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
     */
    gameToUiCoord(x, y) {
        return ct.camera.gameToUiCoord(x, y);
    },
    hexToPixi(hex) {
        return Number('0x' + hex.slice(1));
    },
    pixiToHex(pixi) {
        return '#' + (pixi).toString(16).padStart(6, 0);
    },
    /**
     * Tests whether a given point is inside the given rectangle
     * (it can be either a copy or an array).
     * @param {number} x The x coordinate of the point.
     * @param {number} y The y coordinate of the point.
     * @param {(Copy|Array<Number>)} arg Either a copy (it must have a rectangular shape)
     * or an array in a form of [x1, y1, x2, y2], where (x1;y1) and (x2;y2) specify
     * the two opposite corners of the rectangle.
     * @returns {boolean} `true` if the point is inside the rectangle, `false` otherwise.
     */
    prect(x, y, arg) {
        var xmin, xmax, ymin, ymax;
        if (arg.splice) {
            xmin = Math.min(arg[0], arg[2]);
            xmax = Math.max(arg[0], arg[2]);
            ymin = Math.min(arg[1], arg[3]);
            ymax = Math.max(arg[1], arg[3]);
        } else {
            xmin = arg.x - arg.shape.left * arg.scale.x;
            xmax = arg.x + arg.shape.right * arg.scale.x;
            ymin = arg.y - arg.shape.top * arg.scale.y;
            ymax = arg.y + arg.shape.bottom * arg.scale.y;
        }
        return x >= xmin && y >= ymin && x <= xmax && y <= ymax;
    },
    /**
     * Tests whether a given point is inside the given circle (it can be either a copy or an array)
     * @param {number} x The x coordinate of the point
     * @param {number} y The y coordinate of the point
     * @param {(Copy|Array<Number>)} arg Either a copy (it must have a circular shape)
     * or an array in a form of [x1, y1, r], where (x1;y1) define the center of the circle
     * and `r` defines the radius of it.
     * @returns {boolean} `true` if the point is inside the circle, `false` otherwise
     */
    pcircle(x, y, arg) {
        if (arg.splice) {
            return ct.u.pdc(x, y, arg[0], arg[1]) < arg[2];
        }
        return ct.u.pdc(0, 0, (arg.x - x) / arg.scale.x, (arg.y - y) / arg.scale.y) < arg.shape.r;
    },
    /**
     * Copies all the properties of the source object to the destination object.
     * This is **not** a deep copy. Useful for extending some settings with default values,
     * or for combining data.
     * @param {object} o1 The destination object
     * @param {object} o2 The source object
     * @param {any} [arr] An optional array of properties to copy. If not specified,
     * all the properties will be copied.
     * @returns {object} The modified destination object
     */
    ext(o1, o2, arr) {
        if (arr) {
            for (const i in arr) {
                if (o2[arr[i]]) {
                    o1[arr[i]] = o2[arr[i]];
                }
            }
        } else {
            for (const i in o2) {
                o1[i] = o2[i];
            }
        }
        return o1;
    },
    /**
     * Returns a Promise that resolves after the given time.
     * This timer is run in gameplay time scale, meaning that it is affected by time stretching.
     * @param {number} time Time to wait, in milliseconds
     * @returns {CtTimer} The timer, which you can call `.then()` to
     */
    wait(time) {
        return ct.timer.add(time);
    },
    /**
     * Returns a Promise that resolves after the given time.
     * This timer runs in UI time scale and is not sensitive to time stretching.
     * @param {number} time Time to wait, in milliseconds
     * @returns {CtTimer} The timer, which you can call `.then()` to
     */
    waitUi(time) {
        return ct.timer.addUi(time);
    },
    /**
     * Creates a new function that returns a promise, based
     * on a function with a regular (err, result) => {...} callback.
     * @param {Function} f The function that needs to be promisified
     * @see https://javascript.info/promisify
     */
    promisify(f) {
        // eslint-disable-next-line func-names
        return function (...args) {
            return new Promise((resolve, reject) => {
                const callback = function callback(err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                };
                args.push(callback);
                f.call(this, ...args);
            });
        };
    },
    required(paramName, method) {
        let str = 'The parameter ';
        if (paramName) {
            str += `${paramName} `;
        }
        if (method) {
            str += `of ${method} `;
        }
        str += 'is required.';
        throw new Error(str);
    },
    numberedString(prefix, input) {
        return prefix + '_' + input.toString().padStart(2, '0');
    },
    getStringNumber(str) {
        return Number(str.split('_').pop());
    }
};
ct.u.ext(ct.u, {// make aliases
    getOs: ct.u.getOS,
    lengthDirX: ct.u.ldx,
    lengthDirY: ct.u.ldy,
    pointDirection: ct.u.pdn,
    pointDistance: ct.u.pdc,
    pointRectangle: ct.u.prect,
    pointCircle: ct.u.pcircle,
    extend: ct.u.ext
});

// eslint-disable-next-line max-lines-per-function
(() => {
    const killRecursive = copy => {
        copy.kill = true;
        if (copy.onDestroy) {
            ct.templates.onDestroy.apply(copy);
            copy.onDestroy.apply(copy);
        }
        for (const child of copy.children) {
            if (child[copyTypeSymbol]) {
                killRecursive(child);
            }
        }
        const stackIndex = ct.stack.indexOf(copy);
        if (stackIndex !== -1) {
            ct.stack.splice(stackIndex, 1);
        }
        if (copy.template) {
            const templatelistIndex = ct.templates.list[copy.template].indexOf(copy);
            if (templatelistIndex !== -1) {
                ct.templates.list[copy.template].splice(templatelistIndex, 1);
            }
        }
        deadPool.push(copy);
    };
    const manageCamera = () => {
        if (ct.camera) {
            ct.camera.update(ct.delta);
            ct.camera.manageStage();
        }
    };

    ct.loop = function loop(delta) {
        ct.delta = delta;
        ct.deltaUi = ct.pixiApp.ticker.elapsedMS / (1000 / (ct.pixiApp.ticker.maxFPS || 60));
        ct.inputs.updateActions();
        ct.timer.updateTimers();
        ct.place.debugTraceGraphics.clear();

        for (let i = 0, li = ct.stack.length; i < li; i++) {
            ct.templates.beforeStep.apply(ct.stack[i]);
            ct.stack[i].onStep.apply(ct.stack[i]);
            ct.templates.afterStep.apply(ct.stack[i]);
        }
        // There may be a number of rooms stacked on top of each other.
        // Loop through them and filter out everything that is not a room.
        for (const item of ct.stage.children) {
            if (!(item instanceof Room)) {
                continue;
            }
            ct.rooms.beforeStep.apply(item);
            item.onStep.apply(item);
            ct.rooms.afterStep.apply(item);
        }
        // copies
        for (const copy of ct.stack) {
            // eslint-disable-next-line no-underscore-dangle
            if (copy.kill && !copy._destroyed) {
                killRecursive(copy); // This will also allow a parent to eject children
                                     // to a new container before they are destroyed as well
                copy.destroy({
                    children: true
                });
            }
        }

        for (const cont of ct.stage.children) {
            cont.children.sort((a, b) =>
                ((a.depth || 0) - (b.depth || 0)) || ((a.uid || 0) - (b.uid || 0)) || 0);
        }

        manageCamera();

        for (let i = 0, li = ct.stack.length; i < li; i++) {
            ct.templates.beforeDraw.apply(ct.stack[i]);
            ct.stack[i].onDraw.apply(ct.stack[i]);
            ct.templates.afterDraw.apply(ct.stack[i]);
            ct.stack[i].xprev = ct.stack[i].x;
            ct.stack[i].yprev = ct.stack[i].y;
        }

        for (const item of ct.stage.children) {
            if (!(item instanceof Room)) {
                continue;
            }
            ct.rooms.beforeDraw.apply(item);
            item.onDraw.apply(item);
            ct.rooms.afterDraw.apply(item);
        }
        /*%afterframe%*/
        if (ct.rooms.switching) {
            ct.rooms.forceSwitch();
        }
    };
})();




/**
 * @property {number} value The current value of an action. It is always in the range from -1 to 1.
 * @property {string} name The name of the action.
 */
class CtAction {
    /**
     * This is a custom action defined in the Settings tab → Edit actions section.
     * Actions are used to abstract different input methods into one gameplay-related interface:
     * for example, joystick movement, WASD keys and arrows can be turned into two actions:
     * `MoveHorizontally` and `MoveVertically`.
     * @param {string} name The name of the new action.
     */
    constructor(name) {
        this.name = name;
        this.methodCodes = [];
        this.methodMultipliers = [];
        this.prevValue = 0;
        this.value = 0;
        return this;
    }
    /**
     * Checks whether the current action listens to a given input method.
     * This *does not* check whether this input method is supported by ct.
     *
     * @param {string} code The code to look up.
     * @returns {boolean} `true` if it exists, `false` otherwise.
     */
    methodExists(code) {
        return this.methodCodes.indexOf(code) !== -1;
    }
    /**
     * Adds a new input method to listen.
     *
     * @param {string} code The input method's code to listen to. Must be unique per action.
     * @param {number} [multiplier] An optional multiplier, e.g. to flip its value.
     * Often used with two buttons to combine them into a scalar input identical to joysticks.
     * @returns {void}
     */
    addMethod(code, multiplier) {
        if (this.methodCodes.indexOf(code) === -1) {
            this.methodCodes.push(code);
            this.methodMultipliers.push(multiplier !== void 0 ? multiplier : 1);
        } else {
            throw new Error(`[ct.inputs] An attempt to add an already added input "${code}" to an action "${name}".`);
        }
    }
    /**
     * Removes the provided input method for an action.
     *
     * @param {string} code The input method to remove.
     * @returns {void}
     */
    removeMethod(code) {
        const ind = this.methodCodes.indexOf(code);
        if (ind !== -1) {
            this.methodCodes.splice(ind, 1);
            this.methodMultipliers.splice(ind, 1);
        }
    }
    /**
     * Changes the multiplier for an input method with the provided code.
     * This method will produce a warning if one is trying to change an input method
     * that is not listened by this action.
     *
     * @param {string} code The input method's code to change
     * @param {number} multiplier The new value
     * @returns {void}
     */
    setMultiplier(code, multiplier) {
        const ind = this.methodCodes.indexOf(code);
        if (ind !== -1) {
            this.methodMultipliers[ind] = multiplier;
        } else {
            // eslint-disable-next-line no-console
            console.warning(`[ct.inputs] An attempt to change multiplier of a non-existent method "${code}" at event ${this.name}`);
            // eslint-disable-next-line no-console
            console.trace();
        }
    }
    /**
     * Recalculates the digital value of an action.
     *
     * @returns {number} A scalar value between -1 and 1.
     */
    update() {
        this.prevValue = this.value;
        this.value = 0;
        for (let i = 0, l = this.methodCodes.length; i < l; i++) {
            const rawValue = ct.inputs.registry[this.methodCodes[i]] || 0;
            this.value += rawValue * this.methodMultipliers[i];
        }
        this.value = Math.max(-1, Math.min(this.value, 1));
    }
    /**
     * Resets the state of this action, setting its value to `0`
     * and its pressed, down, released states to `false`.
     *
     * @returns {void}
     */
    reset() {
        this.prevValue = this.value = 0;
    }
    /**
     * Returns whether the action became active in the current frame,
     * either by a button just pressed or by using a scalar input.
     *
     * `true` for being pressed and `false` otherwise
     * @type {boolean}
     */
    get pressed() {
        return this.prevValue === 0 && this.value !== 0;
    }
    /**
     * Returns whether the action became inactive in the current frame,
     * either by releasing all buttons or by resting all scalar inputs.
     *
     * `true` for being released and `false` otherwise
     * @type {boolean}
     */
    get released() {
        return this.prevValue !== 0 && this.value === 0;
    }
    /**
     * Returns whether the action is active, e.g. by a pressed button
     * or a currently used scalar input.
     *
     * `true` for being active and `false` otherwise
     * @type {boolean}
     */
    get down() {
        return this.value !== 0;
    }
    /* In case you need to be hated for the rest of your life, uncomment this */
    /*
    valueOf() {
        return this.value;
    }
    */
}

/**
 * A list of custom Actions. They are defined in the Settings tab → Edit actions section.
 * @type {Object.<string,CtAction>}
 */
ct.actions = {};
/**
 * @namespace
 */
ct.inputs = {
    registry: {},
    /**
     * Adds a new action and puts it into `ct.actions`.
     *
     * @param {string} name The name of an action, as it will be used in `ct.actions`.
     * @param {Array<Object>} methods A list of input methods. This list can be changed later.
     * @returns {CtAction} The created action
     */
    addAction(name, methods) {
        if (name in ct.actions) {
            throw new Error(`[ct.inputs] An action "${name}" already exists, can't add a new one with the same name.`);
        }
        const action = new CtAction(name);
        for (const method of methods) {
            action.addMethod(method.code, method.multiplier);
        }
        ct.actions[name] = action;
        return action;
    },
    /**
     * Removes an action with a given name.
     * @param {string} name The name of an action
     * @returns {void}
     */
    removeAction(name) {
        delete ct.actions[name];
    },
    /**
     * Recalculates values for every action in a game.
     * @returns {void}
     */
    updateActions() {
        for (const i in ct.actions) {
            ct.actions[i].update();
        }
    }
};

ct.inputs.addAction('MoveRight', [{"code":"keyboard.KeyD"},{"code":"keyboard.ArrowRight"}]);
ct.inputs.addAction('MoveLeft', [{"code":"keyboard.ArrowLeft"}]);
ct.inputs.addAction('Jump', [{"code":"keyboard.ArrowUp"},{"code":"keyboard.Space"}]);


/**
 * @typedef IRoomMergeResult
 *
 * @property {Array<Copy>} copies
 * @property {Array<Tilemap>} tileLayers
 * @property {Array<Background>} backgrounds
 */

class Room extends PIXI.Container {
    static getNewId() {
        this.roomId++;
        return this.roomId;
    }

    constructor(template) {
        super();
        this.x = this.y = 0;
        this.uid = Room.getNewId();
        this.tileLayers = [];
        this.backgrounds = [];
        if (!ct.room) {
            ct.room = ct.rooms.current = this;
        }
        if (template) {
            if (template.extends) {
                ct.u.ext(this, template.extends);
            }
            this.onCreate = template.onCreate;
            this.onStep = template.onStep;
            this.onDraw = template.onDraw;
            this.onLeave = template.onLeave;
            this.template = template;
            this.name = template.name;
            if (this === ct.room) {
                ct.pixiApp.renderer.backgroundColor = ct.u.hexToPixi(this.template.backgroundColor);
            }
            if (this === ct.room) {
    ct.place.tileGrid = {};
}
ct.fittoscreen();

            for (let i = 0, li = template.bgs.length; i < li; i++) {
                // Need to put extensions here, so we don't use ct.backgrounds.add
                const bg = new ct.templates.Background(
                    template.bgs[i].texture,
                    null,
                    template.bgs[i].depth,
                    template.bgs[i].extends
                );
                this.addChild(bg);
            }
            for (let i = 0, li = template.tiles.length; i < li; i++) {
                const tl = new Tilemap(template.tiles[i]);
                tl.cache();
                this.tileLayers.push(tl);
                this.addChild(tl);
            }
            for (let i = 0, li = template.objects.length; i < li; i++) {
                const exts = template.objects[i].exts || {};
                ct.templates.copyIntoRoom(
                    template.objects[i].template,
                    template.objects[i].x,
                    template.objects[i].y,
                    this,
                    {
                        tx: template.objects[i].tx,
                        ty: template.objects[i].ty,
                        tr: template.objects[i].tr,
                        ...exts
                    }
                );
            }
        }
        return this;
    }
    get x() {
        return -this.position.x;
    }
    set x(value) {
        this.position.x = -value;
        return value;
    }
    get y() {
        return -this.position.y;
    }
    set y(value) {
        this.position.y = -value;
        return value;
    }
}
Room.roomId = 0;

(function roomsAddon() {
    /* global deadPool */
    var nextRoom;
    /**
     * @namespace
     */
    ct.rooms = {
        templates: {},
        /**
         * An object that contains arrays of currently present rooms.
         * These include the current room (`ct.room`), as well as any rooms
         * appended or prepended through `ct.rooms.append` and `ct.rooms.prepend`.
         * @type {Object.<string,Array<Room>>}
         */
        list: {},
        /**
         * Creates and adds a background to the current room, at the given depth.
         * @param {string} texture The name of the texture to use
         * @param {number} depth The depth of the new background
         * @returns {Background} The created background
         */
        addBg(texture, depth) {
            const bg = new ct.templates.Background(texture, null, depth);
            ct.room.addChild(bg);
            return bg;
        },
        /**
         * Adds a new empty tile layer to the room, at the given depth
         * @param {number} layer The depth of the layer
         * @returns {Tileset} The created tile layer
         * @deprecated Use ct.tilemaps.create instead.
         */
        addTileLayer(layer) {
            return ct.tilemaps.create(layer);
        },
        /**
         * Clears the current stage, removing all rooms with copies, tile layers, backgrounds,
         * and other potential entities.
         * @returns {void}
         */
        clear() {
            ct.stage.children = [];
            ct.stack = [];
            for (const i in ct.templates.list) {
                ct.templates.list[i] = [];
            }
            for (const i in ct.backgrounds.list) {
                ct.backgrounds.list[i] = [];
            }
            ct.rooms.list = {};
            for (const name in ct.rooms.templates) {
                ct.rooms.list[name] = [];
            }
        },
        /**
         * This method safely removes a previously appended/prepended room from the stage.
         * It will trigger "On Leave" for a room and "On Destroy" event
         * for all the copies of the removed room.
         * The room will also have `this.kill` set to `true` in its event, if it comes in handy.
         * This method cannot remove `ct.room`, the main room.
         * @param {Room} room The `room` argument must be a reference
         * to the previously created room.
         * @returns {void}
         */
        remove(room) {
            if (!(room instanceof Room)) {
                if (typeof room === 'string') {
                    throw new Error('[ct.rooms] To remove a room, you should provide a reference to it (to an object), not its name. Provided value:', room);
                }
                throw new Error('[ct.rooms] An attempt to remove a room that is not actually a room! Provided value:', room);
            }
            const ind = ct.rooms.list[room.name];
            if (ind !== -1) {
                ct.rooms.list[room.name].splice(ind, 1);
            } else {
                // eslint-disable-next-line no-console
                console.warn('[ct.rooms] Removing a room that was not found in ct.rooms.list. This is strange…');
            }
            room.kill = true;
            ct.stage.removeChild(room);
            for (const copy of room.children) {
                copy.kill = true;
            }
            room.onLeave();
            ct.rooms.onLeave.apply(room);
        },
        /*
         * Switches to the given room. Note that this transition happens at the end
         * of the frame, so the name of a new room may be overridden.
         */
        'switch'(roomName) {
            if (ct.rooms.templates[roomName]) {
                nextRoom = roomName;
                ct.rooms.switching = true;
            } else {
                console.error('[ct.rooms] The room "' + roomName + '" does not exist!');
            }
        },
        switching: false,
        /**
         * Creates a new room and adds it to the stage, separating its draw stack
         * from existing ones.
         * This room is added to `ct.stage` after all the other rooms.
         * @param {string} roomName The name of the room to be appended
         * @param {object} [exts] Any additional parameters applied to the new room.
         * Useful for passing settings and data to new widgets and prefabs.
         * @returns {Room} A newly created room
         */
        append(roomName, exts) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] append failed: the room ${roomName} does not exist!`);
                return false;
            }
            const room = new Room(ct.rooms.templates[roomName]);
            if (exts) {
                ct.u.ext(room, exts);
            }
            ct.stage.addChild(room);
            room.onCreate();
            ct.rooms.onCreate.apply(room);
            ct.rooms.list[roomName].push(room);
            return room;
        },
        /**
         * Creates a new room and adds it to the stage, separating its draw stack
         * from existing ones.
         * This room is added to `ct.stage` before all the other rooms.
         * @param {string} roomName The name of the room to be prepended
         * @param {object} [exts] Any additional parameters applied to the new room.
         * Useful for passing settings and data to new widgets and prefabs.
         * @returns {Room} A newly created room
         */
        prepend(roomName, exts) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] prepend failed: the room ${roomName} does not exist!`);
                return false;
            }
            const room = new Room(ct.rooms.templates[roomName]);
            if (exts) {
                ct.u.ext(room, exts);
            }
            ct.stage.addChildAt(room, 0);
            room.onCreate();
            ct.rooms.onCreate.apply(room);
            ct.rooms.list[roomName].push(room);
            return room;
        },
        /**
         * Merges a given room into the current one. Skips room's OnCreate event.
         *
         * @param {string} roomName The name of the room that needs to be merged
         * @returns {IRoomMergeResult} Arrays of created copies, backgrounds, tile layers,
         * added to the current room (`ct.room`). Note: it does not get updated,
         * so beware of memory leaks if you keep a reference to this array for a long time!
         */
        merge(roomName) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] merge failed: the room ${roomName} does not exist!`);
                return false;
            }
            const generated = {
                copies: [],
                tileLayers: [],
                backgrounds: []
            };
            const template = ct.rooms.templates[roomName];
            const target = ct.room;
            for (const t of template.bgs) {
                const bg = new ct.templates.Background(t.texture, null, t.depth, t.extends);
                target.backgrounds.push(bg);
                target.addChild(bg);
                generated.backgrounds.push(bg);
            }
            for (const t of template.tiles) {
                const tl = new Tilemap(t);
                target.tileLayers.push(tl);
                target.addChild(tl);
                generated.tileLayers.push(tl);
                tl.cache();
            }
            for (const t of template.objects) {
                const c = ct.templates.copyIntoRoom(t.template, t.x, t.y, target, {
                    tx: t.tx || 1,
                    ty: t.ty || 1,
                    tr: t.tr || 0
                });
                generated.copies.push(c);
            }
            return generated;
        },
        forceSwitch(roomName) {
            if (nextRoom) {
                roomName = nextRoom;
            }
            if (ct.room) {
                ct.room.onLeave();
                ct.rooms.onLeave.apply(ct.room);
                ct.room = void 0;
            }
            ct.rooms.clear();
            deadPool.length = 0;
            var template = ct.rooms.templates[roomName];
            ct.roomWidth = template.width;
            ct.roomHeight = template.height;
            ct.camera = new Camera(
                ct.roomWidth / 2,
                ct.roomHeight / 2,
                ct.roomWidth,
                ct.roomHeight
            );
            if (template.cameraConstraints) {
                ct.camera.minX = template.cameraConstraints.x1;
                ct.camera.maxX = template.cameraConstraints.x2;
                ct.camera.minY = template.cameraConstraints.y1;
                ct.camera.maxY = template.cameraConstraints.y2;
            }
            ct.pixiApp.renderer.resize(template.width, template.height);
            ct.rooms.current = ct.room = new Room(template);
            ct.stage.addChild(ct.room);
            ct.room.onCreate();
            ct.rooms.onCreate.apply(ct.room);
            ct.rooms.list[roomName].push(ct.room);
            
            ct.camera.manageStage();
            ct.rooms.switching = false;
            nextRoom = void 0;
        },
        onCreate() {
            if (this === ct.room) {
    const debugTraceGraphics = new PIXI.Graphics();
    debugTraceGraphics.depth = 10000000; // Why not. Overlap everything.
    ct.room.addChild(debugTraceGraphics);
    ct.place.debugTraceGraphics = debugTraceGraphics;
}
for (const layer of this.tileLayers) {
    if (this.children.indexOf(layer) === -1) {
        continue;
    }
    ct.place.enableTilemapCollisions(layer);
}

        },
        onLeave() {
            if (this === ct.room) {
    ct.place.grid = {};
}

        },
        /**
         * The name of the starting room, as it was set in ct.IDE.
         * @type {string}
         */
        starting: new URL(location.href).searchParams.get("room") || 'poziom1'
    };
})();
/**
 * The current room
 * @type {Room}
 */
ct.room = null;

ct.rooms.beforeStep = function beforeStep() {
    
};
ct.rooms.afterStep = function afterStep() {
    
};
ct.rooms.beforeDraw = function beforeDraw() {
    
};
ct.rooms.afterDraw = function afterDraw() {
    ct.mouse.xprev = ct.mouse.x;
ct.mouse.yprev = ct.mouse.y;
ct.mouse.xuiprev = ct.mouse.xui;
ct.mouse.yuiprev = ct.mouse.yui;
ct.mouse.pressed = ct.mouse.released = false;
ct.inputs.registry['mouse.Wheel'] = 0;
if (ct.sound.follow && !ct.sound.follow.kill) {
    ct.sound.howler.pos(
        ct.sound.follow.x,
        ct.sound.follow.y,
        ct.sound.useDepth ? ct.sound.follow.z : 0
    );
} else if (ct.sound.manageListenerPosition) {
    ct.sound.howler.pos(ct.camera.x, ct.camera.y, ct.camera.z || 0);
}
ct.keyboard.clear();

};


ct.rooms.templates['poziom1'] = {
    name: 'poziom1',
    width: 1024,
    height: 576,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":-512,"y":-128,"exts":{},"template":"trawa"},{"x":-512,"y":128,"exts":{},"template":"skała"},{"x":-448,"y":-128,"exts":{},"template":"trawa"},{"x":-384,"y":-128,"exts":{},"template":"trawa"},{"x":-384,"y":128,"exts":{},"template":"trawa"},{"x":-320,"y":-128,"exts":{},"template":"trawa"},{"x":-320,"y":128,"exts":{},"template":"trawa"},{"x":-256,"y":-128,"exts":{},"template":"trawa"},{"x":-256,"y":-128,"exts":{},"template":"trawa"},{"x":-256,"y":-128,"exts":{},"template":"trawa"},{"x":-256,"y":128,"exts":{},"template":"skała"},{"x":0,"y":64,"exts":{},"template":"trawa"},{"x":0,"y":128,"exts":{},"template":"skała"},{"x":0,"y":192,"exts":{},"template":"skała"},{"x":0,"y":256,"exts":{},"template":"skała"},{"x":0,"y":320,"exts":{},"template":"skała"},{"x":0,"y":384,"exts":{},"template":"skała"},{"x":0,"y":448,"exts":{},"template":"trawa"},{"x":0,"y":448,"exts":{},"template":"skała"},{"x":64,"y":448,"exts":{},"template":"trawa"},{"x":64,"y":448,"exts":{},"template":"trawa"},{"x":64,"y":448,"exts":{},"template":"skała"},{"x":64,"y":448,"exts":{},"template":"trawa"},{"x":128,"y":448,"exts":{},"template":"trawa"},{"x":128,"y":448,"exts":{},"template":"robot"},{"x":192,"y":448,"exts":{},"template":"trawa"},{"x":256,"y":448,"exts":{},"template":"trawa"},{"x":320,"y":448,"exts":{},"template":"trawa"},{"x":384,"y":448,"exts":{},"template":"trawa"},{"x":384,"y":448,"exts":{},"template":"trawa"},{"x":448,"y":448,"exts":{},"template":"trawa"},{"x":512,"y":384,"exts":{},"template":"trawa"},{"x":512,"y":448,"exts":{},"template":"skała"},{"x":512,"y":448,"exts":{},"template":"trawa"},{"x":512,"y":448,"exts":{},"template":"skała"},{"x":576,"y":128,"exts":{},"template":"pratforma"},{"x":576,"y":320,"exts":{},"template":"trawa"},{"x":576,"y":384,"exts":{},"template":"skała"},{"x":576,"y":448,"exts":{},"template":"skała"},{"x":640,"y":256,"exts":{},"template":"trawa"},{"x":640,"y":320,"exts":{},"template":"skała"},{"x":640,"y":384,"exts":{},"template":"skała"},{"x":640,"y":448,"exts":{},"template":"skała"},{"x":704,"y":192,"exts":{},"template":"trawa"},{"x":704,"y":256,"exts":{},"template":"skała"},{"x":704,"y":320,"exts":{},"template":"skała"},{"x":704,"y":384,"exts":{},"template":"skała"},{"x":704,"y":448,"exts":{},"template":"skała"},{"x":768,"y":-64,"exts":{},"template":"skała"},{"x":768,"y":-64,"exts":{},"template":"skała"},{"x":768,"y":0,"exts":{},"template":"skała"},{"x":768,"y":64,"exts":{},"template":"skała"},{"x":768,"y":192,"exts":{},"template":"skała"},{"x":768,"y":192,"exts":{},"template":"pratforma"},{"x":768,"y":192,"exts":{},"template":"skała"},{"x":768,"y":256,"exts":{},"template":"skała"},{"x":768,"y":256,"exts":{},"template":"skała"},{"x":768,"y":320,"exts":{},"template":"skała"},{"x":768,"y":384,"exts":{},"template":"skała"},{"x":768,"y":384,"exts":{},"template":"skała"},{"x":768,"y":448,"exts":{},"template":"skała"},{"x":-256,"y":64,"exts":{},"template":"trawa"},{"x":-64,"y":0,"exts":{},"template":"pratforma"},{"x":-192,"y":-64,"exts":{},"template":"pratforma"},{"x":-896,"y":-128,"exts":{},"template":"skała"},{"x":-896,"y":-192,"exts":{},"template":"skała"},{"x":-832,"y":-192,"exts":{},"template":"skała"},{"x":-896,"y":-256,"exts":{},"template":"skała"},{"x":-960,"y":-128,"exts":{},"template":"skała"},{"x":-960,"y":-192,"exts":{},"template":"skała"},{"x":-960,"y":-256,"exts":{},"template":"skała"},{"x":-960,"y":-320,"exts":{},"template":"skała"},{"x":-768,"y":-192,"exts":{},"template":"trawa"},{"x":-832,"y":-256,"exts":{},"template":"trawa"},{"x":-896,"y":-320,"exts":{},"template":"trawa"},{"x":-960,"y":-384,"exts":{},"template":"trawa"},{"x":-832,"y":-128,"exts":{},"template":"skała"},{"x":-768,"y":-128,"exts":{},"template":"skała"},{"x":-1024,"y":-384,"exts":{},"template":"skała"},{"x":-1024,"y":-320,"exts":{},"template":"skała"},{"x":-1024,"y":-256,"exts":{},"template":"skała"},{"x":-1024,"y":-192,"exts":{},"template":"skała"},{"x":-1024,"y":-192,"exts":{},"template":"skała"},{"x":-1024,"y":-128,"exts":{},"template":"skała"},{"x":-1024,"y":-448,"exts":{},"template":"trawa"},{"x":-1024,"y":-448,"exts":{},"template":"trawa"},{"x":-1088,"y":-448,"exts":{},"template":"trawa"},{"x":-1152,"y":-448,"exts":{},"template":"trawa"},{"x":-1216,"y":-448,"exts":{},"template":"trawa"},{"x":-1280,"y":-448,"exts":{},"template":"trawa"},{"x":-1344,"y":-448,"exts":{},"template":"trawa"},{"x":-1408,"y":-448,"exts":{},"template":"trawa"},{"x":-1472,"y":-448,"exts":{},"template":"trawa"},{"x":-1536,"y":-448,"exts":{},"template":"skała"},{"x":-1536,"y":-512,"exts":{},"template":"skała"},{"x":-1536,"y":-640,"exts":{},"template":"skała"},{"x":-1536,"y":-768,"exts":{},"template":"skała"},{"x":-1536,"y":-576,"exts":{},"template":"skała"},{"x":-1536,"y":-704,"exts":{},"template":"skała"},{"x":-1536,"y":-832,"exts":{},"template":"skała"},{"x":-704,"y":-128,"exts":{},"template":"trawa"},{"x":-640,"y":-128,"exts":{},"template":"trawa"},{"x":-576,"y":-128,"exts":{},"template":"trawa"},{"x":-1536,"y":-896,"exts":{},"template":"trawa"},{"x":-192,"y":64,"exts":{},"template":"trawa"},{"x":-128,"y":64,"exts":{},"template":"trawa"},{"x":-64,"y":64,"exts":{},"template":"trawa"},{"x":64,"y":64,"exts":{},"template":"trawa"},{"x":128,"y":64,"exts":{},"template":"trawa"},{"x":192,"y":64,"exts":{},"template":"trawa"},{"x":256,"y":64,"exts":{},"template":"trawa"},{"x":448,"y":64,"exts":{},"template":"trawa"},{"x":384,"y":64,"exts":{},"template":"trawa"},{"x":512,"y":64,"exts":{},"template":"trawa"},{"x":-1472,"y":-512,"exts":{},"template":"LevelExit"},{"x":-384,"y":64,"exts":{},"template":"GreenCrystal"},{"x":-320,"y":64,"exts":{},"template":"GreenCrystal"},{"x":-832,"y":-448,"exts":{},"template":"GreenCrystal"},{"x":-1280,"y":-576,"exts":{},"template":"GreenCrystal"},{"x":-1216,"y":-512,"exts":{},"template":"GreenCrystal"},{"x":-1152,"y":-576,"exts":{},"template":"GreenCrystal"},{"x":128,"y":192,"exts":{},"template":"GreenCrystal"},{"x":192,"y":256,"exts":{},"template":"platforma_ukryta"},{"x":256,"y":256,"exts":{},"template":"platforma_ukryta"},{"x":320,"y":256,"exts":{},"template":"platforma_ukryta"},{"x":384,"y":256,"exts":{},"template":"platforma_ukryta"},{"x":-448,"y":128,"exts":{},"template":"trawa"},{"x":-512,"y":64,"exts":{},"template":"skała"},{"x":-512,"y":0,"exts":{},"template":"skała"},{"x":-512,"y":-64,"exts":{},"template":"skała"},{"x":283,"y":416,"exts":{},"template":"GreenCrystal"},{"x":256,"y":384,"exts":{},"template":"skrzynia"},{"x":704,"y":128,"exts":{},"template":"GreenCrystal"},{"x":768,"y":128,"exts":{},"template":"skała"},{"x":320,"y":64,"exts":{},"template":"trawa"}]'),
    bgs: JSON.parse('[{"depth":-4,"texture":"SpringShort1_5","extends":{"parallaxX":0.2,"repeat":"repeat-x","shiftY":0,"parallaxY":0}},{"depth":-3,"texture":"SpringShort1_4","extends":{"parallaxX":0.4,"repeat":"repeat-x","shiftY":0,"parallaxY":0}},{"depth":-2,"texture":"SpringShort1_3","extends":{"parallaxX":0.6,"shiftY":0,"parallaxY":0,"repeat":"repeat-x"}},{"depth":-1,"texture":"SpringShort1_2","extends":{"parallaxX":0.9,"shiftY":0,"parallaxY":0,"repeat":"repeat-x"}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#D1EFFD',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'poziom2';
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['poziom2'] = {
    name: 'poziom2',
    width: 1024,
    height: 576,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":512,"exts":{},"template":"trawa"},{"x":0,"y":512,"exts":{},"template":"trawa"},{"x":0,"y":512,"exts":{},"template":"skała"},{"x":0,"y":512,"exts":{},"template":"Water"},{"x":0,"y":512,"exts":{},"template":"Checkpoint"},{"x":0,"y":512,"exts":{},"template":"Spikes"},{"x":0,"y":512,"exts":{},"template":"trawa"},{"x":64,"y":512,"exts":{},"template":"trawa"},{"x":192,"y":512,"exts":{},"template":"trawa"},{"x":128,"y":512,"exts":{},"template":"trawa"},{"x":256,"y":512,"exts":{},"template":"trawa"},{"x":320,"y":512,"exts":{},"template":"trawa"},{"x":384,"y":512,"exts":{},"template":"trawa"},{"x":960,"y":512,"exts":{},"template":"skała"},{"x":960,"y":448,"exts":{},"template":"skała"},{"x":960,"y":384,"exts":{},"template":"skała"},{"x":960,"y":320,"exts":{},"template":"skała"},{"x":0,"y":448,"exts":{},"template":"pratforma"},{"x":128,"y":384,"exts":{},"template":"pratforma"},{"x":256,"y":320,"exts":{},"template":"pratforma"},{"x":128,"y":256,"exts":{},"template":"pratforma"},{"x":0,"y":192,"exts":{},"template":"pratforma"},{"x":256,"y":128,"exts":{},"template":"trawa"},{"x":320,"y":192,"exts":{},"template":"skała"},{"x":448,"y":192,"exts":{},"template":"skała"},{"x":448,"y":128,"exts":{},"template":"trawa"},{"x":512,"y":128,"exts":{},"template":"trawa"},{"x":576,"y":128,"exts":{},"template":"trawa"},{"x":640,"y":128,"exts":{},"template":"trawa"},{"x":704,"y":128,"exts":{},"template":"trawa"},{"x":768,"y":128,"exts":{},"template":"trawa"},{"x":832,"y":128,"exts":{},"template":"trawa"},{"x":896,"y":128,"exts":{},"template":"trawa"},{"x":1088,"y":256,"exts":{},"template":"trawa"},{"x":1216,"y":256,"exts":{},"template":"trawa"},{"x":1152,"y":256,"exts":{},"template":"trawa"},{"x":1024,"y":192,"exts":{},"template":"Spikes"},{"x":1088,"y":128,"exts":{},"template":"trawa"},{"x":1024,"y":192,"exts":{},"template":"trawa"},{"x":1216,"y":128,"exts":{},"template":"trawa"},{"x":1280,"y":256,"exts":{},"template":"trawa"},{"x":1344,"y":256,"exts":{},"template":"trawa"},{"x":1472,"y":256,"exts":{},"template":"trawa"},{"x":1408,"y":256,"exts":{},"template":"trawa"},{"x":320,"y":64,"exts":{},"template":"Checkpoint"},{"x":960,"y":192,"exts":{},"template":"Checkpoint"},{"x":2368,"y":256,"exts":{},"template":"trawa"},{"x":2432,"y":256,"exts":{},"template":"trawa"},{"x":2496,"y":256,"exts":{},"template":"trawa"},{"x":2944,"y":256,"exts":{},"template":"skała"},{"x":2944,"y":192,"exts":{},"template":"skała"},{"x":2944,"y":128,"exts":{},"template":"skała"},{"x":2944,"y":64,"exts":{},"template":"skała"},{"x":2944,"y":0,"exts":{},"template":"skała"},{"x":2944,"y":-64,"exts":{},"template":"skała"},{"x":1664,"y":192,"exts":{},"template":"pratforma"},{"x":1792,"y":192,"exts":{},"template":"pratforma"},{"x":1920,"y":192,"exts":{},"template":"pratforma"},{"x":2048,"y":192,"exts":{},"template":"pratforma"},{"x":2176,"y":192,"exts":{},"template":"pratforma"},{"x":64,"y":256,"exts":{},"template":"pratforma"},{"x":832,"y":512,"exts":{},"template":"robot"},{"x":704,"y":512,"exts":{},"template":"trawa"},{"x":768,"y":512,"exts":{},"template":"trawa"},{"x":896,"y":512,"exts":{},"template":"trawa"},{"x":832,"y":512,"exts":{},"template":"trawa"},{"x":2560,"y":256,"exts":{},"template":"trawa"},{"x":2624,"y":256,"exts":{},"template":"trawa"},{"x":2752,"y":256,"exts":{},"template":"trawa"},{"x":2752,"y":256,"exts":{},"template":"trawa"},{"x":2688,"y":256,"exts":{},"template":"trawa"},{"x":2816,"y":256,"exts":{},"template":"trawa"},{"x":2880,"y":256,"exts":{},"template":"trawa"},{"x":2944,"y":-128,"exts":{},"template":"trawa"},{"x":320,"y":128,"exts":{},"template":"trawa"},{"x":384,"y":192,"exts":{},"template":"trawa"},{"x":960,"y":256,"exts":{},"template":"trawa"},{"x":1536,"y":256,"exts":{},"template":"trawa"},{"x":576,"y":512,"exts":{},"template":"trawa"},{"x":512,"y":512,"exts":{},"template":"trawa"},{"x":192,"y":128,"exts":{},"template":"pratforma"},{"x":128,"y":128,"exts":{},"template":"pratforma"},{"x":2880,"y":192,"exts":{},"template":"LevelExit"},{"x":128,"y":320,"exts":{},"template":"GreenCrystal"},{"x":448,"y":64,"exts":{},"template":"GreenCrystal"},{"x":384,"y":64,"exts":{},"template":"GreenCrystal"},{"x":1408,"y":128,"exts":{},"template":"GreenCrystal"},{"x":1536,"y":192,"exts":{},"template":"Checkpoint"},{"x":576,"y":64,"exts":{},"template":"Heart"},{"x":256,"y":256,"exts":{},"template":"Heart"},{"x":-64,"y":512,"exts":{},"template":"skała"},{"x":-64,"y":512,"exts":{},"template":"skała"},{"x":-64,"y":448,"exts":{},"template":"skała"},{"x":-64,"y":384,"exts":{},"template":"skała"},{"x":-64,"y":320,"exts":{},"template":"skała"},{"x":-64,"y":256,"exts":{},"template":"skała"},{"x":-64,"y":192,"exts":{},"template":"skała"},{"x":-64,"y":128,"exts":{},"template":"skała"},{"x":-64,"y":128,"exts":{},"template":"skała"},{"x":-64,"y":64,"exts":{},"template":"skała"},{"x":-64,"y":0,"exts":{},"template":"skała"},{"x":-64,"y":-64,"exts":{},"template":"trawa"},{"x":448,"y":512,"exts":{},"template":"lava2-top"},{"x":640,"y":512,"exts":{},"template":"lava2-top"},{"x":384,"y":128,"exts":{},"template":"kolce"},{"x":1088,"y":192,"exts":{},"template":"kolce"},{"x":1152,"y":192,"exts":{},"template":"kolce"},{"x":1216,"y":192,"exts":{},"template":"kolce"},{"x":1536,"y":320,"exts":{},"template":"skała"},{"x":1024,"y":256,"exts":{},"template":"skała"},{"x":2304,"y":320,"exts":{},"template":"skała"},{"x":2304,"y":256,"exts":{},"template":"trawa"},{"x":1600,"y":320,"exts":{},"template":"trawa"},{"x":1664,"y":320,"exts":{},"template":"trawa"},{"x":1728,"y":320,"exts":{},"template":"trawa"},{"x":1792,"y":320,"exts":{},"template":"trawa"},{"x":1856,"y":320,"exts":{},"template":"trawa"},{"x":1920,"y":320,"exts":{},"template":"trawa"},{"x":1984,"y":320,"exts":{},"template":"trawa"},{"x":2048,"y":320,"exts":{},"template":"trawa"},{"x":2112,"y":320,"exts":{},"template":"trawa"},{"x":2176,"y":320,"exts":{},"template":"trawa"},{"x":2240,"y":320,"exts":{},"template":"trawa"},{"x":1600,"y":256,"exts":{},"template":"kolce"},{"x":1664,"y":256,"exts":{},"template":"kolce"},{"x":1728,"y":256,"exts":{},"template":"kolce"},{"x":1792,"y":256,"exts":{},"template":"kolce"},{"x":1920,"y":256,"exts":{},"template":"kolce"},{"x":1856,"y":256,"exts":{},"template":"kolce"},{"x":1984,"y":256,"exts":{},"template":"kolce"},{"x":2048,"y":256,"exts":{},"template":"kolce"},{"x":2112,"y":256,"exts":{},"template":"kolce"},{"x":2176,"y":256,"exts":{},"template":"kolce"},{"x":2240,"y":256,"exts":{},"template":"kolce"},{"x":192,"y":384,"exts":{},"template":"pratforma"},{"x":351,"y":495,"exts":{},"template":"GreenCrystal"},{"x":320,"y":448,"exts":{},"template":"skrzynia"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'poziom3';
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['LayerUI'] = {
    name: 'LayerUI',
    width: 1024,
    height: 576,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":64,"y":64,"exts":{},"template":"liczbak"},{"x":64,"y":128,"exts":{},"template":"liczbazyc"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {
    "isUi": true
}
}
ct.rooms.templates['poziom3'] = {
    name: 'poziom3',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":512,"exts":{},"template":"trawa"},{"x":64,"y":512,"exts":{},"template":"trawa"},{"x":128,"y":512,"exts":{},"template":"trawa"},{"x":192,"y":448,"exts":{},"template":"pratforma"},{"x":256,"y":384,"exts":{},"template":"pratforma"},{"x":320,"y":320,"exts":{},"template":"pratforma"},{"x":384,"y":256,"exts":{},"template":"pratforma"},{"x":448,"y":256,"exts":{},"template":"pratforma"},{"x":512,"y":256,"exts":{},"template":"pratforma"},{"x":512,"y":192,"exts":{},"template":"pratforma"},{"x":576,"y":192,"exts":{},"template":"pratforma"},{"x":704,"y":128,"exts":{},"template":"trawa"},{"x":768,"y":128,"exts":{},"template":"trawa"},{"x":832,"y":128,"exts":{},"template":"trawa"},{"x":896,"y":128,"exts":{},"template":"trawa"},{"x":960,"y":128,"exts":{},"template":"trawa"},{"x":1024,"y":192,"exts":{},"template":"skała"},{"x":1152,"y":192,"exts":{},"template":"skała"},{"x":1024,"y":256,"exts":{},"template":"skała"},{"x":1088,"y":256,"exts":{},"template":"trawa"},{"x":1152,"y":128,"exts":{},"template":"trawa"},{"x":1280,"y":128,"exts":{},"template":"trawa"},{"x":1216,"y":128,"exts":{},"template":"trawa"},{"x":1344,"y":128,"exts":{},"template":"trawa"},{"x":1408,"y":64,"exts":{},"template":"pratforma"},{"x":1728,"y":128,"exts":{},"template":"trawa"},{"x":1984,"y":128,"exts":{},"template":"trawa"},{"x":1984,"y":192,"exts":{},"template":"skała"},{"x":1920,"y":192,"exts":{},"template":"trawa"},{"x":1856,"y":256,"exts":{},"template":"trawa"},{"x":1792,"y":320,"exts":{},"template":"trawa"},{"x":1856,"y":320,"exts":{},"template":"skała"},{"x":1920,"y":256,"exts":{},"template":"skała"},{"x":1920,"y":320,"exts":{},"template":"skała"},{"x":1984,"y":256,"exts":{},"template":"skała"},{"x":1984,"y":320,"exts":{},"template":"skała"},{"x":1664,"y":320,"exts":{},"template":"trawa"},{"x":1664,"y":320,"exts":{},"template":"trawa"},{"x":1536,"y":320,"exts":{},"template":"trawa"},{"x":1408,"y":320,"exts":{},"template":"trawa"},{"x":1280,"y":320,"exts":{},"template":"trawa"},{"x":1664,"y":384,"exts":{},"template":"skała"},{"x":1856,"y":384,"exts":{},"template":"skała"},{"x":1920,"y":384,"exts":{},"template":"skała"},{"x":1984,"y":384,"exts":{},"template":"skała"},{"x":1600,"y":384,"exts":{},"template":"trawa"},{"x":1344,"y":384,"exts":{},"template":"trawa"},{"x":1408,"y":384,"exts":{},"template":"skała"},{"x":2176,"y":128,"exts":{},"template":"trawa"},{"x":2240,"y":128,"exts":{},"template":"trawa"},{"x":2304,"y":64,"exts":{},"template":"trawa"},{"x":2368,"y":0,"exts":{},"template":"trawa"},{"x":2432,"y":-64,"exts":{},"template":"trawa"},{"x":2496,"y":-128,"exts":{},"template":"trawa"},{"x":2560,"y":-192,"exts":{},"template":"trawa"},{"x":2624,"y":-256,"exts":{},"template":"trawa"},{"x":2688,"y":-256,"exts":{},"template":"trawa"},{"x":2752,"y":-256,"exts":{},"template":"trawa"},{"x":2816,"y":-256,"exts":{},"template":"trawa"},{"x":2880,"y":-256,"exts":{},"template":"trawa"},{"x":2944,"y":-256,"exts":{},"template":"skała"},{"x":2944,"y":-320,"exts":{},"template":"skała"},{"x":2944,"y":-384,"exts":{},"template":"skała"},{"x":2944,"y":-448,"exts":{},"template":"skała"},{"x":2944,"y":-512,"exts":{},"template":"skała"},{"x":2944,"y":-576,"exts":{},"template":"skała"},{"x":2944,"y":-640,"exts":{},"template":"trawa"},{"x":-64,"y":512,"exts":{},"template":"skała"},{"x":-64,"y":448,"exts":{},"template":"skała"},{"x":-64,"y":384,"exts":{},"template":"skała"},{"x":-64,"y":320,"exts":{},"template":"trawa"},{"x":640,"y":128,"exts":{},"template":"trawa"},{"x":1536,"y":384,"exts":{},"template":"skała"},{"x":1856,"y":384,"exts":{},"template":"skała"},{"x":1792,"y":384,"exts":{},"template":"skała"},{"x":1664,"y":448,"exts":{},"template":"skała"},{"x":1856,"y":448,"exts":{},"template":"skała"},{"x":1792,"y":448,"exts":{},"template":"skała"},{"x":1920,"y":448,"exts":{},"template":"skała"},{"x":1984,"y":448,"exts":{},"template":"skała"},{"x":1600,"y":448,"exts":{},"template":"skała"},{"x":1536,"y":448,"exts":{},"template":"skała"},{"x":1408,"y":448,"exts":{},"template":"skała"},{"x":1408,"y":448,"exts":{},"template":"skała"},{"x":1152,"y":448,"exts":{},"template":"skała"},{"x":1216,"y":448,"exts":{},"template":"trawa"},{"x":1472,"y":448,"exts":{},"template":"trawa"},{"x":1728,"y":448,"exts":{},"template":"trawa"},{"x":1280,"y":448,"exts":{},"template":"trawa"},{"x":1344,"y":448,"exts":{},"template":"skała"},{"x":1280,"y":448,"exts":{},"template":"skała"},{"x":1344,"y":384,"exts":{},"template":"skała"},{"x":1344,"y":384,"exts":{},"template":"skała"},{"x":1344,"y":384,"exts":{},"template":"skała"},{"x":1344,"y":384,"exts":{},"template":"skała"},{"x":1344,"y":448,"exts":{},"template":"skała"},{"x":1280,"y":384,"exts":{},"template":"skała"},{"x":1088,"y":448,"exts":{},"template":"skała"},{"x":1088,"y":384,"exts":{},"template":"skała"},{"x":1088,"y":320,"exts":{},"template":"skała"},{"x":1216,"y":448,"exts":{},"template":"skała"},{"x":1152,"y":384,"exts":{},"template":"trawa"},{"x":1216,"y":384,"exts":{},"template":"trawa"},{"x":1536,"y":320,"exts":{},"template":"trawa"},{"x":1472,"y":320,"exts":{},"template":"trawa"},{"x":1728,"y":320,"exts":{},"template":"trawa"},{"x":1536,"y":448,"exts":{},"template":"Water"},{"x":1536,"y":448,"exts":{},"template":"Water"},{"x":1536,"y":448,"exts":{},"template":"skała"},{"x":1536,"y":448,"exts":{},"template":"skała"},{"x":1728,"y":448,"exts":{},"template":"skała"},{"x":1536,"y":448,"exts":{},"template":"skała"},{"x":1472,"y":448,"exts":{},"template":"skała"},{"x":1216,"y":320,"exts":{},"template":"GreenCrystal"},{"x":1280,"y":256,"exts":{},"template":"GreenCrystal"},{"x":1408,"y":256,"exts":{},"template":"GreenCrystal"},{"x":1344,"y":256,"exts":{},"template":"GreenCrystal"},{"x":1472,"y":256,"exts":{},"template":"GreenCrystal"},{"x":1536,"y":256,"exts":{},"template":"GreenCrystal"},{"x":1600,"y":256,"exts":{},"template":"GreenCrystal"},{"x":1664,"y":256,"exts":{},"template":"GreenCrystal"},{"x":1728,"y":256,"exts":{},"template":"GreenCrystal"},{"x":1792,"y":256,"exts":{},"template":"GreenCrystal"},{"x":1472,"y":0,"exts":{},"template":"GreenCrystal"},{"x":1408,"y":0,"exts":{},"template":"GreenCrystal"},{"x":2880,"y":-320,"exts":{},"template":"LevelExit"},{"x":64,"y":512,"exts":{},"template":"robot"},{"x":1024,"y":128,"exts":{},"template":"trawa"},{"x":2048,"y":128,"exts":{},"template":"trawa"},{"x":2176,"y":128,"exts":{},"template":"trawa"},{"x":2112,"y":128,"exts":{},"template":"trawa"},{"x":1600,"y":64,"exts":{},"template":"skała"},{"x":1536,"y":0,"exts":{},"template":"pratforma"},{"x":1920,"y":0,"exts":{},"template":"Platform"},{"x":1600,"y":0,"exts":{},"template":"trawa"},{"x":1664,"y":64,"exts":{},"template":"trawa"},{"x":192,"y":512,"exts":{},"template":"lava2-top"},{"x":256,"y":512,"exts":{},"template":"lava2-top"},{"x":320,"y":512,"exts":{},"template":"lava2-top"},{"x":384,"y":512,"exts":{},"template":"lava2-top"},{"x":448,"y":512,"exts":{},"template":"lava2-top"},{"x":512,"y":512,"exts":{},"template":"lava2-top"},{"x":576,"y":512,"exts":{},"template":"lava2-top"},{"x":704,"y":512,"exts":{},"template":"lava2-top"},{"x":640,"y":512,"exts":{},"template":"lava2-top"},{"x":768,"y":512,"exts":{},"template":"lava2-top"},{"x":832,"y":512,"exts":{},"template":"trawa"},{"x":1088,"y":128,"exts":{},"template":"lava2-top"},{"x":1088,"y":192,"exts":{},"template":"lava2"},{"x":1472,"y":384,"exts":{},"template":"lava2"},{"x":1728,"y":384,"exts":{},"template":"lava2"},{"x":1408,"y":128,"exts":{},"template":"trawa"},{"x":1472,"y":128,"exts":{},"template":"trawa"},{"x":1536,"y":128,"exts":{},"template":"trawa"},{"x":1600,"y":128,"exts":{},"template":"skała"},{"x":1664,"y":128,"exts":{},"template":"skała"},{"x":1344,"y":64,"exts":{},"template":"kolce"},{"x":1408,"y":64,"exts":{},"template":"kolce"},{"x":1472,"y":64,"exts":{},"template":"kolce"},{"x":1344,"y":320,"exts":{},"template":"kolce"},{"x":1600,"y":320,"exts":{},"template":"kolce"},{"x":1984,"y":64,"exts":{},"template":"kolce"},{"x":2048,"y":64,"exts":{},"template":"kolce"},{"x":2112,"y":64,"exts":{},"template":"kolce"},{"x":2176,"y":64,"exts":{},"template":"kolce"},{"x":2240,"y":64,"exts":{},"template":"kolce"},{"x":863,"y":107,"exts":{},"template":"GreenCrystal"},{"x":832,"y":64,"exts":{},"template":"skrzynia"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'poziom4';
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['poziom4'] = {
    name: 'poziom4',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":64,"y":512,"exts":{},"template":"trawa"},{"x":128,"y":512,"exts":{},"template":"trawa"},{"x":192,"y":512,"exts":{},"template":"trawa"},{"x":256,"y":512,"exts":{},"template":"trawa"},{"x":0,"y":512,"exts":{},"template":"skała"},{"x":0,"y":448,"exts":{},"template":"skała"},{"x":0,"y":384,"exts":{},"template":"skała"},{"x":0,"y":320,"exts":{},"template":"skała"},{"x":0,"y":256,"exts":{},"template":"trawa"},{"x":1024,"y":512,"exts":{},"template":"trawa"},{"x":1088,"y":512,"exts":{},"template":"trawa"},{"x":1152,"y":512,"exts":{},"template":"trawa"},{"x":1216,"y":512,"exts":{},"template":"skała"},{"x":1216,"y":448,"exts":{},"template":"trawa"},{"x":1280,"y":512,"exts":{},"template":"skała"},{"x":1344,"y":512,"exts":{},"template":"trawa"},{"x":1408,"y":512,"exts":{},"template":"trawa"},{"x":1472,"y":512,"exts":{},"template":"trawa"},{"x":1536,"y":512,"exts":{},"template":"trawa"},{"x":1600,"y":512,"exts":{},"template":"trawa"},{"x":2432,"y":512,"exts":{},"template":"trawa"},{"x":2560,"y":512,"exts":{},"template":"trawa"},{"x":2496,"y":512,"exts":{},"template":"trawa"},{"x":2624,"y":512,"exts":{},"template":"trawa"},{"x":2688,"y":512,"exts":{},"template":"trawa"},{"x":2752,"y":512,"exts":{},"template":"trawa"},{"x":2816,"y":512,"exts":{},"template":"trawa"},{"x":2880,"y":512,"exts":{},"template":"trawa"},{"x":2944,"y":512,"exts":{},"template":"trawa"},{"x":3008,"y":512,"exts":{},"template":"trawa"},{"x":3072,"y":512,"exts":{},"template":"trawa"},{"x":3136,"y":512,"exts":{},"template":"trawa"},{"x":3200,"y":512,"exts":{},"template":"trawa"},{"x":3264,"y":512,"exts":{},"template":"trawa"},{"x":3392,"y":512,"exts":{},"template":"trawa"},{"x":3456,"y":512,"exts":{},"template":"trawa"},{"x":3520,"y":512,"exts":{},"template":"trawa"},{"x":3584,"y":512,"exts":{},"template":"trawa"},{"x":3648,"y":512,"exts":{},"template":"trawa"},{"x":3712,"y":512,"exts":{},"template":"trawa"},{"x":3776,"y":512,"exts":{},"template":"trawa"},{"x":3840,"y":512,"exts":{},"template":"trawa"},{"x":3904,"y":512,"exts":{},"template":"skała"},{"x":3968,"y":512,"exts":{},"template":"skała"},{"x":3968,"y":448,"exts":{},"template":"trawa"},{"x":4032,"y":512,"exts":{},"template":"trawa"},{"x":4096,"y":512,"exts":{},"template":"trawa"},{"x":4160,"y":512,"exts":{},"template":"trawa"},{"x":4224,"y":512,"exts":{},"template":"trawa"},{"x":4288,"y":512,"exts":{},"template":"trawa"},{"x":4352,"y":512,"exts":{},"template":"trawa"},{"x":4416,"y":512,"exts":{},"template":"trawa"},{"x":4480,"y":512,"exts":{},"template":"trawa"},{"x":4544,"y":512,"exts":{},"template":"trawa"},{"x":4608,"y":512,"exts":{},"template":"trawa"},{"x":4672,"y":512,"exts":{},"template":"skała"},{"x":4672,"y":448,"exts":{},"template":"skała"},{"x":4672,"y":384,"exts":{},"template":"skała"},{"x":4672,"y":320,"exts":{},"template":"skała"},{"x":4672,"y":256,"exts":{},"template":"skała"},{"x":4672,"y":192,"exts":{},"template":"skała"},{"x":4672,"y":128,"exts":{},"template":"skała"},{"x":4672,"y":64,"exts":{},"template":"trawa"},{"x":4608,"y":448,"exts":{},"template":"LevelExit"},{"x":1664,"y":512,"exts":{},"template":"trawa"},{"x":1280,"y":448,"exts":{},"template":"skała"},{"x":1280,"y":384,"exts":{},"template":"trawa"},{"x":1344,"y":384,"exts":{},"template":"Platform"},{"x":1728,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":1792,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":1856,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":1920,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":1984,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":2048,"y":384,"exts":{},"template":"Platform"},{"x":2432,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":2496,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":2560,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":2624,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":2688,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":2752,"y":384,"exts":{},"template":"Platform"},{"x":3136,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":3200,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":3264,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":3328,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":3392,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":3456,"y":384,"exts":{},"template":"Platform"},{"x":3904,"y":448,"exts":{},"template":"skała"},{"x":3904,"y":384,"exts":{},"template":"trawa"},{"x":320,"y":448,"exts":{},"template":"platforma_ukryta"},{"x":384,"y":448,"exts":{},"template":"platforma_ukryta"},{"x":448,"y":448,"exts":{},"template":"platforma_ukryta"},{"x":512,"y":448,"exts":{},"template":"platforma_ukryta"},{"x":576,"y":448,"exts":{},"template":"platforma_ukryta"},{"x":640,"y":448,"exts":{},"template":"platforma_ukryta"},{"x":704,"y":448,"exts":{},"template":"platforma_ukryta"},{"x":768,"y":448,"exts":{},"template":"platforma_ukryta"},{"x":832,"y":448,"exts":{},"template":"platforma_ukryta"},{"x":896,"y":448,"exts":{},"template":"platforma_ukryta"},{"x":960,"y":448,"exts":{},"template":"platforma_ukryta"},{"x":1152,"y":448,"exts":{},"template":"Heart"},{"x":4096,"y":448,"exts":{},"template":"Heart"},{"x":1280,"y":320,"exts":{},"template":"Checkpoint"},{"x":128,"y":512,"exts":{},"template":"robot"},{"x":384,"y":384,"exts":{},"template":"GreenCrystal"},{"x":448,"y":384,"exts":{},"template":"GreenCrystal"},{"x":512,"y":384,"exts":{},"template":"GreenCrystal"},{"x":576,"y":384,"exts":{},"template":"GreenCrystal"},{"x":640,"y":384,"exts":{},"template":"GreenCrystal"},{"x":704,"y":384,"exts":{},"template":"GreenCrystal"},{"x":768,"y":384,"exts":{},"template":"GreenCrystal"},{"x":832,"y":384,"exts":{},"template":"GreenCrystal"},{"x":960,"y":384,"exts":{},"template":"GreenCrystal"},{"x":896,"y":384,"exts":{},"template":"GreenCrystal"},{"x":1792,"y":320,"exts":{},"template":"GreenCrystal"},{"x":1984,"y":320,"exts":{},"template":"GreenCrystal"},{"x":1920,"y":320,"exts":{},"template":"GreenCrystal"},{"x":1856,"y":320,"exts":{},"template":"GreenCrystal"},{"x":2496,"y":320,"exts":{},"template":"GreenCrystal"},{"x":2560,"y":320,"exts":{},"template":"GreenCrystal"},{"x":2624,"y":320,"exts":{},"template":"GreenCrystal"},{"x":2688,"y":320,"exts":{},"template":"GreenCrystal"},{"x":3200,"y":320,"exts":{},"template":"GreenCrystal"},{"x":3264,"y":320,"exts":{},"template":"GreenCrystal"},{"x":3328,"y":320,"exts":{},"template":"GreenCrystal"},{"x":3392,"y":320,"exts":{},"template":"GreenCrystal"},{"x":320,"y":512,"exts":{},"template":"lava2-top"},{"x":384,"y":512,"exts":{},"template":"lava2-top"},{"x":512,"y":512,"exts":{},"template":"lava2-top"},{"x":448,"y":512,"exts":{},"template":"lava2-top"},{"x":576,"y":512,"exts":{},"template":"lava2-top"},{"x":640,"y":512,"exts":{},"template":"lava2-top"},{"x":704,"y":512,"exts":{},"template":"lava2-top"},{"x":768,"y":512,"exts":{},"template":"lava2-top"},{"x":832,"y":512,"exts":{},"template":"lava2-top"},{"x":896,"y":512,"exts":{},"template":"lava2-top"},{"x":960,"y":512,"exts":{},"template":"lava2-top"},{"x":3328,"y":512,"exts":{},"template":"trawa"},{"x":1728,"y":512,"exts":{},"template":"trawa"},{"x":1792,"y":512,"exts":{},"template":"trawa"},{"x":1856,"y":512,"exts":{},"template":"trawa"},{"x":1920,"y":512,"exts":{},"template":"trawa"},{"x":2048,"y":512,"exts":{},"template":"trawa"},{"x":2048,"y":512,"exts":{},"template":"trawa"},{"x":1984,"y":512,"exts":{},"template":"trawa"},{"x":2112,"y":512,"exts":{},"template":"trawa"},{"x":2176,"y":512,"exts":{},"template":"trawa"},{"x":2240,"y":512,"exts":{},"template":"trawa"},{"x":2304,"y":512,"exts":{},"template":"trawa"},{"x":2368,"y":512,"exts":{},"template":"trawa"},{"x":1344,"y":448,"exts":{},"template":"kolce"},{"x":1408,"y":448,"exts":{},"template":"kolce"},{"x":1472,"y":448,"exts":{},"template":"kolce"},{"x":1536,"y":448,"exts":{},"template":"kolce"},{"x":1600,"y":448,"exts":{},"template":"kolce"},{"x":1664,"y":448,"exts":{},"template":"kolce"},{"x":1728,"y":448,"exts":{},"template":"kolce"},{"x":1792,"y":448,"exts":{},"template":"kolce"},{"x":1856,"y":448,"exts":{},"template":"kolce"},{"x":1920,"y":448,"exts":{},"template":"kolce"},{"x":1984,"y":448,"exts":{},"template":"kolce"},{"x":2048,"y":448,"exts":{},"template":"kolce"},{"x":2112,"y":448,"exts":{},"template":"kolce"},{"x":2176,"y":448,"exts":{},"template":"kolce"},{"x":2240,"y":448,"exts":{},"template":"kolce"},{"x":2304,"y":448,"exts":{},"template":"kolce"},{"x":2368,"y":448,"exts":{},"template":"kolce"},{"x":2432,"y":448,"exts":{},"template":"kolce"},{"x":2496,"y":448,"exts":{},"template":"kolce"},{"x":2560,"y":448,"exts":{},"template":"kolce"},{"x":2624,"y":448,"exts":{},"template":"kolce"},{"x":2688,"y":448,"exts":{},"template":"kolce"},{"x":2752,"y":448,"exts":{},"template":"kolce"},{"x":2816,"y":448,"exts":{},"template":"kolce"},{"x":2880,"y":448,"exts":{},"template":"kolce"},{"x":2944,"y":448,"exts":{},"template":"kolce"},{"x":3008,"y":448,"exts":{},"template":"kolce"},{"x":3072,"y":448,"exts":{},"template":"kolce"},{"x":3136,"y":448,"exts":{},"template":"kolce"},{"x":3200,"y":448,"exts":{},"template":"kolce"},{"x":3264,"y":448,"exts":{},"template":"kolce"},{"x":3328,"y":448,"exts":{},"template":"kolce"},{"x":3392,"y":448,"exts":{},"template":"kolce"},{"x":3456,"y":448,"exts":{},"template":"kolce"},{"x":3520,"y":448,"exts":{},"template":"kolce"},{"x":3584,"y":448,"exts":{},"template":"kolce"},{"x":3648,"y":448,"exts":{},"template":"kolce"},{"x":3712,"y":448,"exts":{},"template":"kolce"},{"x":3776,"y":448,"exts":{},"template":"kolce"},{"x":3840,"y":448,"exts":{},"template":"kolce"},{"x":4317,"y":489,"exts":{},"template":"GreenCrystal"},{"x":4288,"y":448,"exts":{},"template":"skrzynia"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'poziom5';
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['poziom5'] = {
    name: 'poziom5',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":512,"exts":{},"template":"trawa"},{"x":64,"y":512,"exts":{},"template":"trawa"},{"x":128,"y":512,"exts":{},"template":"trawa"},{"x":192,"y":512,"exts":{},"template":"trawa"},{"x":256,"y":512,"exts":{},"template":"trawa"},{"x":320,"y":512,"exts":{},"template":"trawa"},{"x":384,"y":512,"exts":{},"template":"trawa"},{"x":448,"y":512,"exts":{},"template":"trawa"},{"x":512,"y":512,"exts":{},"template":"trawa"},{"x":576,"y":512,"exts":{},"template":"trawa"},{"x":640,"y":512,"exts":{},"template":"trawa"},{"x":704,"y":512,"exts":{},"template":"trawa"},{"x":768,"y":512,"exts":{},"template":"skała"},{"x":-64,"y":512,"exts":{},"template":"skała"},{"x":-64,"y":448,"exts":{},"template":"skała"},{"x":-64,"y":384,"exts":{},"template":"skała"},{"x":-64,"y":320,"exts":{},"template":"skała"},{"x":-64,"y":256,"exts":{},"template":"skała"},{"x":-64,"y":192,"exts":{},"template":"skała"},{"x":-64,"y":128,"exts":{},"template":"skała"},{"x":-64,"y":128,"exts":{},"template":"skała"},{"x":-64,"y":64,"exts":{},"template":"skała"},{"x":-64,"y":0,"exts":{},"template":"skała"},{"x":-64,"y":-64,"exts":{},"template":"skała"},{"x":-64,"y":-128,"exts":{},"template":"skała"},{"x":-64,"y":-192,"exts":{},"template":"skała"},{"x":-64,"y":-256,"exts":{},"template":"skała"},{"x":-64,"y":-320,"exts":{},"template":"skała"},{"x":-64,"y":-384,"exts":{},"template":"skała"},{"x":768,"y":448,"exts":{},"template":"skała"},{"x":768,"y":384,"exts":{},"template":"skała"},{"x":768,"y":320,"exts":{},"template":"skała"},{"x":768,"y":192,"exts":{},"template":"skała"},{"x":768,"y":128,"exts":{},"template":"skała"},{"x":768,"y":64,"exts":{},"template":"skała"},{"x":768,"y":0,"exts":{},"template":"trawa"},{"x":-64,"y":-448,"exts":{},"template":"trawa"},{"x":64,"y":512,"exts":{},"template":"robot"},{"x":832,"y":0,"exts":{},"template":"trawa"},{"x":896,"y":0,"exts":{},"template":"trawa"},{"x":960,"y":0,"exts":{},"template":"trawa"},{"x":1024,"y":0,"exts":{},"template":"trawa"},{"x":1088,"y":0,"exts":{},"template":"trawa"},{"x":1088,"y":64,"exts":{},"template":"skała"},{"x":1152,"y":64,"exts":{},"template":"trawa"},{"x":1216,"y":64,"exts":{},"template":"trawa"},{"x":1280,"y":64,"exts":{},"template":"trawa"},{"x":1344,"y":64,"exts":{},"template":"lava2-top"},{"x":1408,"y":64,"exts":{},"template":"lava2-top"},{"x":1472,"y":64,"exts":{},"template":"lava2-top"},{"x":1536,"y":64,"exts":{},"template":"lava2-top"},{"x":1600,"y":64,"exts":{},"template":"lava2-top"},{"x":1664,"y":64,"exts":{},"template":"lava2-top"},{"x":1728,"y":64,"exts":{},"template":"lava2-top"},{"x":1792,"y":64,"exts":{},"template":"trawa"},{"x":1856,"y":64,"exts":{},"template":"trawa"},{"x":1984,"y":64,"exts":{},"template":"trawa"},{"x":1920,"y":64,"exts":{},"template":"trawa"},{"x":2048,"y":64,"exts":{},"template":"trawa"},{"x":2112,"y":64,"exts":{},"template":"skała"},{"x":2112,"y":0,"exts":{},"template":"skała"},{"x":2112,"y":-64,"exts":{},"template":"skała"},{"x":2112,"y":-128,"exts":{},"template":"skała"},{"x":2112,"y":-192,"exts":{},"template":"skała"},{"x":2112,"y":-192,"exts":{},"template":"skała"},{"x":2112,"y":-256,"exts":{},"template":"trawa"},{"x":2048,"y":0,"exts":{},"template":"LevelExit"},{"x":1344,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":1408,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":1472,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":1600,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":1664,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":1728,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":1536,"y":0,"exts":{},"template":"pratforma"},{"x":512,"y":448,"exts":{},"template":"platforma_ukryta"},{"x":576,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":640,"y":320,"exts":{},"template":"platforma_ukryta"},{"x":704,"y":320,"exts":{},"template":"platforma_ukryta"},{"x":512,"y":256,"exts":{},"template":"platforma_ukryta"},{"x":448,"y":256,"exts":{},"template":"platforma_ukryta"},{"x":384,"y":256,"exts":{},"template":"platforma_ukryta"},{"x":320,"y":192,"exts":{},"template":"platforma_ukryta"},{"x":256,"y":128,"exts":{},"template":"platforma_ukryta"},{"x":192,"y":64,"exts":{},"template":"platforma_ukryta"},{"x":128,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":64,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":0,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":448,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":512,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":320,"y":-128,"exts":{},"template":"platforma_ukryta"},{"x":256,"y":-128,"exts":{},"template":"platforma_ukryta"},{"x":192,"y":-128,"exts":{},"template":"platforma_ukryta"},{"x":128,"y":-128,"exts":{},"template":"platforma_ukryta"},{"x":0,"y":-64,"exts":{},"template":"platforma_ukryta"},{"x":576,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":640,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":704,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":832,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":896,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":960,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":1024,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":1088,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":1152,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":1856,"y":0,"exts":{},"template":"GreenCrystal"},{"x":1920,"y":0,"exts":{},"template":"GreenCrystal"},{"x":1984,"y":0,"exts":{},"template":"GreenCrystal"},{"x":192,"y":448,"exts":{},"template":"GreenCrystal"},{"x":256,"y":448,"exts":{},"template":"GreenCrystal"},{"x":320,"y":448,"exts":{},"template":"GreenCrystal"},{"x":384,"y":448,"exts":{},"template":"GreenCrystal"},{"x":448,"y":448,"exts":{},"template":"GreenCrystal"},{"x":128,"y":-192,"exts":{},"template":"GreenCrystal"},{"x":192,"y":-192,"exts":{},"template":"GreenCrystal"},{"x":256,"y":-192,"exts":{},"template":"GreenCrystal"},{"x":320,"y":-192,"exts":{},"template":"GreenCrystal"},{"x":384,"y":-192,"exts":{},"template":"GreenCrystal"},{"x":448,"y":-192,"exts":{},"template":"GreenCrystal"},{"x":448,"y":-128,"exts":{},"template":"GreenCrystal"},{"x":448,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":512,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":576,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":640,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":704,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":768,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":1856,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":1920,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":1984,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":1216,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":1280,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":1216,"y":0,"exts":{},"template":"GreenCrystal"},{"x":1280,"y":0,"exts":{},"template":"GreenCrystal"},{"x":1344,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":1792,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":1600,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":1536,"y":-64,"exts":{},"template":"GreenCrystal"},{"x":735,"y":295,"exts":{},"template":"GreenCrystal"},{"x":704,"y":256,"exts":{},"template":"skrzynia"},{"x":768,"y":256,"exts":{},"template":"skała"},{"x":384,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":320,"y":-64,"exts":{},"template":"platforma_ukryta"},{"x":320,"y":0,"exts":{},"template":"platforma_ukryta"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'poziom6';
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['poziom6'] = {
    name: 'poziom6',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":192,"y":384,"exts":{},"template":"trawa"},{"x":256,"y":384,"exts":{},"template":"trawa"},{"x":320,"y":384,"exts":{},"template":"trawa"},{"x":384,"y":384,"exts":{},"template":"trawa"},{"x":512,"y":384,"exts":{},"template":"trawa"},{"x":448,"y":384,"exts":{},"template":"trawa"},{"x":576,"y":384,"exts":{},"template":"trawa"},{"x":640,"y":384,"exts":{},"template":"trawa"},{"x":64,"y":384,"exts":{},"template":"trawa"},{"x":0,"y":320,"exts":{},"template":"skała"},{"x":0,"y":320,"exts":{},"template":"skała"},{"x":0,"y":256,"exts":{},"template":"skała"},{"x":0,"y":192,"exts":{},"template":"skała"},{"x":0,"y":192,"exts":{},"template":"skała"},{"x":576,"y":320,"exts":{},"template":"Boss1"},{"x":-64,"y":256,"exts":{},"template":"skała"},{"x":-64,"y":256,"exts":{},"template":"skała"},{"x":-192,"y":256,"exts":{},"template":"robot"},{"x":128,"y":384,"exts":{},"template":"trawa"},{"x":832,"y":320,"exts":{},"template":"trawa"},{"x":896,"y":256,"exts":{},"template":"trawa"},{"x":896,"y":192,"exts":{},"template":"LevelExit"},{"x":704,"y":384,"exts":{},"template":"skała"},{"x":704,"y":320,"exts":{},"template":"trawa"},{"x":768,"y":320,"exts":{},"template":"trawa"},{"x":0,"y":384,"exts":{},"template":"skała"},{"x":0,"y":128,"exts":{},"template":"trawa"},{"x":-64,"y":192,"exts":{},"template":"trawa"},{"x":-128,"y":256,"exts":{},"template":"trawa"},{"x":-192,"y":256,"exts":{},"template":"trawa"},{"x":-256,"y":256,"exts":{},"template":"trawa"},{"x":-320,"y":256,"exts":{},"template":"skała"},{"x":-320,"y":192,"exts":{},"template":"skała"},{"x":-320,"y":128,"exts":{},"template":"skała"},{"x":-320,"y":64,"exts":{},"template":"trawa"},{"x":896,"y":320,"exts":{},"template":"skała"},{"x":960,"y":256,"exts":{},"template":"skała"},{"x":960,"y":192,"exts":{},"template":"skała"},{"x":960,"y":192,"exts":{},"template":"skała"},{"x":960,"y":128,"exts":{},"template":"skała"},{"x":960,"y":64,"exts":{},"template":"skała"},{"x":960,"y":0,"exts":{},"template":"skała"},{"x":960,"y":-64,"exts":{},"template":"trawa"},{"x":867,"y":297,"exts":{},"template":"GreenCrystal"},{"x":832,"y":256,"exts":{},"template":"skrzynia"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'poziom7';
inGameRoomStart(this);
for(var a of ct.templates.list.LevelExit){
    a.visible = false;
}
    },
    extends: {}
}
ct.rooms.templates['poziom7'] = {
    name: 'poziom7',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":128,"y":448,"exts":{},"template":"snieg"},{"x":64,"y":448,"exts":{},"template":"lod"},{"x":64,"y":384,"exts":{},"template":"lod"},{"x":64,"y":384,"exts":{},"template":"lod"},{"x":64,"y":320,"exts":{},"template":"lod"},{"x":64,"y":256,"exts":{},"template":"lod"},{"x":64,"y":256,"exts":{},"template":"lod"},{"x":64,"y":192,"exts":{},"template":"lod"},{"x":64,"y":128,"exts":{},"template":"snieg"},{"x":192,"y":448,"exts":{},"template":"snieg"},{"x":256,"y":448,"exts":{},"template":"snieg"},{"x":320,"y":448,"exts":{},"template":"snieg"},{"x":384,"y":448,"exts":{},"template":"snieg"},{"x":448,"y":448,"exts":{},"template":"WaterTop"},{"x":512,"y":448,"exts":{},"template":"WaterTop"},{"x":640,"y":448,"exts":{},"template":"WaterTop"},{"x":704,"y":448,"exts":{},"template":"WaterTop"},{"x":768,"y":448,"exts":{},"template":"WaterTop"},{"x":832,"y":448,"exts":{},"template":"WaterTop"},{"x":896,"y":448,"exts":{},"template":"WaterTop"},{"x":960,"y":448,"exts":{},"template":"WaterTop"},{"x":1024,"y":448,"exts":{},"template":"snieg"},{"x":1088,"y":448,"exts":{},"template":"snieg"},{"x":640,"y":448,"exts":{},"template":"WaterTop"},{"x":576,"y":448,"exts":{},"template":"WaterTop"},{"x":448,"y":384,"exts":{},"template":"snieg-platforma"},{"x":512,"y":320,"exts":{},"template":"snieg-platforma"},{"x":576,"y":256,"exts":{},"template":"snieg-platforma"},{"x":704,"y":256,"exts":{},"template":"snieg-platforma"},{"x":832,"y":256,"exts":{},"template":"snieg-platforma"},{"x":896,"y":320,"exts":{},"template":"snieg-platforma"},{"x":960,"y":384,"exts":{},"template":"snieg-platforma"},{"x":1152,"y":448,"exts":{},"template":"snieg"},{"x":1216,"y":448,"exts":{},"template":"snieg"},{"x":1216,"y":512,"exts":{},"template":"lod"},{"x":1344,"y":512,"exts":{},"template":"snieg"},{"x":1280,"y":512,"exts":{},"template":"snieg"},{"x":1408,"y":512,"exts":{},"template":"snieg"},{"x":1472,"y":512,"exts":{},"template":"snieg"},{"x":1600,"y":512,"exts":{},"template":"snieg"},{"x":1536,"y":512,"exts":{},"template":"snieg"},{"x":1664,"y":512,"exts":{},"template":"snieg"},{"x":1728,"y":512,"exts":{},"template":"snieg"},{"x":1792,"y":512,"exts":{},"template":"snieg"},{"x":1856,"y":512,"exts":{},"template":"snieg"},{"x":1920,"y":512,"exts":{},"template":"snieg"},{"x":1984,"y":512,"exts":{},"template":"snieg"},{"x":2048,"y":512,"exts":{},"template":"snieg"},{"x":2112,"y":512,"exts":{},"template":"snieg"},{"x":2176,"y":512,"exts":{},"template":"lod"},{"x":2176,"y":448,"exts":{},"template":"snieg"},{"x":2240,"y":448,"exts":{},"template":"snieg"},{"x":2304,"y":448,"exts":{},"template":"snieg"},{"x":2368,"y":448,"exts":{},"template":"snieg"},{"x":2432,"y":448,"exts":{},"template":"snieg"},{"x":2560,"y":448,"exts":{},"template":"snieg"},{"x":2496,"y":448,"exts":{},"template":"snieg"},{"x":2624,"y":448,"exts":{},"template":"lod"},{"x":2624,"y":384,"exts":{},"template":"lod"},{"x":2624,"y":320,"exts":{},"template":"lod"},{"x":2624,"y":256,"exts":{},"template":"lod"},{"x":2624,"y":192,"exts":{},"template":"lod"},{"x":2624,"y":128,"exts":{},"template":"lod"},{"x":2624,"y":64,"exts":{},"template":"snieg"},{"x":1280,"y":448,"exts":{},"template":"kolc"},{"x":1344,"y":448,"exts":{},"template":"kolc"},{"x":1408,"y":448,"exts":{},"template":"kolc"},{"x":1472,"y":448,"exts":{},"template":"kolc"},{"x":1536,"y":448,"exts":{},"template":"kolc"},{"x":1600,"y":448,"exts":{},"template":"kolc"},{"x":1664,"y":448,"exts":{},"template":"kolc"},{"x":1728,"y":448,"exts":{},"template":"kolc"},{"x":1792,"y":448,"exts":{},"template":"kolc"},{"x":1856,"y":448,"exts":{},"template":"kolc"},{"x":1920,"y":448,"exts":{},"template":"kolc"},{"x":1984,"y":448,"exts":{},"template":"kolc"},{"x":2048,"y":448,"exts":{},"template":"kolc"},{"x":2112,"y":448,"exts":{},"template":"kolc"},{"x":1280,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":1344,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":1408,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":1472,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":1536,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":1600,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":1792,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":1856,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":1920,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":1984,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":2048,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":2112,"y":384,"exts":{},"template":"platforma_ukryta"},{"x":1664,"y":384,"exts":{},"template":"snieg-platforma"},{"x":1728,"y":384,"exts":{},"template":"snieg-platforma"},{"x":1664,"y":320,"exts":{},"template":"GreenCrystal"},{"x":1728,"y":320,"exts":{},"template":"GreenCrystal"},{"x":1792,"y":320,"exts":{},"template":"GreenCrystal"},{"x":1792,"y":256,"exts":{},"template":"GreenCrystal"},{"x":1728,"y":256,"exts":{},"template":"GreenCrystal"},{"x":1664,"y":256,"exts":{},"template":"GreenCrystal"},{"x":384,"y":320,"exts":{},"template":"GreenCrystal"},{"x":384,"y":384,"exts":{},"template":"GreenCrystal"},{"x":448,"y":320,"exts":{},"template":"GreenCrystal"},{"x":448,"y":256,"exts":{},"template":"GreenCrystal"},{"x":512,"y":256,"exts":{},"template":"GreenCrystal"},{"x":512,"y":192,"exts":{},"template":"GreenCrystal"},{"x":576,"y":192,"exts":{},"template":"GreenCrystal"},{"x":640,"y":192,"exts":{},"template":"GreenCrystal"},{"x":704,"y":192,"exts":{},"template":"GreenCrystal"},{"x":768,"y":192,"exts":{},"template":"GreenCrystal"},{"x":832,"y":192,"exts":{},"template":"GreenCrystal"},{"x":896,"y":192,"exts":{},"template":"GreenCrystal"},{"x":960,"y":192,"exts":{},"template":"GreenCrystal"},{"x":960,"y":256,"exts":{},"template":"GreenCrystal"},{"x":1024,"y":256,"exts":{},"template":"GreenCrystal"},{"x":1024,"y":320,"exts":{},"template":"GreenCrystal"},{"x":1088,"y":320,"exts":{},"template":"GreenCrystal"},{"x":1088,"y":384,"exts":{},"template":"GreenCrystal"},{"x":1152,"y":384,"exts":{},"template":"GreenCrystal"},{"x":320,"y":384,"exts":{},"template":"GreenCrystal"},{"x":2304,"y":384,"exts":{},"template":"GreenCrystal"},{"x":2368,"y":384,"exts":{},"template":"GreenCrystal"},{"x":2432,"y":384,"exts":{},"template":"GreenCrystal"},{"x":2240,"y":384,"exts":{},"template":"GreenCrystal"},{"x":2496,"y":384,"exts":{},"template":"GreenCrystal"},{"x":2560,"y":384,"exts":{},"template":"LevelExit"},{"x":192,"y":448,"exts":{},"template":"robot"},{"x":1245,"y":428,"exts":{},"template":"GreenCrystal"},{"x":1216,"y":384,"exts":{},"template":"skrzynia_lod"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'poziom8';
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['poziom8'] = {
    name: 'poziom8',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":64,"y":448,"exts":{},"template":"snieg"},{"x":128,"y":448,"exts":{},"template":"snieg"},{"x":128,"y":448,"exts":{},"template":"robot"},{"x":0,"y":448,"exts":{},"template":"lod"},{"x":0,"y":448,"exts":{},"template":"lod"},{"x":0,"y":384,"exts":{},"template":"lod"},{"x":0,"y":320,"exts":{},"template":"lod"},{"x":0,"y":320,"exts":{},"template":"lod"},{"x":0,"y":320,"exts":{},"template":"lod"},{"x":0,"y":256,"exts":{},"template":"lod"},{"x":0,"y":192,"exts":{},"template":"snieg"},{"x":192,"y":448,"exts":{},"template":"snieg"},{"x":256,"y":448,"exts":{},"template":"snieg"},{"x":320,"y":448,"exts":{},"template":"snieg"},{"x":512,"y":320,"exts":{},"template":"snieg"},{"x":576,"y":256,"exts":{},"template":"snieg"},{"x":704,"y":256,"exts":{},"template":"snieg"},{"x":704,"y":256,"exts":{},"template":"snieg"},{"x":640,"y":256,"exts":{},"template":"snieg"},{"x":448,"y":320,"exts":{},"template":"snieg"},{"x":384,"y":384,"exts":{},"template":"snieg"},{"x":768,"y":256,"exts":{},"template":"snieg"},{"x":768,"y":256,"exts":{},"template":"snieg"},{"x":384,"y":448,"exts":{},"template":"WaterTop"},{"x":448,"y":448,"exts":{},"template":"WaterTop"},{"x":512,"y":448,"exts":{},"template":"WaterTop"},{"x":576,"y":448,"exts":{},"template":"WaterTop"},{"x":640,"y":448,"exts":{},"template":"WaterTop"},{"x":704,"y":448,"exts":{},"template":"WaterTop"},{"x":768,"y":448,"exts":{},"template":"WaterTop"},{"x":1024,"y":256,"exts":{},"template":"skrzynia_lod"},{"x":1344,"y":256,"exts":{},"template":"skrzynia_lod"},{"x":832,"y":256,"exts":{},"template":"skrzynia_lod"},{"x":896,"y":256,"exts":{},"template":"skrzynia_lod"},{"x":960,"y":256,"exts":{},"template":"skrzynia_lod"},{"x":1088,"y":256,"exts":{},"template":"skrzynia_lod"},{"x":1152,"y":256,"exts":{},"template":"skrzynia_lod"},{"x":1216,"y":256,"exts":{},"template":"skrzynia_lod"},{"x":1280,"y":256,"exts":{},"template":"skrzynia_lod"},{"x":1408,"y":256,"exts":{},"template":"snieg"},{"x":1472,"y":256,"exts":{},"template":"snieg"},{"x":1536,"y":256,"exts":{},"template":"snieg"},{"x":1600,"y":256,"exts":{},"template":"snieg"},{"x":1664,"y":320,"exts":{},"template":"snieg"},{"x":1728,"y":320,"exts":{},"template":"snieg"},{"x":1792,"y":384,"exts":{},"template":"snieg"},{"x":1856,"y":448,"exts":{},"template":"snieg"},{"x":1920,"y":448,"exts":{},"template":"snieg"},{"x":1984,"y":448,"exts":{},"template":"snieg"},{"x":832,"y":448,"exts":{},"template":"WaterTop"},{"x":960,"y":448,"exts":{},"template":"WaterTop"},{"x":896,"y":448,"exts":{},"template":"WaterTop"},{"x":1024,"y":448,"exts":{},"template":"WaterTop"},{"x":1088,"y":448,"exts":{},"template":"WaterTop"},{"x":1216,"y":448,"exts":{},"template":"WaterTop"},{"x":1152,"y":448,"exts":{},"template":"WaterTop"},{"x":1280,"y":448,"exts":{},"template":"WaterTop"},{"x":1344,"y":448,"exts":{},"template":"WaterTop"},{"x":1408,"y":448,"exts":{},"template":"WaterTop"},{"x":1472,"y":448,"exts":{},"template":"WaterTop"},{"x":1536,"y":448,"exts":{},"template":"WaterTop"},{"x":1600,"y":448,"exts":{},"template":"WaterTop"},{"x":1728,"y":448,"exts":{},"template":"WaterTop"},{"x":1792,"y":448,"exts":{},"template":"WaterTop"},{"x":1664,"y":448,"exts":{},"template":"WaterTop"},{"x":2048,"y":448,"exts":{},"template":"lod"},{"x":2048,"y":384,"exts":{},"template":"lod"},{"x":2048,"y":320,"exts":{},"template":"lod"},{"x":2048,"y":256,"exts":{},"template":"lod"},{"x":2048,"y":192,"exts":{},"template":"lod"},{"x":2048,"y":128,"exts":{},"template":"snieg"},{"x":1984,"y":384,"exts":{},"template":"LevelExit"},{"x":1920,"y":384,"exts":{},"template":"GreenCrystal"},{"x":1856,"y":320,"exts":{},"template":"GreenCrystal"},{"x":1792,"y":256,"exts":{},"template":"GreenCrystal"},{"x":1728,"y":256,"exts":{},"template":"GreenCrystal"},{"x":1664,"y":192,"exts":{},"template":"GreenCrystal"},{"x":1600,"y":192,"exts":{},"template":"GreenCrystal"},{"x":1536,"y":192,"exts":{},"template":"GreenCrystal"},{"x":1472,"y":192,"exts":{},"template":"GreenCrystal"},{"x":768,"y":192,"exts":{},"template":"GreenCrystal"},{"x":704,"y":192,"exts":{},"template":"GreenCrystal"},{"x":640,"y":192,"exts":{},"template":"GreenCrystal"},{"x":512,"y":256,"exts":{},"template":"GreenCrystal"},{"x":448,"y":256,"exts":{},"template":"GreenCrystal"},{"x":384,"y":320,"exts":{},"template":"GreenCrystal"},{"x":320,"y":384,"exts":{},"template":"GreenCrystal"},{"x":256,"y":384,"exts":{},"template":"GreenCrystal"},{"x":576,"y":192,"exts":{},"template":"GreenCrystal"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'poziom9';
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['poziom9'] = {
    name: 'poziom9',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":64,"y":448,"exts":{},"template":"snieg"},{"x":128,"y":448,"exts":{},"template":"snieg"},{"x":192,"y":448,"exts":{},"template":"snieg"},{"x":256,"y":448,"exts":{},"template":"snieg"},{"x":0,"y":448,"exts":{},"template":"lod"},{"x":0,"y":384,"exts":{},"template":"lod"},{"x":0,"y":320,"exts":{},"template":"lod"},{"x":0,"y":320,"exts":{},"template":"lod"},{"x":0,"y":256,"exts":{},"template":"lod"},{"x":0,"y":192,"exts":{},"template":"snieg"},{"x":128,"y":448,"exts":{},"template":"robot"},{"x":320,"y":448,"exts":{},"template":"WaterTop"},{"x":384,"y":448,"exts":{},"template":"WaterTop"},{"x":448,"y":448,"exts":{},"template":"WaterTop"},{"x":512,"y":448,"exts":{},"template":"WaterTop"},{"x":576,"y":448,"exts":{},"template":"WaterTop"},{"x":640,"y":448,"exts":{},"template":"WaterTop"},{"x":704,"y":448,"exts":{},"template":"WaterTop"},{"x":768,"y":448,"exts":{},"template":"WaterTop"},{"x":832,"y":448,"exts":{},"template":"WaterTop"},{"x":896,"y":448,"exts":{},"template":"WaterTop"},{"x":960,"y":448,"exts":{},"template":"WaterTop"},{"x":1024,"y":448,"exts":{},"template":"WaterTop"},{"x":1088,"y":448,"exts":{},"template":"WaterTop"},{"x":1152,"y":448,"exts":{},"template":"WaterTop"},{"x":1216,"y":448,"exts":{},"template":"WaterTop"},{"x":1280,"y":448,"exts":{},"template":"WaterTop"},{"x":1344,"y":448,"exts":{},"template":"WaterTop"},{"x":1408,"y":448,"exts":{},"template":"WaterTop"},{"x":1472,"y":448,"exts":{},"template":"WaterTop"},{"x":1600,"y":448,"exts":{},"template":"WaterTop"},{"x":1536,"y":448,"exts":{},"template":"WaterTop"},{"x":1664,"y":448,"exts":{},"template":"WaterTop"},{"x":1728,"y":448,"exts":{},"template":"WaterTop"},{"x":1792,"y":448,"exts":{},"template":"WaterTop"},{"x":1856,"y":448,"exts":{},"template":"WaterTop"},{"x":1920,"y":448,"exts":{},"template":"WaterTop"},{"x":1984,"y":448,"exts":{},"template":"snieg"},{"x":2048,"y":448,"exts":{},"template":"snieg"},{"x":320,"y":384,"exts":{},"template":"snieg-platforma"},{"x":384,"y":320,"exts":{},"template":"snieg-platforma"},{"x":512,"y":320,"exts":{},"template":"snieg-platforma"},{"x":640,"y":256,"exts":{},"template":"snieg-platforma"},{"x":768,"y":192,"exts":{},"template":"snieg-platforma"},{"x":960,"y":256,"exts":{},"template":"snieg-platforma"},{"x":896,"y":256,"exts":{},"template":"snieg-platforma"},{"x":1088,"y":320,"exts":{},"template":"snieg-platforma"},{"x":1152,"y":384,"exts":{},"template":"snieg-platforma"},{"x":1216,"y":384,"exts":{},"template":"snieg-platforma"},{"x":1280,"y":384,"exts":{},"template":"snieg-platforma"},{"x":1344,"y":384,"exts":{},"template":"snieg-platforma"},{"x":1408,"y":320,"exts":{},"template":"snieg-platforma"},{"x":2112,"y":448,"exts":{},"template":"snieg"},{"x":2176,"y":448,"exts":{},"template":"lod"},{"x":2176,"y":448,"exts":{},"template":"lod"},{"x":2176,"y":448,"exts":{},"template":"lod"},{"x":2176,"y":384,"exts":{},"template":"lod"},{"x":2176,"y":320,"exts":{},"template":"lod"},{"x":2176,"y":256,"exts":{},"template":"snieg"},{"x":2112,"y":384,"exts":{},"template":"LevelExit"},{"x":1472,"y":256,"exts":{},"template":"snieg-platforma"},{"x":1536,"y":192,"exts":{},"template":"snieg-platforma"},{"x":1600,"y":128,"exts":{},"template":"snieg-platforma"},{"x":1664,"y":64,"exts":{},"template":"snieg-platforma"},{"x":1728,"y":0,"exts":{},"template":"snieg-platforma"},{"x":1792,"y":-64,"exts":{},"template":"snieg-platforma"},{"x":1856,"y":-128,"exts":{},"template":"snieg-platforma"},{"x":2016,"y":424,"exts":{},"template":"GreenCrystal"},{"x":2015,"y":367,"exts":{},"template":"GreenCrystal"},{"x":2016,"y":300,"exts":{},"template":"GreenCrystal"},{"x":2017,"y":238,"exts":{},"template":"GreenCrystal"},{"x":2014,"y":168,"exts":{},"template":"GreenCrystal"},{"x":2015,"y":109,"exts":{},"template":"GreenCrystal"},{"x":2014,"y":44,"exts":{},"template":"GreenCrystal"},{"x":2014,"y":-21,"exts":{},"template":"GreenCrystal"},{"x":2016,"y":-85,"exts":{},"template":"GreenCrystal"},{"x":1984,"y":-64,"exts":{},"template":"skrzynia_lod"},{"x":1984,"y":0,"exts":{},"template":"skrzynia_lod"},{"x":1984,"y":-128,"exts":{},"template":"skrzynia_lod"},{"x":1984,"y":128,"exts":{},"template":"skrzynia_lod"},{"x":1984,"y":64,"exts":{},"template":"skrzynia_lod"},{"x":1984,"y":192,"exts":{},"template":"skrzynia_lod"},{"x":1984,"y":256,"exts":{},"template":"skrzynia_lod"},{"x":1984,"y":320,"exts":{},"template":"skrzynia_lod"},{"x":1984,"y":384,"exts":{},"template":"skrzynia_lod"},{"x":1920,"y":-128,"exts":{},"template":"snieg-platforma"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'poziom10';
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['poziom10'] = {
    name: 'poziom10',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":448,"exts":{},"template":"Water"},{"x":0,"y":384,"exts":{},"template":"Water"},{"x":0,"y":320,"exts":{},"template":"Water"},{"x":0,"y":256,"exts":{},"template":"Water"},{"x":0,"y":192,"exts":{},"template":"Water"},{"x":0,"y":128,"exts":{},"template":"Water"},{"x":0,"y":512,"exts":{},"template":"Water"},{"x":0,"y":64,"exts":{},"template":"WaterTop"},{"x":0,"y":576,"exts":{},"template":"Water"},{"x":0,"y":640,"exts":{},"template":"Water"},{"x":0,"y":704,"exts":{},"template":"Water"},{"x":0,"y":768,"exts":{},"template":"Water"},{"x":64,"y":448,"exts":{},"template":"lod"},{"x":64,"y":384,"exts":{},"template":"lod"},{"x":64,"y":320,"exts":{},"template":"lod"},{"x":64,"y":256,"exts":{},"template":"lod"},{"x":64,"y":128,"exts":{},"template":"Water"},{"x":64,"y":512,"exts":{},"template":"Water"},{"x":64,"y":512,"exts":{},"template":"Water"},{"x":64,"y":192,"exts":{},"template":"lod"},{"x":64,"y":64,"exts":{},"template":"WaterTop"},{"x":64,"y":576,"exts":{},"template":"Water"},{"x":64,"y":640,"exts":{},"template":"Water"},{"x":64,"y":704,"exts":{},"template":"Water"},{"x":64,"y":768,"exts":{},"template":"Water"},{"x":128,"y":128,"exts":{},"template":"Water"},{"x":128,"y":512,"exts":{},"template":"Water"},{"x":128,"y":192,"exts":{},"template":"lod"},{"x":128,"y":448,"exts":{},"template":"lod"},{"x":128,"y":64,"exts":{},"template":"WaterTop"},{"x":128,"y":576,"exts":{},"template":"Water"},{"x":128,"y":576,"exts":{},"template":"Water"},{"x":128,"y":640,"exts":{},"template":"Water"},{"x":128,"y":704,"exts":{},"template":"Water"},{"x":128,"y":768,"exts":{},"template":"Water"},{"x":192,"y":128,"exts":{},"template":"Water"},{"x":192,"y":512,"exts":{},"template":"Water"},{"x":192,"y":512,"exts":{},"template":"Water"},{"x":192,"y":192,"exts":{},"template":"lod"},{"x":192,"y":448,"exts":{},"template":"lod"},{"x":192,"y":64,"exts":{},"template":"WaterTop"},{"x":192,"y":576,"exts":{},"template":"Water"},{"x":192,"y":640,"exts":{},"template":"Water"},{"x":192,"y":704,"exts":{},"template":"Water"},{"x":192,"y":768,"exts":{},"template":"Water"},{"x":256,"y":128,"exts":{},"template":"Water"},{"x":256,"y":512,"exts":{},"template":"Water"},{"x":256,"y":192,"exts":{},"template":"lod"},{"x":256,"y":448,"exts":{},"template":"lod"},{"x":256,"y":64,"exts":{},"template":"WaterTop"},{"x":256,"y":576,"exts":{},"template":"Water"},{"x":256,"y":640,"exts":{},"template":"Water"},{"x":256,"y":704,"exts":{},"template":"Water"},{"x":256,"y":768,"exts":{},"template":"Water"},{"x":320,"y":128,"exts":{},"template":"Water"},{"x":320,"y":512,"exts":{},"template":"Water"},{"x":320,"y":192,"exts":{},"template":"lod"},{"x":320,"y":448,"exts":{},"template":"lod"},{"x":320,"y":64,"exts":{},"template":"WaterTop"},{"x":320,"y":576,"exts":{},"template":"Water"},{"x":320,"y":576,"exts":{},"template":"Water"},{"x":320,"y":640,"exts":{},"template":"Water"},{"x":320,"y":704,"exts":{},"template":"Water"},{"x":320,"y":768,"exts":{},"template":"Water"},{"x":384,"y":128,"exts":{},"template":"Water"},{"x":384,"y":512,"exts":{},"template":"Water"},{"x":384,"y":192,"exts":{},"template":"lod"},{"x":384,"y":448,"exts":{},"template":"lod"},{"x":384,"y":64,"exts":{},"template":"WaterTop"},{"x":384,"y":576,"exts":{},"template":"Water"},{"x":384,"y":576,"exts":{},"template":"Water"},{"x":384,"y":640,"exts":{},"template":"Water"},{"x":384,"y":704,"exts":{},"template":"Water"},{"x":384,"y":768,"exts":{},"template":"Water"},{"x":448,"y":448,"exts":{},"template":"lod"},{"x":448,"y":256,"exts":{},"template":"lod"},{"x":448,"y":128,"exts":{},"template":"Water"},{"x":448,"y":512,"exts":{},"template":"Water"},{"x":448,"y":512,"exts":{},"template":"Water"},{"x":448,"y":192,"exts":{},"template":"lod"},{"x":448,"y":64,"exts":{},"template":"WaterTop"},{"x":448,"y":576,"exts":{},"template":"Water"},{"x":448,"y":640,"exts":{},"template":"Water"},{"x":448,"y":704,"exts":{},"template":"Water"},{"x":448,"y":768,"exts":{},"template":"Water"},{"x":512,"y":128,"exts":{},"template":"Water"},{"x":512,"y":192,"exts":{},"template":"Water"},{"x":512,"y":512,"exts":{},"template":"Water"},{"x":512,"y":64,"exts":{},"template":"WaterTop"},{"x":512,"y":448,"exts":{},"template":"lod"},{"x":512,"y":512,"exts":{},"template":"lod"},{"x":512,"y":576,"exts":{},"template":"lod"},{"x":512,"y":640,"exts":{},"template":"lod"},{"x":512,"y":768,"exts":{},"template":"Water"},{"x":576,"y":704,"exts":{},"template":"lod"},{"x":576,"y":768,"exts":{},"template":"Water"},{"x":576,"y":192,"exts":{},"template":"Water"},{"x":576,"y":128,"exts":{},"template":"Water"},{"x":640,"y":704,"exts":{},"template":"lod"},{"x":640,"y":768,"exts":{},"template":"Water"},{"x":640,"y":128,"exts":{},"template":"Water"},{"x":640,"y":192,"exts":{},"template":"Water"},{"x":704,"y":704,"exts":{},"template":"lod"},{"x":704,"y":768,"exts":{},"template":"Water"},{"x":704,"y":192,"exts":{},"template":"Water"},{"x":704,"y":128,"exts":{},"template":"Water"},{"x":768,"y":704,"exts":{},"template":"lod"},{"x":768,"y":448,"exts":{},"template":"lod"},{"x":768,"y":768,"exts":{},"template":"Water"},{"x":768,"y":128,"exts":{},"template":"Water"},{"x":768,"y":192,"exts":{},"template":"Water"},{"x":768,"y":256,"exts":{},"template":"Water"},{"x":768,"y":320,"exts":{},"template":"Water"},{"x":832,"y":704,"exts":{},"template":"lod"},{"x":832,"y":448,"exts":{},"template":"lod"},{"x":832,"y":768,"exts":{},"template":"Water"},{"x":832,"y":256,"exts":{},"template":"Water"},{"x":832,"y":384,"exts":{},"template":"Water"},{"x":832,"y":320,"exts":{},"template":"Water"},{"x":832,"y":192,"exts":{},"template":"Water"},{"x":832,"y":128,"exts":{},"template":"Water"},{"x":896,"y":704,"exts":{},"template":"WaterTop"},{"x":896,"y":640,"exts":{},"template":"snieg-platforma"},{"x":896,"y":448,"exts":{},"template":"lod"},{"x":896,"y":768,"exts":{},"template":"Water"},{"x":896,"y":128,"exts":{},"template":"Water"},{"x":960,"y":704,"exts":{},"template":"WaterTop"},{"x":960,"y":640,"exts":{},"template":"snieg-platforma"},{"x":960,"y":448,"exts":{},"template":"lod"},{"x":960,"y":768,"exts":{},"template":"Water"},{"x":960,"y":128,"exts":{},"template":"Water"},{"x":960,"y":256,"exts":{},"template":"Water"},{"x":1024,"y":704,"exts":{},"template":"WaterTop"},{"x":1024,"y":640,"exts":{},"template":"snieg-platforma"},{"x":1024,"y":448,"exts":{},"template":"lod"},{"x":1024,"y":768,"exts":{},"template":"Water"},{"x":1024,"y":128,"exts":{},"template":"Water"},{"x":1024,"y":192,"exts":{},"template":"Water"},{"x":1088,"y":704,"exts":{},"template":"WaterTop"},{"x":1088,"y":640,"exts":{},"template":"snieg-platforma"},{"x":1088,"y":448,"exts":{},"template":"lod"},{"x":1088,"y":768,"exts":{},"template":"Water"},{"x":1088,"y":128,"exts":{},"template":"Water"},{"x":1152,"y":704,"exts":{},"template":"WaterTop"},{"x":1152,"y":640,"exts":{},"template":"snieg-platforma"},{"x":1152,"y":448,"exts":{},"template":"lod"},{"x":1152,"y":768,"exts":{},"template":"Water"},{"x":1152,"y":128,"exts":{},"template":"Water"},{"x":1152,"y":320,"exts":{},"template":"Water"},{"x":1216,"y":704,"exts":{},"template":"WaterTop"},{"x":1216,"y":640,"exts":{},"template":"snieg-platforma"},{"x":1216,"y":448,"exts":{},"template":"lod"},{"x":1216,"y":768,"exts":{},"template":"Water"},{"x":1280,"y":704,"exts":{},"template":"WaterTop"},{"x":1280,"y":640,"exts":{},"template":"snieg-platforma"},{"x":1280,"y":448,"exts":{},"template":"lod"},{"x":1280,"y":768,"exts":{},"template":"Water"},{"x":1344,"y":448,"exts":{},"template":"lod"},{"x":1344,"y":704,"exts":{},"template":"lod"},{"x":1344,"y":768,"exts":{},"template":"Water"},{"x":1408,"y":448,"exts":{},"template":"lod"},{"x":1408,"y":704,"exts":{},"template":"lod"},{"x":1472,"y":704,"exts":{},"template":"lod"},{"x":1472,"y":448,"exts":{},"template":"lod"},{"x":1472,"y":512,"exts":{},"template":"lod"},{"x":1536,"y":512,"exts":{},"template":"lod"},{"x":1536,"y":704,"exts":{},"template":"lod"},{"x":1600,"y":704,"exts":{},"template":"kolc"},{"x":1600,"y":512,"exts":{},"template":"lod"},{"x":1664,"y":704,"exts":{},"template":"lod"},{"x":1664,"y":512,"exts":{},"template":"lod"},{"x":1664,"y":448,"exts":{},"template":"lod"},{"x":1728,"y":704,"exts":{},"template":"lod"},{"x":1728,"y":448,"exts":{},"template":"lod"},{"x":1792,"y":704,"exts":{},"template":"lod"},{"x":1792,"y":448,"exts":{},"template":"lod"},{"x":1792,"y":448,"exts":{},"template":"lod"},{"x":1856,"y":704,"exts":{},"template":"lod"},{"x":1856,"y":448,"exts":{},"template":"lod"},{"x":1856,"y":640,"exts":{},"template":"LevelExit"},{"x":1920,"y":704,"exts":{},"template":"lod"},{"x":1920,"y":640,"exts":{},"template":"lod"},{"x":1920,"y":576,"exts":{},"template":"lod"},{"x":1920,"y":512,"exts":{},"template":"lod"},{"x":1920,"y":448,"exts":{},"template":"lod"},{"x":1920,"y":448,"exts":{},"template":"lod"},{"x":1024,"y":320,"exts":{},"template":"Water"},{"x":960,"y":320,"exts":{},"template":"Water"},{"x":960,"y":192,"exts":{},"template":"Water"},{"x":960,"y":192,"exts":{},"template":"Water"},{"x":896,"y":256,"exts":{},"template":"Water"},{"x":896,"y":192,"exts":{},"template":"Water"},{"x":896,"y":384,"exts":{},"template":"Water"},{"x":896,"y":320,"exts":{},"template":"Water"},{"x":960,"y":384,"exts":{},"template":"Water"},{"x":1024,"y":384,"exts":{},"template":"Water"},{"x":1088,"y":384,"exts":{},"template":"Water"},{"x":1152,"y":384,"exts":{},"template":"Water"},{"x":1088,"y":320,"exts":{},"template":"Water"},{"x":1024,"y":256,"exts":{},"template":"Water"},{"x":1088,"y":256,"exts":{},"template":"Water"},{"x":1088,"y":256,"exts":{},"template":"Water"},{"x":1152,"y":256,"exts":{},"template":"Water"},{"x":1088,"y":192,"exts":{},"template":"Water"},{"x":1152,"y":192,"exts":{},"template":"Water"},{"x":1216,"y":128,"exts":{},"template":"Water"},{"x":1216,"y":192,"exts":{},"template":"Water"},{"x":1216,"y":256,"exts":{},"template":"Water"},{"x":1216,"y":320,"exts":{},"template":"Water"},{"x":1216,"y":384,"exts":{},"template":"Water"},{"x":1280,"y":128,"exts":{},"template":"Water"},{"x":1280,"y":192,"exts":{},"template":"Water"},{"x":1280,"y":256,"exts":{},"template":"Water"},{"x":1280,"y":320,"exts":{},"template":"Water"},{"x":1280,"y":384,"exts":{},"template":"Water"},{"x":1344,"y":128,"exts":{},"template":"Water"},{"x":1344,"y":192,"exts":{},"template":"Water"},{"x":1344,"y":256,"exts":{},"template":"Water"},{"x":1408,"y":320,"exts":{},"template":"Water"},{"x":1344,"y":320,"exts":{},"template":"Water"},{"x":1344,"y":384,"exts":{},"template":"Water"},{"x":1408,"y":384,"exts":{},"template":"Water"},{"x":1408,"y":256,"exts":{},"template":"Water"},{"x":1408,"y":192,"exts":{},"template":"Water"},{"x":1408,"y":128,"exts":{},"template":"Water"},{"x":1472,"y":128,"exts":{},"template":"Water"},{"x":1472,"y":192,"exts":{},"template":"Water"},{"x":1472,"y":256,"exts":{},"template":"Water"},{"x":1472,"y":320,"exts":{},"template":"Water"},{"x":1472,"y":384,"exts":{},"template":"Water"},{"x":1536,"y":448,"exts":{},"template":"Water"},{"x":1600,"y":448,"exts":{},"template":"Water"},{"x":1664,"y":384,"exts":{},"template":"Water"},{"x":1600,"y":384,"exts":{},"template":"Water"},{"x":1536,"y":384,"exts":{},"template":"Water"},{"x":1664,"y":320,"exts":{},"template":"Water"},{"x":1664,"y":256,"exts":{},"template":"Water"},{"x":1664,"y":192,"exts":{},"template":"Water"},{"x":1664,"y":192,"exts":{},"template":"Water"},{"x":1664,"y":192,"exts":{},"template":"Water"},{"x":1664,"y":192,"exts":{},"template":"Water"},{"x":1664,"y":128,"exts":{},"template":"Water"},{"x":1536,"y":320,"exts":{},"template":"Water"},{"x":1600,"y":320,"exts":{},"template":"Water"},{"x":1600,"y":256,"exts":{},"template":"Water"},{"x":1600,"y":256,"exts":{},"template":"Water"},{"x":1600,"y":256,"exts":{},"template":"Water"},{"x":1536,"y":256,"exts":{},"template":"Water"},{"x":1600,"y":256,"exts":{},"template":"Water"},{"x":1600,"y":256,"exts":{},"template":"Water"},{"x":1600,"y":192,"exts":{},"template":"Water"},{"x":1536,"y":192,"exts":{},"template":"Water"},{"x":1536,"y":128,"exts":{},"template":"Water"},{"x":1600,"y":128,"exts":{},"template":"Water"},{"x":1408,"y":768,"exts":{},"template":"Water"},{"x":1472,"y":768,"exts":{},"template":"Water"},{"x":1728,"y":768,"exts":{},"template":"Water"},{"x":1792,"y":768,"exts":{},"template":"Water"},{"x":1856,"y":768,"exts":{},"template":"Water"},{"x":1920,"y":768,"exts":{},"template":"Water"},{"x":1984,"y":768,"exts":{},"template":"Water"},{"x":1984,"y":704,"exts":{},"template":"Water"},{"x":1984,"y":704,"exts":{},"template":"Water"},{"x":1984,"y":640,"exts":{},"template":"Water"},{"x":1984,"y":576,"exts":{},"template":"Water"},{"x":1984,"y":512,"exts":{},"template":"Water"},{"x":1984,"y":448,"exts":{},"template":"Water"},{"x":1984,"y":384,"exts":{},"template":"Water"},{"x":1920,"y":384,"exts":{},"template":"Water"},{"x":1856,"y":384,"exts":{},"template":"Water"},{"x":1856,"y":384,"exts":{},"template":"Water"},{"x":1792,"y":384,"exts":{},"template":"Water"},{"x":1728,"y":384,"exts":{},"template":"Water"},{"x":1728,"y":320,"exts":{},"template":"Water"},{"x":1728,"y":256,"exts":{},"template":"Water"},{"x":1728,"y":192,"exts":{},"template":"Water"},{"x":1728,"y":128,"exts":{},"template":"Water"},{"x":1792,"y":128,"exts":{},"template":"Water"},{"x":1792,"y":192,"exts":{},"template":"Water"},{"x":1792,"y":256,"exts":{},"template":"Water"},{"x":1856,"y":320,"exts":{},"template":"Water"},{"x":1792,"y":320,"exts":{},"template":"Water"},{"x":1920,"y":320,"exts":{},"template":"Water"},{"x":1984,"y":320,"exts":{},"template":"Water"},{"x":1984,"y":256,"exts":{},"template":"Water"},{"x":1920,"y":256,"exts":{},"template":"Water"},{"x":1856,"y":256,"exts":{},"template":"Water"},{"x":1856,"y":192,"exts":{},"template":"Water"},{"x":1920,"y":192,"exts":{},"template":"Water"},{"x":1984,"y":192,"exts":{},"template":"Water"},{"x":1984,"y":128,"exts":{},"template":"Water"},{"x":1920,"y":128,"exts":{},"template":"Water"},{"x":1856,"y":128,"exts":{},"template":"Water"},{"x":576,"y":64,"exts":{},"template":"WaterTop"},{"x":640,"y":64,"exts":{},"template":"WaterTop"},{"x":704,"y":64,"exts":{},"template":"WaterTop"},{"x":768,"y":64,"exts":{},"template":"WaterTop"},{"x":832,"y":64,"exts":{},"template":"WaterTop"},{"x":896,"y":64,"exts":{},"template":"WaterTop"},{"x":960,"y":64,"exts":{},"template":"WaterTop"},{"x":1024,"y":64,"exts":{},"template":"WaterTop"},{"x":1088,"y":64,"exts":{},"template":"WaterTop"},{"x":1152,"y":64,"exts":{},"template":"WaterTop"},{"x":1216,"y":64,"exts":{},"template":"WaterTop"},{"x":1280,"y":64,"exts":{},"template":"WaterTop"},{"x":1344,"y":64,"exts":{},"template":"WaterTop"},{"x":1408,"y":64,"exts":{},"template":"WaterTop"},{"x":1472,"y":64,"exts":{},"template":"WaterTop"},{"x":1536,"y":64,"exts":{},"template":"WaterTop"},{"x":1600,"y":64,"exts":{},"template":"WaterTop"},{"x":1728,"y":64,"exts":{},"template":"WaterTop"},{"x":1664,"y":64,"exts":{},"template":"WaterTop"},{"x":1792,"y":64,"exts":{},"template":"WaterTop"},{"x":1856,"y":64,"exts":{},"template":"WaterTop"},{"x":1920,"y":64,"exts":{},"template":"WaterTop"},{"x":1984,"y":64,"exts":{},"template":"WaterTop"},{"x":1536,"y":768,"exts":{},"template":"lod"},{"x":1600,"y":768,"exts":{},"template":"lod"},{"x":1664,"y":768,"exts":{},"template":"lod"},{"x":0,"y":832,"exts":{},"template":"Water"},{"x":64,"y":832,"exts":{},"template":"Water"},{"x":128,"y":832,"exts":{},"template":"Water"},{"x":192,"y":832,"exts":{},"template":"Water"},{"x":256,"y":832,"exts":{},"template":"Water"},{"x":384,"y":832,"exts":{},"template":"Water"},{"x":320,"y":832,"exts":{},"template":"Water"},{"x":448,"y":832,"exts":{},"template":"Water"},{"x":512,"y":832,"exts":{},"template":"Water"},{"x":576,"y":832,"exts":{},"template":"Water"},{"x":640,"y":832,"exts":{},"template":"Water"},{"x":704,"y":832,"exts":{},"template":"Water"},{"x":768,"y":832,"exts":{},"template":"Water"},{"x":832,"y":832,"exts":{},"template":"Water"},{"x":896,"y":832,"exts":{},"template":"Water"},{"x":960,"y":832,"exts":{},"template":"Water"},{"x":1088,"y":832,"exts":{},"template":"Water"},{"x":1024,"y":832,"exts":{},"template":"Water"},{"x":1152,"y":832,"exts":{},"template":"Water"},{"x":1216,"y":832,"exts":{},"template":"Water"},{"x":1280,"y":832,"exts":{},"template":"Water"},{"x":1344,"y":832,"exts":{},"template":"Water"},{"x":1408,"y":832,"exts":{},"template":"Water"},{"x":1472,"y":832,"exts":{},"template":"Water"},{"x":1536,"y":832,"exts":{},"template":"Water"},{"x":1600,"y":832,"exts":{},"template":"Water"},{"x":1664,"y":832,"exts":{},"template":"Water"},{"x":1728,"y":832,"exts":{},"template":"Water"},{"x":1792,"y":832,"exts":{},"template":"Water"},{"x":1856,"y":832,"exts":{},"template":"Water"},{"x":1920,"y":832,"exts":{},"template":"Water"},{"x":1984,"y":832,"exts":{},"template":"Water"},{"x":192,"y":448,"exts":{},"template":"robot"},{"x":512,"y":704,"exts":{},"template":"lod"},{"x":512,"y":256,"exts":{},"template":"lod"},{"x":576,"y":256,"exts":{},"template":"lod"},{"x":640,"y":256,"exts":{},"template":"lod"},{"x":704,"y":448,"exts":{},"template":"lod"},{"x":704,"y":384,"exts":{},"template":"lod"},{"x":704,"y":320,"exts":{},"template":"lod"},{"x":704,"y":256,"exts":{},"template":"lod"},{"x":768,"y":384,"exts":{},"template":"Water"},{"x":320,"y":384,"exts":{},"template":"GreenCrystal"},{"x":384,"y":384,"exts":{},"template":"GreenCrystal"},{"x":448,"y":384,"exts":{},"template":"GreenCrystal"},{"x":512,"y":384,"exts":{},"template":"GreenCrystal"},{"x":576,"y":384,"exts":{},"template":"GreenCrystal"},{"x":640,"y":384,"exts":{},"template":"GreenCrystal"},{"x":640,"y":448,"exts":{},"template":"GreenCrystal"},{"x":640,"y":512,"exts":{},"template":"GreenCrystal"},{"x":640,"y":576,"exts":{},"template":"GreenCrystal"},{"x":640,"y":640,"exts":{},"template":"GreenCrystal"},{"x":704,"y":640,"exts":{},"template":"GreenCrystal"},{"x":768,"y":640,"exts":{},"template":"GreenCrystal"},{"x":832,"y":640,"exts":{},"template":"GreenCrystal"},{"x":896,"y":576,"exts":{},"template":"GreenCrystal"},{"x":960,"y":576,"exts":{},"template":"GreenCrystal"},{"x":1024,"y":576,"exts":{},"template":"GreenCrystal"},{"x":1088,"y":576,"exts":{},"template":"GreenCrystal"},{"x":1152,"y":576,"exts":{},"template":"GreenCrystal"},{"x":1216,"y":576,"exts":{},"template":"GreenCrystal"},{"x":1280,"y":576,"exts":{},"template":"GreenCrystal"},{"x":1344,"y":576,"exts":{},"template":"GreenCrystal"},{"x":1472,"y":640,"exts":{},"template":"GreenCrystal"},{"x":1536,"y":640,"exts":{},"template":"GreenCrystal"},{"x":1600,"y":640,"exts":{},"template":"GreenCrystal"},{"x":1664,"y":640,"exts":{},"template":"GreenCrystal"},{"x":1728,"y":640,"exts":{},"template":"GreenCrystal"},{"x":1792,"y":640,"exts":{},"template":"GreenCrystal"},{"x":1408,"y":640,"exts":{},"template":"GreenCrystal"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'poziom11';
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['poziom11'] = {
    name: 'poziom11',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":-64,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":0,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":64,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":192,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":256,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":128,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":384,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":320,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":448,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":512,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":640,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":640,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":704,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":768,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":640,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":576,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":-64,"y":576,"exts":{},"template":"Water_grow"},{"x":0,"y":576,"exts":{},"template":"Water_grow"},{"x":128,"y":576,"exts":{},"template":"Water_grow"},{"x":128,"y":576,"exts":{},"template":"Water_grow"},{"x":256,"y":576,"exts":{},"template":"Water_grow"},{"x":128,"y":576,"exts":{},"template":"Water_grow"},{"x":192,"y":576,"exts":{},"template":"Water_grow"},{"x":128,"y":576,"exts":{},"template":"Water_grow"},{"x":64,"y":576,"exts":{},"template":"Water_grow"},{"x":320,"y":576,"exts":{},"template":"Water_grow"},{"x":384,"y":576,"exts":{},"template":"Water_grow"},{"x":448,"y":576,"exts":{},"template":"Water_grow"},{"x":576,"y":576,"exts":{},"template":"Water_grow"},{"x":576,"y":576,"exts":{},"template":"Water_grow"},{"x":704,"y":576,"exts":{},"template":"Water_grow"},{"x":768,"y":576,"exts":{},"template":"Water_grow"},{"x":640,"y":576,"exts":{},"template":"Water_grow"},{"x":512,"y":576,"exts":{},"template":"Water_grow"},{"x":-64,"y":640,"exts":{},"template":"Water_grow"},{"x":64,"y":640,"exts":{},"template":"Water_grow"},{"x":0,"y":640,"exts":{},"template":"Water_grow"},{"x":128,"y":640,"exts":{},"template":"Water_grow"},{"x":256,"y":640,"exts":{},"template":"Water_grow"},{"x":192,"y":640,"exts":{},"template":"Water_grow"},{"x":320,"y":704,"exts":{},"template":"Water_grow"},{"x":384,"y":704,"exts":{},"template":"Water_grow"},{"x":384,"y":640,"exts":{},"template":"Water_grow"},{"x":320,"y":640,"exts":{},"template":"Water_grow"},{"x":448,"y":640,"exts":{},"template":"Water_grow"},{"x":512,"y":640,"exts":{},"template":"Water_grow"},{"x":576,"y":640,"exts":{},"template":"Water_grow"},{"x":640,"y":640,"exts":{},"template":"Water_grow"},{"x":704,"y":640,"exts":{},"template":"Water_grow"},{"x":768,"y":640,"exts":{},"template":"Water_grow"},{"x":768,"y":704,"exts":{},"template":"Water_grow"},{"x":768,"y":704,"exts":{},"template":"Water_grow"},{"x":704,"y":704,"exts":{},"template":"Water_grow"},{"x":640,"y":704,"exts":{},"template":"Water_grow"},{"x":576,"y":704,"exts":{},"template":"Water_grow"},{"x":512,"y":704,"exts":{},"template":"Water_grow"},{"x":448,"y":704,"exts":{},"template":"Water_grow"},{"x":256,"y":768,"exts":{},"template":"Water_grow"},{"x":256,"y":704,"exts":{},"template":"Water_grow"},{"x":192,"y":704,"exts":{},"template":"Water_grow"},{"x":128,"y":704,"exts":{},"template":"Water_grow"},{"x":64,"y":704,"exts":{},"template":"Water_grow"},{"x":0,"y":704,"exts":{},"template":"Water_grow"},{"x":-64,"y":704,"exts":{},"template":"Water_grow"},{"x":-64,"y":768,"exts":{},"template":"Water_grow"},{"x":64,"y":768,"exts":{},"template":"Water_grow"},{"x":64,"y":768,"exts":{},"template":"Water_grow"},{"x":0,"y":768,"exts":{},"template":"Water_grow"},{"x":128,"y":768,"exts":{},"template":"Water_grow"},{"x":192,"y":768,"exts":{},"template":"Water_grow"},{"x":384,"y":768,"exts":{},"template":"Water_grow"},{"x":384,"y":768,"exts":{},"template":"Water_grow"},{"x":320,"y":768,"exts":{},"template":"Water_grow"},{"x":448,"y":768,"exts":{},"template":"Water_grow"},{"x":512,"y":768,"exts":{},"template":"Water_grow"},{"x":576,"y":768,"exts":{},"template":"Water_grow"},{"x":640,"y":768,"exts":{},"template":"Water_grow"},{"x":704,"y":768,"exts":{},"template":"Water_grow"},{"x":768,"y":768,"exts":{},"template":"Water_grow"},{"x":320,"y":256,"exts":{},"template":"snieg-platforma"},{"x":384,"y":192,"exts":{},"template":"snieg-platforma"},{"x":448,"y":192,"exts":{},"template":"snieg-platforma"},{"x":512,"y":192,"exts":{},"template":"snieg-platforma"},{"x":576,"y":128,"exts":{},"template":"snieg-platforma"},{"x":640,"y":64,"exts":{},"template":"snieg-platforma"},{"x":704,"y":0,"exts":{},"template":"snieg-platforma"},{"x":576,"y":-64,"exts":{},"template":"snieg-platforma"},{"x":384,"y":-64,"exts":{},"template":"snieg-platforma"},{"x":192,"y":-256,"exts":{},"template":"snieg-platforma"},{"x":128,"y":-256,"exts":{},"template":"snieg-platforma"},{"x":64,"y":-256,"exts":{},"template":"snieg-platforma"},{"x":0,"y":-256,"exts":{},"template":"snieg-platforma"},{"x":-64,"y":-320,"exts":{},"template":"snieg-platforma"},{"x":-128,"y":-384,"exts":{},"template":"snieg-platforma"},{"x":-192,"y":-448,"exts":{},"template":"snieg-platforma"},{"x":-256,"y":-512,"exts":{},"template":"snieg-platforma"},{"x":-320,"y":-576,"exts":{},"template":"snieg-platforma"},{"x":-384,"y":-640,"exts":{},"template":"snieg-platforma"},{"x":-448,"y":-704,"exts":{},"template":"snieg-platforma"},{"x":-512,"y":-768,"exts":{},"template":"snieg-platforma"},{"x":-576,"y":-832,"exts":{},"template":"snieg-platforma"},{"x":-640,"y":-832,"exts":{},"template":"snieg-platforma"},{"x":-640,"y":-832,"exts":{},"template":"snieg-platforma"},{"x":-704,"y":-832,"exts":{},"template":"snieg-platforma"},{"x":-768,"y":-832,"exts":{},"template":"snieg-platforma"},{"x":-832,"y":-832,"exts":{},"template":"snieg-platforma"},{"x":128,"y":-320,"exts":{},"template":"Checkpoint"},{"x":256,"y":-192,"exts":{},"template":"snieg-platforma"},{"x":320,"y":-128,"exts":{},"template":"snieg-platforma"},{"x":832,"y":768,"exts":{},"template":"lod"},{"x":832,"y":704,"exts":{},"template":"lod"},{"x":832,"y":640,"exts":{},"template":"lod"},{"x":832,"y":576,"exts":{},"template":"lod"},{"x":832,"y":512,"exts":{},"template":"lod"},{"x":832,"y":448,"exts":{},"template":"lod"},{"x":832,"y":384,"exts":{},"template":"lod"},{"x":832,"y":320,"exts":{},"template":"lod"},{"x":832,"y":256,"exts":{},"template":"lod"},{"x":832,"y":128,"exts":{},"template":"lod"},{"x":832,"y":192,"exts":{},"template":"lod"},{"x":832,"y":64,"exts":{},"template":"lod"},{"x":832,"y":0,"exts":{},"template":"lod"},{"x":832,"y":-64,"exts":{},"template":"lod"},{"x":832,"y":-192,"exts":{},"template":"lod"},{"x":832,"y":-128,"exts":{},"template":"lod"},{"x":832,"y":-256,"exts":{},"template":"lod"},{"x":832,"y":-320,"exts":{},"template":"lod"},{"x":832,"y":-384,"exts":{},"template":"snieg"},{"x":-832,"y":-896,"exts":{},"template":"LevelExit"},{"x":-896,"y":-832,"exts":{},"template":"lod"},{"x":-896,"y":-896,"exts":{},"template":"lod"},{"x":-896,"y":-960,"exts":{},"template":"lod"},{"x":-896,"y":-1024,"exts":{},"template":"snieg"},{"x":-896,"y":-768,"exts":{},"template":"lod"},{"x":-896,"y":-704,"exts":{},"template":"lod"},{"x":-896,"y":-640,"exts":{},"template":"lod"},{"x":-896,"y":-576,"exts":{},"template":"lod"},{"x":-896,"y":-512,"exts":{},"template":"lod"},{"x":-896,"y":-448,"exts":{},"template":"lod"},{"x":-896,"y":-320,"exts":{},"template":"lod"},{"x":-896,"y":-384,"exts":{},"template":"lod"},{"x":-896,"y":-192,"exts":{},"template":"lod"},{"x":-896,"y":-256,"exts":{},"template":"lod"},{"x":-896,"y":-128,"exts":{},"template":"lod"},{"x":-896,"y":-64,"exts":{},"template":"lod"},{"x":-896,"y":0,"exts":{},"template":"lod"},{"x":-896,"y":64,"exts":{},"template":"lod"},{"x":-896,"y":128,"exts":{},"template":"lod"},{"x":-896,"y":192,"exts":{},"template":"lod"},{"x":-896,"y":256,"exts":{},"template":"lod"},{"x":-896,"y":320,"exts":{},"template":"lod"},{"x":-896,"y":384,"exts":{},"template":"lod"},{"x":-896,"y":448,"exts":{},"template":"lod"},{"x":-896,"y":512,"exts":{},"template":"lod"},{"x":-896,"y":576,"exts":{},"template":"lod"},{"x":-896,"y":640,"exts":{},"template":"lod"},{"x":-896,"y":704,"exts":{},"template":"lod"},{"x":-896,"y":768,"exts":{},"template":"lod"},{"x":-128,"y":768,"exts":{},"template":"Water_grow"},{"x":-128,"y":768,"exts":{},"template":"Water_grow"},{"x":-192,"y":768,"exts":{},"template":"Water_grow"},{"x":-256,"y":768,"exts":{},"template":"Water_grow"},{"x":-320,"y":768,"exts":{},"template":"Water_grow"},{"x":-384,"y":768,"exts":{},"template":"Water_grow"},{"x":-448,"y":768,"exts":{},"template":"Water_grow"},{"x":-512,"y":768,"exts":{},"template":"Water_grow"},{"x":-576,"y":768,"exts":{},"template":"Water_grow"},{"x":-576,"y":768,"exts":{},"template":"Water_grow"},{"x":-640,"y":768,"exts":{},"template":"Water_grow"},{"x":-704,"y":768,"exts":{},"template":"Water_grow"},{"x":-768,"y":768,"exts":{},"template":"Water_grow"},{"x":-832,"y":768,"exts":{},"template":"Water_grow"},{"x":-832,"y":704,"exts":{},"template":"Water_grow"},{"x":-768,"y":704,"exts":{},"template":"Water_grow"},{"x":-704,"y":704,"exts":{},"template":"Water_grow"},{"x":-640,"y":704,"exts":{},"template":"Water_grow"},{"x":-576,"y":704,"exts":{},"template":"Water_grow"},{"x":-512,"y":704,"exts":{},"template":"Water_grow"},{"x":-448,"y":704,"exts":{},"template":"Water_grow"},{"x":-384,"y":704,"exts":{},"template":"Water_grow"},{"x":-320,"y":704,"exts":{},"template":"Water_grow"},{"x":-320,"y":704,"exts":{},"template":"Water_grow"},{"x":-256,"y":704,"exts":{},"template":"Water_grow"},{"x":-192,"y":704,"exts":{},"template":"Water_grow"},{"x":-128,"y":704,"exts":{},"template":"Water_grow"},{"x":-128,"y":640,"exts":{},"template":"Water_grow"},{"x":-192,"y":640,"exts":{},"template":"Water_grow"},{"x":-256,"y":640,"exts":{},"template":"Water_grow"},{"x":-320,"y":640,"exts":{},"template":"Water_grow"},{"x":-384,"y":640,"exts":{},"template":"Water_grow"},{"x":-448,"y":640,"exts":{},"template":"Water_grow"},{"x":-512,"y":640,"exts":{},"template":"Water_grow"},{"x":-576,"y":640,"exts":{},"template":"Water_grow"},{"x":-640,"y":640,"exts":{},"template":"Water_grow"},{"x":-704,"y":640,"exts":{},"template":"Water_grow"},{"x":-768,"y":640,"exts":{},"template":"Water_grow"},{"x":-832,"y":640,"exts":{},"template":"Water_grow"},{"x":-832,"y":576,"exts":{},"template":"Water_grow"},{"x":-768,"y":576,"exts":{},"template":"Water_grow"},{"x":-768,"y":576,"exts":{},"template":"Water_grow"},{"x":-704,"y":576,"exts":{},"template":"Water_grow"},{"x":-640,"y":576,"exts":{},"template":"Water_grow"},{"x":-576,"y":576,"exts":{},"template":"Water_grow"},{"x":-512,"y":576,"exts":{},"template":"Water_grow"},{"x":-448,"y":576,"exts":{},"template":"Water_grow"},{"x":-384,"y":576,"exts":{},"template":"Water_grow"},{"x":-320,"y":576,"exts":{},"template":"Water_grow"},{"x":-256,"y":576,"exts":{},"template":"Water_grow"},{"x":-192,"y":576,"exts":{},"template":"Water_grow"},{"x":-128,"y":576,"exts":{},"template":"Water_grow"},{"x":-768,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":-832,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":-704,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":-640,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":-576,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":-512,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":-384,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":-448,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":-320,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":-256,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":-192,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":-128,"y":512,"exts":{},"template":"Water_Top_grow"},{"x":256,"y":256,"exts":{},"template":"snieg-platforma"},{"x":320,"y":256,"exts":{},"template":"robot"},{"x":448,"y":-64,"exts":{},"template":"snieg-platforma"},{"x":512,"y":-64,"exts":{},"template":"snieg-platforma"},{"x":-704,"y":-896,"exts":{},"template":"GreenCrystal"},{"x":-640,"y":-896,"exts":{},"template":"GreenCrystal"},{"x":-576,"y":-896,"exts":{},"template":"GreenCrystal"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        this.waterLevel = (this.waterLevel || 0.0) - 1.0 * ct.delta;
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'poziom12';
this.waterLevel = 0.0
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['poziom12'] = {
    name: 'poziom12',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":384,"exts":{},"template":"lod"},{"x":0,"y":320,"exts":{},"template":"lod"},{"x":0,"y":256,"exts":{},"template":"lod"},{"x":0,"y":192,"exts":{},"template":"lod"},{"x":0,"y":448,"exts":{},"template":"lod"},{"x":0,"y":512,"exts":{},"template":"lod"},{"x":768,"y":512,"exts":{},"template":"lod"},{"x":768,"y":448,"exts":{},"template":"lod"},{"x":768,"y":448,"exts":{},"template":"lod"},{"x":768,"y":384,"exts":{},"template":"lod"},{"x":768,"y":576,"exts":{},"template":"lod"},{"x":0,"y":576,"exts":{},"template":"lod"},{"x":0,"y":0,"exts":{},"template":"snieg"},{"x":0,"y":128,"exts":{},"template":"lod"},{"x":0,"y":128,"exts":{},"template":"lod"},{"x":0,"y":64,"exts":{},"template":"lod"},{"x":64,"y":576,"exts":{},"template":"snieg"},{"x":128,"y":576,"exts":{},"template":"snieg"},{"x":192,"y":576,"exts":{},"template":"snieg"},{"x":256,"y":576,"exts":{},"template":"snieg"},{"x":320,"y":576,"exts":{},"template":"snieg"},{"x":384,"y":576,"exts":{},"template":"snieg"},{"x":448,"y":576,"exts":{},"template":"snieg"},{"x":512,"y":576,"exts":{},"template":"snieg"},{"x":576,"y":576,"exts":{},"template":"snieg"},{"x":640,"y":576,"exts":{},"template":"snieg"},{"x":64,"y":512,"exts":{},"template":"kolc"},{"x":128,"y":512,"exts":{},"template":"kolc"},{"x":192,"y":512,"exts":{},"template":"kolc"},{"x":256,"y":512,"exts":{},"template":"kolc"},{"x":320,"y":512,"exts":{},"template":"kolc"},{"x":384,"y":512,"exts":{},"template":"kolc"},{"x":448,"y":512,"exts":{},"template":"kolc"},{"x":512,"y":512,"exts":{},"template":"kolc"},{"x":576,"y":512,"exts":{},"template":"kolc"},{"x":640,"y":512,"exts":{},"template":"kolc"},{"x":704,"y":512,"exts":{},"template":"kolc"},{"x":704,"y":576,"exts":{},"template":"snieg"},{"x":64,"y":384,"exts":{},"template":"snieg-platforma"},{"x":192,"y":384,"exts":{},"template":"snieg-platforma"},{"x":320,"y":384,"exts":{},"template":"snieg-platforma"},{"x":448,"y":384,"exts":{},"template":"snieg-platforma"},{"x":576,"y":384,"exts":{},"template":"snieg-platforma"},{"x":704,"y":384,"exts":{},"template":"snieg-platforma"},{"x":-64,"y":64,"exts":{},"template":"snieg"},{"x":-128,"y":128,"exts":{},"template":"snieg"},{"x":-192,"y":192,"exts":{},"template":"snieg"},{"x":-256,"y":192,"exts":{},"template":"snieg"},{"x":-320,"y":192,"exts":{},"template":"snieg"},{"x":-384,"y":192,"exts":{},"template":"snieg"},{"x":-448,"y":-64,"exts":{},"template":"snieg"},{"x":-448,"y":0,"exts":{},"template":"lod"},{"x":-448,"y":64,"exts":{},"template":"lod"},{"x":-448,"y":128,"exts":{},"template":"lod"},{"x":-448,"y":192,"exts":{},"template":"lod"},{"x":768,"y":320,"exts":{},"template":"snieg"},{"x":-64,"y":128,"exts":{},"template":"lod"},{"x":-64,"y":192,"exts":{},"template":"lod"},{"x":-128,"y":192,"exts":{},"template":"lod"},{"x":832,"y":320,"exts":{},"template":"snieg"},{"x":896,"y":320,"exts":{},"template":"snieg"},{"x":960,"y":320,"exts":{},"template":"snieg"},{"x":1088,"y":256,"exts":{},"template":"snieg"},{"x":1152,"y":128,"exts":{},"template":"snieg"},{"x":1152,"y":192,"exts":{},"template":"lod"},{"x":1152,"y":256,"exts":{},"template":"lod"},{"x":1088,"y":320,"exts":{},"template":"lod"},{"x":1152,"y":320,"exts":{},"template":"lod"},{"x":1088,"y":192,"exts":{},"template":"LevelExit"},{"x":1024,"y":320,"exts":{},"template":"snieg"},{"x":1058,"y":291,"exts":{},"template":"GreenCrystal"},{"x":1024,"y":256,"exts":{},"template":"skrzynia_lod"},{"x":-320,"y":192,"exts":{},"template":"robot"},{"x":192,"y":294,"exts":{},"template":"Boss2"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'wyspa dywanowa';
inGameRoomStart(this);
for(var a of ct.templates.list.LevelExit){
    a.visible = false;
}
    },
    extends: {}
}
ct.rooms.templates['poziom13old'] = {
    name: 'poziom13old',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":192,"y":448,"exts":{},"template":"robot"},{"x":64,"y":128,"exts":{},"template":"skała"},{"x":128,"y":128,"exts":{},"template":"skała"},{"x":192,"y":192,"exts":{},"template":"skała"},{"x":256,"y":128,"exts":{},"template":"skała"},{"x":320,"y":64,"exts":{},"template":"skała"},{"x":384,"y":64,"exts":{},"template":"skała"},{"x":448,"y":64,"exts":{},"template":"skała"},{"x":512,"y":0,"exts":{},"template":"skała"},{"x":640,"y":0,"exts":{},"template":"skała"},{"x":576,"y":0,"exts":{},"template":"skała"},{"x":640,"y":-64,"exts":{},"template":"skała"},{"x":640,"y":-128,"exts":{},"template":"skała"},{"x":704,"y":-128,"exts":{},"template":"skała"},{"x":832,"y":-128,"exts":{},"template":"skała"},{"x":768,"y":-128,"exts":{},"template":"skała"},{"x":896,"y":-128,"exts":{},"template":"skała"},{"x":960,"y":-64,"exts":{},"template":"skała"},{"x":960,"y":0,"exts":{},"template":"skała"},{"x":960,"y":64,"exts":{},"template":"skała"},{"x":960,"y":128,"exts":{},"template":"skała"},{"x":1024,"y":256,"exts":{},"template":"skała"},{"x":960,"y":192,"exts":{},"template":"skała"},{"x":960,"y":320,"exts":{},"template":"skała"},{"x":1024,"y":320,"exts":{},"template":"skała"},{"x":1024,"y":384,"exts":{},"template":"skała"},{"x":1024,"y":448,"exts":{},"template":"skała"},{"x":960,"y":512,"exts":{},"template":"skała"},{"x":896,"y":576,"exts":{},"template":"skała"},{"x":832,"y":576,"exts":{},"template":"skała"},{"x":768,"y":576,"exts":{},"template":"skała"},{"x":704,"y":576,"exts":{},"template":"skała"},{"x":640,"y":576,"exts":{},"template":"skała"},{"x":576,"y":576,"exts":{},"template":"skała"},{"x":512,"y":576,"exts":{},"template":"skała"},{"x":448,"y":576,"exts":{},"template":"skała"},{"x":384,"y":640,"exts":{},"template":"skała"},{"x":320,"y":640,"exts":{},"template":"skała"},{"x":320,"y":704,"exts":{},"template":"skała"},{"x":320,"y":768,"exts":{},"template":"skała"},{"x":320,"y":896,"exts":{},"template":"skała"},{"x":320,"y":832,"exts":{},"template":"skała"},{"x":320,"y":960,"exts":{},"template":"skała"},{"x":320,"y":1024,"exts":{},"template":"skała"},{"x":256,"y":1024,"exts":{},"template":"skała"},{"x":192,"y":1024,"exts":{},"template":"skała"},{"x":128,"y":1024,"exts":{},"template":"skała"},{"x":64,"y":1024,"exts":{},"template":"skała"},{"x":0,"y":1024,"exts":{},"template":"skała"},{"x":-64,"y":960,"exts":{},"template":"skała"},{"x":-128,"y":896,"exts":{},"template":"skała"},{"x":-192,"y":832,"exts":{},"template":"skała"},{"x":-256,"y":768,"exts":{},"template":"skała"},{"x":-256,"y":704,"exts":{},"template":"skała"},{"x":-256,"y":640,"exts":{},"template":"skała"},{"x":-320,"y":576,"exts":{},"template":"skała"},{"x":-384,"y":576,"exts":{},"template":"skała"},{"x":-448,"y":576,"exts":{},"template":"skała"},{"x":-512,"y":576,"exts":{},"template":"skała"},{"x":-512,"y":576,"exts":{},"template":"skała"},{"x":-512,"y":512,"exts":{},"template":"skała"},{"x":-512,"y":448,"exts":{},"template":"skała"},{"x":-512,"y":384,"exts":{},"template":"skała"},{"x":-512,"y":320,"exts":{},"template":"skała"},{"x":-512,"y":256,"exts":{},"template":"skała"},{"x":-384,"y":256,"exts":{},"template":"skała"},{"x":-448,"y":256,"exts":{},"template":"skała"},{"x":-320,"y":256,"exts":{},"template":"skała"},{"x":-256,"y":256,"exts":{},"template":"skała"},{"x":-192,"y":192,"exts":{},"template":"skała"},{"x":-128,"y":128,"exts":{},"template":"skała"},{"x":0,"y":128,"exts":{},"template":"skała"},{"x":0,"y":128,"exts":{},"template":"skała"},{"x":-64,"y":128,"exts":{},"template":"skała"},{"x":-384,"y":448,"exts":{},"template":"GreenCrystal"},{"x":-320,"y":448,"exts":{},"template":"GreenCrystal"},{"x":-320,"y":512,"exts":{},"template":"GreenCrystal"},{"x":-384,"y":512,"exts":{},"template":"GreenCrystal"},{"x":64,"y":960,"exts":{},"template":"Heart"},{"x":0,"y":896,"exts":{},"template":"Heart"},{"x":64,"y":896,"exts":{},"template":"Heart"},{"x":667,"y":355,"exts":{},"template":"GreenCrystal"},{"x":419,"y":359,"exts":{},"template":"GreenCrystal"},{"x":384,"y":320,"exts":{},"template":"skrzynia"},{"x":640,"y":320,"exts":{},"template":"skrzynia"},{"x":796,"y":-37,"exts":{},"template":"LevelExit"},{"x":-64,"y":640,"exts":{},"template":"pratforma"},{"x":64,"y":640,"exts":{},"template":"pratforma"},{"x":0,"y":640,"exts":{},"template":"pratforma"},{"x":128,"y":640,"exts":{},"template":"pratforma"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"pixil-frame-0_(19)","extends":{"parallaxX":0.9,"parallaxY":0.9}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.waterLevel = true;
this.nextRoom = 'poziom1';
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['poziom13'] = {
    name: 'poziom13',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":128,"y":320,"exts":{},"template":"robot"},{"x":576,"y":256,"exts":{},"template":"LevelExit"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"pixil-frame-0_(19)","extends":{"parallaxX":0.5,"parallaxY":0.5}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.underwaterLevel = true;
this.nextRoom = 'poziom1';
inGameRoomStart(this);

    },
    extends: {}
}
ct.rooms.templates['dom 135'] = {
    name: 'dom 135',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":448,"exts":{},"template":"ziemia"},{"x":64,"y":448,"exts":{},"template":"ziemia"},{"x":128,"y":448,"exts":{},"template":"ziemia"},{"x":192,"y":448,"exts":{},"template":"ziemia"},{"x":256,"y":448,"exts":{},"template":"ziemia"},{"x":320,"y":448,"exts":{},"template":"ziemia"},{"x":384,"y":448,"exts":{},"template":"ziemia"},{"x":448,"y":448,"exts":{},"template":"ziemia"},{"x":512,"y":448,"exts":{},"template":"ziemia"},{"x":576,"y":448,"exts":{},"template":"ziemia"},{"x":0,"y":448,"exts":{},"template":"trawa"},{"x":64,"y":448,"exts":{},"template":"trawa"},{"x":128,"y":448,"exts":{},"template":"trawa"},{"x":192,"y":448,"exts":{},"template":"trawa"},{"x":256,"y":448,"exts":{},"template":"trawa"},{"x":320,"y":448,"exts":{},"template":"trawa"},{"x":384,"y":448,"exts":{},"template":"trawa"},{"x":448,"y":512,"exts":{},"template":"trawa"},{"x":448,"y":448,"exts":{},"template":"trawa"},{"x":512,"y":448,"exts":{},"template":"trawa"},{"x":576,"y":448,"exts":{},"template":"trawa"},{"x":448,"y":512,"exts":{},"template":"skała"},{"x":448,"y":512,"exts":{},"template":"skała"},{"x":448,"y":512,"exts":{},"template":"skała"},{"x":384,"y":512,"exts":{},"template":"skała"},{"x":384,"y":512,"exts":{},"template":"skała"},{"x":320,"y":512,"exts":{},"template":"skała"},{"x":256,"y":512,"exts":{},"template":"skała"},{"x":192,"y":512,"exts":{},"template":"skała"},{"x":128,"y":512,"exts":{},"template":"skała"},{"x":64,"y":512,"exts":{},"template":"skała"},{"x":0,"y":512,"exts":{},"template":"skała"},{"x":512,"y":512,"exts":{},"template":"skała"},{"x":576,"y":512,"exts":{},"template":"skała"},{"x":640,"y":448,"exts":{},"template":"trawa"},{"x":704,"y":448,"exts":{},"template":"trawa"},{"x":768,"y":448,"exts":{},"template":"trawa"},{"x":832,"y":448,"exts":{},"template":"trawa"},{"x":896,"y":448,"exts":{},"template":"trawa"},{"x":960,"y":448,"exts":{},"template":"trawa"},{"x":1024,"y":448,"exts":{},"template":"trawa"},{"x":1088,"y":448,"exts":{},"template":"trawa"},{"x":1152,"y":448,"exts":{},"template":"trawa"},{"x":640,"y":512,"exts":{},"template":"skała"},{"x":704,"y":512,"exts":{},"template":"skała"},{"x":768,"y":512,"exts":{},"template":"skała"},{"x":896,"y":512,"exts":{},"template":"skała"},{"x":832,"y":512,"exts":{},"template":"skała"},{"x":960,"y":512,"exts":{},"template":"skała"},{"x":1088,"y":512,"exts":{},"template":"skała"},{"x":1024,"y":512,"exts":{},"template":"skała"},{"x":1152,"y":512,"exts":{},"template":"skała"},{"x":1216,"y":512,"exts":{},"template":"skała"},{"x":1216,"y":448,"exts":{},"template":"trawa"},{"x":1280,"y":512,"exts":{},"template":"trawa"},{"x":1344,"y":448,"exts":{},"template":"trawa"},{"x":1280,"y":512,"exts":{},"template":"skała"},{"x":1280,"y":448,"exts":{},"template":"trawa"},{"x":1344,"y":512,"exts":{},"template":"skała"},{"x":1408,"y":512,"exts":{},"template":"skała"},{"x":1472,"y":512,"exts":{},"template":"skała"},{"x":1600,"y":512,"exts":{},"template":"skała"},{"x":1600,"y":512,"exts":{},"template":"skała"},{"x":1600,"y":512,"exts":{},"template":"skała"},{"x":1536,"y":512,"exts":{},"template":"skała"},{"x":1664,"y":512,"exts":{},"template":"skała"},{"x":1728,"y":512,"exts":{},"template":"skała"},{"x":1792,"y":512,"exts":{},"template":"skała"},{"x":1856,"y":512,"exts":{},"template":"skała"},{"x":1920,"y":512,"exts":{},"template":"skała"},{"x":1984,"y":512,"exts":{},"template":"skała"},{"x":2048,"y":512,"exts":{},"template":"skała"},{"x":2112,"y":512,"exts":{},"template":"skała"},{"x":2176,"y":512,"exts":{},"template":"skała"},{"x":2240,"y":512,"exts":{},"template":"skała"},{"x":2304,"y":512,"exts":{},"template":"skała"},{"x":2368,"y":512,"exts":{},"template":"skała"},{"x":2496,"y":512,"exts":{},"template":"skała"},{"x":2432,"y":512,"exts":{},"template":"skała"},{"x":2560,"y":512,"exts":{},"template":"skała"},{"x":2624,"y":512,"exts":{},"template":"skała"},{"x":2688,"y":512,"exts":{},"template":"skała"},{"x":2752,"y":512,"exts":{},"template":"skała"},{"x":1408,"y":448,"exts":{},"template":"trawa"},{"x":1664,"y":448,"exts":{},"template":"trawa"},{"x":1728,"y":448,"exts":{},"template":"trawa"},{"x":1792,"y":448,"exts":{},"template":"trawa"},{"x":1920,"y":448,"exts":{},"template":"trawa"},{"x":1984,"y":448,"exts":{},"template":"trawa"},{"x":2048,"y":448,"exts":{},"template":"trawa"},{"x":2112,"y":448,"exts":{},"template":"trawa"},{"x":2176,"y":448,"exts":{},"template":"trawa"},{"x":2240,"y":448,"exts":{},"template":"trawa"},{"x":2304,"y":448,"exts":{},"template":"trawa"},{"x":2368,"y":448,"exts":{},"template":"trawa"},{"x":2432,"y":448,"exts":{},"template":"trawa"},{"x":2496,"y":448,"exts":{},"template":"trawa"},{"x":2560,"y":448,"exts":{},"template":"trawa"},{"x":2624,"y":448,"exts":{},"template":"trawa"},{"x":2688,"y":448,"exts":{},"template":"trawa"},{"x":2752,"y":448,"exts":{},"template":"trawa"},{"x":1472,"y":448,"exts":{},"template":"trawa"},{"x":1536,"y":448,"exts":{},"template":"trawa"},{"x":1600,"y":448,"exts":{},"template":"trawa"},{"x":1856,"y":448,"exts":{},"template":"trawa"},{"x":1664,"y":384,"exts":{},"template":"zernnit"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['1'] = {
    name: '1',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":384,"exts":{},"template":"vbn"},{"x":64,"y":384,"exts":{},"template":"vbn"},{"x":128,"y":384,"exts":{},"template":"vbn"},{"x":192,"y":384,"exts":{},"template":"vbn"},{"x":256,"y":384,"exts":{},"template":"vbn"},{"x":384,"y":384,"exts":{},"template":"vbn"},{"x":448,"y":384,"exts":{},"template":"vbn"},{"x":512,"y":384,"exts":{},"template":"vbn"},{"x":576,"y":384,"exts":{},"template":"vbn"},{"x":640,"y":384,"exts":{},"template":"vbn"},{"x":704,"y":384,"exts":{},"template":"vbn"},{"x":768,"y":384,"exts":{},"template":"vbn"},{"x":384,"y":320,"exts":{},"template":"uio"},{"x":448,"y":320,"exts":{},"template":"uio"},{"x":320,"y":256,"exts":{},"template":"uio"},{"x":320,"y":192,"exts":{},"template":"uio"},{"x":320,"y":128,"exts":{},"template":"uio"},{"x":192,"y":320,"exts":{},"template":"uio"},{"x":256,"y":320,"exts":{},"template":"uio"},{"x":512,"y":320,"exts":{},"template":"hjk"},{"x":-64,"y":384,"exts":{},"template":"vbn"},{"x":128,"y":320,"exts":{},"template":"hjk"},{"x":-128,"y":384,"exts":{},"template":"vbn"},{"x":-192,"y":384,"exts":{},"template":"vbn"},{"x":832,"y":384,"exts":{},"template":"vbn"},{"x":896,"y":384,"exts":{},"template":"vbn"},{"x":-256,"y":384,"exts":{},"template":"vbn"},{"x":960,"y":384,"exts":{},"template":"vbn"},{"x":-320,"y":384,"exts":{},"template":"vbn"},{"x":1024,"y":384,"exts":{},"template":"vbn"},{"x":1088,"y":384,"exts":{},"template":"vbn"},{"x":1152,"y":384,"exts":{},"template":"vbn"},{"x":1216,"y":384,"exts":{},"template":"vbn"},{"x":1280,"y":384,"exts":{},"template":"vbn"},{"x":1344,"y":384,"exts":{},"template":"vbn"},{"x":1408,"y":384,"exts":{},"template":"vbn"},{"x":1472,"y":384,"exts":{},"template":"vbn"},{"x":-384,"y":384,"exts":{},"template":"vbn"},{"x":-448,"y":384,"exts":{},"template":"vbn"},{"x":-512,"y":384,"exts":{},"template":"vbn"},{"x":-576,"y":384,"exts":{},"template":"vbn"},{"x":-640,"y":384,"exts":{},"template":"vbn"},{"x":-640,"y":384,"exts":{},"template":"vbn"},{"x":-704,"y":384,"exts":{},"template":"vbn"},{"x":-704,"y":384,"exts":{},"template":"vbn"},{"x":-704,"y":384,"exts":{},"template":"vbn"},{"x":-768,"y":384,"exts":{},"template":"vbn"},{"x":-832,"y":384,"exts":{},"template":"vbn"},{"x":-896,"y":384,"exts":{},"template":"vbn"},{"x":-896,"y":384,"exts":{},"template":"vbn"},{"x":-1024,"y":384,"exts":{},"template":"vbn"},{"x":-960,"y":384,"exts":{},"template":"vbn"},{"x":-1088,"y":384,"exts":{},"template":"vbn"},{"x":1536,"y":384,"exts":{},"template":"vbn"},{"x":1600,"y":384,"exts":{},"template":"vbn"},{"x":1664,"y":384,"exts":{},"template":"vbn"},{"x":1728,"y":384,"exts":{},"template":"vbn"},{"x":1792,"y":384,"exts":{},"template":"vbn"},{"x":1856,"y":384,"exts":{},"template":"vbn"},{"x":-1088,"y":192,"exts":{},"template":"wer"},{"x":-1088,"y":256,"exts":{},"template":"wer"},{"x":-1088,"y":320,"exts":{},"template":"wer"},{"x":-1024,"y":320,"exts":{},"template":"wer"},{"x":-960,"y":320,"exts":{},"template":"wer"},{"x":-960,"y":256,"exts":{},"template":"wer"},{"x":-1024,"y":256,"exts":{},"template":"wer"},{"x":-1024,"y":256,"exts":{},"template":"wer"},{"x":-1024,"y":192,"exts":{},"template":"wer"},{"x":-960,"y":192,"exts":{},"template":"wer"},{"x":-960,"y":128,"exts":{},"template":"wer"},{"x":-1024,"y":128,"exts":{},"template":"wer"},{"x":-1088,"y":128,"exts":{},"template":"wer"},{"x":-1088,"y":64,"exts":{},"template":"wer"},{"x":-1024,"y":64,"exts":{},"template":"wer"},{"x":-960,"y":64,"exts":{},"template":"wer"},{"x":-960,"y":0,"exts":{},"template":"wer"},{"x":-1024,"y":0,"exts":{},"template":"wer"},{"x":-1088,"y":0,"exts":{},"template":"wer"},{"x":-1088,"y":-64,"exts":{},"template":"wer"},{"x":-1024,"y":-64,"exts":{},"template":"wer"},{"x":-960,"y":-64,"exts":{},"template":"wer"},{"x":-960,"y":-128,"exts":{},"template":"wer"},{"x":-960,"y":-128,"exts":{},"template":"wer"},{"x":-1024,"y":-128,"exts":{},"template":"wer"},{"x":-1024,"y":-128,"exts":{},"template":"wer"},{"x":-1088,"y":-128,"exts":{},"template":"wer"},{"x":-1088,"y":-192,"exts":{},"template":"wer"},{"x":-1024,"y":-192,"exts":{},"template":"wer"},{"x":-960,"y":-192,"exts":{},"template":"wer"},{"x":-960,"y":-256,"exts":{},"template":"wer"},{"x":-1024,"y":-256,"exts":{},"template":"wer"},{"x":-1088,"y":-256,"exts":{},"template":"wer"},{"x":-1088,"y":-320,"exts":{},"template":"wer"},{"x":-1024,"y":-320,"exts":{},"template":"wer"},{"x":-960,"y":-320,"exts":{},"template":"wer"},{"x":-960,"y":-384,"exts":{},"template":"wer"},{"x":-1024,"y":-384,"exts":{},"template":"wer"},{"x":-1088,"y":-384,"exts":{},"template":"wer"},{"x":-1152,"y":384,"exts":{},"template":"vbn"},{"x":-576,"y":320,"exts":{},"template":"wer"},{"x":-576,"y":320,"exts":{},"template":"wer"},{"x":-576,"y":256,"exts":{},"template":"wer"},{"x":-576,"y":192,"exts":{},"template":"wer"},{"x":-576,"y":128,"exts":{},"template":"wer"},{"x":-576,"y":64,"exts":{},"template":"wer"},{"x":-576,"y":0,"exts":{},"template":"wer"},{"x":-576,"y":-64,"exts":{},"template":"wer"},{"x":-576,"y":-128,"exts":{},"template":"wer"},{"x":-576,"y":-192,"exts":{},"template":"wer"},{"x":-576,"y":-256,"exts":{},"template":"wer"},{"x":-576,"y":-320,"exts":{},"template":"wer"},{"x":-576,"y":-384,"exts":{},"template":"wer"},{"x":-640,"y":-384,"exts":{},"template":"wer"},{"x":-640,"y":-320,"exts":{},"template":"wer"},{"x":-640,"y":-256,"exts":{},"template":"wer"},{"x":-640,"y":-192,"exts":{},"template":"wer"},{"x":-640,"y":-128,"exts":{},"template":"wer"},{"x":-640,"y":-64,"exts":{},"template":"wer"},{"x":-640,"y":64,"exts":{},"template":"wer"},{"x":-640,"y":128,"exts":{},"template":"wer"},{"x":-640,"y":64,"exts":{},"template":"wer"},{"x":-640,"y":0,"exts":{},"template":"wer"},{"x":-640,"y":192,"exts":{},"template":"wer"},{"x":-640,"y":256,"exts":{},"template":"wer"},{"x":-576,"y":320,"exts":{},"template":"wer"},{"x":-640,"y":320,"exts":{},"template":"wer"},{"x":-512,"y":320,"exts":{},"template":"wer"},{"x":-512,"y":256,"exts":{},"template":"wer"},{"x":-512,"y":192,"exts":{},"template":"wer"},{"x":-512,"y":128,"exts":{},"template":"wer"},{"x":-512,"y":64,"exts":{},"template":"wer"},{"x":-512,"y":0,"exts":{},"template":"wer"},{"x":-512,"y":-64,"exts":{},"template":"wer"},{"x":-512,"y":-128,"exts":{},"template":"wer"},{"x":-512,"y":-192,"exts":{},"template":"wer"},{"x":-512,"y":-256,"exts":{},"template":"wer"},{"x":-512,"y":-320,"exts":{},"template":"wer"},{"x":-512,"y":-384,"exts":{},"template":"wer"},{"x":1792,"y":320,"exts":{},"template":"wer"},{"x":1792,"y":256,"exts":{},"template":"wer"},{"x":1792,"y":192,"exts":{},"template":"wer"},{"x":1792,"y":128,"exts":{},"template":"wer"},{"x":1792,"y":64,"exts":{},"template":"wer"},{"x":1792,"y":0,"exts":{},"template":"wer"},{"x":1792,"y":-64,"exts":{},"template":"wer"},{"x":1792,"y":-128,"exts":{},"template":"wer"},{"x":1792,"y":-192,"exts":{},"template":"wer"},{"x":1792,"y":-256,"exts":{},"template":"wer"},{"x":1792,"y":-320,"exts":{},"template":"wer"},{"x":1792,"y":-384,"exts":{},"template":"wer"},{"x":1664,"y":-384,"exts":{},"template":"wer"},{"x":1664,"y":-320,"exts":{},"template":"wer"},{"x":1664,"y":-256,"exts":{},"template":"wer"},{"x":1664,"y":-192,"exts":{},"template":"wer"},{"x":1664,"y":-128,"exts":{},"template":"wer"},{"x":1664,"y":-64,"exts":{},"template":"wer"},{"x":1664,"y":0,"exts":{},"template":"wer"},{"x":1664,"y":128,"exts":{},"template":"wer"},{"x":1664,"y":64,"exts":{},"template":"wer"},{"x":1664,"y":192,"exts":{},"template":"wer"},{"x":1664,"y":256,"exts":{},"template":"wer"},{"x":1664,"y":320,"exts":{},"template":"wer"},{"x":1728,"y":320,"exts":{},"template":"wer"},{"x":1728,"y":-384,"exts":{},"template":"wer"},{"x":1280,"y":320,"exts":{},"template":"wer"},{"x":1280,"y":256,"exts":{},"template":"wer"},{"x":1280,"y":192,"exts":{},"template":"wer"},{"x":1280,"y":128,"exts":{},"template":"wer"},{"x":1280,"y":64,"exts":{},"template":"wer"},{"x":1280,"y":0,"exts":{},"template":"wer"},{"x":1280,"y":-64,"exts":{},"template":"wer"},{"x":1280,"y":-128,"exts":{},"template":"wer"},{"x":1280,"y":-128,"exts":{},"template":"wer"},{"x":1280,"y":-192,"exts":{},"template":"wer"},{"x":1280,"y":-256,"exts":{},"template":"wer"},{"x":1280,"y":-320,"exts":{},"template":"wer"},{"x":1280,"y":-384,"exts":{},"template":"wer"},{"x":1344,"y":-384,"exts":{},"template":"wer"},{"x":1344,"y":-256,"exts":{},"template":"wer"},{"x":1344,"y":-320,"exts":{},"template":"wer"},{"x":1344,"y":-192,"exts":{},"template":"wer"},{"x":1344,"y":-128,"exts":{},"template":"wer"},{"x":1344,"y":-64,"exts":{},"template":"wer"},{"x":1344,"y":0,"exts":{},"template":"wer"},{"x":1344,"y":64,"exts":{},"template":"wer"},{"x":1344,"y":128,"exts":{},"template":"wer"},{"x":1344,"y":192,"exts":{},"template":"wer"},{"x":1344,"y":256,"exts":{},"template":"wer"},{"x":1344,"y":320,"exts":{},"template":"wer"},{"x":1216,"y":-384,"exts":{},"template":"wer"},{"x":1216,"y":-320,"exts":{},"template":"wer"},{"x":1216,"y":-256,"exts":{},"template":"wer"},{"x":1216,"y":-192,"exts":{},"template":"wer"},{"x":1216,"y":-128,"exts":{},"template":"wer"},{"x":1216,"y":0,"exts":{},"template":"wer"},{"x":1216,"y":-64,"exts":{},"template":"wer"},{"x":1216,"y":64,"exts":{},"template":"wer"},{"x":1216,"y":128,"exts":{},"template":"wer"},{"x":1216,"y":192,"exts":{},"template":"wer"},{"x":1216,"y":256,"exts":{},"template":"wer"},{"x":1216,"y":320,"exts":{},"template":"wer"},{"x":1728,"y":256,"exts":{},"template":"wer"},{"x":1728,"y":192,"exts":{},"template":"wer"},{"x":1728,"y":128,"exts":{},"template":"wer"},{"x":1728,"y":64,"exts":{},"template":"wer"},{"x":1728,"y":0,"exts":{},"template":"wer"},{"x":1728,"y":0,"exts":{},"template":"wer"},{"x":1728,"y":-128,"exts":{},"template":"wer"},{"x":1728,"y":-64,"exts":{},"template":"wer"},{"x":1792,"y":-192,"exts":{},"template":"wer"},{"x":1792,"y":-192,"exts":{},"template":"wer"},{"x":1728,"y":-192,"exts":{},"template":"wer"},{"x":1728,"y":-256,"exts":{},"template":"wer"},{"x":1728,"y":-320,"exts":{},"template":"wer"},{"x":-1024,"y":-448,"exts":{},"template":"hjk"},{"x":-576,"y":-448,"exts":{},"template":"hjk"},{"x":1280,"y":-448,"exts":{},"template":"hjk"},{"x":1728,"y":-448,"exts":{},"template":"hjk"},{"x":-1024,"y":-512,"exts":{},"template":"dfg"},{"x":-576,"y":-512,"exts":{},"template":"dfg"},{"x":1280,"y":-512,"exts":{},"template":"dfg"},{"x":1728,"y":-512,"exts":{},"template":"dfg"},{"x":-512,"y":-448,"exts":{},"template":"krat"},{"x":-576,"y":-448,"exts":{},"template":"krat"},{"x":-640,"y":-448,"exts":{},"template":"krat"},{"x":-640,"y":-512,"exts":{},"template":"krat"},{"x":-576,"y":-512,"exts":{},"template":"krat"},{"x":-512,"y":-512,"exts":{},"template":"krat"},{"x":-512,"y":-576,"exts":{},"template":"krat"},{"x":-576,"y":-576,"exts":{},"template":"krat"},{"x":-576,"y":-576,"exts":{},"template":"krat"},{"x":-640,"y":-576,"exts":{},"template":"krat"},{"x":1344,"y":-448,"exts":{},"template":"krat"},{"x":1280,"y":-448,"exts":{},"template":"krat"},{"x":1216,"y":-448,"exts":{},"template":"krat"},{"x":1280,"y":-512,"exts":{},"template":"krat"},{"x":1344,"y":-512,"exts":{},"template":"krat"},{"x":1216,"y":-512,"exts":{},"template":"krat"},{"x":1216,"y":-576,"exts":{},"template":"krat"},{"x":1280,"y":-576,"exts":{},"template":"krat"},{"x":1344,"y":-576,"exts":{},"template":"krat"},{"x":-256,"y":320,"exts":{},"template":"wer"},{"x":-256,"y":256,"exts":{},"template":"wer"},{"x":-256,"y":192,"exts":{},"template":"wer"},{"x":1088,"y":320,"exts":{},"template":"wer"},{"x":1088,"y":256,"exts":{},"template":"wer"},{"x":1088,"y":192,"exts":{},"template":"wer"},{"x":896,"y":320,"exts":{},"template":"wer"},{"x":896,"y":256,"exts":{},"template":"wer"},{"x":896,"y":192,"exts":{},"template":"wer"},{"x":-256,"y":128,"exts":{},"template":"pin"},{"x":896,"y":128,"exts":{},"template":"pin"},{"x":1088,"y":128,"exts":{},"template":"pin"},{"x":256,"y":256,"exts":{},"template":"hjk"},{"x":384,"y":256,"exts":{},"template":"hjk"},{"x":128,"y":320,"exts":{},"template":"uio"},{"x":512,"y":320,"exts":{},"template":"uio"},{"x":320,"y":64,"exts":{},"template":"zxc"},{"x":320,"y":384,"exts":{},"template":"vbn"},{"x":320,"y":320,"exts":{},"template":"uio"},{"x":128,"y":256,"exts":{},"template":"hjk"},{"x":512,"y":256,"exts":{},"template":"hjk"},{"x":128,"y":192,"exts":{},"template":"dfg"},{"x":256,"y":192,"exts":{},"template":"dfg"},{"x":384,"y":192,"exts":{},"template":"dfg"},{"x":512,"y":192,"exts":{},"template":"dfg"},{"x":-64,"y":384,"exts":{},"template":"robot"},{"x":1344,"y":320,"exts":{},"template":"platforma_ukryta"},{"x":1216,"y":256,"exts":{},"template":"platforma_ukryta"},{"x":1088,"y":192,"exts":{},"template":"platforma_ukryta"},{"x":1280,"y":128,"exts":{},"template":"platforma_ukryta"},{"x":1344,"y":0,"exts":{},"template":"LevelExit"}]'),
    bgs: JSON.parse('[{"depth":-2,"texture":"BG","extends":{}},{"depth":-1,"texture":"pixil-frame-0_(58)","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'poziom1';
inGameRoomStart(this);

    },
    extends: {}
}
ct.rooms.templates[''] = {
    name: '',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":448,"exts":{},"template":"trawa"},{"x":64,"y":448,"exts":{},"template":"trawa"},{"x":128,"y":448,"exts":{},"template":"trawa"},{"x":192,"y":448,"exts":{},"template":"trawa"},{"x":320,"y":448,"exts":{},"template":"trawa"},{"x":384,"y":448,"exts":{},"template":"trawa"},{"x":448,"y":448,"exts":{},"template":"trawa"},{"x":512,"y":448,"exts":{},"template":"trawa"},{"x":576,"y":448,"exts":{},"template":"trawa"},{"x":640,"y":448,"exts":{},"template":"trawa"},{"x":704,"y":448,"exts":{},"template":"trawa"},{"x":768,"y":448,"exts":{},"template":"trawa"},{"x":384,"y":384,"exts":{},"template":"o0p"},{"x":384,"y":320,"exts":{},"template":"o0p"},{"x":384,"y":320,"exts":{},"template":"o0p"},{"x":320,"y":320,"exts":{},"template":"o0p"},{"x":448,"y":320,"exts":{},"template":"o0p"},{"x":320,"y":256,"exts":{},"template":"p0o"},{"x":384,"y":256,"exts":{},"template":"p0o"},{"x":448,"y":256,"exts":{},"template":"p0o"},{"x":128,"y":448,"exts":{},"template":"trawa"},{"x":192,"y":448,"exts":{},"template":"trawa"},{"x":192,"y":448,"exts":{},"template":"trawa"},{"x":192,"y":448,"exts":{},"template":"trawa"},{"x":192,"y":448,"exts":{},"template":"trawa"},{"x":64,"y":448,"exts":{},"template":"trawa"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"BG","extends":{}},{"depth":-1,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['3'] = {
    name: '3',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":448,"exts":{},"template":"trawa"},{"x":64,"y":448,"exts":{},"template":"trawa"},{"x":128,"y":448,"exts":{},"template":"trawa"},{"x":192,"y":448,"exts":{},"template":"trawa"},{"x":256,"y":448,"exts":{},"template":"trawa"},{"x":320,"y":448,"exts":{},"template":"trawa"},{"x":384,"y":448,"exts":{},"template":"trawa"},{"x":448,"y":448,"exts":{},"template":"trawa"},{"x":512,"y":448,"exts":{},"template":"trawa"},{"x":576,"y":448,"exts":{},"template":"trawa"},{"x":640,"y":448,"exts":{},"template":"trawa"},{"x":704,"y":448,"exts":{},"template":"trawa"},{"x":768,"y":448,"exts":{},"template":"trawa"},{"x":384,"y":384,"exts":{},"template":"o0p"},{"x":384,"y":320,"exts":{},"template":"o0p"},{"x":320,"y":320,"exts":{},"template":"o0p"},{"x":448,"y":320,"exts":{},"template":"o0p"},{"x":320,"y":256,"exts":{},"template":"p0o"},{"x":384,"y":256,"exts":{},"template":"p0o"},{"x":448,"y":256,"exts":{},"template":"p0o"},{"x":-64,"y":448,"exts":{},"template":"trawa"},{"x":-128,"y":448,"exts":{},"template":"trawa"},{"x":-192,"y":448,"exts":{},"template":"trawa"},{"x":-192,"y":448,"exts":{},"template":"trawa"},{"x":-256,"y":448,"exts":{},"template":"trawa"},{"x":-320,"y":448,"exts":{},"template":"trawa"},{"x":-384,"y":448,"exts":{},"template":"trawa"},{"x":832,"y":448,"exts":{},"template":"trawa"},{"x":896,"y":448,"exts":{},"template":"trawa"},{"x":960,"y":448,"exts":{},"template":"trawa"},{"x":1024,"y":448,"exts":{},"template":"trawa"},{"x":1088,"y":448,"exts":{},"template":"trawa"},{"x":704,"y":384,"exts":{},"template":"o0p"},{"x":704,"y":320,"exts":{},"template":"o0p"},{"x":704,"y":256,"exts":{},"template":"p0o"},{"x":64,"y":384,"exts":{},"template":"o0p"},{"x":64,"y":320,"exts":{},"template":"o0p"},{"x":64,"y":256,"exts":{},"template":"p0o"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['5'] = {
    name: '5',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":448,"exts":{},"template":"trawa"},{"x":64,"y":448,"exts":{},"template":"trawa"},{"x":128,"y":448,"exts":{},"template":"trawa"},{"x":192,"y":448,"exts":{},"template":"trawa"},{"x":256,"y":448,"exts":{},"template":"trawa"},{"x":320,"y":448,"exts":{},"template":"trawa"},{"x":384,"y":448,"exts":{},"template":"trawa"},{"x":448,"y":448,"exts":{},"template":"trawa"},{"x":512,"y":448,"exts":{},"template":"trawa"},{"x":576,"y":448,"exts":{},"template":"trawa"},{"x":704,"y":448,"exts":{},"template":"trawa"},{"x":640,"y":448,"exts":{},"template":"trawa"},{"x":768,"y":448,"exts":{},"template":"trawa"},{"x":256,"y":384,"exts":{},"template":"z89"},{"x":384,"y":384,"exts":{},"template":"z89"},{"x":320,"y":320,"exts":{},"template":"z89"},{"x":320,"y":256,"exts":{},"template":"z89"},{"x":448,"y":192,"exts":{},"template":"z89"},{"x":320,"y":192,"exts":{},"template":"z89"},{"x":192,"y":192,"exts":{},"template":"z89"},{"x":256,"y":320,"exts":{},"template":"z89"},{"x":384,"y":320,"exts":{},"template":"z89"},{"x":320,"y":128,"exts":{},"template":"z89"},{"x":384,"y":128,"exts":{},"template":"z89"},{"x":448,"y":128,"exts":{},"template":"z89"},{"x":256,"y":128,"exts":{},"template":"z89"},{"x":192,"y":128,"exts":{},"template":"z89"},{"x":320,"y":64,"exts":{},"template":"d98"},{"x":-64,"y":448,"exts":{},"template":"trawa"},{"x":-128,"y":448,"exts":{},"template":"trawa"},{"x":-192,"y":448,"exts":{},"template":"trawa"},{"x":-256,"y":448,"exts":{},"template":"trawa"},{"x":-320,"y":448,"exts":{},"template":"trawa"},{"x":832,"y":448,"exts":{},"template":"trawa"},{"x":896,"y":448,"exts":{},"template":"trawa"},{"x":960,"y":448,"exts":{},"template":"trawa"},{"x":1024,"y":448,"exts":{},"template":"trawa"},{"x":1088,"y":448,"exts":{},"template":"trawa"},{"x":-192,"y":384,"exts":{},"template":"z89"},{"x":-192,"y":320,"exts":{},"template":"z89"},{"x":-256,"y":320,"exts":{},"template":"z89"},{"x":-128,"y":320,"exts":{},"template":"z89"},{"x":832,"y":384,"exts":{},"template":"z89"},{"x":832,"y":320,"exts":{},"template":"z89"},{"x":768,"y":320,"exts":{},"template":"z89"},{"x":896,"y":320,"exts":{},"template":"z89"},{"x":-192,"y":256,"exts":{},"template":"d98"},{"x":832,"y":256,"exts":{},"template":"d98"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['15'] = {
    name: '15',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":448,"exts":{},"template":"trawa"},{"x":64,"y":448,"exts":{},"template":"trawa"},{"x":128,"y":448,"exts":{},"template":"trawa"},{"x":192,"y":448,"exts":{},"template":"trawa"},{"x":320,"y":448,"exts":{},"template":"trawa"},{"x":256,"y":448,"exts":{},"template":"trawa"},{"x":384,"y":448,"exts":{},"template":"trawa"},{"x":448,"y":448,"exts":{},"template":"trawa"},{"x":512,"y":448,"exts":{},"template":"trawa"},{"x":576,"y":448,"exts":{},"template":"trawa"},{"x":640,"y":448,"exts":{},"template":"trawa"},{"x":704,"y":448,"exts":{},"template":"trawa"},{"x":768,"y":448,"exts":{},"template":"trawa"},{"x":320,"y":384,"exts":{},"template":"TNT"},{"x":64,"y":384,"exts":{},"template":"TNT"},{"x":64,"y":320,"exts":{},"template":"TNT"},{"x":640,"y":384,"exts":{},"template":"TNT"},{"x":640,"y":320,"exts":{},"template":"TNT"},{"x":64,"y":256,"exts":{},"template":"kri"},{"x":640,"y":256,"exts":{},"template":"kri"},{"x":320,"y":320,"exts":{},"template":"TNT"},{"x":320,"y":256,"exts":{},"template":"TNT"},{"x":256,"y":256,"exts":{},"template":"TNT"},{"x":384,"y":256,"exts":{},"template":"TNT"},{"x":256,"y":192,"exts":{},"template":"kri"},{"x":320,"y":192,"exts":{},"template":"kri"},{"x":384,"y":192,"exts":{},"template":"kri"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['portal'] = {
    name: 'portal',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":64,"y":384,"exts":{},"template":"ned"},{"x":128,"y":384,"exts":{},"template":"ned"},{"x":192,"y":384,"exts":{},"template":"ned"},{"x":256,"y":384,"exts":{},"template":"ned"},{"x":576,"y":384,"exts":{},"template":"ned"},{"x":640,"y":384,"exts":{},"template":"ned"},{"x":704,"y":384,"exts":{},"template":"ned"},{"x":512,"y":320,"exts":{},"template":"ned"},{"x":384,"y":320,"exts":{},"template":"ned"},{"x":320,"y":320,"exts":{},"template":"ned"},{"x":128,"y":320,"exts":{},"template":"ned"},{"x":448,"y":320,"exts":{},"template":"ned"},{"x":320,"y":256,"exts":{},"template":"wer"},{"x":384,"y":256,"exts":{},"template":"wer"},{"x":448,"y":256,"exts":{},"template":"wer"},{"x":512,"y":256,"exts":{},"template":"wer"},{"x":512,"y":192,"exts":{},"template":"wer"},{"x":512,"y":128,"exts":{},"template":"wer"},{"x":512,"y":0,"exts":{},"template":"wer"},{"x":448,"y":0,"exts":{},"template":"wer"},{"x":384,"y":0,"exts":{},"template":"wer"},{"x":384,"y":0,"exts":{},"template":"wer"},{"x":320,"y":0,"exts":{},"template":"wer"},{"x":320,"y":64,"exts":{},"template":"wer"},{"x":320,"y":128,"exts":{},"template":"wer"},{"x":320,"y":192,"exts":{},"template":"wer"},{"x":256,"y":256,"exts":{},"template":"sk"},{"x":384,"y":192,"exts":{},"template":"rew"},{"x":448,"y":192,"exts":{},"template":"rew"},{"x":448,"y":128,"exts":{},"template":"rew"},{"x":384,"y":128,"exts":{},"template":"rew"},{"x":384,"y":64,"exts":{},"template":"rew"},{"x":448,"y":64,"exts":{},"template":"rew"},{"x":512,"y":64,"exts":{},"template":"wer"},{"x":640,"y":320,"exts":{},"template":"ned"},{"x":640,"y":256,"exts":{},"template":"hjk"},{"x":64,"y":320,"exts":{},"template":"hjk"},{"x":0,"y":448,"exts":{},"template":"ned"},{"x":64,"y":448,"exts":{},"template":"ned"},{"x":128,"y":448,"exts":{},"template":"ned"},{"x":192,"y":448,"exts":{},"template":"ned"},{"x":448,"y":448,"exts":{},"template":"ned"},{"x":512,"y":448,"exts":{},"template":"ned"},{"x":576,"y":448,"exts":{},"template":"ned"},{"x":640,"y":448,"exts":{},"template":"ned"},{"x":704,"y":448,"exts":{},"template":"ned"},{"x":768,"y":448,"exts":{},"template":"ned"},{"x":768,"y":448,"exts":{},"template":"ned"},{"x":832,"y":448,"exts":{},"template":"ned"},{"x":256,"y":448,"exts":{},"template":"ned"},{"x":384,"y":448,"exts":{},"template":"ned"},{"x":320,"y":448,"exts":{},"template":"ned"},{"x":-64,"y":512,"exts":{},"template":"trawa"},{"x":-128,"y":512,"exts":{},"template":"trawa"},{"x":-192,"y":512,"exts":{},"template":"trawa"},{"x":-256,"y":512,"exts":{},"template":"trawa"},{"x":-320,"y":512,"exts":{},"template":"trawa"},{"x":896,"y":512,"exts":{},"template":"trawa"},{"x":960,"y":512,"exts":{},"template":"trawa"},{"x":1024,"y":512,"exts":{},"template":"trawa"},{"x":1088,"y":512,"exts":{},"template":"trawa"},{"x":1152,"y":512,"exts":{},"template":"trawa"},{"x":1216,"y":512,"exts":{},"template":"trawa"},{"x":1280,"y":512,"exts":{},"template":"trawa"},{"x":1344,"y":512,"exts":{},"template":"trawa"},{"x":1408,"y":512,"exts":{},"template":"trawa"},{"x":1472,"y":512,"exts":{},"template":"trawa"},{"x":1536,"y":512,"exts":{},"template":"trawa"},{"x":0,"y":512,"exts":{},"template":"skała"},{"x":64,"y":512,"exts":{},"template":"skała"},{"x":128,"y":512,"exts":{},"template":"skała"},{"x":192,"y":512,"exts":{},"template":"skała"},{"x":256,"y":512,"exts":{},"template":"skała"},{"x":320,"y":512,"exts":{},"template":"skała"},{"x":384,"y":512,"exts":{},"template":"skała"},{"x":448,"y":512,"exts":{},"template":"skała"},{"x":512,"y":512,"exts":{},"template":"skała"},{"x":576,"y":512,"exts":{},"template":"skała"},{"x":640,"y":512,"exts":{},"template":"skała"},{"x":704,"y":512,"exts":{},"template":"skała"},{"x":768,"y":512,"exts":{},"template":"skała"},{"x":832,"y":512,"exts":{},"template":"skała"},{"x":768,"y":384,"exts":{},"template":"hjk"},{"x":512,"y":384,"exts":{},"template":"ned"},{"x":256,"y":320,"exts":{},"template":"ned"},{"x":192,"y":320,"exts":{},"template":"lava2-top"},{"x":576,"y":320,"exts":{},"template":"lava2-top"},{"x":320,"y":384,"exts":{},"template":"lava2"},{"x":448,"y":384,"exts":{},"template":"lava2"},{"x":384,"y":384,"exts":{},"template":"lava2"},{"x":-64,"y":448,"exts":{},"template":"z1"},{"x":448,"y":-64,"exts":{},"template":"z1"},{"x":384,"y":-64,"exts":{},"template":"z1"},{"x":0,"y":384,"exts":{},"template":"pppppooooo"},{"x":896,"y":448,"exts":{},"template":"pppppooooo"},{"x":0,"y":384,"exts":{},"template":"robot"},{"x":128,"y":128,"exts":{},"template":"platforma_ukryta"},{"x":256,"y":0,"exts":{},"template":"platforma_ukryta"},{"x":896,"y":384,"exts":{},"template":"LevelExit"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = '1';
inGameRoomStart(this);

    },
    extends: {}
}
ct.rooms.templates['13551525'] = {
    name: '13551525',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":64,"y":448,"exts":{},"template":"trawa"},{"x":128,"y":448,"exts":{},"template":"trawa"},{"x":192,"y":448,"exts":{},"template":"trawa"},{"x":256,"y":448,"exts":{},"template":"trawa"},{"x":320,"y":448,"exts":{},"template":"trawa"},{"x":384,"y":448,"exts":{},"template":"trawa"},{"x":384,"y":448,"exts":{},"template":"trawa"},{"x":448,"y":448,"exts":{},"template":"trawa"},{"x":512,"y":448,"exts":{},"template":"trawa"},{"x":576,"y":448,"exts":{},"template":"trawa"},{"x":640,"y":448,"exts":{},"template":"trawa"},{"x":704,"y":448,"exts":{},"template":"trawa"},{"x":768,"y":448,"exts":{},"template":"trawa"},{"x":0,"y":448,"exts":{},"template":"trawa"},{"x":320,"y":384,"exts":{},"template":"z89"},{"x":320,"y":320,"exts":{},"template":"z89"},{"x":256,"y":320,"exts":{},"template":"z89"},{"x":384,"y":320,"exts":{},"template":"z89"},{"x":320,"y":256,"exts":{},"template":"d98"},{"x":64,"y":384,"exts":{},"template":"szklo2"},{"x":64,"y":384,"exts":{},"template":"szklo2"},{"x":63,"y":407,"exts":{},"template":"szklo2"},{"x":66,"y":409,"exts":{},"template":"szklo2"},{"x":66,"y":396,"exts":{},"template":"szklo2"},{"x":66,"y":396,"exts":{},"template":"szklo2"},{"x":66,"y":401,"exts":{},"template":"szklo2"},{"x":66,"y":401,"exts":{},"template":"szklo2"},{"x":66,"y":380,"exts":{},"template":"szklo2"},{"x":68,"y":346,"exts":{},"template":"szklo2"},{"x":68,"y":346,"exts":{},"template":"szklo2"},{"x":68,"y":346,"exts":{},"template":"szklo2"},{"x":68,"y":346,"exts":{},"template":"szklo2"},{"x":66,"y":326,"exts":{},"template":"szklo2"},{"x":66,"y":326,"exts":{},"template":"szklo2"},{"x":66,"y":326,"exts":{},"template":"szklo2"},{"x":66,"y":326,"exts":{},"template":"szklo2"},{"x":66,"y":326,"exts":{},"template":"szklo2"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['R'] = {
    name: 'R',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":64,"y":448,"exts":{},"template":"trawa"},{"x":128,"y":448,"exts":{},"template":"trawa"},{"x":256,"y":448,"exts":{},"template":"trawa"},{"x":384,"y":448,"exts":{},"template":"trawa"},{"x":320,"y":448,"exts":{},"template":"trawa"},{"x":448,"y":448,"exts":{},"template":"trawa"},{"x":512,"y":448,"exts":{},"template":"trawa"},{"x":576,"y":448,"exts":{},"template":"trawa"},{"x":640,"y":448,"exts":{},"template":"trawa"},{"x":704,"y":448,"exts":{},"template":"trawa"},{"x":0,"y":448,"exts":{},"template":"trawa"},{"x":-64,"y":448,"exts":{},"template":"trawa"},{"x":-128,"y":448,"exts":{},"template":"trawa"},{"x":-128,"y":448,"exts":{},"template":"trawa"},{"x":768,"y":448,"exts":{},"template":"trawa"},{"x":832,"y":448,"exts":{},"template":"trawa"},{"x":896,"y":448,"exts":{},"template":"trawa"},{"x":960,"y":448,"exts":{},"template":"trawa"},{"x":1024,"y":448,"exts":{},"template":"trawa"},{"x":1088,"y":448,"exts":{},"template":"trawa"},{"x":1152,"y":448,"exts":{},"template":"trawa"},{"x":-192,"y":448,"exts":{},"template":"trawa"},{"x":-192,"y":448,"exts":{},"template":"trawa"},{"x":-256,"y":448,"exts":{},"template":"trawa"},{"x":-320,"y":448,"exts":{},"template":"trawa"},{"x":-384,"y":448,"exts":{},"template":"trawa"},{"x":-448,"y":448,"exts":{},"template":"trawa"},{"x":-512,"y":448,"exts":{},"template":"skała"},{"x":-512,"y":384,"exts":{},"template":"skała"},{"x":-512,"y":320,"exts":{},"template":"skała"},{"x":-512,"y":256,"exts":{},"template":"skała"},{"x":-512,"y":192,"exts":{},"template":"skała"},{"x":-512,"y":128,"exts":{},"template":"trawa"},{"x":192,"y":448,"exts":{},"template":"trawa"},{"x":1152,"y":384,"exts":{},"template":"skała"},{"x":1088,"y":384,"exts":{},"template":"skała"},{"x":1024,"y":384,"exts":{},"template":"skała"},{"x":960,"y":384,"exts":{},"template":"skała"},{"x":960,"y":320,"exts":{},"template":"skała"},{"x":1024,"y":320,"exts":{},"template":"skała"},{"x":1088,"y":320,"exts":{},"template":"skała"},{"x":1152,"y":320,"exts":{},"template":"skała"},{"x":960,"y":384,"exts":{},"template":"LevelExit"},{"x":-384,"y":448,"exts":{},"template":"robot"},{"x":896,"y":256,"exts":{},"template":"ned"},{"x":960,"y":256,"exts":{},"template":"ned"},{"x":1024,"y":256,"exts":{},"template":"ned"},{"x":1088,"y":256,"exts":{},"template":"ned"},{"x":1152,"y":256,"exts":{},"template":"ned"},{"x":1216,"y":256,"exts":{},"template":"ned"},{"x":1152,"y":192,"exts":{},"template":"ned"},{"x":1088,"y":192,"exts":{},"template":"ned"},{"x":1088,"y":192,"exts":{},"template":"ned"},{"x":1024,"y":192,"exts":{},"template":"ned"},{"x":1024,"y":192,"exts":{},"template":"ned"},{"x":960,"y":192,"exts":{},"template":"ned"},{"x":1024,"y":128,"exts":{},"template":"ned"},{"x":1088,"y":128,"exts":{},"template":"ned"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['Ro'] = {
    name: 'Ro',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":64,"y":448,"exts":{},"template":"skała"},{"x":128,"y":448,"exts":{},"template":"skała"},{"x":192,"y":448,"exts":{},"template":"skała"},{"x":256,"y":448,"exts":{},"template":"skała"},{"x":320,"y":448,"exts":{},"template":"skała"},{"x":384,"y":448,"exts":{},"template":"skała"},{"x":448,"y":448,"exts":{},"template":"skała"},{"x":512,"y":448,"exts":{},"template":"skała"},{"x":576,"y":448,"exts":{},"template":"skała"},{"x":640,"y":448,"exts":{},"template":"skała"},{"x":704,"y":448,"exts":{},"template":"skała"},{"x":704,"y":384,"exts":{},"template":"skała"},{"x":704,"y":320,"exts":{},"template":"skała"},{"x":704,"y":256,"exts":{},"template":"skała"},{"x":704,"y":192,"exts":{},"template":"skała"},{"x":704,"y":128,"exts":{},"template":"skała"},{"x":640,"y":128,"exts":{},"template":"skała"},{"x":640,"y":128,"exts":{},"template":"skała"},{"x":576,"y":128,"exts":{},"template":"skała"},{"x":576,"y":128,"exts":{},"template":"skała"},{"x":512,"y":128,"exts":{},"template":"skała"},{"x":448,"y":128,"exts":{},"template":"skała"},{"x":384,"y":128,"exts":{},"template":"skała"},{"x":320,"y":128,"exts":{},"template":"skała"},{"x":256,"y":128,"exts":{},"template":"skała"},{"x":192,"y":128,"exts":{},"template":"skała"},{"x":128,"y":128,"exts":{},"template":"skała"},{"x":128,"y":128,"exts":{},"template":"skała"},{"x":64,"y":128,"exts":{},"template":"skała"},{"x":64,"y":192,"exts":{},"template":"skała"},{"x":64,"y":256,"exts":{},"template":"skała"},{"x":64,"y":320,"exts":{},"template":"skała"},{"x":64,"y":384,"exts":{},"template":"skała"},{"x":192,"y":448,"exts":{},"template":"robot"},{"x":64,"y":384,"exts":{},"template":"LevelExit"},{"x":0,"y":64,"exts":{},"template":"ned"},{"x":64,"y":64,"exts":{},"template":"ned"},{"x":192,"y":64,"exts":{},"template":"ned"},{"x":128,"y":64,"exts":{},"template":"ned"},{"x":256,"y":64,"exts":{},"template":"ned"},{"x":320,"y":64,"exts":{},"template":"ned"},{"x":384,"y":64,"exts":{},"template":"ned"},{"x":448,"y":64,"exts":{},"template":"ned"},{"x":512,"y":64,"exts":{},"template":"ned"},{"x":576,"y":64,"exts":{},"template":"ned"},{"x":640,"y":64,"exts":{},"template":"ned"},{"x":704,"y":64,"exts":{},"template":"ned"},{"x":768,"y":64,"exts":{},"template":"ned"},{"x":704,"y":0,"exts":{},"template":"ned"},{"x":640,"y":0,"exts":{},"template":"ned"},{"x":576,"y":0,"exts":{},"template":"ned"},{"x":512,"y":0,"exts":{},"template":"ned"},{"x":448,"y":0,"exts":{},"template":"ned"},{"x":384,"y":0,"exts":{},"template":"ned"},{"x":320,"y":0,"exts":{},"template":"ned"},{"x":256,"y":0,"exts":{},"template":"ned"},{"x":192,"y":0,"exts":{},"template":"ned"},{"x":128,"y":0,"exts":{},"template":"ned"},{"x":64,"y":0,"exts":{},"template":"ned"},{"x":128,"y":-64,"exts":{},"template":"ned"},{"x":192,"y":-64,"exts":{},"template":"ned"},{"x":256,"y":-64,"exts":{},"template":"ned"},{"x":320,"y":-64,"exts":{},"template":"ned"},{"x":384,"y":-64,"exts":{},"template":"ned"},{"x":448,"y":-64,"exts":{},"template":"ned"},{"x":512,"y":-64,"exts":{},"template":"ned"},{"x":576,"y":-64,"exts":{},"template":"ned"},{"x":640,"y":-64,"exts":{},"template":"ned"},{"x":64,"y":448,"exts":{},"template":"trawa"},{"x":128,"y":448,"exts":{},"template":"trawa"},{"x":192,"y":448,"exts":{},"template":"trawa"},{"x":256,"y":448,"exts":{},"template":"trawa"},{"x":320,"y":448,"exts":{},"template":"trawa"},{"x":448,"y":448,"exts":{},"template":"trawa"},{"x":384,"y":448,"exts":{},"template":"trawa"},{"x":512,"y":448,"exts":{},"template":"trawa"},{"x":576,"y":448,"exts":{},"template":"trawa"},{"x":640,"y":448,"exts":{},"template":"trawa"},{"x":704,"y":448,"exts":{},"template":"trawa"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['Room_2ee6bcf14541'] = {
    name: 'Room_2ee6bcf14541',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":128,"y":448,"exts":{},"template":"trawa"},{"x":192,"y":448,"exts":{},"template":"trawa"},{"x":320,"y":448,"exts":{},"template":"trawa"},{"x":320,"y":448,"exts":{},"template":"trawa"},{"x":256,"y":448,"exts":{},"template":"trawa"},{"x":128,"y":384,"exts":{},"template":"pixil-frame-0_(5)"},{"x":192,"y":384,"exts":{},"template":"pixil-frame-0_(5)"},{"x":256,"y":384,"exts":{},"template":"pixil-frame-0_(5)"},{"x":320,"y":384,"exts":{},"template":"pixil-frame-0_(5)"},{"x":320,"y":384,"exts":{},"template":"pixil-frame-0_(5)"},{"x":320,"y":320,"exts":{},"template":"pixil-frame-0_(5)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(5)"},{"x":320,"y":128,"exts":{},"template":"pixil-frame-0_(5)"},{"x":320,"y":128,"exts":{},"template":"pixil-frame-0_(5)"},{"x":256,"y":128,"exts":{},"template":"pixil-frame-0_(5)"},{"x":256,"y":128,"exts":{},"template":"pixil-frame-0_(5)"},{"x":192,"y":128,"exts":{},"template":"pixil-frame-0_(5)"},{"x":192,"y":128,"exts":{},"template":"pixil-frame-0_(5)"},{"x":128,"y":128,"exts":{},"template":"pixil-frame-0_(5)"},{"x":128,"y":192,"exts":{},"template":"pixil-frame-0_(5)"},{"x":128,"y":256,"exts":{},"template":"pixil-frame-0_(5)"},{"x":128,"y":320,"exts":{},"template":"pixil-frame-0_(5)"},{"x":192,"y":320,"exts":{},"template":"pixil-frame-0_(44)"},{"x":256,"y":320,"exts":{},"template":"pixil-frame-0_(44)"},{"x":256,"y":320,"exts":{},"template":"pixil-frame-0_(44)"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(44)"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(44)"},{"x":192,"y":256,"exts":{},"template":"pixil-frame-0_(44)"},{"x":192,"y":256,"exts":{},"template":"pixil-frame-0_(44)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(44)"},{"x":256,"y":192,"exts":{},"template":"pixil-frame-0_(44)"},{"x":320,"y":256,"exts":{},"template":"pixil-frame-0_(5)"},{"x":64,"y":448,"exts":{},"template":"ned"},{"x":128,"y":448,"exts":{},"template":"ned"},{"x":192,"y":448,"exts":{},"template":"ned"},{"x":256,"y":448,"exts":{},"template":"ned"},{"x":320,"y":448,"exts":{},"template":"ned"},{"x":128,"y":512,"exts":{},"template":"ned"},{"x":192,"y":512,"exts":{},"template":"ned"},{"x":256,"y":512,"exts":{},"template":"ned"},{"x":320,"y":512,"exts":{},"template":"ned"},{"x":448,"y":512,"exts":{},"template":"ned"},{"x":384,"y":512,"exts":{},"template":"ned"},{"x":448,"y":512,"exts":{},"template":"ned"},{"x":448,"y":448,"exts":{},"template":"ned"},{"x":512,"y":512,"exts":{},"template":"ned"},{"x":-64,"y":512,"exts":{},"template":"ned"},{"x":-384,"y":576,"exts":{},"template":"trawa"},{"x":-320,"y":576,"exts":{},"template":"trawa"},{"x":-256,"y":576,"exts":{},"template":"trawa"},{"x":-192,"y":576,"exts":{},"template":"trawa"},{"x":-128,"y":576,"exts":{},"template":"trawa"},{"x":-64,"y":576,"exts":{},"template":"trawa"},{"x":0,"y":576,"exts":{},"template":"trawa"},{"x":128,"y":576,"exts":{},"template":"trawa"},{"x":256,"y":576,"exts":{},"template":"trawa"},{"x":192,"y":576,"exts":{},"template":"trawa"},{"x":320,"y":576,"exts":{},"template":"trawa"},{"x":448,"y":576,"exts":{},"template":"trawa"},{"x":448,"y":576,"exts":{},"template":"trawa"},{"x":448,"y":576,"exts":{},"template":"trawa"},{"x":384,"y":576,"exts":{},"template":"trawa"},{"x":512,"y":576,"exts":{},"template":"trawa"},{"x":576,"y":576,"exts":{},"template":"trawa"},{"x":640,"y":576,"exts":{},"template":"trawa"},{"x":704,"y":576,"exts":{},"template":"trawa"},{"x":64,"y":576,"exts":{},"template":"trawa"},{"x":-192,"y":-128,"exts":{},"template":"z1"},{"x":-128,"y":-128,"exts":{},"template":"z1"},{"x":-64,"y":-128,"exts":{},"template":"z1"},{"x":-64,"y":-64,"exts":{},"template":"z1"},{"x":-128,"y":-64,"exts":{},"template":"z1"},{"x":-192,"y":-64,"exts":{},"template":"z1"},{"x":-192,"y":0,"exts":{},"template":"z1"},{"x":-128,"y":0,"exts":{},"template":"z1"},{"x":-64,"y":0,"exts":{},"template":"z1"},{"x":384,"y":512,"exts":{},"template":"ned"},{"x":384,"y":512,"exts":{},"template":"ned"},{"x":384,"y":448,"exts":{},"template":"lava2-top"},{"x":0,"y":512,"exts":{},"template":"lava2-top"},{"x":64,"y":512,"exts":{},"template":"ned"},{"x":768,"y":576,"exts":{},"template":"trawa"},{"x":896,"y":576,"exts":{},"template":"trawa"},{"x":896,"y":576,"exts":{},"template":"trawa"},{"x":832,"y":576,"exts":{},"template":"trawa"},{"x":960,"y":576,"exts":{},"template":"trawa"},{"x":1088,"y":576,"exts":{},"template":"trawa"},{"x":1024,"y":576,"exts":{},"template":"trawa"},{"x":1088,"y":576,"exts":{},"template":"trawa"},{"x":1152,"y":576,"exts":{},"template":"trawa"},{"x":-384,"y":576,"exts":{},"template":"trawa"},{"x":-384,"y":576,"exts":{},"template":"trawa"}]'),
    bgs: JSON.parse('[{"depth":-2,"texture":"pixil-frame-0_(20)","extends":{}},{"depth":-1,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['Room_bbe8901c25e5'] = {
    name: 'Room_bbe8901c25e5',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":448,"exts":{},"template":"hgy"},{"x":256,"y":448,"exts":{},"template":"hgy"},{"x":320,"y":448,"exts":{},"template":"hgy"},{"x":512,"y":448,"exts":{},"template":"hgy"},{"x":704,"y":448,"exts":{},"template":"hgy"},{"x":704,"y":384,"exts":{},"template":"hgy"},{"x":704,"y":320,"exts":{},"template":"hgy"},{"x":704,"y":256,"exts":{},"template":"hgy"},{"x":704,"y":256,"exts":{},"template":"hgy"},{"x":704,"y":256,"exts":{},"template":"hgy"},{"x":704,"y":256,"exts":{},"template":"hgy"},{"x":704,"y":192,"exts":{},"template":"hgy"},{"x":704,"y":192,"exts":{},"template":"hgy"},{"x":704,"y":192,"exts":{},"template":"hgy"},{"x":704,"y":128,"exts":{},"template":"hgy"},{"x":704,"y":64,"exts":{},"template":"hgy"},{"x":704,"y":64,"exts":{},"template":"hgy"},{"x":704,"y":0,"exts":{},"template":"hgy"},{"x":640,"y":0,"exts":{},"template":"hgy"},{"x":576,"y":0,"exts":{},"template":"hgy"},{"x":576,"y":0,"exts":{},"template":"hgy"},{"x":512,"y":0,"exts":{},"template":"hgy"},{"x":384,"y":0,"exts":{},"template":"hgy"},{"x":448,"y":0,"exts":{},"template":"hgy"},{"x":320,"y":0,"exts":{},"template":"hgy"},{"x":256,"y":0,"exts":{},"template":"hgy"},{"x":192,"y":0,"exts":{},"template":"hgy"},{"x":128,"y":0,"exts":{},"template":"hgy"},{"x":64,"y":0,"exts":{},"template":"hgy"},{"x":64,"y":0,"exts":{},"template":"hgy"},{"x":0,"y":0,"exts":{},"template":"hgy"},{"x":0,"y":448,"exts":{},"template":"hgy"},{"x":192,"y":448,"exts":{},"template":"hgy"},{"x":192,"y":448,"exts":{},"template":"hgy"},{"x":256,"y":448,"exts":{},"template":"hgy"},{"x":320,"y":448,"exts":{},"template":"hgy"},{"x":64,"y":448,"exts":{},"template":"hgy"},{"x":64,"y":448,"exts":{},"template":"hgy"},{"x":128,"y":448,"exts":{},"template":"hgy"},{"x":192,"y":448,"exts":{},"template":"hgy"},{"x":256,"y":448,"exts":{},"template":"hgy"},{"x":320,"y":448,"exts":{},"template":"hgy"},{"x":384,"y":448,"exts":{},"template":"hgy"},{"x":448,"y":448,"exts":{},"template":"hgy"},{"x":512,"y":448,"exts":{},"template":"hgy"},{"x":704,"y":448,"exts":{},"template":"hgy"},{"x":-64,"y":448,"exts":{},"template":"hgy"},{"x":-64,"y":384,"exts":{},"template":"hgy"},{"x":-64,"y":384,"exts":{},"template":"hgy"},{"x":-64,"y":256,"exts":{},"template":"hgy"},{"x":-64,"y":320,"exts":{},"template":"hgy"},{"x":-64,"y":192,"exts":{},"template":"hgy"},{"x":-64,"y":128,"exts":{},"template":"hgy"},{"x":-64,"y":64,"exts":{},"template":"hgy"},{"x":0,"y":0,"exts":{},"template":"hgy"},{"x":-64,"y":0,"exts":{},"template":"hgy"},{"x":640,"y":320,"exts":{},"template":"pixi"},{"x":576,"y":320,"exts":{},"template":"pixi"},{"x":512,"y":320,"exts":{},"template":"pixi"},{"x":448,"y":320,"exts":{},"template":"pixi"},{"x":448,"y":320,"exts":{},"template":"pixi"},{"x":320,"y":320,"exts":{},"template":"pixi"},{"x":256,"y":320,"exts":{},"template":"pixi"},{"x":192,"y":320,"exts":{},"template":"pixi"},{"x":128,"y":320,"exts":{},"template":"pixi"},{"x":64,"y":320,"exts":{},"template":"pixi"},{"x":64,"y":320,"exts":{},"template":"pixi"},{"x":0,"y":320,"exts":{},"template":"pixi"},{"x":0,"y":256,"exts":{},"template":"pixi"},{"x":64,"y":256,"exts":{},"template":"pixi"},{"x":192,"y":256,"exts":{},"template":"pixi"},{"x":128,"y":256,"exts":{},"template":"pixi"},{"x":256,"y":256,"exts":{},"template":"pixi"},{"x":256,"y":256,"exts":{},"template":"pixi"},{"x":320,"y":256,"exts":{},"template":"pixi"},{"x":384,"y":256,"exts":{},"template":"pixi"},{"x":448,"y":256,"exts":{},"template":"pixi"},{"x":512,"y":256,"exts":{},"template":"pixi"},{"x":640,"y":256,"exts":{},"template":"pixi"},{"x":576,"y":256,"exts":{},"template":"pixi"},{"x":640,"y":192,"exts":{},"template":"pixi"},{"x":576,"y":192,"exts":{},"template":"pixi"},{"x":512,"y":192,"exts":{},"template":"pixi"},{"x":448,"y":192,"exts":{},"template":"pixi"},{"x":384,"y":192,"exts":{},"template":"pixi"},{"x":320,"y":192,"exts":{},"template":"pixi"},{"x":256,"y":192,"exts":{},"template":"pixi"},{"x":192,"y":192,"exts":{},"template":"pixi"},{"x":128,"y":192,"exts":{},"template":"pixi"},{"x":128,"y":192,"exts":{},"template":"pixi"},{"x":64,"y":192,"exts":{},"template":"pixi"},{"x":64,"y":192,"exts":{},"template":"pixi"},{"x":0,"y":192,"exts":{},"template":"pixi"},{"x":0,"y":128,"exts":{},"template":"pixi"},{"x":128,"y":128,"exts":{},"template":"pixi"},{"x":128,"y":128,"exts":{},"template":"pixi"},{"x":64,"y":128,"exts":{},"template":"pixi"},{"x":256,"y":128,"exts":{},"template":"pixi"},{"x":256,"y":128,"exts":{},"template":"pixi"},{"x":256,"y":128,"exts":{},"template":"pixi"},{"x":192,"y":128,"exts":{},"template":"pixi"},{"x":384,"y":128,"exts":{},"template":"pixi"},{"x":320,"y":128,"exts":{},"template":"pixi"},{"x":448,"y":256,"exts":{},"template":"pixi"},{"x":448,"y":128,"exts":{},"template":"pixi"},{"x":512,"y":128,"exts":{},"template":"pixi"},{"x":512,"y":128,"exts":{},"template":"pixi"},{"x":576,"y":128,"exts":{},"template":"pixi"},{"x":640,"y":128,"exts":{},"template":"pixi"},{"x":640,"y":64,"exts":{},"template":"pixi"},{"x":640,"y":64,"exts":{},"template":"pixi"},{"x":576,"y":64,"exts":{},"template":"pixi"},{"x":512,"y":64,"exts":{},"template":"pixi"},{"x":448,"y":64,"exts":{},"template":"pixi"},{"x":448,"y":64,"exts":{},"template":"pixi"},{"x":448,"y":64,"exts":{},"template":"pixi"},{"x":384,"y":64,"exts":{},"template":"pixi"},{"x":384,"y":64,"exts":{},"template":"pixi"},{"x":320,"y":64,"exts":{},"template":"pixi"},{"x":256,"y":64,"exts":{},"template":"pixi"},{"x":192,"y":64,"exts":{},"template":"pixi"},{"x":192,"y":64,"exts":{},"template":"pixi"},{"x":128,"y":64,"exts":{},"template":"pixi"},{"x":128,"y":64,"exts":{},"template":"pixi"},{"x":128,"y":64,"exts":{},"template":"pixi"},{"x":128,"y":64,"exts":{},"template":"pixi"},{"x":64,"y":64,"exts":{},"template":"pixi"},{"x":0,"y":64,"exts":{},"template":"pixi"},{"x":576,"y":448,"exts":{},"template":"hgy"},{"x":640,"y":448,"exts":{},"template":"hgy"},{"x":384,"y":320,"exts":{},"template":"pixi"},{"x":0,"y":384,"exts":{},"template":"pixi"},{"x":64,"y":384,"exts":{},"template":"pixi"},{"x":128,"y":384,"exts":{},"template":"pixi"},{"x":192,"y":384,"exts":{},"template":"pixi"},{"x":256,"y":384,"exts":{},"template":"pixi"},{"x":320,"y":384,"exts":{},"template":"pixi"},{"x":320,"y":384,"exts":{},"template":"pixi"},{"x":384,"y":384,"exts":{},"template":"pixi"},{"x":448,"y":384,"exts":{},"template":"pixi"},{"x":448,"y":384,"exts":{},"template":"pixi"},{"x":512,"y":384,"exts":{},"template":"pixi"},{"x":576,"y":384,"exts":{},"template":"pixi"},{"x":640,"y":384,"exts":{},"template":"pixi"},{"x":-64,"y":448,"exts":{},"template":"pixil-frame-0_(13)"},{"x":0,"y":448,"exts":{},"template":"pixil-frame-0_(13)"},{"x":64,"y":448,"exts":{},"template":"pixil-frame-0_(13)"},{"x":-64,"y":448,"exts":{},"template":"pixil-frame-0_(13)"},{"x":-64,"y":384,"exts":{},"template":"pixil-frame-0_(13)"},{"x":-64,"y":320,"exts":{},"template":"pixil-frame-0_(13)"},{"x":-64,"y":256,"exts":{},"template":"pixil-frame-0_(13)"},{"x":-64,"y":192,"exts":{},"template":"pixil-frame-0_(13)"},{"x":-64,"y":128,"exts":{},"template":"pixil-frame-0_(13)"},{"x":-64,"y":64,"exts":{},"template":"pixil-frame-0_(13)"},{"x":-64,"y":64,"exts":{},"template":"pixil-frame-0_(13)"},{"x":-64,"y":0,"exts":{},"template":"pixil-frame-0_(13)"},{"x":0,"y":0,"exts":{},"template":"pixil-frame-0_(13)"},{"x":64,"y":0,"exts":{},"template":"pixil-frame-0_(13)"},{"x":128,"y":0,"exts":{},"template":"pixil-frame-0_(13)"},{"x":192,"y":0,"exts":{},"template":"pixil-frame-0_(13)"},{"x":256,"y":0,"exts":{},"template":"pixil-frame-0_(13)"},{"x":320,"y":0,"exts":{},"template":"pixil-frame-0_(13)"},{"x":384,"y":0,"exts":{},"template":"pixil-frame-0_(13)"},{"x":448,"y":0,"exts":{},"template":"pixil-frame-0_(13)"},{"x":512,"y":0,"exts":{},"template":"pixil-frame-0_(13)"},{"x":576,"y":0,"exts":{},"template":"pixil-frame-0_(13)"},{"x":640,"y":0,"exts":{},"template":"pixil-frame-0_(13)"},{"x":704,"y":0,"exts":{},"template":"pixil-frame-0_(13)"},{"x":704,"y":64,"exts":{},"template":"pixil-frame-0_(13)"},{"x":128,"y":448,"exts":{},"template":"pixil-frame-0_(13)"},{"x":192,"y":448,"exts":{},"template":"pixil-frame-0_(13)"},{"x":256,"y":448,"exts":{},"template":"pixil-frame-0_(13)"},{"x":320,"y":448,"exts":{},"template":"pixil-frame-0_(13)"},{"x":384,"y":448,"exts":{},"template":"pixil-frame-0_(13)"},{"x":448,"y":448,"exts":{},"template":"pixil-frame-0_(13)"},{"x":512,"y":448,"exts":{},"template":"pixil-frame-0_(13)"},{"x":576,"y":448,"exts":{},"template":"pixil-frame-0_(13)"},{"x":640,"y":448,"exts":{},"template":"pixil-frame-0_(13)"},{"x":704,"y":448,"exts":{},"template":"pixil-frame-0_(13)"},{"x":704,"y":384,"exts":{},"template":"pixil-frame-0_(13)"},{"x":704,"y":320,"exts":{},"template":"pixil-frame-0_(13)"},{"x":704,"y":256,"exts":{},"template":"pixil-frame-0_(13)"},{"x":704,"y":192,"exts":{},"template":"pixil-frame-0_(13)"},{"x":704,"y":128,"exts":{},"template":"pixil-frame-0_(13)"},{"x":0,"y":384,"exts":{},"template":"pixil-frame-0_(14)"},{"x":0,"y":320,"exts":{},"template":"pixil-frame-0_(14)"},{"x":0,"y":320,"exts":{},"template":"pixil-frame-0_(14)"},{"x":0,"y":256,"exts":{},"template":"pixil-frame-0_(14)"},{"x":0,"y":192,"exts":{},"template":"pixil-frame-0_(14)"},{"x":0,"y":128,"exts":{},"template":"pixil-frame-0_(14)"},{"x":0,"y":64,"exts":{},"template":"pixil-frame-0_(14)"},{"x":64,"y":64,"exts":{},"template":"pixil-frame-0_(14)"},{"x":128,"y":64,"exts":{},"template":"pixil-frame-0_(14)"},{"x":192,"y":64,"exts":{},"template":"pixil-frame-0_(14)"},{"x":256,"y":64,"exts":{},"template":"pixil-frame-0_(14)"},{"x":320,"y":64,"exts":{},"template":"pixil-frame-0_(14)"},{"x":320,"y":64,"exts":{},"template":"pixil-frame-0_(14)"},{"x":384,"y":64,"exts":{},"template":"pixil-frame-0_(14)"},{"x":384,"y":64,"exts":{},"template":"pixil-frame-0_(14)"},{"x":448,"y":64,"exts":{},"template":"pixil-frame-0_(14)"},{"x":512,"y":64,"exts":{},"template":"pixil-frame-0_(14)"},{"x":576,"y":64,"exts":{},"template":"pixil-frame-0_(14)"},{"x":640,"y":64,"exts":{},"template":"pixil-frame-0_(14)"},{"x":640,"y":128,"exts":{},"template":"pixil-frame-0_(14)"},{"x":640,"y":192,"exts":{},"template":"pixil-frame-0_(14)"},{"x":640,"y":256,"exts":{},"template":"pixil-frame-0_(14)"},{"x":640,"y":320,"exts":{},"template":"pixil-frame-0_(14)"},{"x":640,"y":384,"exts":{},"template":"pixil-frame-0_(14)"},{"x":576,"y":384,"exts":{},"template":"pixil-frame-0_(14)"},{"x":512,"y":384,"exts":{},"template":"pixil-frame-0_(14)"},{"x":448,"y":384,"exts":{},"template":"pixil-frame-0_(14)"},{"x":384,"y":384,"exts":{},"template":"pixil-frame-0_(14)"},{"x":384,"y":384,"exts":{},"template":"pixil-frame-0_(14)"},{"x":320,"y":384,"exts":{},"template":"pixil-frame-0_(14)"},{"x":256,"y":384,"exts":{},"template":"pixil-frame-0_(14)"},{"x":256,"y":384,"exts":{},"template":"pixil-frame-0_(14)"},{"x":192,"y":384,"exts":{},"template":"pixil-frame-0_(14)"},{"x":128,"y":384,"exts":{},"template":"pixil-frame-0_(14)"},{"x":64,"y":384,"exts":{},"template":"pixil-frame-0_(14)"},{"x":64,"y":320,"exts":{},"template":"pixil-frame-0_(14)"},{"x":128,"y":256,"exts":{},"template":"pixil-frame-0_(14)"},{"x":64,"y":256,"exts":{},"template":"pixil-frame-0_(14)"},{"x":64,"y":192,"exts":{},"template":"pixil-frame-0_(14)"},{"x":64,"y":128,"exts":{},"template":"pixil-frame-0_(14)"},{"x":128,"y":128,"exts":{},"template":"pixil-frame-0_(14)"},{"x":128,"y":192,"exts":{},"template":"pixil-frame-0_(14)"},{"x":128,"y":320,"exts":{},"template":"pixil-frame-0_(14)"},{"x":256,"y":320,"exts":{},"template":"pixil-frame-0_(14)"},{"x":192,"y":320,"exts":{},"template":"pixil-frame-0_(14)"},{"x":192,"y":256,"exts":{},"template":"pixil-frame-0_(14)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(14)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(14)"},{"x":256,"y":128,"exts":{},"template":"pixil-frame-0_(14)"},{"x":192,"y":128,"exts":{},"template":"pixil-frame-0_(14)"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(14)"},{"x":256,"y":192,"exts":{},"template":"pixil-frame-0_(14)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(14)"},{"x":320,"y":128,"exts":{},"template":"pixil-frame-0_(14)"},{"x":384,"y":128,"exts":{},"template":"pixil-frame-0_(14)"},{"x":448,"y":128,"exts":{},"template":"pixil-frame-0_(14)"},{"x":512,"y":128,"exts":{},"template":"pixil-frame-0_(14)"},{"x":576,"y":128,"exts":{},"template":"pixil-frame-0_(14)"},{"x":576,"y":192,"exts":{},"template":"pixil-frame-0_(14)"},{"x":512,"y":192,"exts":{},"template":"pixil-frame-0_(14)"},{"x":448,"y":192,"exts":{},"template":"pixil-frame-0_(14)"},{"x":384,"y":192,"exts":{},"template":"pixil-frame-0_(14)"},{"x":384,"y":256,"exts":{},"template":"pixil-frame-0_(14)"},{"x":320,"y":256,"exts":{},"template":"pixil-frame-0_(14)"},{"x":320,"y":256,"exts":{},"template":"pixil-frame-0_(14)"},{"x":320,"y":320,"exts":{},"template":"pixil-frame-0_(14)"},{"x":384,"y":320,"exts":{},"template":"pixil-frame-0_(14)"},{"x":448,"y":320,"exts":{},"template":"pixil-frame-0_(14)"},{"x":576,"y":320,"exts":{},"template":"pixil-frame-0_(14)"},{"x":512,"y":320,"exts":{},"template":"pixil-frame-0_(14)"},{"x":512,"y":320,"exts":{},"template":"pixil-frame-0_(14)"},{"x":448,"y":256,"exts":{},"template":"pixil-frame-0_(14)"},{"x":512,"y":256,"exts":{},"template":"pixil-frame-0_(14)"},{"x":640,"y":256,"exts":{},"template":"pixil-frame-0_(14)"},{"x":576,"y":256,"exts":{},"template":"pixil-frame-0_(14)"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['Room_007bbd38e058'] = {
    name: 'Room_007bbd38e058',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":512,"exts":{},"template":"trawa"},{"x":64,"y":512,"exts":{},"template":"trawa"},{"x":192,"y":512,"exts":{},"template":"trawa"},{"x":128,"y":512,"exts":{},"template":"trawa"},{"x":256,"y":512,"exts":{},"template":"trawa"},{"x":320,"y":512,"exts":{},"template":"trawa"},{"x":384,"y":512,"exts":{},"template":"trawa"},{"x":512,"y":512,"exts":{},"template":"trawa"},{"x":448,"y":512,"exts":{},"template":"trawa"},{"x":576,"y":512,"exts":{},"template":"trawa"},{"x":640,"y":512,"exts":{},"template":"trawa"},{"x":832,"y":512,"exts":{},"template":"trawa"},{"x":896,"y":512,"exts":{},"template":"trawa"},{"x":-64,"y":512,"exts":{},"template":"trawa"},{"x":-128,"y":512,"exts":{},"template":"trawa"},{"x":256,"y":448,"exts":{},"template":"ned"},{"x":320,"y":448,"exts":{},"template":"ned"},{"x":384,"y":448,"exts":{},"template":"ned"},{"x":448,"y":448,"exts":{},"template":"ned"},{"x":256,"y":448,"exts":{},"template":"ned"},{"x":256,"y":384,"exts":{},"template":"ned"},{"x":320,"y":384,"exts":{},"template":"ned"},{"x":384,"y":448,"exts":{},"template":"ned"},{"x":448,"y":384,"exts":{},"template":"ned"},{"x":384,"y":384,"exts":{},"template":"ned"},{"x":512,"y":448,"exts":{},"template":"ned"},{"x":512,"y":448,"exts":{},"template":"ned"},{"x":576,"y":448,"exts":{},"template":"ned"},{"x":256,"y":448,"exts":{},"template":"ned"},{"x":192,"y":448,"exts":{},"template":"ned"},{"x":192,"y":448,"exts":{},"template":"ned"},{"x":448,"y":320,"exts":{},"template":"o0p"},{"x":384,"y":320,"exts":{},"template":"o0p"},{"x":320,"y":320,"exts":{},"template":"o0p"},{"x":320,"y":320,"exts":{},"template":"pixil-frame-0_(5)"},{"x":384,"y":320,"exts":{},"template":"pixil-frame-0_(5)"},{"x":448,"y":320,"exts":{},"template":"pixil-frame-0_(5)"},{"x":256,"y":320,"exts":{},"template":"pixil-frame-0_(5)"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(5)"},{"x":256,"y":192,"exts":{},"template":"pixil-frame-0_(5)"},{"x":256,"y":128,"exts":{},"template":"pixil-frame-0_(5)"},{"x":256,"y":64,"exts":{},"template":"pixil-frame-0_(5)"},{"x":320,"y":64,"exts":{},"template":"pixil-frame-0_(5)"},{"x":384,"y":64,"exts":{},"template":"pixil-frame-0_(5)"},{"x":448,"y":64,"exts":{},"template":"pixil-frame-0_(5)"},{"x":448,"y":128,"exts":{},"template":"pixil-frame-0_(5)"},{"x":448,"y":256,"exts":{},"template":"pixil-frame-0_(5)"},{"x":448,"y":256,"exts":{},"template":"pixil-frame-0_(5)"},{"x":448,"y":192,"exts":{},"template":"pixil-frame-0_(5)"},{"x":192,"y":384,"exts":{},"template":"ned"},{"x":64,"y":448,"exts":{},"template":"ned"},{"x":64,"y":512,"exts":{},"template":"ned"},{"x":0,"y":512,"exts":{},"template":"ned"},{"x":128,"y":512,"exts":{},"template":"ned"},{"x":256,"y":512,"exts":{},"template":"ned"},{"x":192,"y":512,"exts":{},"template":"ned"},{"x":320,"y":512,"exts":{},"template":"ned"},{"x":384,"y":512,"exts":{},"template":"ned"},{"x":448,"y":512,"exts":{},"template":"ned"},{"x":448,"y":512,"exts":{},"template":"ned"},{"x":512,"y":512,"exts":{},"template":"ned"},{"x":576,"y":512,"exts":{},"template":"ned"},{"x":640,"y":512,"exts":{},"template":"ned"},{"x":768,"y":512,"exts":{},"template":"ned"},{"x":576,"y":384,"exts":{},"template":"ned"},{"x":640,"y":448,"exts":{},"template":"ned"},{"x":128,"y":448,"exts":{},"template":"lava2-top"},{"x":512,"y":384,"exts":{},"template":"lava2-top"},{"x":320,"y":256,"exts":{},"template":"pixil-frame-0_(44)"},{"x":384,"y":256,"exts":{},"template":"pixil-frame-0_(44)"},{"x":384,"y":256,"exts":{},"template":"pixil-frame-0_(44)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(44)"},{"x":384,"y":192,"exts":{},"template":"pixil-frame-0_(44)"},{"x":384,"y":128,"exts":{},"template":"pixil-frame-0_(44)"},{"x":384,"y":128,"exts":{},"template":"pixil-frame-0_(44)"},{"x":320,"y":128,"exts":{},"template":"pixil-frame-0_(44)"},{"x":-192,"y":512,"exts":{},"template":"trawa"},{"x":-256,"y":512,"exts":{},"template":"trawa"},{"x":-320,"y":512,"exts":{},"template":"trawa"},{"x":-384,"y":512,"exts":{},"template":"trawa"},{"x":-448,"y":512,"exts":{},"template":"trawa"},{"x":-512,"y":512,"exts":{},"template":"trawa"},{"x":-512,"y":512,"exts":{},"template":"trawa"},{"x":960,"y":512,"exts":{},"template":"trawa"},{"x":1024,"y":512,"exts":{},"template":"trawa"},{"x":1088,"y":512,"exts":{},"template":"trawa"},{"x":1088,"y":512,"exts":{},"template":"trawa"},{"x":1152,"y":512,"exts":{},"template":"trawa"},{"x":1216,"y":512,"exts":{},"template":"trawa"},{"x":1280,"y":512,"exts":{},"template":"trawa"},{"x":-576,"y":512,"exts":{},"template":"trawa"},{"x":-512,"y":576,"exts":{},"template":"skała"},{"x":-448,"y":576,"exts":{},"template":"skała"},{"x":-320,"y":576,"exts":{},"template":"skała"},{"x":-384,"y":576,"exts":{},"template":"skała"},{"x":-256,"y":576,"exts":{},"template":"skała"},{"x":-128,"y":576,"exts":{},"template":"skała"},{"x":-192,"y":576,"exts":{},"template":"skała"},{"x":-64,"y":576,"exts":{},"template":"skała"},{"x":0,"y":576,"exts":{},"template":"skała"},{"x":64,"y":576,"exts":{},"template":"skała"},{"x":128,"y":576,"exts":{},"template":"skała"},{"x":192,"y":576,"exts":{},"template":"skała"},{"x":256,"y":576,"exts":{},"template":"skała"},{"x":384,"y":640,"exts":{},"template":"skała"},{"x":320,"y":576,"exts":{},"template":"skała"},{"x":384,"y":576,"exts":{},"template":"skała"},{"x":448,"y":576,"exts":{},"template":"skała"},{"x":576,"y":576,"exts":{},"template":"skała"},{"x":640,"y":576,"exts":{},"template":"skała"},{"x":704,"y":576,"exts":{},"template":"skała"},{"x":768,"y":576,"exts":{},"template":"skała"},{"x":512,"y":640,"exts":{},"template":"skała"},{"x":512,"y":576,"exts":{},"template":"skała"},{"x":512,"y":640,"exts":{},"template":"skała"},{"x":512,"y":640,"exts":{},"template":"skała"},{"x":448,"y":640,"exts":{},"template":"skała"},{"x":576,"y":640,"exts":{},"template":"skała"},{"x":704,"y":640,"exts":{},"template":"skała"},{"x":640,"y":640,"exts":{},"template":"skała"},{"x":768,"y":640,"exts":{},"template":"skała"},{"x":384,"y":640,"exts":{},"template":"skała"},{"x":256,"y":640,"exts":{},"template":"skała"},{"x":384,"y":640,"exts":{},"template":"skała"},{"x":192,"y":640,"exts":{},"template":"skała"},{"x":320,"y":640,"exts":{},"template":"skała"},{"x":128,"y":640,"exts":{},"template":"skała"},{"x":64,"y":640,"exts":{},"template":"skała"},{"x":0,"y":640,"exts":{},"template":"skała"},{"x":-64,"y":640,"exts":{},"template":"skała"},{"x":-64,"y":640,"exts":{},"template":"skała"},{"x":-128,"y":640,"exts":{},"template":"skała"},{"x":-192,"y":640,"exts":{},"template":"skała"},{"x":-192,"y":640,"exts":{},"template":"skała"},{"x":-256,"y":640,"exts":{},"template":"skała"},{"x":-320,"y":640,"exts":{},"template":"skała"},{"x":-384,"y":640,"exts":{},"template":"skała"},{"x":-448,"y":640,"exts":{},"template":"skała"},{"x":-512,"y":640,"exts":{},"template":"skała"},{"x":-512,"y":640,"exts":{},"template":"skała"},{"x":-512,"y":640,"exts":{},"template":"skała"},{"x":-576,"y":640,"exts":{},"template":"skała"},{"x":-512,"y":576,"exts":{},"template":"skała"},{"x":-576,"y":576,"exts":{},"template":"skała"},{"x":832,"y":576,"exts":{},"template":"skała"},{"x":960,"y":576,"exts":{},"template":"skała"},{"x":896,"y":576,"exts":{},"template":"skała"},{"x":1024,"y":576,"exts":{},"template":"skała"},{"x":1152,"y":576,"exts":{},"template":"skała"},{"x":1088,"y":576,"exts":{},"template":"skała"},{"x":1152,"y":576,"exts":{},"template":"skała"},{"x":1216,"y":576,"exts":{},"template":"skała"},{"x":1280,"y":576,"exts":{},"template":"skała"},{"x":1344,"y":640,"exts":{},"template":"skała"},{"x":1344,"y":640,"exts":{},"template":"skała"},{"x":1280,"y":640,"exts":{},"template":"skała"},{"x":1280,"y":640,"exts":{},"template":"skała"},{"x":1216,"y":640,"exts":{},"template":"skała"},{"x":1152,"y":640,"exts":{},"template":"skała"},{"x":1088,"y":640,"exts":{},"template":"skała"},{"x":1024,"y":640,"exts":{},"template":"skała"},{"x":960,"y":640,"exts":{},"template":"skała"},{"x":896,"y":640,"exts":{},"template":"skała"},{"x":896,"y":640,"exts":{},"template":"skała"},{"x":832,"y":640,"exts":{},"template":"skała"},{"x":704,"y":512,"exts":{},"template":"lava2-top"},{"x":-64,"y":512,"exts":{},"template":"ned"},{"x":-128,"y":576,"exts":{},"template":"ned"},{"x":-64,"y":576,"exts":{},"template":"ned"},{"x":64,"y":576,"exts":{},"template":"ned"},{"x":0,"y":576,"exts":{},"template":"ned"},{"x":128,"y":576,"exts":{},"template":"ned"},{"x":192,"y":576,"exts":{},"template":"ned"},{"x":192,"y":576,"exts":{},"template":"ned"},{"x":256,"y":576,"exts":{},"template":"ned"},{"x":320,"y":576,"exts":{},"template":"ned"},{"x":384,"y":576,"exts":{},"template":"ned"},{"x":448,"y":576,"exts":{},"template":"ned"},{"x":512,"y":576,"exts":{},"template":"ned"},{"x":640,"y":576,"exts":{},"template":"ned"},{"x":576,"y":576,"exts":{},"template":"ned"},{"x":640,"y":576,"exts":{},"template":"ned"},{"x":704,"y":576,"exts":{},"template":"ned"},{"x":768,"y":576,"exts":{},"template":"ned"},{"x":832,"y":640,"exts":{},"template":"ned"},{"x":832,"y":640,"exts":{},"template":"ned"},{"x":768,"y":640,"exts":{},"template":"ned"},{"x":896,"y":640,"exts":{},"template":"ned"},{"x":704,"y":640,"exts":{},"template":"ned"},{"x":640,"y":640,"exts":{},"template":"ned"},{"x":576,"y":640,"exts":{},"template":"ned"},{"x":512,"y":640,"exts":{},"template":"ned"},{"x":448,"y":640,"exts":{},"template":"ned"},{"x":384,"y":640,"exts":{},"template":"ned"},{"x":256,"y":640,"exts":{},"template":"ned"},{"x":384,"y":640,"exts":{},"template":"ned"},{"x":384,"y":640,"exts":{},"template":"ned"},{"x":320,"y":640,"exts":{},"template":"ned"},{"x":192,"y":640,"exts":{},"template":"ned"},{"x":64,"y":640,"exts":{},"template":"ned"},{"x":128,"y":640,"exts":{},"template":"ned"},{"x":0,"y":640,"exts":{},"template":"ned"},{"x":-64,"y":640,"exts":{},"template":"ned"},{"x":-128,"y":640,"exts":{},"template":"ned"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['Room_2904b4be171a'] = {
    name: 'Room_2904b4be171a',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['Room_6e93f2436403'] = {
    name: 'Room_6e93f2436403',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['Room_bf64aab57cce'] = {
    name: 'Room_bf64aab57cce',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":128,"y":448,"exts":{},"template":"pixil-frame-0_(5)"},{"x":192,"y":448,"exts":{},"template":"pixil-frame-0_(5)"},{"x":256,"y":448,"exts":{},"template":"pixil-frame-0_(5)"},{"x":320,"y":448,"exts":{},"template":"pixil-frame-0_(5)"},{"x":320,"y":384,"exts":{},"template":"pixil-frame-0_(5)"},{"x":320,"y":384,"exts":{},"template":"pixil-frame-0_(5)"},{"x":320,"y":320,"exts":{},"template":"pixil-frame-0_(5)"},{"x":320,"y":256,"exts":{},"template":"pixil-frame-0_(5)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(5)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(5)"},{"x":256,"y":192,"exts":{},"template":"pixil-frame-0_(5)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(5)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(5)"},{"x":128,"y":192,"exts":{},"template":"pixil-frame-0_(5)"},{"x":128,"y":256,"exts":{},"template":"pixil-frame-0_(5)"},{"x":128,"y":320,"exts":{},"template":"pixil-frame-0_(5)"},{"x":128,"y":384,"exts":{},"template":"pixil-frame-0_(5)"},{"x":256,"y":320,"exts":{},"template":"pixil-frame-0_(44)"},{"x":192,"y":320,"exts":{},"template":"pixil-frame-0_(44)"},{"x":192,"y":384,"exts":{},"template":"pixil-frame-0_(44)"},{"x":256,"y":384,"exts":{},"template":"pixil-frame-0_(44)"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(44)"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(44)"},{"x":192,"y":256,"exts":{},"template":"pixil-frame-0_(44)"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['Room_3c3e1acc6c64'] = {
    name: 'Room_3c3e1acc6c64',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":128,"y":192,"exts":{},"template":"pixil-frame-0_(66)"},{"x":128,"y":256,"exts":{},"template":"pixil-frame-0_(66)"},{"x":128,"y":320,"exts":{},"template":"pixil-frame-0_(66)"},{"x":384,"y":320,"exts":{},"template":"pixil-frame-0_(66)"},{"x":384,"y":256,"exts":{},"template":"pixil-frame-0_(66)"},{"x":384,"y":192,"exts":{},"template":"pixil-frame-0_(66)"},{"x":192,"y":384,"exts":{},"template":"pixil-frame-0_(67)"},{"x":256,"y":384,"exts":{},"template":"pixil-frame-0_(67)"},{"x":320,"y":384,"exts":{},"template":"pixil-frame-0_(67)"},{"x":320,"y":128,"exts":{},"template":"pixil-frame-0_(67)"},{"x":320,"y":128,"exts":{},"template":"pixil-frame-0_(67)"},{"x":256,"y":128,"exts":{},"template":"pixil-frame-0_(67)"},{"x":192,"y":128,"exts":{},"template":"pixil-frame-0_(67)"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(68)"},{"x":192,"y":320,"exts":{},"template":"pixil-frame-0_(68)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(68)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(68)"},{"x":320,"y":320,"exts":{},"template":"pixil-frame-0_(68)"},{"x":256,"y":320,"exts":{},"template":"pixil-frame-0_(68)"},{"x":320,"y":320,"exts":{},"template":"pixil-frame-0_(68)"},{"x":320,"y":256,"exts":{},"template":"pixil-frame-0_(68)"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(68)"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(68)"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(68)"},{"x":256,"y":192,"exts":{},"template":"pixil-frame-0_(68)"},{"x":192,"y":256,"exts":{},"template":"pixil-frame-0_(68)"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"pixil-frame-0_(63)","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['Room_d56e8625b056'] = {
    name: 'Room_d56e8625b056',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['Room_c5e4317a2636'] = {
    name: 'Room_c5e4317a2636',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['wyspa_dywan'] = {
    name: 'wyspa_dywan',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":192,"y":512,"exts":{},"template":"trawa2"},{"x":256,"y":512,"exts":{},"template":"trawa2"},{"x":320,"y":512,"exts":{},"template":"trawa2"},{"x":448,"y":512,"exts":{},"template":"trawa2"},{"x":448,"y":512,"exts":{},"template":"trawa2"},{"x":384,"y":512,"exts":{},"template":"trawa2"},{"x":512,"y":512,"exts":{},"template":"trawa2"},{"x":576,"y":512,"exts":{},"template":"trawa2"},{"x":256,"y":448,"exts":{},"template":"trawa2"},{"x":320,"y":512,"exts":{},"template":"trawa2"},{"x":320,"y":448,"exts":{},"template":"trawa2"},{"x":384,"y":448,"exts":{},"template":"trawa2"},{"x":448,"y":448,"exts":{},"template":"trawa2"},{"x":512,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":512,"exts":{},"template":"trawa2"},{"x":704,"y":512,"exts":{},"template":"trawa2"},{"x":192,"y":512,"exts":{},"template":"trawa2"},{"x":128,"y":512,"exts":{},"template":"trawa2"},{"x":64,"y":512,"exts":{},"template":"trawa2"},{"x":64,"y":576,"exts":{},"template":"trawa2"},{"x":0,"y":512,"exts":{},"template":"trawa2"},{"x":0,"y":576,"exts":{},"template":"trawa2"},{"x":128,"y":576,"exts":{},"template":"trawa2"},{"x":192,"y":576,"exts":{},"template":"trawa2"},{"x":256,"y":576,"exts":{},"template":"trawa2"},{"x":320,"y":576,"exts":{},"template":"trawa2"},{"x":384,"y":576,"exts":{},"template":"trawa2"},{"x":448,"y":576,"exts":{},"template":"trawa2"},{"x":576,"y":576,"exts":{},"template":"trawa2"},{"x":512,"y":576,"exts":{},"template":"trawa2"},{"x":640,"y":576,"exts":{},"template":"trawa2"},{"x":704,"y":576,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":448,"exts":{},"template":"trawa2"},{"x":576,"y":448,"exts":{},"template":"trawa2"},{"x":64,"y":512,"exts":{},"template":"trawa2"},{"x":0,"y":448,"exts":{},"template":"trawa2"},{"x":64,"y":448,"exts":{},"template":"trawa2"},{"x":128,"y":448,"exts":{},"template":"trawa2"},{"x":192,"y":448,"exts":{},"template":"trawa2"},{"x":64,"y":448,"exts":{},"template":"trawa2"},{"x":128,"y":384,"exts":{},"template":"trawa2"},{"x":64,"y":384,"exts":{},"template":"trawa2"},{"x":320,"y":384,"exts":{},"template":"trawa2"},{"x":256,"y":384,"exts":{},"template":"trawa2"},{"x":384,"y":384,"exts":{},"template":"trawa2"},{"x":448,"y":384,"exts":{},"template":"trawa2"},{"x":512,"y":384,"exts":{},"template":"trawa2"},{"x":576,"y":384,"exts":{},"template":"trawa2"},{"x":640,"y":384,"exts":{},"template":"trawa2"},{"x":768,"y":512,"exts":{},"template":"trawa2"},{"x":768,"y":576,"exts":{},"template":"trawa2"},{"x":-64,"y":576,"exts":{},"template":"trawa2"},{"x":-64,"y":512,"exts":{},"template":"trawa2"},{"x":-128,"y":576,"exts":{},"template":"piach d"},{"x":-192,"y":576,"exts":{},"template":"piach d"},{"x":-256,"y":576,"exts":{},"template":"piach d"},{"x":-320,"y":576,"exts":{},"template":"piach d"},{"x":-128,"y":576,"exts":{},"template":"piach d"},{"x":-128,"y":512,"exts":{},"template":"piach d"},{"x":-192,"y":512,"exts":{},"template":"piach d"},{"x":832,"y":576,"exts":{},"template":"piach d"},{"x":832,"y":512,"exts":{},"template":"piach d"},{"x":896,"y":576,"exts":{},"template":"piach d"},{"x":960,"y":576,"exts":{},"template":"piach d"},{"x":896,"y":512,"exts":{},"template":"piach d"},{"x":1024,"y":576,"exts":{},"template":"piach d"},{"x":1152,"y":576,"exts":{},"template":"piach d"},{"x":1088,"y":576,"exts":{},"template":"piach d"},{"x":1216,"y":640,"exts":{},"template":"piach d"},{"x":1280,"y":640,"exts":{},"template":"piach d"},{"x":1344,"y":640,"exts":{},"template":"piach d"},{"x":1408,"y":640,"exts":{},"template":"piach d"},{"x":1536,"y":640,"exts":{},"template":"piach d"},{"x":1472,"y":640,"exts":{},"template":"piach d"},{"x":1600,"y":640,"exts":{},"template":"piach d"},{"x":-384,"y":576,"exts":{},"template":"piach d"},{"x":-512,"y":640,"exts":{},"template":"piach d"},{"x":-640,"y":640,"exts":{},"template":"piach d"},{"x":-576,"y":640,"exts":{},"template":"piach d"},{"x":-832,"y":640,"exts":{},"template":"piach d"},{"x":-704,"y":640,"exts":{},"template":"piach d"},{"x":-768,"y":640,"exts":{},"template":"piach d"},{"x":-320,"y":640,"exts":{},"template":"piach d"},{"x":-320,"y":640,"exts":{},"template":"piach d"},{"x":-384,"y":640,"exts":{},"template":"piach d"},{"x":-256,"y":640,"exts":{},"template":"piach d"},{"x":-192,"y":640,"exts":{},"template":"piach d"},{"x":-128,"y":640,"exts":{},"template":"piach d"},{"x":1152,"y":640,"exts":{},"template":"piach d"},{"x":1088,"y":640,"exts":{},"template":"piach d"},{"x":1024,"y":640,"exts":{},"template":"piach d"},{"x":1024,"y":640,"exts":{},"template":"piach d"},{"x":960,"y":640,"exts":{},"template":"piach d"},{"x":896,"y":640,"exts":{},"template":"piach d"},{"x":896,"y":640,"exts":{},"template":"piach d"},{"x":832,"y":640,"exts":{},"template":"piach d"},{"x":768,"y":640,"exts":{},"template":"piach d"},{"x":704,"y":640,"exts":{},"template":"piach d"},{"x":640,"y":640,"exts":{},"template":"piach d"},{"x":576,"y":640,"exts":{},"template":"piach d"},{"x":512,"y":640,"exts":{},"template":"piach d"},{"x":0,"y":640,"exts":{},"template":"trawa2"},{"x":-64,"y":640,"exts":{},"template":"trawa2"},{"x":-128,"y":640,"exts":{},"template":"trawa2"},{"x":64,"y":640,"exts":{},"template":"trawa2"},{"x":128,"y":640,"exts":{},"template":"trawa2"},{"x":192,"y":640,"exts":{},"template":"trawa2"},{"x":256,"y":640,"exts":{},"template":"trawa2"},{"x":320,"y":640,"exts":{},"template":"trawa2"},{"x":384,"y":640,"exts":{},"template":"trawa2"},{"x":448,"y":640,"exts":{},"template":"trawa2"},{"x":576,"y":640,"exts":{},"template":"trawa2"},{"x":576,"y":640,"exts":{},"template":"trawa2"},{"x":512,"y":640,"exts":{},"template":"trawa2"},{"x":704,"y":640,"exts":{},"template":"trawa2"},{"x":640,"y":640,"exts":{},"template":"trawa2"},{"x":768,"y":640,"exts":{},"template":"trawa2"},{"x":832,"y":640,"exts":{},"template":"trawa2"},{"x":-832,"y":576,"exts":{},"template":"Water"},{"x":-704,"y":576,"exts":{},"template":"Water"},{"x":-768,"y":576,"exts":{},"template":"Water"},{"x":-640,"y":576,"exts":{},"template":"Water"},{"x":-832,"y":512,"exts":{},"template":"Water"},{"x":-832,"y":512,"exts":{},"template":"Water"},{"x":-832,"y":512,"exts":{},"template":"Water"},{"x":-704,"y":512,"exts":{},"template":"Water"},{"x":-768,"y":512,"exts":{},"template":"Water"},{"x":-640,"y":512,"exts":{},"template":"Water"},{"x":-384,"y":512,"exts":{},"template":"Water"},{"x":-320,"y":512,"exts":{},"template":"Water"},{"x":1024,"y":512,"exts":{},"template":"Water"},{"x":960,"y":512,"exts":{},"template":"Water"},{"x":1088,"y":512,"exts":{},"template":"Water"},{"x":1216,"y":512,"exts":{},"template":"Water"},{"x":1152,"y":512,"exts":{},"template":"Water"},{"x":1280,"y":512,"exts":{},"template":"Water"},{"x":1344,"y":512,"exts":{},"template":"Water"},{"x":1408,"y":512,"exts":{},"template":"Water"},{"x":1536,"y":512,"exts":{},"template":"Water"},{"x":1472,"y":512,"exts":{},"template":"Water"},{"x":1600,"y":512,"exts":{},"template":"Water"},{"x":1600,"y":576,"exts":{},"template":"Water"},{"x":1536,"y":576,"exts":{},"template":"Water"},{"x":1536,"y":576,"exts":{},"template":"Water"},{"x":1472,"y":576,"exts":{},"template":"Water"},{"x":1408,"y":576,"exts":{},"template":"Water"},{"x":1344,"y":576,"exts":{},"template":"Water"},{"x":1280,"y":576,"exts":{},"template":"Water"},{"x":1280,"y":576,"exts":{},"template":"Water"},{"x":1216,"y":576,"exts":{},"template":"Water"},{"x":1024,"y":576,"exts":{},"template":"Water"},{"x":960,"y":576,"exts":{},"template":"Water"},{"x":1024,"y":640,"exts":{},"template":"Water"},{"x":960,"y":640,"exts":{},"template":"Water"},{"x":1088,"y":640,"exts":{},"template":"Water"},{"x":1088,"y":576,"exts":{},"template":"Water"},{"x":1152,"y":576,"exts":{},"template":"Water"},{"x":1152,"y":640,"exts":{},"template":"Water"},{"x":-192,"y":640,"exts":{},"template":"piach d"},{"x":-256,"y":576,"exts":{},"template":"piach d"},{"x":960,"y":640,"exts":{},"template":"piach d"},{"x":960,"y":576,"exts":{},"template":"piach d"},{"x":1024,"y":576,"exts":{},"template":"piach d"},{"x":960,"y":512,"exts":{},"template":"piach d"},{"x":1024,"y":576,"exts":{},"template":"Water"},{"x":1280,"y":640,"exts":{},"template":"Water"},{"x":1280,"y":640,"exts":{},"template":"Water"},{"x":1216,"y":640,"exts":{},"template":"Water"},{"x":1344,"y":640,"exts":{},"template":"Water"},{"x":1344,"y":640,"exts":{},"template":"Water"},{"x":1472,"y":640,"exts":{},"template":"Water"},{"x":1536,"y":640,"exts":{},"template":"Water"},{"x":1600,"y":640,"exts":{},"template":"Water"},{"x":1408,"y":640,"exts":{},"template":"Water"},{"x":-320,"y":576,"exts":{},"template":"Water"},{"x":-384,"y":576,"exts":{},"template":"Water"},{"x":-320,"y":640,"exts":{},"template":"Water"},{"x":-384,"y":640,"exts":{},"template":"Water"},{"x":-384,"y":640,"exts":{},"template":"Water"},{"x":-512,"y":640,"exts":{},"template":"Water"},{"x":-576,"y":640,"exts":{},"template":"Water"},{"x":-576,"y":640,"exts":{},"template":"Water"},{"x":-640,"y":640,"exts":{},"template":"Water"},{"x":-704,"y":640,"exts":{},"template":"Water"},{"x":-768,"y":640,"exts":{},"template":"Water"},{"x":-832,"y":640,"exts":{},"template":"Water"},{"x":-320,"y":640,"exts":{},"template":"piach d"},{"x":-320,"y":576,"exts":{},"template":"piach d"},{"x":-320,"y":576,"exts":{},"template":"piach d"},{"x":-320,"y":512,"exts":{},"template":"piach d"},{"x":1024,"y":640,"exts":{},"template":"piach d"},{"x":1024,"y":576,"exts":{},"template":"piach d"},{"x":1024,"y":512,"exts":{},"template":"piach d"},{"x":-384,"y":640,"exts":{},"template":"piach d"},{"x":-384,"y":576,"exts":{},"template":"piach d"},{"x":-384,"y":512,"exts":{},"template":"piach d"},{"x":1088,"y":640,"exts":{},"template":"piach d"},{"x":1088,"y":576,"exts":{},"template":"piach d"},{"x":1088,"y":512,"exts":{},"template":"piach d"},{"x":1152,"y":640,"exts":{},"template":"piach d"},{"x":-448,"y":640,"exts":{},"template":"piach d"},{"x":-576,"y":576,"exts":{},"template":"Water"},{"x":-576,"y":512,"exts":{},"template":"Water"},{"x":-448,"y":512,"exts":{},"template":"Water"},{"x":-512,"y":512,"exts":{},"template":"Water"},{"x":-512,"y":576,"exts":{},"template":"Water"},{"x":-448,"y":576,"exts":{},"template":"Water"},{"x":-768,"y":-128,"exts":{},"template":"BG"},{"x":-704,"y":-192,"exts":{},"template":"BG"},{"x":-768,"y":640,"exts":{},"template":"BG"},{"x":-768,"y":640,"exts":{},"template":"Water"},{"x":-704,"y":640,"exts":{},"template":"Water"},{"x":-640,"y":640,"exts":{},"template":"Water"},{"x":-576,"y":640,"exts":{},"template":"Water"},{"x":192,"y":384,"exts":{},"template":"trawa2"},{"x":64,"y":320,"exts":{},"template":"ExitNiewidzialne"},{"x":85,"y":320,"exts":{},"template":"g1"},{"x":128,"y":320,"exts":{},"template":"pixil"},{"x":128,"y":256,"exts":{},"template":"pixil"},{"x":128,"y":192,"exts":{},"template":"pixil"},{"x":192,"y":320,"exts":{},"template":"pixil-frame-0_(8)"},{"x":192,"y":256,"exts":{},"template":"pixil-frame-0_(8)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(8)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(8)"},{"x":384,"y":320,"exts":{},"template":"pixil"},{"x":384,"y":192,"exts":{},"template":"pixil"},{"x":512,"y":320,"exts":{},"template":"g1"},{"x":512,"y":256,"exts":{},"template":"g1"},{"x":640,"y":320,"exts":{},"template":"g1"},{"x":576,"y":320,"exts":{},"template":"pixil-frame-0_(8)"},{"x":576,"y":256,"exts":{},"template":"pixil-frame-0_(8)"},{"x":576,"y":192,"exts":{},"template":"pixil-frame-0_(8)"},{"x":384,"y":256,"exts":{},"template":"pixil"},{"x":192,"y":128,"exts":{},"template":"pixil-frame-0_(8)"},{"x":128,"y":128,"exts":{},"template":"pixil"},{"x":85,"y":256,"exts":{},"template":"g1"},{"x":64,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":64,"exts":{},"template":"pixil-frame-0_(4)"},{"x":256,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":256,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":384,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":384,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":576,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":576,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":640,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":576,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":320,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":320,"exts":{},"template":"pixil-frame-0_(4)"},{"x":256,"y":320,"exts":{},"template":"g1"},{"x":256,"y":256,"exts":{},"template":"g1"},{"x":320,"y":384,"exts":{},"template":"Bluey"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":256,"exts":{},"template":"pixil-frame-0_(8)"},{"x":320,"y":320,"exts":{},"template":"pixil-frame-0_(8)"},{"x":320,"y":320,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":320,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":448,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":384,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":384,"exts":{},"template":"pixil-frame-0_(4)"},{"x":640,"y":512,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":576,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":640,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":576,"exts":{},"template":"pixil-frame-0_(4)"},{"x":0,"y":576,"exts":{},"template":"pixil-frame-0_(4)"},{"x":64,"y":448,"exts":{},"template":"pixil-frame-0_(4)"},{"x":640,"y":384,"exts":{},"template":"pixil-frame-0_(4)"},{"x":704,"y":640,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":128,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":128,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":256,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":384,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":384,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":384,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":384,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":512,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":512,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":640,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":640,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":64,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":64,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":256,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":576,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":576,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":128,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":192,"y":64,"exts":{},"template":"pixil-frame-0_(11)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":-256,"y":512,"exts":{},"template":"piach d"},{"x":-64,"y":512,"exts":{},"template":"robot"},{"x":1216,"y":512,"exts":{},"template":"pixil-frame-0_(12)"},{"x":1280,"y":512,"exts":{},"template":"pixil-frame-0_(12)"},{"x":1344,"y":512,"exts":{},"template":"pixil-frame-0_(12)"},{"x":320,"y":-192,"exts":{},"template":"z1"},{"x":384,"y":-192,"exts":{},"template":"z1"},{"x":448,"y":-192,"exts":{},"template":"z1"},{"x":448,"y":-256,"exts":{},"template":"z1"},{"x":384,"y":-256,"exts":{},"template":"z1"},{"x":320,"y":-256,"exts":{},"template":"z1"},{"x":320,"y":-320,"exts":{},"template":"z1"},{"x":384,"y":-320,"exts":{},"template":"z1"},{"x":448,"y":-320,"exts":{},"template":"z1"},{"x":448,"y":-384,"exts":{},"template":"z1"},{"x":384,"y":-384,"exts":{},"template":"z1"},{"x":384,"y":-384,"exts":{},"template":"z1"},{"x":320,"y":-384,"exts":{},"template":"z1"},{"x":256,"y":-384,"exts":{},"template":"z1"},{"x":256,"y":-320,"exts":{},"template":"z1"},{"x":256,"y":-256,"exts":{},"template":"z1"},{"x":512,"y":-384,"exts":{},"template":"z1"},{"x":512,"y":-320,"exts":{},"template":"z1"},{"x":512,"y":-256,"exts":{},"template":"z1"},{"x":448,"y":-384,"exts":{},"template":"z1"},{"x":384,"y":-448,"exts":{},"template":"z1"},{"x":448,"y":-448,"exts":{},"template":"z1"},{"x":320,"y":-448,"exts":{},"template":"z1"},{"x":256,"y":192,"exts":{},"template":"pixil-frame-0_(23)"},{"x":448,"y":128,"exts":{},"template":"pixil-frame-0_(23)"},{"x":448,"y":256,"exts":{},"template":"pixil-frame-0_(23)"},{"x":512,"y":192,"exts":{},"template":"pixil-frame-0_(23)"},{"x":192,"y":128,"exts":{},"template":"pixil-frame-0_(23)"},{"x":576,"y":256,"exts":{},"template":"pixil-frame-0_(23)"},{"x":64,"y":192,"exts":{},"template":"pixil-frame-0_(23)"},{"x":320,"y":320,"exts":{},"template":"pixil-frame-0_(23)"},{"x":384,"y":192,"exts":{},"template":"pixil-frame-0_(23)"},{"x":256,"y":128,"exts":{},"template":"pixil-frame-0_(23)"},{"x":576,"y":128,"exts":{},"template":"pixil-frame-0_(23)"},{"x":640,"y":320,"exts":{},"template":"pixil-frame-0_(23)"},{"x":320,"y":256,"exts":{},"template":"pixil-frame-0_(23)"},{"x":192,"y":320,"exts":{},"template":"pixil-frame-0_(23)"},{"x":128,"y":256,"exts":{},"template":"pixil-frame-0_(23)"}]'),
    bgs: JSON.parse('[{"depth":-2,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'dzungla';
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['dzungla'] = {
    name: 'dzungla',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":384,"exts":{},"template":"trawa2"},{"x":64,"y":384,"exts":{},"template":"trawa2"},{"x":128,"y":384,"exts":{},"template":"trawa2"},{"x":192,"y":384,"exts":{},"template":"trawa2"},{"x":320,"y":384,"exts":{},"template":"trawa2"},{"x":384,"y":384,"exts":{},"template":"trawa2"},{"x":448,"y":384,"exts":{},"template":"trawa2"},{"x":512,"y":384,"exts":{},"template":"trawa2"},{"x":512,"y":384,"exts":{},"template":"trawa2"},{"x":576,"y":384,"exts":{},"template":"trawa2"},{"x":640,"y":384,"exts":{},"template":"trawa2"},{"x":704,"y":384,"exts":{},"template":"trawa2"},{"x":704,"y":384,"exts":{},"template":"trawa2"},{"x":768,"y":384,"exts":{},"template":"trawa2"},{"x":832,"y":384,"exts":{},"template":"trawa2"},{"x":896,"y":384,"exts":{},"template":"trawa2"},{"x":0,"y":384,"exts":{},"template":"trawa2"},{"x":-64,"y":384,"exts":{},"template":"trawa2"},{"x":-128,"y":384,"exts":{},"template":"trawa2"},{"x":-128,"y":384,"exts":{},"template":"trawa2"},{"x":-64,"y":320,"exts":{},"template":"g1"},{"x":0,"y":256,"exts":{},"template":"pixil-frame-0_(8)"},{"x":64,"y":320,"exts":{},"template":"pixil"},{"x":64,"y":256,"exts":{},"template":"pixil"},{"x":64,"y":256,"exts":{},"template":"pixil"},{"x":64,"y":192,"exts":{},"template":"pixil"},{"x":127,"y":348,"exts":{},"template":"pixil-frame"},{"x":896,"y":320,"exts":{},"template":"g1"},{"x":832,"y":320,"exts":{},"template":"pixil-frame-0_(8)"},{"x":832,"y":256,"exts":{},"template":"pixil-frame-0_(8)"},{"x":768,"y":320,"exts":{},"template":"pixil"},{"x":768,"y":256,"exts":{},"template":"pixil"},{"x":768,"y":192,"exts":{},"template":"pixil"},{"x":730,"y":348,"exts":{},"template":"pixil-frame"},{"x":729,"y":313,"exts":{},"template":"pixil-frame"},{"x":695,"y":349,"exts":{},"template":"pixil-frame"},{"x":751,"y":315,"exts":{},"template":"pixil-frame"},{"x":-64,"y":448,"exts":{},"template":"trawa2"},{"x":-128,"y":448,"exts":{},"template":"trawa2"},{"x":-128,"y":512,"exts":{},"template":"trawa2"},{"x":-64,"y":512,"exts":{},"template":"trawa2"},{"x":64,"y":512,"exts":{},"template":"trawa2"},{"x":64,"y":512,"exts":{},"template":"trawa2"},{"x":0,"y":512,"exts":{},"template":"trawa2"},{"x":128,"y":512,"exts":{},"template":"trawa2"},{"x":192,"y":512,"exts":{},"template":"trawa2"},{"x":256,"y":512,"exts":{},"template":"trawa2"},{"x":320,"y":512,"exts":{},"template":"trawa2"},{"x":384,"y":512,"exts":{},"template":"trawa2"},{"x":448,"y":512,"exts":{},"template":"trawa2"},{"x":512,"y":512,"exts":{},"template":"trawa2"},{"x":576,"y":512,"exts":{},"template":"trawa2"},{"x":640,"y":512,"exts":{},"template":"trawa2"},{"x":704,"y":512,"exts":{},"template":"trawa2"},{"x":768,"y":512,"exts":{},"template":"trawa2"},{"x":832,"y":512,"exts":{},"template":"trawa2"},{"x":896,"y":512,"exts":{},"template":"trawa2"},{"x":896,"y":448,"exts":{},"template":"trawa2"},{"x":832,"y":448,"exts":{},"template":"trawa2"},{"x":768,"y":448,"exts":{},"template":"trawa2"},{"x":0,"y":448,"exts":{},"template":"trawa2"},{"x":64,"y":448,"exts":{},"template":"trawa2"},{"x":128,"y":448,"exts":{},"template":"trawa2"},{"x":192,"y":448,"exts":{},"template":"trawa2"},{"x":256,"y":448,"exts":{},"template":"trawa2"},{"x":768,"y":448,"exts":{},"template":"trawa2"},{"x":768,"y":448,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":448,"exts":{},"template":"trawa2"},{"x":576,"y":448,"exts":{},"template":"trawa2"},{"x":512,"y":448,"exts":{},"template":"trawa2"},{"x":448,"y":448,"exts":{},"template":"trawa2"},{"x":320,"y":448,"exts":{},"template":"trawa2"},{"x":384,"y":448,"exts":{},"template":"trawa2"},{"x":0,"y":512,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":448,"exts":{},"template":"pixil-frame-0_(4)"},{"x":384,"y":512,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":384,"exts":{},"template":"pixil-frame-0_(4)"},{"x":640,"y":512,"exts":{},"template":"pixil-frame-0_(4)"},{"x":768,"y":448,"exts":{},"template":"pixil-frame-0_(4)"},{"x":896,"y":384,"exts":{},"template":"pixil-frame-0_(4)"},{"x":0,"y":384,"exts":{},"template":"pixil-frame-0_(4)"},{"x":-64,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":-64,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":-128,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":-128,"y":320,"exts":{},"template":"pixil-frame-0_(4)"},{"x":0,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":-64,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":0,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":0,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":64,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":256,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":384,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":640,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":576,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":640,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":704,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":704,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":768,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":832,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":832,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":832,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":896,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":896,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":832,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":896,"y":320,"exts":{},"template":"pixil-frame-0_(4)"},{"x":0,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":64,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":832,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":768,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":640,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":576,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":384,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":256,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":64,"y":64,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":64,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":64,"exts":{},"template":"pixil-frame-0_(4)"},{"x":256,"y":64,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":64,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":64,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":64,"exts":{},"template":"pixil-frame-0_(4)"},{"x":576,"y":64,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":64,"exts":{},"template":"pixil-frame-0_(4)"},{"x":384,"y":64,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":64,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":0,"exts":{},"template":"pixil-frame-0_(4)"},{"x":384,"y":0,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":0,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":0,"exts":{},"template":"pixil-frame-0_(4)"},{"x":256,"y":0,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":0,"exts":{},"template":"pixil-frame-0_(4)"},{"x":384,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":0,"y":320,"exts":{},"template":"pixil-frame-0_(4)"},{"x":0,"y":320,"exts":{},"template":"pixil-frame-0_(8)"},{"x":128,"y":320,"exts":{"targetRoom":"wyspa_dywanowa"},"template":"ExitNiewidzialne"},{"x":704,"y":320,"exts":{},"template":"ExitNiewidzialne"},{"x":512,"y":384,"exts":{},"template":"Bluey"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":448,"y":64,"exts":{},"template":"pixil-frame-0_(11)"},{"x":192,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":64,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":64,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":64,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":64,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":512,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":512,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":704,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":704,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":704,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":704,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":704,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":832,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":832,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":832,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":832,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":832,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":-128,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":-64,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":-64,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":-64,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":256,"y":384,"exts":{},"template":"trawa2"},{"x":256,"y":384,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":384,"y":384,"exts":{},"template":"robot"},{"x":320,"y":128,"exts":{},"template":"pixil-frame-0_(23)"},{"x":256,"y":0,"exts":{},"template":"pixil-frame-0_(23)"},{"x":448,"y":192,"exts":{},"template":"pixil-frame-0_(23)"},{"x":0,"y":192,"exts":{},"template":"pixil-frame-0_(23)"},{"x":192,"y":64,"exts":{},"template":"pixil-frame-0_(23)"},{"x":384,"y":0,"exts":{},"template":"pixil-frame-0_(23)"},{"x":576,"y":128,"exts":{},"template":"pixil-frame-0_(23)"},{"x":256,"y":192,"exts":{},"template":"pixil-frame-0_(23)"},{"x":128,"y":192,"exts":{},"template":"pixil-frame-0_(23)"},{"x":640,"y":192,"exts":{},"template":"pixil-frame-0_(23)"},{"x":512,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":320,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":192,"y":256,"exts":{},"template":"pixil-frame-0_(11)"}]'),
    bgs: JSON.parse('[{"depth":-2,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'plaza';
inGameRoomStart(this);

    },
    extends: {}
}
ct.rooms.templates['plaza'] = {
    name: 'plaza',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":192,"y":512,"exts":{},"template":"trawa2"},{"x":256,"y":512,"exts":{},"template":"trawa2"},{"x":320,"y":512,"exts":{},"template":"trawa2"},{"x":448,"y":512,"exts":{},"template":"trawa2"},{"x":448,"y":512,"exts":{},"template":"trawa2"},{"x":384,"y":512,"exts":{},"template":"trawa2"},{"x":512,"y":512,"exts":{},"template":"trawa2"},{"x":576,"y":512,"exts":{},"template":"trawa2"},{"x":256,"y":448,"exts":{},"template":"trawa2"},{"x":320,"y":512,"exts":{},"template":"trawa2"},{"x":320,"y":448,"exts":{},"template":"trawa2"},{"x":384,"y":448,"exts":{},"template":"trawa2"},{"x":448,"y":448,"exts":{},"template":"trawa2"},{"x":512,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":512,"exts":{},"template":"trawa2"},{"x":704,"y":512,"exts":{},"template":"trawa2"},{"x":192,"y":512,"exts":{},"template":"trawa2"},{"x":128,"y":512,"exts":{},"template":"trawa2"},{"x":64,"y":512,"exts":{},"template":"trawa2"},{"x":64,"y":576,"exts":{},"template":"trawa2"},{"x":0,"y":512,"exts":{},"template":"trawa2"},{"x":0,"y":576,"exts":{},"template":"trawa2"},{"x":128,"y":576,"exts":{},"template":"trawa2"},{"x":192,"y":576,"exts":{},"template":"trawa2"},{"x":256,"y":576,"exts":{},"template":"trawa2"},{"x":320,"y":576,"exts":{},"template":"trawa2"},{"x":384,"y":576,"exts":{},"template":"trawa2"},{"x":448,"y":576,"exts":{},"template":"trawa2"},{"x":576,"y":576,"exts":{},"template":"trawa2"},{"x":512,"y":576,"exts":{},"template":"trawa2"},{"x":640,"y":576,"exts":{},"template":"trawa2"},{"x":704,"y":576,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":448,"exts":{},"template":"trawa2"},{"x":576,"y":448,"exts":{},"template":"trawa2"},{"x":64,"y":512,"exts":{},"template":"trawa2"},{"x":0,"y":448,"exts":{},"template":"trawa2"},{"x":64,"y":448,"exts":{},"template":"trawa2"},{"x":128,"y":448,"exts":{},"template":"trawa2"},{"x":192,"y":448,"exts":{},"template":"trawa2"},{"x":64,"y":448,"exts":{},"template":"trawa2"},{"x":128,"y":384,"exts":{},"template":"trawa2"},{"x":64,"y":384,"exts":{},"template":"trawa2"},{"x":320,"y":384,"exts":{},"template":"trawa2"},{"x":256,"y":384,"exts":{},"template":"trawa2"},{"x":384,"y":384,"exts":{},"template":"trawa2"},{"x":448,"y":384,"exts":{},"template":"trawa2"},{"x":512,"y":384,"exts":{},"template":"trawa2"},{"x":576,"y":384,"exts":{},"template":"trawa2"},{"x":640,"y":384,"exts":{},"template":"trawa2"},{"x":768,"y":512,"exts":{},"template":"trawa2"},{"x":768,"y":576,"exts":{},"template":"trawa2"},{"x":-64,"y":576,"exts":{},"template":"trawa2"},{"x":-64,"y":512,"exts":{},"template":"trawa2"},{"x":-128,"y":576,"exts":{},"template":"piach d"},{"x":-192,"y":576,"exts":{},"template":"piach d"},{"x":-256,"y":576,"exts":{},"template":"piach d"},{"x":-320,"y":576,"exts":{},"template":"piach d"},{"x":-128,"y":576,"exts":{},"template":"piach d"},{"x":-128,"y":512,"exts":{},"template":"piach d"},{"x":-192,"y":512,"exts":{},"template":"piach d"},{"x":832,"y":576,"exts":{},"template":"piach d"},{"x":896,"y":576,"exts":{},"template":"piach d"},{"x":960,"y":576,"exts":{},"template":"piach d"},{"x":896,"y":512,"exts":{},"template":"piach d"},{"x":1024,"y":576,"exts":{},"template":"piach d"},{"x":1216,"y":640,"exts":{},"template":"piach d"},{"x":1280,"y":640,"exts":{},"template":"piach d"},{"x":1344,"y":640,"exts":{},"template":"piach d"},{"x":1408,"y":640,"exts":{},"template":"piach d"},{"x":1536,"y":640,"exts":{},"template":"piach d"},{"x":1472,"y":640,"exts":{},"template":"piach d"},{"x":1600,"y":640,"exts":{},"template":"piach d"},{"x":-384,"y":576,"exts":{},"template":"piach d"},{"x":-512,"y":640,"exts":{},"template":"piach d"},{"x":-640,"y":640,"exts":{},"template":"piach d"},{"x":-576,"y":640,"exts":{},"template":"piach d"},{"x":-832,"y":640,"exts":{},"template":"piach d"},{"x":-704,"y":640,"exts":{},"template":"piach d"},{"x":-768,"y":640,"exts":{},"template":"piach d"},{"x":-320,"y":640,"exts":{},"template":"piach d"},{"x":-320,"y":640,"exts":{},"template":"piach d"},{"x":-384,"y":640,"exts":{},"template":"piach d"},{"x":-256,"y":640,"exts":{},"template":"piach d"},{"x":-192,"y":640,"exts":{},"template":"piach d"},{"x":-128,"y":640,"exts":{},"template":"piach d"},{"x":1088,"y":640,"exts":{},"template":"piach d"},{"x":1024,"y":640,"exts":{},"template":"piach d"},{"x":1024,"y":640,"exts":{},"template":"piach d"},{"x":960,"y":640,"exts":{},"template":"piach d"},{"x":896,"y":640,"exts":{},"template":"piach d"},{"x":896,"y":640,"exts":{},"template":"piach d"},{"x":832,"y":640,"exts":{},"template":"piach d"},{"x":768,"y":640,"exts":{},"template":"piach d"},{"x":704,"y":640,"exts":{},"template":"piach d"},{"x":640,"y":640,"exts":{},"template":"piach d"},{"x":576,"y":640,"exts":{},"template":"piach d"},{"x":512,"y":640,"exts":{},"template":"piach d"},{"x":0,"y":640,"exts":{},"template":"trawa2"},{"x":-64,"y":640,"exts":{},"template":"trawa2"},{"x":-128,"y":640,"exts":{},"template":"trawa2"},{"x":64,"y":640,"exts":{},"template":"trawa2"},{"x":128,"y":640,"exts":{},"template":"trawa2"},{"x":192,"y":640,"exts":{},"template":"trawa2"},{"x":256,"y":640,"exts":{},"template":"trawa2"},{"x":320,"y":640,"exts":{},"template":"trawa2"},{"x":384,"y":640,"exts":{},"template":"trawa2"},{"x":448,"y":640,"exts":{},"template":"trawa2"},{"x":576,"y":640,"exts":{},"template":"trawa2"},{"x":576,"y":640,"exts":{},"template":"trawa2"},{"x":512,"y":640,"exts":{},"template":"trawa2"},{"x":704,"y":640,"exts":{},"template":"trawa2"},{"x":640,"y":640,"exts":{},"template":"trawa2"},{"x":768,"y":640,"exts":{},"template":"trawa2"},{"x":832,"y":640,"exts":{},"template":"trawa2"},{"x":-832,"y":576,"exts":{},"template":"Water"},{"x":-704,"y":576,"exts":{},"template":"Water"},{"x":-768,"y":576,"exts":{},"template":"Water"},{"x":-640,"y":576,"exts":{},"template":"Water"},{"x":-384,"y":512,"exts":{},"template":"Water"},{"x":-320,"y":512,"exts":{},"template":"Water"},{"x":1024,"y":512,"exts":{},"template":"Water"},{"x":960,"y":512,"exts":{},"template":"Water"},{"x":1600,"y":576,"exts":{},"template":"Water"},{"x":1536,"y":576,"exts":{},"template":"Water"},{"x":1536,"y":576,"exts":{},"template":"Water"},{"x":1472,"y":576,"exts":{},"template":"Water"},{"x":1408,"y":576,"exts":{},"template":"Water"},{"x":1344,"y":576,"exts":{},"template":"Water"},{"x":1280,"y":576,"exts":{},"template":"Water"},{"x":1024,"y":576,"exts":{},"template":"Water"},{"x":960,"y":576,"exts":{},"template":"Water"},{"x":1024,"y":640,"exts":{},"template":"Water"},{"x":960,"y":640,"exts":{},"template":"Water"},{"x":1088,"y":640,"exts":{},"template":"Water"},{"x":-192,"y":640,"exts":{},"template":"piach d"},{"x":-256,"y":576,"exts":{},"template":"piach d"},{"x":960,"y":640,"exts":{},"template":"piach d"},{"x":960,"y":576,"exts":{},"template":"piach d"},{"x":1024,"y":576,"exts":{},"template":"piach d"},{"x":960,"y":512,"exts":{},"template":"piach d"},{"x":1024,"y":576,"exts":{},"template":"Water"},{"x":1280,"y":640,"exts":{},"template":"Water"},{"x":1280,"y":640,"exts":{},"template":"Water"},{"x":1216,"y":640,"exts":{},"template":"Water"},{"x":1344,"y":640,"exts":{},"template":"Water"},{"x":1344,"y":640,"exts":{},"template":"Water"},{"x":1472,"y":640,"exts":{},"template":"Water"},{"x":1536,"y":640,"exts":{},"template":"Water"},{"x":1600,"y":640,"exts":{},"template":"Water"},{"x":1408,"y":640,"exts":{},"template":"Water"},{"x":-320,"y":576,"exts":{},"template":"Water"},{"x":-384,"y":576,"exts":{},"template":"Water"},{"x":-320,"y":640,"exts":{},"template":"Water"},{"x":-384,"y":640,"exts":{},"template":"Water"},{"x":-384,"y":640,"exts":{},"template":"Water"},{"x":-512,"y":640,"exts":{},"template":"Water"},{"x":-576,"y":640,"exts":{},"template":"Water"},{"x":-576,"y":640,"exts":{},"template":"Water"},{"x":-640,"y":640,"exts":{},"template":"Water"},{"x":-704,"y":640,"exts":{},"template":"Water"},{"x":-768,"y":640,"exts":{},"template":"Water"},{"x":-832,"y":640,"exts":{},"template":"Water"},{"x":-320,"y":640,"exts":{},"template":"piach d"},{"x":-320,"y":576,"exts":{},"template":"piach d"},{"x":-320,"y":576,"exts":{},"template":"piach d"},{"x":-320,"y":512,"exts":{},"template":"piach d"},{"x":1024,"y":640,"exts":{},"template":"piach d"},{"x":1024,"y":576,"exts":{},"template":"piach d"},{"x":1024,"y":512,"exts":{},"template":"piach d"},{"x":-384,"y":640,"exts":{},"template":"piach d"},{"x":-384,"y":576,"exts":{},"template":"piach d"},{"x":-384,"y":512,"exts":{},"template":"piach d"},{"x":1088,"y":640,"exts":{},"template":"piach d"},{"x":-448,"y":640,"exts":{},"template":"piach d"},{"x":-576,"y":576,"exts":{},"template":"Water"},{"x":-512,"y":576,"exts":{},"template":"Water"},{"x":-448,"y":576,"exts":{},"template":"Water"},{"x":-768,"y":-128,"exts":{},"template":"BG"},{"x":-704,"y":-192,"exts":{},"template":"BG"},{"x":-768,"y":640,"exts":{},"template":"BG"},{"x":-768,"y":640,"exts":{},"template":"Water"},{"x":-704,"y":640,"exts":{},"template":"Water"},{"x":-640,"y":640,"exts":{},"template":"Water"},{"x":-576,"y":640,"exts":{},"template":"Water"},{"x":192,"y":384,"exts":{},"template":"trawa2"},{"x":128,"y":320,"exts":{},"template":"pixil"},{"x":128,"y":256,"exts":{},"template":"pixil"},{"x":128,"y":192,"exts":{},"template":"pixil"},{"x":192,"y":320,"exts":{},"template":"pixil-frame-0_(8)"},{"x":192,"y":256,"exts":{},"template":"pixil-frame-0_(8)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(8)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(8)"},{"x":384,"y":320,"exts":{},"template":"pixil"},{"x":384,"y":192,"exts":{},"template":"pixil"},{"x":512,"y":320,"exts":{},"template":"g1"},{"x":512,"y":256,"exts":{},"template":"g1"},{"x":576,"y":320,"exts":{},"template":"pixil-frame-0_(8)"},{"x":576,"y":256,"exts":{},"template":"pixil-frame-0_(8)"},{"x":576,"y":192,"exts":{},"template":"pixil-frame-0_(8)"},{"x":384,"y":256,"exts":{},"template":"pixil"},{"x":192,"y":128,"exts":{},"template":"pixil-frame-0_(8)"},{"x":128,"y":128,"exts":{},"template":"pixil"},{"x":85,"y":256,"exts":{},"template":"g1"},{"x":64,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":64,"exts":{},"template":"pixil-frame-0_(4)"},{"x":256,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":256,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":384,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":384,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":576,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":576,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":640,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":576,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":320,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":320,"exts":{},"template":"pixil-frame-0_(4)"},{"x":256,"y":320,"exts":{},"template":"g1"},{"x":256,"y":256,"exts":{},"template":"g1"},{"x":320,"y":384,"exts":{},"template":"Bluey"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":256,"exts":{},"template":"pixil-frame-0_(8)"},{"x":320,"y":320,"exts":{},"template":"pixil-frame-0_(8)"},{"x":320,"y":320,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":320,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":448,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":384,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":384,"exts":{},"template":"pixil-frame-0_(4)"},{"x":640,"y":512,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":576,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":640,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":576,"exts":{},"template":"pixil-frame-0_(4)"},{"x":0,"y":576,"exts":{},"template":"pixil-frame-0_(4)"},{"x":64,"y":448,"exts":{},"template":"pixil-frame-0_(4)"},{"x":640,"y":384,"exts":{},"template":"pixil-frame-0_(4)"},{"x":704,"y":640,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":128,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":128,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":256,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":384,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":384,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":384,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":384,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":512,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":512,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":640,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":64,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":256,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":576,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":576,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":128,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":192,"y":64,"exts":{},"template":"pixil-frame-0_(11)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":84,"y":319,"exts":{},"template":"g1"},{"x":64,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":-256,"y":512,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":640,"y":320,"exts":{},"template":"ExitNiewidzialne"},{"x":663,"y":320,"exts":{},"template":"g1"},{"x":640,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":1408,"y":448,"exts":{"targetRoom":"sup"},"template":"ExitNiewidzialne"},{"x":960,"y":512,"exts":{},"template":"robot"},{"x":320,"y":-256,"exts":{},"template":"z1"},{"x":384,"y":-256,"exts":{},"template":"z1"},{"x":448,"y":-256,"exts":{},"template":"z1"},{"x":448,"y":-320,"exts":{},"template":"z1"},{"x":384,"y":-320,"exts":{},"template":"z1"},{"x":384,"y":-320,"exts":{},"template":"z1"},{"x":320,"y":-320,"exts":{},"template":"z1"},{"x":384,"y":-384,"exts":{},"template":"z1"},{"x":320,"y":-384,"exts":{},"template":"z1"},{"x":448,"y":-384,"exts":{},"template":"z1"},{"x":320,"y":-448,"exts":{},"template":"z1"},{"x":448,"y":-448,"exts":{},"template":"z1"},{"x":384,"y":-448,"exts":{},"template":"z1"},{"x":512,"y":-384,"exts":{},"template":"z1"},{"x":512,"y":-320,"exts":{},"template":"z1"},{"x":512,"y":-256,"exts":{},"template":"z1"},{"x":448,"y":-192,"exts":{},"template":"z1"},{"x":384,"y":-192,"exts":{},"template":"z1"},{"x":320,"y":-192,"exts":{},"template":"z1"},{"x":256,"y":-256,"exts":{},"template":"z1"},{"x":256,"y":-320,"exts":{},"template":"z1"},{"x":256,"y":-384,"exts":{},"template":"z1"},{"x":1152,"y":640,"exts":{},"template":"Water"},{"x":1216,"y":576,"exts":{},"template":"Water"},{"x":1216,"y":576,"exts":{},"template":"Water"},{"x":1152,"y":576,"exts":{},"template":"Water"},{"x":1152,"y":576,"exts":{},"template":"Water"},{"x":1088,"y":576,"exts":{},"template":"Water"},{"x":1216,"y":576,"exts":{},"template":"Water"},{"x":1030,"y":518,"exts":{},"template":"piach d"},{"x":1035,"y":522,"exts":{},"template":"piach d"},{"x":1042,"y":529,"exts":{},"template":"piach d"},{"x":1051,"y":539,"exts":{},"template":"piach d"},{"x":1057,"y":547,"exts":{},"template":"piach d"},{"x":1072,"y":555,"exts":{},"template":"piach d"},{"x":1081,"y":568,"exts":{},"template":"piach d"},{"x":1086,"y":579,"exts":{},"template":"piach d"},{"x":1092,"y":593,"exts":{},"template":"piach d"},{"x":1095,"y":602,"exts":{},"template":"piach d"},{"x":1100,"y":616,"exts":{},"template":"piach d"},{"x":1119,"y":635,"exts":{},"template":"piach d"},{"x":1126,"y":650,"exts":{},"template":"piach d"},{"x":1108,"y":626,"exts":{},"template":"piach d"},{"x":1135,"y":666,"exts":{},"template":"piach d"},{"x":1148,"y":674,"exts":{},"template":"piach d"},{"x":1153,"y":677,"exts":{},"template":"piach d"},{"x":1152,"y":768,"exts":{},"template":"BG"},{"x":1152,"y":832,"exts":{},"template":"BG"},{"x":1152,"y":768,"exts":{},"template":"BG"},{"x":1152,"y":768,"exts":{},"template":"BG"},{"x":1088,"y":768,"exts":{},"template":"BG"},{"x":1152,"y":704,"exts":{},"template":"BG"},{"x":1152,"y":704,"exts":{},"template":"BG"},{"x":1152,"y":704,"exts":{},"template":"BG"},{"x":1088,"y":704,"exts":{},"template":"BG"},{"x":1024,"y":512,"exts":{},"template":"piach d"},{"x":1088,"y":576,"exts":{},"template":"piach d"},{"x":1088,"y":640,"exts":{},"template":"piach d"},{"x":896,"y":640,"exts":{},"template":"piach d"},{"x":896,"y":576,"exts":{},"template":"piach d"},{"x":1088,"y":640,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":1024,"y":576,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":651,"y":389,"exts":{},"template":"trawa2"},{"x":656,"y":396,"exts":{},"template":"trawa2"},{"x":663,"y":401,"exts":{},"template":"trawa2"},{"x":669,"y":406,"exts":{},"template":"trawa2"},{"x":674,"y":413,"exts":{},"template":"trawa2"},{"x":690,"y":427,"exts":{},"template":"trawa2"},{"x":690,"y":427,"exts":{},"template":"trawa2"},{"x":685,"y":417,"exts":{},"template":"trawa2"},{"x":701,"y":430,"exts":{},"template":"trawa2"},{"x":710,"y":443,"exts":{},"template":"trawa2"},{"x":716,"y":459,"exts":{},"template":"trawa2"},{"x":722,"y":459,"exts":{},"template":"trawa2"},{"x":721,"y":452,"exts":{},"template":"trawa2"},{"x":728,"y":456,"exts":{},"template":"trawa2"},{"x":737,"y":462,"exts":{},"template":"trawa2"},{"x":748,"y":472,"exts":{},"template":"trawa2"},{"x":760,"y":475,"exts":{},"template":"trawa2"},{"x":770,"y":483,"exts":{},"template":"trawa2"},{"x":788,"y":490,"exts":{},"template":"trawa2"},{"x":791,"y":502,"exts":{},"template":"trawa2"},{"x":801,"y":515,"exts":{},"template":"trawa2"},{"x":802,"y":516,"exts":{},"template":"trawa2"},{"x":813,"y":526,"exts":{},"template":"trawa2"},{"x":823,"y":540,"exts":{},"template":"trawa2"},{"x":836,"y":551,"exts":{},"template":"trawa2"},{"x":853,"y":560,"exts":{},"template":"trawa2"},{"x":861,"y":579,"exts":{},"template":"trawa2"},{"x":866,"y":601,"exts":{},"template":"trawa2"},{"x":882,"y":619,"exts":{},"template":"trawa2"},{"x":885,"y":633,"exts":{},"template":"trawa2"},{"x":888,"y":644,"exts":{},"template":"trawa2"},{"x":888,"y":640,"exts":{},"template":"trawa2"},{"x":832,"y":576,"exts":{},"template":"trawa2"},{"x":832,"y":512,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":803,"y":507,"exts":{},"template":"trawa2"},{"x":817,"y":521,"exts":{},"template":"trawa2"},{"x":832,"y":534,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":384,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":768,"y":512,"exts":{},"template":"trawa2"},{"x":832,"y":576,"exts":{},"template":"trawa2"},{"x":832,"y":640,"exts":{},"template":"trawa2"},{"x":768,"y":704,"exts":{},"template":"BG"},{"x":55,"y":387,"exts":{},"template":"trawa2"},{"x":50,"y":396,"exts":{},"template":"trawa2"},{"x":44,"y":396,"exts":{},"template":"trawa2"},{"x":44,"y":404,"exts":{},"template":"trawa2"},{"x":36,"y":404,"exts":{},"template":"trawa2"},{"x":28,"y":414,"exts":{},"template":"trawa2"},{"x":22,"y":416,"exts":{},"template":"trawa2"},{"x":21,"y":418,"exts":{},"template":"trawa2"},{"x":17,"y":418,"exts":{},"template":"trawa2"},{"x":17,"y":418,"exts":{},"template":"trawa2"},{"x":8,"y":422,"exts":{},"template":"trawa2"},{"x":8,"y":423,"exts":{},"template":"trawa2"},{"x":7,"y":424,"exts":{},"template":"trawa2"},{"x":4,"y":424,"exts":{},"template":"trawa2"},{"x":4,"y":425,"exts":{},"template":"trawa2"},{"x":0,"y":435,"exts":{},"template":"trawa2"},{"x":0,"y":435,"exts":{},"template":"trawa2"},{"x":-4,"y":442,"exts":{},"template":"trawa2"},{"x":-4,"y":442,"exts":{},"template":"trawa2"},{"x":-4,"y":443,"exts":{},"template":"trawa2"},{"x":-4,"y":443,"exts":{},"template":"trawa2"},{"x":-4,"y":443,"exts":{},"template":"trawa2"},{"x":-6,"y":446,"exts":{},"template":"trawa2"},{"x":-7,"y":448,"exts":{},"template":"trawa2"},{"x":-8,"y":448,"exts":{},"template":"trawa2"},{"x":-15,"y":450,"exts":{},"template":"trawa2"},{"x":-15,"y":450,"exts":{},"template":"trawa2"},{"x":-18,"y":450,"exts":{},"template":"trawa2"},{"x":-33,"y":473,"exts":{},"template":"trawa2"},{"x":-30,"y":455,"exts":{},"template":"trawa2"},{"x":-43,"y":459,"exts":{},"template":"trawa2"},{"x":-43,"y":468,"exts":{},"template":"trawa2"},{"x":-43,"y":469,"exts":{},"template":"trawa2"},{"x":-63,"y":470,"exts":{},"template":"trawa2"},{"x":-52,"y":462,"exts":{},"template":"trawa2"},{"x":-71,"y":474,"exts":{},"template":"trawa2"},{"x":-72,"y":476,"exts":{},"template":"trawa2"},{"x":-72,"y":490,"exts":{},"template":"trawa2"},{"x":-78,"y":491,"exts":{},"template":"trawa2"},{"x":-79,"y":488,"exts":{},"template":"trawa2"},{"x":-83,"y":503,"exts":{},"template":"trawa2"},{"x":-83,"y":512,"exts":{},"template":"trawa2"},{"x":-96,"y":515,"exts":{},"template":"trawa2"},{"x":-104,"y":537,"exts":{},"template":"trawa2"},{"x":-86,"y":505,"exts":{},"template":"trawa2"},{"x":-95,"y":507,"exts":{},"template":"trawa2"},{"x":-85,"y":499,"exts":{},"template":"trawa2"},{"x":-103,"y":517,"exts":{},"template":"trawa2"},{"x":-109,"y":532,"exts":{},"template":"trawa2"},{"x":-116,"y":545,"exts":{},"template":"trawa2"},{"x":-129,"y":581,"exts":{},"template":"trawa2"},{"x":-123,"y":571,"exts":{},"template":"trawa2"},{"x":-126,"y":567,"exts":{},"template":"trawa2"},{"x":-134,"y":592,"exts":{},"template":"trawa2"},{"x":-134,"y":583,"exts":{},"template":"trawa2"},{"x":-138,"y":596,"exts":{},"template":"trawa2"},{"x":-140,"y":609,"exts":{},"template":"trawa2"},{"x":-143,"y":613,"exts":{},"template":"trawa2"},{"x":-147,"y":619,"exts":{},"template":"trawa2"},{"x":-147,"y":619,"exts":{},"template":"trawa2"},{"x":-154,"y":637,"exts":{},"template":"trawa2"},{"x":-155,"y":638,"exts":{},"template":"trawa2"},{"x":-155,"y":638,"exts":{},"template":"trawa2"},{"x":-157,"y":639,"exts":{},"template":"trawa2"},{"x":-163,"y":657,"exts":{},"template":"trawa2"},{"x":-149,"y":626,"exts":{},"template":"trawa2"},{"x":-64,"y":512,"exts":{},"template":"trawa2"},{"x":0,"y":512,"exts":{},"template":"trawa2"},{"x":-64,"y":640,"exts":{},"template":"trawa2"},{"x":-128,"y":704,"exts":{},"template":"trawa2"},{"x":-128,"y":640,"exts":{},"template":"trawa2"},{"x":-64,"y":640,"exts":{},"template":"trawa2"},{"x":-64,"y":640,"exts":{},"template":"trawa2"},{"x":-64,"y":640,"exts":{},"template":"trawa2"},{"x":-64,"y":576,"exts":{},"template":"trawa2"},{"x":-64,"y":640,"exts":{},"template":"trawa2"},{"x":-64,"y":640,"exts":{},"template":"trawa2"},{"x":-128,"y":576,"exts":{},"template":"pixil-frame-0_(4)"},{"x":-192,"y":704,"exts":{},"template":"BG"},{"x":-396,"y":517,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-399,"y":530,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-400,"y":530,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-407,"y":539,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-416,"y":549,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-416,"y":549,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-416,"y":549,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-416,"y":554,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-423,"y":566,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-423,"y":568,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-434,"y":582,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-434,"y":582,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-434,"y":582,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-434,"y":585,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-435,"y":588,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-436,"y":589,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-436,"y":592,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-444,"y":610,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-445,"y":611,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-450,"y":630,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-459,"y":649,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-462,"y":640,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-468,"y":643,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-469,"y":644,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-475,"y":652,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-475,"y":652,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-477,"y":652,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-478,"y":652,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-498,"y":674,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-490,"y":665,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-488,"y":659,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-507,"y":681,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-509,"y":685,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-514,"y":686,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-512,"y":689,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-522,"y":691,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-527,"y":698,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-441,"y":601,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-443,"y":598,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-438,"y":580,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-433,"y":574,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-421,"y":563,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-428,"y":554,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-422,"y":551,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-384,"y":576,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-384,"y":576,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-384,"y":512,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-448,"y":640,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-640,"y":704,"exts":{},"template":"BG"},{"x":-384,"y":960,"exts":{},"template":"BG"},{"x":512,"y":1152,"exts":{},"template":"BG"},{"x":1152,"y":576,"exts":{},"template":"Water"},{"x":1088,"y":576,"exts":{},"template":"Water"},{"x":1024,"y":576,"exts":{},"template":"Water"},{"x":1024,"y":576,"exts":{},"template":"Water"},{"x":960,"y":576,"exts":{},"template":"Water"},{"x":960,"y":576,"exts":{},"template":"Water"},{"x":896,"y":576,"exts":{},"template":"Water"},{"x":896,"y":576,"exts":{},"template":"Water"},{"x":832,"y":576,"exts":{},"template":"Water"},{"x":896,"y":640,"exts":{},"template":"Water"},{"x":1024,"y":640,"exts":{},"template":"Water"},{"x":960,"y":640,"exts":{},"template":"Water"},{"x":1088,"y":640,"exts":{},"template":"Water"},{"x":1088,"y":640,"exts":{},"template":"Water"},{"x":1152,"y":640,"exts":{},"template":"Water"},{"x":832,"y":640,"exts":{},"template":"Water"},{"x":1344,"y":576,"exts":{},"template":"pixil-frame-0_(12)"},{"x":1280,"y":576,"exts":{},"template":"pixil-frame-0_(12)"},{"x":1216,"y":576,"exts":{},"template":"pixil-frame-0_(12)"},{"x":768,"y":576,"exts":{},"template":"Water"},{"x":704,"y":576,"exts":{},"template":"Water"},{"x":640,"y":576,"exts":{},"template":"Water"},{"x":-448,"y":576,"exts":{},"template":"Water"},{"x":-320,"y":576,"exts":{},"template":"Water"},{"x":-384,"y":576,"exts":{},"template":"Water"},{"x":-192,"y":576,"exts":{},"template":"Water"},{"x":-256,"y":576,"exts":{},"template":"Water"},{"x":-64,"y":576,"exts":{},"template":"Water"},{"x":-128,"y":576,"exts":{},"template":"Water"},{"x":-64,"y":576,"exts":{},"template":"Water"},{"x":0,"y":576,"exts":{},"template":"Water"},{"x":64,"y":576,"exts":{},"template":"Water"},{"x":128,"y":576,"exts":{},"template":"Water"},{"x":320,"y":576,"exts":{},"template":"Water"},{"x":256,"y":640,"exts":{},"template":"Water"},{"x":256,"y":576,"exts":{},"template":"Water"},{"x":192,"y":576,"exts":{},"template":"Water"},{"x":448,"y":576,"exts":{},"template":"Water"},{"x":512,"y":576,"exts":{},"template":"Water"},{"x":576,"y":576,"exts":{},"template":"Water"},{"x":384,"y":576,"exts":{},"template":"Water"},{"x":768,"y":640,"exts":{},"template":"Water"},{"x":768,"y":640,"exts":{},"template":"Water"},{"x":704,"y":640,"exts":{},"template":"Water"},{"x":640,"y":640,"exts":{},"template":"Water"},{"x":448,"y":640,"exts":{},"template":"Water"},{"x":512,"y":640,"exts":{},"template":"Water"},{"x":576,"y":640,"exts":{},"template":"Water"},{"x":384,"y":640,"exts":{},"template":"Water"},{"x":320,"y":640,"exts":{},"template":"Water"},{"x":192,"y":640,"exts":{},"template":"Water"},{"x":128,"y":640,"exts":{},"template":"Water"},{"x":0,"y":640,"exts":{},"template":"Water"},{"x":64,"y":640,"exts":{},"template":"Water"},{"x":-64,"y":640,"exts":{},"template":"Water"},{"x":-128,"y":640,"exts":{},"template":"Water"},{"x":-128,"y":640,"exts":{},"template":"Water"},{"x":-256,"y":640,"exts":{},"template":"Water"},{"x":-128,"y":640,"exts":{},"template":"Water"},{"x":-192,"y":640,"exts":{},"template":"Water"},{"x":-384,"y":640,"exts":{},"template":"Water"},{"x":-448,"y":640,"exts":{},"template":"Water"},{"x":-448,"y":640,"exts":{},"template":"Water"},{"x":-448,"y":640,"exts":{},"template":"Water"},{"x":-512,"y":640,"exts":{},"template":"Water"},{"x":-512,"y":640,"exts":{},"template":"Water"},{"x":-576,"y":640,"exts":{},"template":"Water"},{"x":-512,"y":576,"exts":{},"template":"Water"},{"x":-320,"y":640,"exts":{},"template":"Water"},{"x":128,"y":320,"exts":{},"template":"Water"},{"x":-172,"y":506,"exts":{},"template":"piach d"},{"x":-146,"y":498,"exts":{},"template":"piach d"},{"x":-135,"y":489,"exts":{},"template":"piach d"},{"x":-127,"y":482,"exts":{},"template":"piach d"},{"x":-116,"y":475,"exts":{},"template":"piach d"},{"x":-108,"y":465,"exts":{},"template":"piach d"},{"x":-99,"y":460,"exts":{},"template":"piach d"},{"x":-183,"y":511,"exts":{},"template":"piach d"},{"x":-192,"y":512,"exts":{},"template":"piach d"},{"x":-38,"y":458,"exts":{},"template":"trawa2"},{"x":-42,"y":487,"exts":{},"template":"trawa2"},{"x":-47,"y":504,"exts":{},"template":"trawa2"},{"x":-55,"y":506,"exts":{},"template":"trawa2"},{"x":-62,"y":511,"exts":{},"template":"trawa2"},{"x":-70,"y":519,"exts":{},"template":"trawa2"},{"x":-91,"y":528,"exts":{},"template":"trawa2"},{"x":-42,"y":462,"exts":{},"template":"trawa2"},{"x":-46,"y":462,"exts":{},"template":"trawa2"},{"x":-55,"y":462,"exts":{},"template":"trawa2"},{"x":-53,"y":495,"exts":{},"template":"trawa2"},{"x":-66,"y":501,"exts":{},"template":"trawa2"},{"x":-68,"y":506,"exts":{},"template":"trawa2"},{"x":-69,"y":507,"exts":{},"template":"trawa2"},{"x":-67,"y":478,"exts":{},"template":"trawa2"},{"x":-75,"y":507,"exts":{},"template":"trawa2"},{"x":-82,"y":515,"exts":{},"template":"trawa2"},{"x":-83,"y":515,"exts":{},"template":"trawa2"},{"x":-83,"y":515,"exts":{},"template":"trawa2"},{"x":-102,"y":540,"exts":{},"template":"trawa2"},{"x":-113,"y":545,"exts":{},"template":"trawa2"},{"x":-117,"y":547,"exts":{},"template":"trawa2"},{"x":-117,"y":547,"exts":{},"template":"trawa2"},{"x":-123,"y":553,"exts":{},"template":"trawa2"},{"x":-132,"y":559,"exts":{},"template":"trawa2"},{"x":-141,"y":564,"exts":{},"template":"trawa2"},{"x":-128,"y":576,"exts":{},"template":"Water"},{"x":-64,"y":576,"exts":{},"template":"Water"},{"x":-192,"y":640,"exts":{},"template":"Water"},{"x":-192,"y":576,"exts":{},"template":"Water"},{"x":896,"y":576,"exts":{},"template":"Water"},{"x":832,"y":506,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":825,"y":502,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":814,"y":496,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":801,"y":491,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":790,"y":485,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":781,"y":479,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":772,"y":475,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":761,"y":472,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":750,"y":468,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":737,"y":464,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":739,"y":463,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":740,"y":462,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":832,"y":512,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":896,"y":512,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":766,"y":542,"exts":{},"template":"trawa2"},{"x":759,"y":538,"exts":{},"template":"trawa2"},{"x":748,"y":533,"exts":{},"template":"trawa2"},{"x":779,"y":561,"exts":{},"template":"trawa2"},{"x":791,"y":564,"exts":{},"template":"trawa2"},{"x":798,"y":566,"exts":{},"template":"trawa2"},{"x":776,"y":556,"exts":{},"template":"trawa2"},{"x":803,"y":568,"exts":{},"template":"trawa2"},{"x":810,"y":570,"exts":{},"template":"trawa2"},{"x":709,"y":524,"exts":{},"template":"trawa2"},{"x":698,"y":517,"exts":{},"template":"trawa2"},{"x":687,"y":508,"exts":{},"template":"trawa2"},{"x":688,"y":492,"exts":{},"template":"trawa2"},{"x":683,"y":478,"exts":{},"template":"trawa2"},{"x":692,"y":473,"exts":{},"template":"trawa2"},{"x":694,"y":466,"exts":{},"template":"trawa2"},{"x":705,"y":442,"exts":{},"template":"trawa2"},{"x":716,"y":415,"exts":{},"template":"trawa2"},{"x":723,"y":415,"exts":{},"template":"trawa2"},{"x":716,"y":421,"exts":{},"template":"trawa2"},{"x":705,"y":410,"exts":{},"template":"trawa2"},{"x":729,"y":424,"exts":{},"template":"trawa2"},{"x":733,"y":433,"exts":{},"template":"trawa2"},{"x":748,"y":447,"exts":{},"template":"trawa2"},{"x":742,"y":460,"exts":{},"template":"trawa2"},{"x":742,"y":475,"exts":{},"template":"trawa2"},{"x":748,"y":493,"exts":{},"template":"trawa2"},{"x":754,"y":452,"exts":{},"template":"trawa2"},{"x":756,"y":465,"exts":{},"template":"trawa2"},{"x":764,"y":476,"exts":{},"template":"trawa2"},{"x":762,"y":472,"exts":{},"template":"trawa2"},{"x":771,"y":496,"exts":{},"template":"trawa2"},{"x":832,"y":576,"exts":{},"template":"Water"},{"x":768,"y":576,"exts":{},"template":"Water"},{"x":768,"y":576,"exts":{},"template":"Water"},{"x":768,"y":576,"exts":{},"template":"Water"},{"x":704,"y":576,"exts":{},"template":"Water"},{"x":704,"y":576,"exts":{},"template":"Water"},{"x":640,"y":576,"exts":{},"template":"Water"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":704,"y":512,"exts":{},"template":"trawa2"},{"x":768,"y":512,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":830,"y":505,"exts":{},"template":"piach d"},{"x":829,"y":501,"exts":{},"template":"piach d"},{"x":815,"y":494,"exts":{},"template":"piach d"},{"x":801,"y":491,"exts":{},"template":"piach d"},{"x":789,"y":484,"exts":{},"template":"piach d"},{"x":779,"y":478,"exts":{},"template":"piach d"},{"x":768,"y":473,"exts":{},"template":"piach d"},{"x":817,"y":550,"exts":{},"template":"trawa2"},{"x":801,"y":543,"exts":{},"template":"trawa2"},{"x":785,"y":533,"exts":{},"template":"trawa2"},{"x":774,"y":530,"exts":{},"template":"trawa2"},{"x":762,"y":524,"exts":{},"template":"trawa2"},{"x":744,"y":511,"exts":{},"template":"trawa2"},{"x":722,"y":486,"exts":{},"template":"trawa2"},{"x":722,"y":481,"exts":{},"template":"trawa2"},{"x":724,"y":471,"exts":{},"template":"trawa2"},{"x":732,"y":428,"exts":{},"template":"trawa2"},{"x":737,"y":471,"exts":{},"template":"trawa2"},{"x":745,"y":471,"exts":{},"template":"trawa2"},{"x":760,"y":483,"exts":{},"template":"trawa2"},{"x":773,"y":506,"exts":{},"template":"trawa2"},{"x":783,"y":513,"exts":{},"template":"trawa2"},{"x":811,"y":550,"exts":{},"template":"trawa2"},{"x":747,"y":472,"exts":{},"template":"trawa2"},{"x":753,"y":476,"exts":{},"template":"trawa2"},{"x":830,"y":566,"exts":{},"template":"trawa2"},{"x":830,"y":561,"exts":{},"template":"trawa2"},{"x":844,"y":567,"exts":{},"template":"trawa2"},{"x":858,"y":570,"exts":{},"template":"trawa2"},{"x":768,"y":576,"exts":{},"template":"Water"},{"x":768,"y":576,"exts":{},"template":"Water"},{"x":704,"y":640,"exts":{},"template":"Water"},{"x":704,"y":576,"exts":{},"template":"Water"},{"x":832,"y":640,"exts":{},"template":"Water"},{"x":896,"y":576,"exts":{},"template":"Water"},{"x":832,"y":576,"exts":{},"template":"Water"},{"x":960,"y":512,"exts":{},"template":"vbn"},{"x":960,"y":512,"exts":{},"template":"piach d"},{"x":128,"y":320,"exts":{},"template":"pixil-frame-0_(8)"},{"x":154,"y":320,"exts":{},"template":"pixil-frame-0_(8)"},{"x":474,"y":-239,"exts":{},"template":"z1"},{"x":467,"y":-215,"exts":{},"template":"z1"},{"x":465,"y":-188,"exts":{},"template":"z1"},{"x":496,"y":-228,"exts":{},"template":"z1"},{"x":527,"y":-295,"exts":{},"template":"z1"},{"x":527,"y":-324,"exts":{},"template":"z1"},{"x":530,"y":-338,"exts":{},"template":"z1"},{"x":536,"y":-371,"exts":{},"template":"z1"},{"x":512,"y":-192,"exts":{},"template":"z1"},{"x":576,"y":-256,"exts":{},"template":"z1"},{"x":576,"y":-320,"exts":{},"template":"z1"},{"x":576,"y":-384,"exts":{},"template":"z1"},{"x":448,"y":-128,"exts":{},"template":"z1"},{"x":384,"y":-128,"exts":{},"template":"z1"},{"x":320,"y":-128,"exts":{},"template":"z1"},{"x":320,"y":-192,"exts":{},"template":"z1"},{"x":320,"y":-192,"exts":{},"template":"z1"},{"x":256,"y":-192,"exts":{},"template":"z1"},{"x":192,"y":-320,"exts":{},"template":"z1"},{"x":192,"y":-384,"exts":{},"template":"z1"},{"x":192,"y":-256,"exts":{},"template":"z1"},{"x":256,"y":-448,"exts":{},"template":"z1"},{"x":384,"y":-512,"exts":{},"template":"z1"},{"x":320,"y":-512,"exts":{},"template":"z1"},{"x":320,"y":-512,"exts":{},"template":"z1"},{"x":448,"y":-512,"exts":{},"template":"z1"},{"x":512,"y":-448,"exts":{},"template":"z1"},{"x":64,"y":-192,"exts":{},"template":"BG"},{"x":320,"y":-128,"exts":{},"template":"BG"},{"x":512,"y":-192,"exts":{},"template":"BG"},{"x":576,"y":-320,"exts":{},"template":"BG"},{"x":576,"y":-384,"exts":{},"template":"BG"},{"x":512,"y":-640,"exts":{},"template":"BG"},{"x":320,"y":-704,"exts":{},"template":"BG"},{"x":64,"y":-640,"exts":{},"template":"BG"},{"x":0,"y":-448,"exts":{},"template":"BG"},{"x":487,"y":-222,"exts":{},"template":"z1"},{"x":483,"y":-422,"exts":{},"template":"z1"},{"x":284,"y":-420,"exts":{},"template":"z1"},{"x":289,"y":-215,"exts":{},"template":"z1"},{"x":527,"y":-345,"exts":{},"template":"z1"},{"x":535,"y":-308,"exts":{},"template":"z1"},{"x":532,"y":-332,"exts":{},"template":"z1"},{"x":388,"y":-478,"exts":{},"template":"z1"},{"x":378,"y":-476,"exts":{},"template":"z1"},{"x":402,"y":-476,"exts":{},"template":"z1"},{"x":250,"y":-297,"exts":{},"template":"z1"},{"x":242,"y":-297,"exts":{},"template":"z1"},{"x":234,"y":-326,"exts":{},"template":"z1"},{"x":372,"y":-164,"exts":{},"template":"z1"},{"x":407,"y":-161,"exts":{},"template":"z1"},{"x":842,"y":-710,"exts":{},"template":"BG"},{"x":1216,"y":-512,"exts":{},"template":"BG"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(23)"},{"x":448,"y":256,"exts":{},"template":"pixil-frame-0_(23)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(23)"},{"x":512,"y":192,"exts":{},"template":"pixil-frame-0_(23)"},{"x":192,"y":128,"exts":{},"template":"pixil-frame-0_(23)"},{"x":576,"y":128,"exts":{},"template":"pixil-frame-0_(23)"}]'),
    bgs: JSON.parse('[{"depth":-2,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'dzungla';
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['sup'] = {
    name: 'sup',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":-128,"y":448,"exts":{},"template":"Water"},{"x":-128,"y":448,"exts":{},"template":"Water"},{"x":-128,"y":576,"exts":{},"template":"Water"},{"x":-128,"y":512,"exts":{},"template":"Water"},{"x":-64,"y":448,"exts":{},"template":"Water"},{"x":0,"y":448,"exts":{},"template":"Water"},{"x":0,"y":512,"exts":{},"template":"Water"},{"x":-64,"y":512,"exts":{},"template":"Water"},{"x":-192,"y":448,"exts":{},"template":"Water"},{"x":-192,"y":512,"exts":{},"template":"Water"},{"x":-192,"y":576,"exts":{},"template":"Water"},{"x":-256,"y":576,"exts":{},"template":"Water"},{"x":-256,"y":512,"exts":{},"template":"Water"},{"x":-256,"y":448,"exts":{},"template":"Water"},{"x":-320,"y":448,"exts":{},"template":"Water"},{"x":-320,"y":512,"exts":{},"template":"Water"},{"x":-320,"y":576,"exts":{},"template":"Water"},{"x":-384,"y":576,"exts":{},"template":"Water"},{"x":-384,"y":512,"exts":{},"template":"Water"},{"x":-384,"y":448,"exts":{},"template":"Water"},{"x":-64,"y":576,"exts":{},"template":"Water"},{"x":0,"y":576,"exts":{},"template":"Water"},{"x":64,"y":576,"exts":{},"template":"Water"},{"x":128,"y":576,"exts":{},"template":"Water"},{"x":128,"y":512,"exts":{},"template":"Water"},{"x":128,"y":512,"exts":{},"template":"Water"},{"x":64,"y":512,"exts":{},"template":"Water"},{"x":64,"y":448,"exts":{},"template":"Water"},{"x":128,"y":448,"exts":{},"template":"Water"},{"x":192,"y":448,"exts":{},"template":"Water"},{"x":192,"y":512,"exts":{},"template":"Water"},{"x":192,"y":576,"exts":{},"template":"Water"},{"x":256,"y":576,"exts":{},"template":"Water"},{"x":256,"y":512,"exts":{},"template":"Water"},{"x":256,"y":448,"exts":{},"template":"Water"},{"x":320,"y":448,"exts":{},"template":"Water"},{"x":320,"y":512,"exts":{},"template":"Water"},{"x":320,"y":576,"exts":{},"template":"Water"},{"x":448,"y":576,"exts":{},"template":"Water"},{"x":384,"y":576,"exts":{},"template":"Water"},{"x":384,"y":512,"exts":{},"template":"Water"},{"x":384,"y":512,"exts":{},"template":"Water"},{"x":448,"y":512,"exts":{},"template":"Water"},{"x":448,"y":448,"exts":{},"template":"Water"},{"x":384,"y":448,"exts":{},"template":"Water"},{"x":512,"y":512,"exts":{},"template":"Water"},{"x":512,"y":576,"exts":{},"template":"Water"},{"x":576,"y":576,"exts":{},"template":"Water"},{"x":576,"y":512,"exts":{},"template":"Water"},{"x":576,"y":448,"exts":{},"template":"Water"},{"x":640,"y":448,"exts":{},"template":"Water"},{"x":640,"y":512,"exts":{},"template":"Water"},{"x":640,"y":576,"exts":{},"template":"Water"},{"x":704,"y":576,"exts":{},"template":"Water"},{"x":768,"y":448,"exts":{},"template":"Water"},{"x":704,"y":512,"exts":{},"template":"Water"},{"x":704,"y":512,"exts":{},"template":"Water"},{"x":704,"y":448,"exts":{},"template":"Water"},{"x":768,"y":512,"exts":{},"template":"Water"},{"x":768,"y":576,"exts":{},"template":"Water"},{"x":896,"y":448,"exts":{},"template":"Water"},{"x":832,"y":448,"exts":{},"template":"Water"},{"x":832,"y":576,"exts":{},"template":"Water"},{"x":832,"y":512,"exts":{},"template":"Water"},{"x":896,"y":512,"exts":{},"template":"Water"},{"x":896,"y":576,"exts":{},"template":"Water"},{"x":960,"y":448,"exts":{},"template":"Water"},{"x":1024,"y":448,"exts":{},"template":"Water"},{"x":1088,"y":448,"exts":{},"template":"Water"},{"x":1152,"y":448,"exts":{},"template":"Water"},{"x":1152,"y":512,"exts":{},"template":"Water"},{"x":1152,"y":576,"exts":{},"template":"Water"},{"x":1088,"y":576,"exts":{},"template":"Water"},{"x":1024,"y":576,"exts":{},"template":"Water"},{"x":960,"y":576,"exts":{},"template":"Water"},{"x":1024,"y":512,"exts":{},"template":"Water"},{"x":1024,"y":512,"exts":{},"template":"Water"},{"x":960,"y":512,"exts":{},"template":"Water"},{"x":1088,"y":512,"exts":{},"template":"Water"},{"x":320,"y":448,"exts":{},"template":"pixil-frame-0_(12)"},{"x":384,"y":448,"exts":{},"template":"pixil-frame-0_(12)"},{"x":448,"y":448,"exts":{},"template":"pixil-frame-0_(12)"},{"x":256,"y":384,"exts":{"newProperty1":""},"template":"ExitNiewidzialne"},{"x":512,"y":448,"exts":{},"template":"Water"},{"x":384,"y":448,"exts":{},"template":"robot"},{"x":512,"y":384,"exts":{"targetRoom":"odlegla_wyspa"},"template":"ExitNiewidzialne"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'plaza';
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['Room_9f4fa01edb74'] = {
    name: 'Room_9f4fa01edb74',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":-128,"y":320,"exts":{},"template":"Water"},{"x":-64,"y":320,"exts":{},"template":"Water"},{"x":0,"y":320,"exts":{},"template":"Water"},{"x":64,"y":320,"exts":{},"template":"Water"},{"x":128,"y":320,"exts":{},"template":"Water"},{"x":192,"y":320,"exts":{},"template":"Water"},{"x":256,"y":320,"exts":{},"template":"Water"},{"x":512,"y":320,"exts":{},"template":"Water"},{"x":640,"y":320,"exts":{},"template":"Water"},{"x":576,"y":320,"exts":{},"template":"Water"},{"x":704,"y":320,"exts":{},"template":"Water"},{"x":768,"y":320,"exts":{},"template":"Water"},{"x":832,"y":320,"exts":{},"template":"Water"},{"x":896,"y":320,"exts":{},"template":"Water"},{"x":896,"y":384,"exts":{},"template":"Water"},{"x":832,"y":384,"exts":{},"template":"Water"},{"x":768,"y":384,"exts":{},"template":"Water"},{"x":704,"y":384,"exts":{},"template":"Water"},{"x":640,"y":384,"exts":{},"template":"Water"},{"x":576,"y":384,"exts":{},"template":"Water"},{"x":512,"y":384,"exts":{},"template":"Water"},{"x":448,"y":384,"exts":{},"template":"Water"},{"x":448,"y":384,"exts":{},"template":"Water"},{"x":384,"y":384,"exts":{},"template":"Water"},{"x":320,"y":384,"exts":{},"template":"Water"},{"x":256,"y":384,"exts":{},"template":"Water"},{"x":192,"y":384,"exts":{},"template":"Water"},{"x":128,"y":384,"exts":{},"template":"Water"},{"x":64,"y":384,"exts":{},"template":"Water"},{"x":0,"y":384,"exts":{},"template":"Water"},{"x":0,"y":384,"exts":{},"template":"Water"},{"x":-64,"y":384,"exts":{},"template":"Water"},{"x":-128,"y":384,"exts":{},"template":"Water"},{"x":-128,"y":512,"exts":{},"template":"Water"},{"x":-64,"y":448,"exts":{},"template":"Water"},{"x":-128,"y":448,"exts":{},"template":"Water"},{"x":-64,"y":512,"exts":{},"template":"Water"},{"x":0,"y":512,"exts":{},"template":"Water"},{"x":64,"y":448,"exts":{},"template":"Water"},{"x":0,"y":448,"exts":{},"template":"Water"},{"x":192,"y":448,"exts":{},"template":"Water"},{"x":128,"y":448,"exts":{},"template":"Water"},{"x":256,"y":448,"exts":{},"template":"Water"},{"x":320,"y":448,"exts":{},"template":"Water"},{"x":448,"y":448,"exts":{},"template":"Water"},{"x":384,"y":448,"exts":{},"template":"Water"},{"x":512,"y":448,"exts":{},"template":"Water"},{"x":640,"y":448,"exts":{},"template":"Water"},{"x":576,"y":448,"exts":{},"template":"Water"},{"x":960,"y":448,"exts":{},"template":"Water"},{"x":896,"y":448,"exts":{},"template":"Water"},{"x":896,"y":448,"exts":{},"template":"Water"},{"x":832,"y":448,"exts":{},"template":"Water"},{"x":832,"y":448,"exts":{},"template":"Water"},{"x":832,"y":448,"exts":{},"template":"Water"},{"x":768,"y":448,"exts":{},"template":"Water"},{"x":768,"y":448,"exts":{},"template":"Water"},{"x":704,"y":512,"exts":{},"template":"Water"},{"x":704,"y":448,"exts":{},"template":"Water"},{"x":704,"y":576,"exts":{},"template":"Water"},{"x":768,"y":576,"exts":{},"template":"Water"},{"x":768,"y":512,"exts":{},"template":"Water"},{"x":832,"y":512,"exts":{},"template":"Water"},{"x":896,"y":512,"exts":{},"template":"Water"},{"x":896,"y":576,"exts":{},"template":"Water"},{"x":896,"y":576,"exts":{},"template":"Water"},{"x":832,"y":576,"exts":{},"template":"Water"},{"x":-128,"y":576,"exts":{},"template":"Water"},{"x":-64,"y":576,"exts":{},"template":"Water"},{"x":0,"y":576,"exts":{},"template":"Water"},{"x":64,"y":576,"exts":{},"template":"Water"},{"x":64,"y":512,"exts":{},"template":"Water"},{"x":128,"y":512,"exts":{},"template":"Water"},{"x":128,"y":576,"exts":{},"template":"Water"},{"x":640,"y":576,"exts":{},"template":"Water"},{"x":640,"y":512,"exts":{},"template":"Water"},{"x":576,"y":576,"exts":{},"template":"Water"},{"x":512,"y":512,"exts":{},"template":"Water"},{"x":448,"y":576,"exts":{},"template":"Water"},{"x":384,"y":512,"exts":{},"template":"Water"},{"x":320,"y":576,"exts":{},"template":"Water"},{"x":256,"y":512,"exts":{},"template":"Water"},{"x":192,"y":576,"exts":{},"template":"Water"},{"x":192,"y":512,"exts":{},"template":"Water"},{"x":256,"y":576,"exts":{},"template":"Water"},{"x":320,"y":512,"exts":{},"template":"Water"},{"x":384,"y":576,"exts":{},"template":"Water"},{"x":384,"y":576,"exts":{},"template":"Water"},{"x":448,"y":512,"exts":{},"template":"Water"},{"x":512,"y":576,"exts":{},"template":"Water"},{"x":576,"y":512,"exts":{},"template":"Water"},{"x":320,"y":320,"exts":{},"template":"Water"},{"x":384,"y":320,"exts":{},"template":"Water"},{"x":448,"y":320,"exts":{},"template":"Water"},{"x":1024,"y":384,"exts":{},"template":"Water"},{"x":1024,"y":512,"exts":{},"template":"Water"},{"x":960,"y":576,"exts":{},"template":"Water"},{"x":960,"y":320,"exts":{},"template":"Water"},{"x":1088,"y":448,"exts":{},"template":"Water"},{"x":1088,"y":320,"exts":{},"template":"Water"},{"x":1088,"y":576,"exts":{},"template":"Water"},{"x":1152,"y":512,"exts":{},"template":"Water"},{"x":1152,"y":384,"exts":{},"template":"Water"},{"x":1216,"y":448,"exts":{},"template":"Water"},{"x":1344,"y":384,"exts":{},"template":"Water"},{"x":1280,"y":384,"exts":{},"template":"Water"},{"x":1280,"y":512,"exts":{},"template":"Water"},{"x":1280,"y":448,"exts":{},"template":"Water"},{"x":1152,"y":448,"exts":{},"template":"Water"},{"x":1024,"y":448,"exts":{},"template":"Water"},{"x":1088,"y":384,"exts":{},"template":"Water"},{"x":960,"y":384,"exts":{},"template":"Water"},{"x":1024,"y":320,"exts":{},"template":"Water"},{"x":1152,"y":320,"exts":{},"template":"Water"},{"x":1280,"y":320,"exts":{},"template":"Water"},{"x":1216,"y":320,"exts":{},"template":"Water"},{"x":1344,"y":320,"exts":{},"template":"Water"},{"x":1216,"y":384,"exts":{},"template":"Water"},{"x":1344,"y":448,"exts":{},"template":"Water"},{"x":1344,"y":512,"exts":{},"template":"Water"},{"x":1344,"y":512,"exts":{},"template":"Water"},{"x":1344,"y":576,"exts":{},"template":"Water"},{"x":1280,"y":576,"exts":{},"template":"Water"},{"x":1216,"y":576,"exts":{},"template":"Water"},{"x":1152,"y":576,"exts":{},"template":"Water"},{"x":1280,"y":512,"exts":{},"template":"Water"},{"x":1088,"y":512,"exts":{},"template":"Water"},{"x":1216,"y":512,"exts":{},"template":"Water"},{"x":1024,"y":576,"exts":{},"template":"Water"},{"x":960,"y":512,"exts":{},"template":"Water"},{"x":384,"y":320,"exts":{},"template":"trawa2"},{"x":512,"y":320,"exts":{},"template":"trawa2"},{"x":448,"y":320,"exts":{},"template":"trawa2"},{"x":576,"y":320,"exts":{},"template":"trawa2"},{"x":640,"y":320,"exts":{},"template":"trawa2"},{"x":768,"y":320,"exts":{},"template":"trawa2"},{"x":704,"y":320,"exts":{},"template":"trawa2"},{"x":448,"y":256,"exts":{},"template":"trawa2"},{"x":512,"y":256,"exts":{},"template":"trawa2"},{"x":576,"y":256,"exts":{},"template":"trawa2"},{"x":640,"y":256,"exts":{},"template":"trawa2"},{"x":704,"y":256,"exts":{},"template":"trawa2"},{"x":768,"y":256,"exts":{},"template":"trawa2"},{"x":896,"y":320,"exts":{},"template":"trawa2"},{"x":832,"y":320,"exts":{},"template":"trawa2"},{"x":832,"y":256,"exts":{},"template":"trawa2"},{"x":384,"y":256,"exts":{},"template":"trawa2"},{"x":384,"y":320,"exts":{},"template":"trawa2"},{"x":320,"y":320,"exts":{},"template":"trawa2"},{"x":320,"y":384,"exts":{},"template":"trawa2"},{"x":256,"y":448,"exts":{},"template":"trawa2"},{"x":320,"y":448,"exts":{},"template":"trawa2"},{"x":384,"y":448,"exts":{},"template":"trawa2"},{"x":448,"y":448,"exts":{},"template":"trawa2"},{"x":512,"y":448,"exts":{},"template":"trawa2"},{"x":576,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":448,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":768,"y":448,"exts":{},"template":"trawa2"},{"x":832,"y":448,"exts":{},"template":"trawa2"},{"x":960,"y":448,"exts":{},"template":"trawa2"},{"x":896,"y":448,"exts":{},"template":"trawa2"},{"x":896,"y":384,"exts":{},"template":"trawa2"},{"x":832,"y":384,"exts":{},"template":"trawa2"},{"x":384,"y":384,"exts":{},"template":"trawa2"},{"x":576,"y":384,"exts":{},"template":"trawa2"},{"x":640,"y":384,"exts":{},"template":"trawa2"},{"x":768,"y":384,"exts":{},"template":"trawa2"},{"x":448,"y":384,"exts":{},"template":"trawa2"},{"x":512,"y":384,"exts":{},"template":"trawa2"},{"x":704,"y":384,"exts":{},"template":"trawa2"},{"x":256,"y":512,"exts":{},"template":"trawa2"},{"x":256,"y":576,"exts":{},"template":"trawa2"},{"x":320,"y":576,"exts":{},"template":"trawa2"},{"x":320,"y":512,"exts":{},"template":"trawa2"},{"x":384,"y":512,"exts":{},"template":"trawa2"},{"x":384,"y":576,"exts":{},"template":"trawa2"},{"x":448,"y":576,"exts":{},"template":"trawa2"},{"x":512,"y":576,"exts":{},"template":"trawa2"},{"x":640,"y":576,"exts":{},"template":"trawa2"},{"x":576,"y":576,"exts":{},"template":"trawa2"},{"x":704,"y":576,"exts":{},"template":"trawa2"},{"x":768,"y":576,"exts":{},"template":"trawa2"},{"x":832,"y":576,"exts":{},"template":"trawa2"},{"x":896,"y":576,"exts":{},"template":"trawa2"},{"x":960,"y":576,"exts":{},"template":"trawa2"},{"x":960,"y":512,"exts":{},"template":"trawa2"},{"x":896,"y":512,"exts":{},"template":"trawa2"},{"x":832,"y":512,"exts":{},"template":"trawa2"},{"x":768,"y":512,"exts":{},"template":"trawa2"},{"x":704,"y":512,"exts":{},"template":"trawa2"},{"x":640,"y":512,"exts":{},"template":"trawa2"},{"x":576,"y":512,"exts":{},"template":"trawa2"},{"x":512,"y":512,"exts":{},"template":"trawa2"},{"x":448,"y":512,"exts":{},"template":"trawa2"},{"x":256,"y":320,"exts":{},"template":"piach d"},{"x":256,"y":384,"exts":{},"template":"piach d"},{"x":192,"y":320,"exts":{},"template":"piach d"},{"x":192,"y":384,"exts":{},"template":"piach d"},{"x":192,"y":448,"exts":{},"template":"piach d"},{"x":192,"y":512,"exts":{},"template":"piach d"},{"x":192,"y":576,"exts":{},"template":"piach d"},{"x":128,"y":320,"exts":{},"template":"piach d"},{"x":128,"y":384,"exts":{},"template":"piach d"},{"x":128,"y":448,"exts":{},"template":"piach d"},{"x":128,"y":512,"exts":{},"template":"piach d"},{"x":128,"y":576,"exts":{},"template":"piach d"},{"x":64,"y":384,"exts":{},"template":"piach d"},{"x":64,"y":448,"exts":{},"template":"piach d"},{"x":128,"y":512,"exts":{},"template":"piach d"},{"x":128,"y":512,"exts":{},"template":"piach d"},{"x":64,"y":512,"exts":{},"template":"piach d"},{"x":64,"y":576,"exts":{},"template":"piach d"},{"x":64,"y":576,"exts":{},"template":"piach d"},{"x":0,"y":576,"exts":{},"template":"piach d"},{"x":0,"y":512,"exts":{},"template":"piach d"},{"x":960,"y":320,"exts":{},"template":"piach d"},{"x":1024,"y":320,"exts":{},"template":"piach d"},{"x":1088,"y":320,"exts":{},"template":"piach d"},{"x":960,"y":384,"exts":{},"template":"piach d"},{"x":1024,"y":384,"exts":{},"template":"piach d"},{"x":1088,"y":384,"exts":{},"template":"piach d"},{"x":1152,"y":384,"exts":{},"template":"piach d"},{"x":1024,"y":448,"exts":{},"template":"piach d"},{"x":1152,"y":448,"exts":{},"template":"piach d"},{"x":1088,"y":448,"exts":{},"template":"piach d"},{"x":1024,"y":512,"exts":{},"template":"piach d"},{"x":1088,"y":512,"exts":{},"template":"piach d"},{"x":1152,"y":512,"exts":{},"template":"piach d"},{"x":1216,"y":512,"exts":{},"template":"piach d"},{"x":1024,"y":576,"exts":{},"template":"piach d"},{"x":1088,"y":576,"exts":{},"template":"piach d"},{"x":1152,"y":576,"exts":{},"template":"piach d"},{"x":1216,"y":576,"exts":{},"template":"piach d"},{"x":-192,"y":576,"exts":{},"template":"Water"},{"x":-192,"y":512,"exts":{},"template":"Water"},{"x":-192,"y":448,"exts":{},"template":"Water"},{"x":-192,"y":320,"exts":{},"template":"Water"},{"x":-192,"y":384,"exts":{},"template":"Water"},{"x":-256,"y":320,"exts":{},"template":"Water"},{"x":-256,"y":384,"exts":{},"template":"Water"},{"x":-256,"y":448,"exts":{},"template":"Water"},{"x":-256,"y":512,"exts":{},"template":"Water"},{"x":-256,"y":576,"exts":{},"template":"Water"},{"x":-320,"y":576,"exts":{},"template":"Water"},{"x":-320,"y":448,"exts":{},"template":"Water"},{"x":-320,"y":512,"exts":{},"template":"Water"},{"x":-320,"y":384,"exts":{},"template":"Water"},{"x":-320,"y":320,"exts":{},"template":"Water"},{"x":1408,"y":576,"exts":{},"template":"Water"},{"x":1472,"y":576,"exts":{},"template":"Water"},{"x":1536,"y":576,"exts":{},"template":"Water"},{"x":1536,"y":512,"exts":{},"template":"Water"},{"x":1536,"y":512,"exts":{},"template":"Water"},{"x":1536,"y":512,"exts":{},"template":"Water"},{"x":1536,"y":512,"exts":{},"template":"Water"},{"x":1536,"y":448,"exts":{},"template":"Water"},{"x":1536,"y":320,"exts":{},"template":"Water"},{"x":1536,"y":384,"exts":{},"template":"Water"},{"x":1472,"y":320,"exts":{},"template":"Water"},{"x":1408,"y":320,"exts":{},"template":"Water"},{"x":1472,"y":384,"exts":{},"template":"Water"},{"x":1408,"y":448,"exts":{},"template":"Water"},{"x":1472,"y":512,"exts":{},"template":"Water"},{"x":1408,"y":512,"exts":{},"template":"Water"},{"x":1472,"y":448,"exts":{},"template":"Water"},{"x":1408,"y":384,"exts":{},"template":"Water"},{"x":512,"y":192,"exts":{},"template":"trawa2"},{"x":576,"y":192,"exts":{},"template":"trawa2"},{"x":640,"y":192,"exts":{},"template":"trawa2"},{"x":704,"y":192,"exts":{},"template":"trawa2"},{"x":768,"y":192,"exts":{},"template":"trawa2"},{"x":576,"y":64,"exts":{},"template":"ExitNiewidzialne"},{"x":640,"y":64,"exts":{},"template":"ExitNiewidzialne"},{"x":704,"y":64,"exts":{},"template":"ExitNiewidzialne"},{"x":704,"y":0,"exts":{},"template":"ExitNiewidzialne"},{"x":704,"y":-64,"exts":{},"template":"ExitNiewidzialne"},{"x":640,"y":-64,"exts":{},"template":"ExitNiewidzialne"},{"x":576,"y":-64,"exts":{},"template":"ExitNiewidzialne"},{"x":576,"y":0,"exts":{},"template":"ExitNiewidzialne"},{"x":704,"y":0,"exts":{},"template":"ExitNiewidzialne"},{"x":640,"y":0,"exts":{},"template":"ExitNiewidzialne"},{"x":640,"y":64,"exts":{},"template":"pixi"},{"x":704,"y":0,"exts":{},"template":"pixi"},{"x":576,"y":0,"exts":{},"template":"pixi"},{"x":640,"y":-64,"exts":{},"template":"pixi"},{"x":640,"y":0,"exts":{},"template":"pixi"},{"x":704,"y":-64,"exts":{},"template":"pixi"},{"x":576,"y":-64,"exts":{},"template":"pixi"},{"x":576,"y":64,"exts":{},"template":"pixi"},{"x":704,"y":64,"exts":{},"template":"pixi"},{"x":640,"y":0,"exts":{},"template":"zernnit"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['Room_Jq8Jh1'] = {
    name: 'Room_Jq8Jh1',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['odlegla_wyspa'] = {
    name: 'odlegla_wyspa',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":0,"y":640,"exts":{},"template":"Water"},{"x":64,"y":640,"exts":{},"template":"Water"},{"x":128,"y":640,"exts":{},"template":"Water"},{"x":320,"y":640,"exts":{},"template":"Water"},{"x":256,"y":640,"exts":{},"template":"Water"},{"x":192,"y":640,"exts":{},"template":"Water"},{"x":512,"y":640,"exts":{},"template":"Water"},{"x":448,"y":640,"exts":{},"template":"Water"},{"x":384,"y":640,"exts":{},"template":"Water"},{"x":640,"y":640,"exts":{},"template":"Water"},{"x":640,"y":640,"exts":{},"template":"Water"},{"x":576,"y":640,"exts":{},"template":"Water"},{"x":704,"y":640,"exts":{},"template":"Water"},{"x":768,"y":640,"exts":{},"template":"Water"},{"x":896,"y":640,"exts":{},"template":"Water"},{"x":832,"y":640,"exts":{},"template":"Water"},{"x":960,"y":640,"exts":{},"template":"Water"},{"x":1024,"y":640,"exts":{},"template":"Water"},{"x":1088,"y":640,"exts":{},"template":"Water"},{"x":1216,"y":640,"exts":{},"template":"Water"},{"x":1216,"y":640,"exts":{},"template":"Water"},{"x":1152,"y":640,"exts":{},"template":"Water"},{"x":1216,"y":576,"exts":{},"template":"Water"},{"x":1152,"y":576,"exts":{},"template":"Water"},{"x":1088,"y":576,"exts":{},"template":"Water"},{"x":1024,"y":576,"exts":{},"template":"Water"},{"x":1024,"y":576,"exts":{},"template":"Water"},{"x":960,"y":576,"exts":{},"template":"Water"},{"x":896,"y":576,"exts":{},"template":"Water"},{"x":832,"y":576,"exts":{},"template":"Water"},{"x":832,"y":576,"exts":{},"template":"Water"},{"x":832,"y":576,"exts":{},"template":"Water"},{"x":832,"y":576,"exts":{},"template":"Water"},{"x":704,"y":576,"exts":{},"template":"Water"},{"x":768,"y":576,"exts":{},"template":"Water"},{"x":640,"y":576,"exts":{},"template":"Water"},{"x":576,"y":576,"exts":{},"template":"Water"},{"x":512,"y":576,"exts":{},"template":"Water"},{"x":384,"y":576,"exts":{},"template":"Water"},{"x":448,"y":576,"exts":{},"template":"Water"},{"x":320,"y":576,"exts":{},"template":"Water"},{"x":192,"y":576,"exts":{},"template":"Water"},{"x":128,"y":576,"exts":{},"template":"Water"},{"x":64,"y":576,"exts":{},"template":"Water"},{"x":64,"y":576,"exts":{},"template":"Water"},{"x":0,"y":576,"exts":{},"template":"Water"},{"x":64,"y":512,"exts":{},"template":"Water"},{"x":128,"y":576,"exts":{},"template":"Water"},{"x":192,"y":512,"exts":{},"template":"Water"},{"x":128,"y":512,"exts":{},"template":"Water"},{"x":192,"y":512,"exts":{},"template":"Water"},{"x":256,"y":512,"exts":{},"template":"Water"},{"x":256,"y":576,"exts":{},"template":"Water"},{"x":384,"y":512,"exts":{},"template":"Water"},{"x":320,"y":512,"exts":{},"template":"Water"},{"x":0,"y":512,"exts":{},"template":"Water"},{"x":512,"y":512,"exts":{},"template":"Water"},{"x":448,"y":512,"exts":{},"template":"Water"},{"x":640,"y":512,"exts":{},"template":"Water"},{"x":704,"y":512,"exts":{},"template":"Water"},{"x":768,"y":512,"exts":{},"template":"Water"},{"x":896,"y":512,"exts":{},"template":"Water"},{"x":832,"y":512,"exts":{},"template":"Water"},{"x":960,"y":512,"exts":{},"template":"Water"},{"x":1024,"y":512,"exts":{},"template":"Water"},{"x":1088,"y":512,"exts":{},"template":"Water"},{"x":1216,"y":512,"exts":{},"template":"Water"},{"x":1152,"y":512,"exts":{},"template":"Water"},{"x":1216,"y":1088,"exts":{},"template":"trawa2"},{"x":576,"y":512,"exts":{},"template":"Water"},{"x":512,"y":448,"exts":{},"template":"trawa2"},{"x":576,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":448,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":768,"y":448,"exts":{},"template":"trawa2"},{"x":832,"y":448,"exts":{},"template":"trawa2"},{"x":512,"y":448,"exts":{},"template":"trawa2"},{"x":512,"y":448,"exts":{},"template":"trawa2"},{"x":448,"y":448,"exts":{},"template":"trawa2"},{"x":384,"y":448,"exts":{},"template":"trawa2"},{"x":320,"y":448,"exts":{},"template":"trawa2"},{"x":256,"y":448,"exts":{},"template":"trawa2"},{"x":192,"y":448,"exts":{},"template":"piach d"},{"x":128,"y":448,"exts":{},"template":"piach d"},{"x":128,"y":448,"exts":{},"template":"piach d"},{"x":64,"y":448,"exts":{},"template":"piach d"},{"x":896,"y":448,"exts":{},"template":"piach d"},{"x":960,"y":448,"exts":{},"template":"piach d"},{"x":1024,"y":448,"exts":{},"template":"piach d"},{"x":960,"y":448,"exts":{},"template":"piach d"},{"x":960,"y":384,"exts":{},"template":"piach d"},{"x":960,"y":384,"exts":{},"template":"piach d"},{"x":960,"y":384,"exts":{},"template":"piach d"},{"x":896,"y":384,"exts":{},"template":"piach d"},{"x":896,"y":384,"exts":{},"template":"piach d"},{"x":128,"y":384,"exts":{},"template":"piach d"},{"x":192,"y":384,"exts":{},"template":"piach d"},{"x":256,"y":384,"exts":{},"template":"trawa2"},{"x":256,"y":320,"exts":{},"template":"trawa2"},{"x":320,"y":320,"exts":{},"template":"trawa2"},{"x":320,"y":320,"exts":{},"template":"trawa2"},{"x":320,"y":320,"exts":{},"template":"trawa2"},{"x":320,"y":256,"exts":{},"template":"trawa2"},{"x":384,"y":256,"exts":{},"template":"trawa2"},{"x":512,"y":192,"exts":{},"template":"trawa2"},{"x":512,"y":192,"exts":{},"template":"trawa2"},{"x":448,"y":192,"exts":{},"template":"trawa2"},{"x":832,"y":320,"exts":{},"template":"trawa2"},{"x":832,"y":320,"exts":{},"template":"trawa2"},{"x":832,"y":320,"exts":{},"template":"trawa2"},{"x":768,"y":320,"exts":{},"template":"trawa2"},{"x":704,"y":320,"exts":{},"template":"trawa2"},{"x":640,"y":256,"exts":{},"template":"trawa2"},{"x":576,"y":256,"exts":{},"template":"trawa2"},{"x":832,"y":384,"exts":{},"template":"trawa2"},{"x":768,"y":384,"exts":{},"template":"trawa2"},{"x":768,"y":384,"exts":{},"template":"trawa2"},{"x":448,"y":256,"exts":{},"template":"trawa2"},{"x":512,"y":256,"exts":{},"template":"trawa2"},{"x":640,"y":320,"exts":{},"template":"trawa2"},{"x":576,"y":320,"exts":{},"template":"trawa2"},{"x":512,"y":320,"exts":{},"template":"trawa2"},{"x":448,"y":320,"exts":{},"template":"trawa2"},{"x":384,"y":320,"exts":{},"template":"trawa2"},{"x":320,"y":384,"exts":{},"template":"trawa2"},{"x":448,"y":384,"exts":{},"template":"trawa2"},{"x":384,"y":384,"exts":{},"template":"trawa2"},{"x":512,"y":384,"exts":{},"template":"trawa2"},{"x":576,"y":384,"exts":{},"template":"trawa2"},{"x":640,"y":384,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":768,"y":384,"exts":{},"template":"trawa2"},{"x":704,"y":384,"exts":{},"template":"trawa2"},{"x":896,"y":448,"exts":{},"template":"trawa2"},{"x":896,"y":448,"exts":{},"template":"trawa2"},{"x":896,"y":384,"exts":{},"template":"trawa2"},{"x":256,"y":448,"exts":{},"template":"trawa2"},{"x":256,"y":448,"exts":{},"template":"trawa2"},{"x":256,"y":448,"exts":{},"template":"trawa2"},{"x":192,"y":448,"exts":{},"template":"trawa2"},{"x":896,"y":448,"exts":{},"template":"piach d"},{"x":177,"y":485,"exts":{},"template":"trawa2"},{"x":160,"y":494,"exts":{},"template":"trawa2"},{"x":184,"y":464,"exts":{},"template":"trawa2"},{"x":186,"y":455,"exts":{},"template":"trawa2"},{"x":201,"y":444,"exts":{},"template":"trawa2"},{"x":153,"y":495,"exts":{},"template":"trawa2"},{"x":224,"y":421,"exts":{},"template":"trawa2"},{"x":210,"y":422,"exts":{},"template":"trawa2"},{"x":220,"y":412,"exts":{},"template":"trawa2"},{"x":229,"y":405,"exts":{},"template":"trawa2"},{"x":240,"y":399,"exts":{},"template":"trawa2"},{"x":242,"y":386,"exts":{},"template":"trawa2"},{"x":242,"y":379,"exts":{},"template":"trawa2"},{"x":242,"y":378,"exts":{},"template":"trawa2"},{"x":245,"y":366,"exts":{},"template":"trawa2"},{"x":249,"y":352,"exts":{},"template":"trawa2"},{"x":253,"y":323,"exts":{},"template":"trawa2"},{"x":255,"y":322,"exts":{},"template":"trawa2"},{"x":267,"y":306,"exts":{},"template":"trawa2"},{"x":276,"y":287,"exts":{},"template":"trawa2"},{"x":278,"y":285,"exts":{},"template":"trawa2"},{"x":295,"y":275,"exts":{},"template":"trawa2"},{"x":296,"y":273,"exts":{},"template":"trawa2"},{"x":296,"y":273,"exts":{},"template":"trawa2"},{"x":289,"y":286,"exts":{},"template":"trawa2"},{"x":288,"y":286,"exts":{},"template":"trawa2"},{"x":288,"y":286,"exts":{},"template":"trawa2"},{"x":282,"y":293,"exts":{},"template":"trawa2"},{"x":278,"y":300,"exts":{},"template":"trawa2"},{"x":332,"y":249,"exts":{},"template":"trawa2"},{"x":351,"y":236,"exts":{},"template":"trawa2"},{"x":355,"y":236,"exts":{},"template":"trawa2"},{"x":372,"y":227,"exts":{},"template":"trawa2"},{"x":374,"y":227,"exts":{},"template":"trawa2"},{"x":384,"y":220,"exts":{},"template":"trawa2"},{"x":385,"y":220,"exts":{},"template":"trawa2"},{"x":402,"y":198,"exts":{},"template":"trawa2"},{"x":404,"y":198,"exts":{},"template":"trawa2"},{"x":391,"y":206,"exts":{},"template":"trawa2"},{"x":391,"y":206,"exts":{},"template":"trawa2"},{"x":387,"y":211,"exts":{},"template":"trawa2"},{"x":422,"y":186,"exts":{},"template":"trawa2"},{"x":447,"y":186,"exts":{},"template":"trawa2"},{"x":448,"y":186,"exts":{},"template":"trawa2"},{"x":453,"y":180,"exts":{},"template":"trawa2"},{"x":478,"y":184,"exts":{},"template":"trawa2"},{"x":503,"y":187,"exts":{},"template":"trawa2"},{"x":514,"y":190,"exts":{},"template":"trawa2"},{"x":526,"y":198,"exts":{},"template":"trawa2"},{"x":533,"y":207,"exts":{},"template":"trawa2"},{"x":536,"y":209,"exts":{},"template":"trawa2"},{"x":550,"y":209,"exts":{},"template":"trawa2"},{"x":552,"y":209,"exts":{},"template":"trawa2"},{"x":552,"y":209,"exts":{},"template":"trawa2"},{"x":552,"y":209,"exts":{},"template":"trawa2"},{"x":564,"y":209,"exts":{},"template":"trawa2"},{"x":573,"y":217,"exts":{},"template":"trawa2"},{"x":587,"y":224,"exts":{},"template":"trawa2"},{"x":603,"y":229,"exts":{},"template":"trawa2"},{"x":615,"y":236,"exts":{},"template":"trawa2"},{"x":623,"y":236,"exts":{},"template":"trawa2"},{"x":629,"y":242,"exts":{},"template":"trawa2"},{"x":636,"y":242,"exts":{},"template":"trawa2"},{"x":648,"y":256,"exts":{},"template":"trawa2"},{"x":666,"y":259,"exts":{},"template":"trawa2"},{"x":678,"y":266,"exts":{},"template":"trawa2"},{"x":679,"y":267,"exts":{},"template":"trawa2"},{"x":692,"y":267,"exts":{},"template":"trawa2"},{"x":694,"y":267,"exts":{},"template":"trawa2"},{"x":717,"y":269,"exts":{},"template":"trawa2"},{"x":747,"y":270,"exts":{},"template":"trawa2"},{"x":747,"y":272,"exts":{},"template":"trawa2"},{"x":767,"y":279,"exts":{},"template":"trawa2"},{"x":787,"y":285,"exts":{},"template":"trawa2"},{"x":810,"y":290,"exts":{},"template":"trawa2"},{"x":836,"y":303,"exts":{},"template":"trawa2"},{"x":830,"y":302,"exts":{},"template":"trawa2"},{"x":844,"y":323,"exts":{},"template":"trawa2"},{"x":866,"y":333,"exts":{},"template":"trawa2"},{"x":883,"y":338,"exts":{},"template":"trawa2"},{"x":889,"y":343,"exts":{},"template":"trawa2"},{"x":894,"y":353,"exts":{},"template":"trawa2"},{"x":894,"y":411,"exts":{},"template":"trawa2"},{"x":894,"y":411,"exts":{},"template":"trawa2"},{"x":894,"y":417,"exts":{},"template":"trawa2"},{"x":894,"y":418,"exts":{},"template":"trawa2"},{"x":882,"y":422,"exts":{},"template":"trawa2"},{"x":867,"y":438,"exts":{},"template":"trawa2"},{"x":874,"y":431,"exts":{},"template":"trawa2"},{"x":856,"y":442,"exts":{},"template":"trawa2"},{"x":850,"y":445,"exts":{},"template":"trawa2"},{"x":849,"y":450,"exts":{},"template":"trawa2"},{"x":192,"y":512,"exts":{},"template":"Water"},{"x":192,"y":512,"exts":{},"template":"Water"},{"x":128,"y":512,"exts":{},"template":"Water"},{"x":896,"y":512,"exts":{},"template":"Water"},{"x":832,"y":512,"exts":{},"template":"Water"},{"x":896,"y":512,"exts":{},"template":"Water"},{"x":896,"y":512,"exts":{},"template":"Water"},{"x":138,"y":375,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":154,"y":372,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":173,"y":372,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":183,"y":368,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":115,"y":388,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":115,"y":388,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":115,"y":388,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":101,"y":402,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":107,"y":395,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":91,"y":415,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":68,"y":428,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":57,"y":438,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":52,"y":442,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":52,"y":444,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":34,"y":460,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":19,"y":473,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":15,"y":478,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":11,"y":484,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":5,"y":487,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-1,"y":493,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-8,"y":500,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-14,"y":506,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":64,"y":576,"exts":{},"template":"Water"},{"x":0,"y":512,"exts":{},"template":"Water"},{"x":128,"y":512,"exts":{},"template":"Water"},{"x":64,"y":512,"exts":{},"template":"Water"},{"x":-64,"y":640,"exts":{},"template":"Water"},{"x":-64,"y":576,"exts":{},"template":"Water"},{"x":-128,"y":512,"exts":{},"template":"Water"},{"x":-128,"y":576,"exts":{},"template":"Water"},{"x":-128,"y":640,"exts":{},"template":"Water"},{"x":-128,"y":576,"exts":{},"template":"Water"},{"x":-192,"y":512,"exts":{},"template":"Water"},{"x":-192,"y":576,"exts":{},"template":"Water"},{"x":-192,"y":640,"exts":{},"template":"Water"},{"x":217,"y":405,"exts":{},"template":"trawa2"},{"x":237,"y":394,"exts":{},"template":"trawa2"},{"x":239,"y":382,"exts":{},"template":"trawa2"},{"x":232,"y":395,"exts":{},"template":"trawa2"},{"x":204,"y":422,"exts":{},"template":"trawa2"},{"x":203,"y":429,"exts":{},"template":"trawa2"},{"x":203,"y":431,"exts":{},"template":"trawa2"},{"x":200,"y":431,"exts":{},"template":"trawa2"},{"x":199,"y":432,"exts":{},"template":"trawa2"},{"x":232,"y":363,"exts":{},"template":"trawa2"},{"x":576,"y":256,"exts":{},"template":"trawa2"},{"x":640,"y":320,"exts":{},"template":"trawa2"},{"x":640,"y":320,"exts":{},"template":"trawa2"},{"x":704,"y":320,"exts":{},"template":"trawa2"},{"x":832,"y":320,"exts":{},"template":"trawa2"},{"x":832,"y":384,"exts":{},"template":"trawa2"},{"x":896,"y":384,"exts":{},"template":"trawa2"},{"x":448,"y":256,"exts":{},"template":"trawa2"},{"x":384,"y":256,"exts":{},"template":"trawa2"},{"x":448,"y":256,"exts":{},"template":"trawa2"},{"x":512,"y":256,"exts":{},"template":"trawa2"},{"x":512,"y":256,"exts":{},"template":"trawa2"},{"x":384,"y":256,"exts":{},"template":"trawa2"},{"x":512,"y":192,"exts":{},"template":"trawa2"},{"x":640,"y":256,"exts":{},"template":"trawa2"},{"x":640,"y":256,"exts":{},"template":"trawa2"},{"x":704,"y":256,"exts":{},"template":"trawa2"},{"x":768,"y":320,"exts":{},"template":"trawa2"},{"x":448,"y":256,"exts":{},"template":"trawa2"},{"x":448,"y":192,"exts":{},"template":"trawa2"},{"x":384,"y":256,"exts":{},"template":"trawa2"},{"x":320,"y":256,"exts":{},"template":"trawa2"},{"x":384,"y":192,"exts":{},"template":"trawa2"},{"x":955,"y":372,"exts":{},"template":"piach d"},{"x":943,"y":362,"exts":{},"template":"piach d"},{"x":946,"y":388,"exts":{},"template":"piach d"},{"x":936,"y":376,"exts":{},"template":"piach d"},{"x":971,"y":390,"exts":{},"template":"piach d"},{"x":971,"y":397,"exts":{},"template":"piach d"},{"x":984,"y":404,"exts":{},"template":"piach d"},{"x":986,"y":404,"exts":{},"template":"piach d"},{"x":1011,"y":430,"exts":{},"template":"piach d"},{"x":1012,"y":432,"exts":{},"template":"piach d"},{"x":1008,"y":408,"exts":{},"template":"piach d"},{"x":1018,"y":423,"exts":{},"template":"piach d"},{"x":1022,"y":454,"exts":{},"template":"piach d"},{"x":1026,"y":456,"exts":{},"template":"piach d"},{"x":1037,"y":457,"exts":{},"template":"piach d"},{"x":1053,"y":460,"exts":{},"template":"piach d"},{"x":1074,"y":468,"exts":{},"template":"piach d"},{"x":1077,"y":473,"exts":{},"template":"piach d"},{"x":1078,"y":475,"exts":{},"template":"piach d"},{"x":1084,"y":477,"exts":{},"template":"piach d"},{"x":1102,"y":478,"exts":{},"template":"piach d"},{"x":1102,"y":478,"exts":{},"template":"piach d"},{"x":1119,"y":488,"exts":{},"template":"piach d"},{"x":960,"y":448,"exts":{},"template":"piach d"},{"x":960,"y":448,"exts":{},"template":"piach d"},{"x":960,"y":448,"exts":{},"template":"piach d"},{"x":960,"y":384,"exts":{},"template":"piach d"},{"x":1024,"y":512,"exts":{},"template":"Water"},{"x":1088,"y":512,"exts":{},"template":"Water"},{"x":1152,"y":512,"exts":{},"template":"Water"},{"x":64,"y":448,"exts":{},"template":"piach d"},{"x":128,"y":384,"exts":{},"template":"piach d"},{"x":1216,"y":1088,"exts":{},"template":"BG"},{"x":-320,"y":512,"exts":{},"template":"Water"},{"x":-256,"y":576,"exts":{},"template":"Water"},{"x":-256,"y":576,"exts":{},"template":"Water"},{"x":-256,"y":512,"exts":{},"template":"Water"},{"x":-384,"y":512,"exts":{},"template":"Water"},{"x":-384,"y":576,"exts":{},"template":"Water"},{"x":-320,"y":576,"exts":{},"template":"Water"},{"x":-320,"y":640,"exts":{},"template":"Water"},{"x":-384,"y":640,"exts":{},"template":"Water"},{"x":-256,"y":640,"exts":{},"template":"Water"},{"x":-384,"y":576,"exts":{},"template":"Water"},{"x":-448,"y":576,"exts":{},"template":"Water"},{"x":-448,"y":512,"exts":{},"template":"Water"},{"x":-448,"y":512,"exts":{},"template":"Water"},{"x":-512,"y":512,"exts":{},"template":"Water"},{"x":-576,"y":512,"exts":{},"template":"Water"},{"x":-640,"y":512,"exts":{},"template":"Water"},{"x":-704,"y":512,"exts":{},"template":"Water"},{"x":-704,"y":512,"exts":{},"template":"Water"},{"x":-768,"y":512,"exts":{},"template":"Water"},{"x":-832,"y":512,"exts":{},"template":"Water"},{"x":-832,"y":576,"exts":{},"template":"Water"},{"x":-832,"y":640,"exts":{},"template":"Water"},{"x":-768,"y":640,"exts":{},"template":"Water"},{"x":-768,"y":640,"exts":{},"template":"Water"},{"x":-704,"y":576,"exts":{},"template":"Water"},{"x":-768,"y":576,"exts":{},"template":"Water"},{"x":-640,"y":640,"exts":{},"template":"Water"},{"x":-640,"y":576,"exts":{},"template":"Water"},{"x":-576,"y":576,"exts":{},"template":"Water"},{"x":-576,"y":640,"exts":{},"template":"Water"},{"x":-512,"y":640,"exts":{},"template":"Water"},{"x":-448,"y":640,"exts":{},"template":"Water"},{"x":-512,"y":576,"exts":{},"template":"Water"},{"x":-704,"y":640,"exts":{},"template":"Water"},{"x":-896,"y":512,"exts":{},"template":"Water"},{"x":-896,"y":512,"exts":{},"template":"Water"},{"x":-960,"y":512,"exts":{},"template":"Water"},{"x":-1024,"y":512,"exts":{},"template":"Water"},{"x":-960,"y":576,"exts":{},"template":"Water"},{"x":-960,"y":576,"exts":{},"template":"Water"},{"x":-1024,"y":576,"exts":{},"template":"Water"},{"x":-960,"y":640,"exts":{},"template":"Water"},{"x":-1024,"y":640,"exts":{},"template":"Water"},{"x":-832,"y":576,"exts":{},"template":"Water"},{"x":-896,"y":640,"exts":{},"template":"Water"},{"x":-832,"y":576,"exts":{},"template":"Water"},{"x":-896,"y":576,"exts":{},"template":"Water"},{"x":-192,"y":512,"exts":{},"template":"pixil-frame-0_(12)"},{"x":-192,"y":512,"exts":{},"template":"pixil-frame-0_(12)"},{"x":-256,"y":512,"exts":{},"template":"pixil-frame-0_(12)"},{"x":-320,"y":512,"exts":{},"template":"pixil-frame-0_(12)"},{"x":-256,"y":512,"exts":{},"template":"robot"},{"x":960,"y":128,"exts":{"targetRoom":"sekret"},"template":"ExitNiewidzialne"},{"x":960,"y":128,"exts":{},"template":"pixil-frame-0_(22)"},{"x":-384,"y":448,"exts":{"targetRoom":"sup"},"template":"ExitNiewidzialne"},{"x":-64,"y":512,"exts":{},"template":"Water"},{"x":0,"y":512,"exts":{},"template":"Water"},{"x":-64,"y":512,"exts":{},"template":"Water"},{"x":-128,"y":576,"exts":{},"template":"WaterTop"},{"x":-64,"y":576,"exts":{},"template":"WaterTop"},{"x":0,"y":576,"exts":{},"template":"WaterTop"},{"x":64,"y":576,"exts":{},"template":"WaterTop"},{"x":128,"y":576,"exts":{},"template":"WaterTop"},{"x":-192,"y":576,"exts":{},"template":"WaterTop"},{"x":-128,"y":576,"exts":{},"template":"Water"},{"x":-192,"y":576,"exts":{},"template":"Water"},{"x":-64,"y":576,"exts":{},"template":"Water"},{"x":64,"y":576,"exts":{},"template":"Water"},{"x":0,"y":576,"exts":{},"template":"Water"},{"x":128,"y":576,"exts":{},"template":"Water"},{"x":28,"y":472,"exts":{},"template":"piach d"},{"x":13,"y":485,"exts":{},"template":"piach d"},{"x":6,"y":487,"exts":{},"template":"piach d"},{"x":-9,"y":494,"exts":{},"template":"piach d"},{"x":-18,"y":500,"exts":{},"template":"piach d"},{"x":64,"y":512,"exts":{},"template":"Water"},{"x":64,"y":512,"exts":{},"template":"Water"},{"x":0,"y":512,"exts":{},"template":"Water"},{"x":0,"y":512,"exts":{},"template":"Water"},{"x":-64,"y":512,"exts":{},"template":"Water"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'sekret';
inGameRoomStart(this);

    },
    extends: {}
}
ct.rooms.templates['sekret'] = {
    name: 'sekret',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":256,"y":256,"exts":{},"template":"uio"},{"x":256,"y":256,"exts":{},"template":"uio"},{"x":320,"y":256,"exts":{},"template":"uio"},{"x":384,"y":256,"exts":{},"template":"uio"},{"x":448,"y":256,"exts":{},"template":"uio"},{"x":512,"y":256,"exts":{},"template":"uio"},{"x":256,"y":320,"exts":{},"template":"uio"},{"x":256,"y":384,"exts":{},"template":"uio"},{"x":256,"y":512,"exts":{},"template":"uio"},{"x":448,"y":576,"exts":{},"template":"uio"},{"x":512,"y":576,"exts":{},"template":"uio"},{"x":576,"y":576,"exts":{},"template":"uio"},{"x":576,"y":256,"exts":{},"template":"uio"},{"x":640,"y":192,"exts":{},"template":"uio"},{"x":704,"y":448,"exts":{},"template":"uio"},{"x":768,"y":384,"exts":{},"template":"uio"},{"x":832,"y":384,"exts":{},"template":"uio"},{"x":896,"y":320,"exts":{},"template":"uio"},{"x":896,"y":192,"exts":{},"template":"uio"},{"x":832,"y":192,"exts":{},"template":"uio"},{"x":832,"y":128,"exts":{},"template":"uio"},{"x":832,"y":128,"exts":{},"template":"uio"},{"x":768,"y":128,"exts":{},"template":"uio"},{"x":704,"y":128,"exts":{},"template":"uio"},{"x":640,"y":640,"exts":{},"template":"uio"},{"x":768,"y":640,"exts":{},"template":"uio"},{"x":704,"y":640,"exts":{},"template":"uio"},{"x":768,"y":448,"exts":{},"template":"uio"},{"x":832,"y":448,"exts":{},"template":"uio"},{"x":896,"y":512,"exts":{},"template":"uio"},{"x":832,"y":704,"exts":{},"template":"uio"},{"x":896,"y":768,"exts":{},"template":"uio"},{"x":960,"y":512,"exts":{},"template":"uio"},{"x":1024,"y":512,"exts":{},"template":"uio"},{"x":1088,"y":512,"exts":{},"template":"uio"},{"x":1152,"y":512,"exts":{},"template":"uio"},{"x":960,"y":832,"exts":{},"template":"uio"},{"x":960,"y":896,"exts":{},"template":"uio"},{"x":1024,"y":960,"exts":{},"template":"uio"},{"x":1088,"y":1024,"exts":{},"template":"uio"},{"x":1152,"y":1024,"exts":{},"template":"uio"},{"x":1216,"y":1024,"exts":{},"template":"uio"},{"x":1280,"y":960,"exts":{},"template":"uio"},{"x":1344,"y":896,"exts":{},"template":"uio"},{"x":1088,"y":960,"exts":{},"template":"lava2"},{"x":1152,"y":960,"exts":{},"template":"lava2"},{"x":1216,"y":960,"exts":{},"template":"lava2"},{"x":1216,"y":896,"exts":{},"template":"lava2"},{"x":1280,"y":896,"exts":{},"template":"lava2"},{"x":1088,"y":896,"exts":{},"template":"lava2"},{"x":1152,"y":896,"exts":{},"template":"lava2"},{"x":1024,"y":896,"exts":{},"template":"lava2"},{"x":1088,"y":960,"exts":{},"template":"lava2"},{"x":1088,"y":832,"exts":{},"template":"lava2-top"},{"x":1024,"y":832,"exts":{},"template":"lava2-top"},{"x":1152,"y":832,"exts":{},"template":"lava2-top"},{"x":1216,"y":832,"exts":{},"template":"lava2-top"},{"x":1280,"y":832,"exts":{},"template":"lava2-top"},{"x":1344,"y":832,"exts":{},"template":"lava2-top"},{"x":1472,"y":832,"exts":{},"template":"lava2-top"},{"x":1536,"y":832,"exts":{},"template":"lava2-top"},{"x":1600,"y":832,"exts":{},"template":"lava2-top"},{"x":1664,"y":832,"exts":{},"template":"lava2-top"},{"x":1728,"y":832,"exts":{},"template":"lava2-top"},{"x":1728,"y":832,"exts":{},"template":"lava2-top"},{"x":1408,"y":896,"exts":{},"template":"lava2"},{"x":1472,"y":896,"exts":{},"template":"lava2"},{"x":1472,"y":960,"exts":{},"template":"lava2"},{"x":1600,"y":960,"exts":{},"template":"lava2"},{"x":1536,"y":960,"exts":{},"template":"lava2"},{"x":1600,"y":1024,"exts":{},"template":"lava2"},{"x":1664,"y":960,"exts":{},"template":"lava2"},{"x":1664,"y":1024,"exts":{},"template":"lava2"},{"x":1728,"y":960,"exts":{},"template":"lava2"},{"x":1728,"y":960,"exts":{},"template":"lava2"},{"x":1728,"y":960,"exts":{},"template":"lava2"},{"x":1728,"y":896,"exts":{},"template":"lava2"},{"x":1664,"y":896,"exts":{},"template":"lava2"},{"x":1600,"y":896,"exts":{},"template":"lava2"},{"x":1536,"y":896,"exts":{},"template":"lava2"},{"x":1792,"y":896,"exts":{},"template":"lava2"},{"x":704,"y":640,"exts":{},"template":"pixil-frame-0_(24)"},{"x":768,"y":640,"exts":{},"template":"pixil-frame-0_(24)"},{"x":768,"y":640,"exts":{},"template":"pixil-frame-0_(24)"},{"x":768,"y":640,"exts":{},"template":"pixil-frame-0_(24)"},{"x":832,"y":704,"exts":{},"template":"pixil-frame-0_(24)"},{"x":896,"y":768,"exts":{},"template":"pixil-frame-0_(24)"},{"x":960,"y":832,"exts":{},"template":"pixil-frame-0_(24)"},{"x":960,"y":896,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1024,"y":960,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1088,"y":1024,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1152,"y":1024,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1216,"y":1024,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1280,"y":960,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1344,"y":896,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1408,"y":960,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1472,"y":1024,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1536,"y":1024,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1600,"y":1088,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1664,"y":1088,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1728,"y":1024,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1792,"y":960,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1856,"y":896,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1792,"y":832,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1408,"y":960,"exts":{},"template":"uio"},{"x":1472,"y":1024,"exts":{},"template":"uio"},{"x":1536,"y":1024,"exts":{},"template":"uio"},{"x":1600,"y":1088,"exts":{},"template":"uio"},{"x":1664,"y":1088,"exts":{},"template":"uio"},{"x":1728,"y":1024,"exts":{},"template":"uio"},{"x":1792,"y":960,"exts":{},"template":"uio"},{"x":1856,"y":896,"exts":{},"template":"uio"},{"x":1792,"y":832,"exts":{},"template":"uio"},{"x":1856,"y":832,"exts":{},"template":"uio"},{"x":1856,"y":832,"exts":{},"template":"uio"},{"x":1920,"y":832,"exts":{},"template":"uio"},{"x":1984,"y":832,"exts":{},"template":"uio"},{"x":2048,"y":704,"exts":{},"template":"uio"},{"x":1984,"y":576,"exts":{},"template":"uio"},{"x":1920,"y":576,"exts":{},"template":"uio"},{"x":1856,"y":512,"exts":{},"template":"uio"},{"x":1792,"y":576,"exts":{},"template":"uio"},{"x":1728,"y":576,"exts":{},"template":"uio"},{"x":704,"y":640,"exts":{},"template":"pixil-frame-0_(25)"},{"x":768,"y":640,"exts":{},"template":"pixil-frame-0_(25)"},{"x":576,"y":576,"exts":{},"template":"pixil-frame-0_(25)"},{"x":640,"y":640,"exts":{},"template":"pixil-frame-0_(25)"},{"x":576,"y":576,"exts":{},"template":"pixil-frame-0_(25)"},{"x":512,"y":576,"exts":{},"template":"pixil-frame-0_(25)"},{"x":448,"y":576,"exts":{},"template":"pixil-frame-0_(25)"},{"x":256,"y":448,"exts":{},"template":"pixil-frame-0_(25)"},{"x":256,"y":320,"exts":{},"template":"pixil-frame-0_(25)"},{"x":256,"y":384,"exts":{},"template":"pixil-frame-0_(25)"},{"x":320,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":384,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":384,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":384,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":384,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":448,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":448,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":512,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":576,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":576,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":640,"y":192,"exts":{},"template":"pixil-frame-0_(25)"},{"x":704,"y":128,"exts":{},"template":"pixil-frame-0_(25)"},{"x":768,"y":128,"exts":{},"template":"pixil-frame-0_(25)"},{"x":832,"y":192,"exts":{},"template":"pixil-frame-0_(25)"},{"x":896,"y":320,"exts":{},"template":"pixil-frame-0_(25)"},{"x":832,"y":384,"exts":{},"template":"pixil-frame-0_(25)"},{"x":832,"y":384,"exts":{},"template":"pixil-frame-0_(25)"},{"x":768,"y":448,"exts":{},"template":"pixil-frame-0_(25)"},{"x":832,"y":448,"exts":{},"template":"pixil-frame-0_(25)"},{"x":768,"y":384,"exts":{},"template":"pixil-frame-0_(25)"},{"x":704,"y":448,"exts":{},"template":"pixil-frame-0_(25)"},{"x":960,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":896,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1024,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1088,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1088,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1152,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1792,"y":576,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1728,"y":576,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1856,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1920,"y":576,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1920,"y":576,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1984,"y":576,"exts":{},"template":"pixil-frame-0_(25)"},{"x":2048,"y":640,"exts":{},"template":"pixil-frame-0_(25)"},{"x":2048,"y":704,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1984,"y":832,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1920,"y":832,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1856,"y":832,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1792,"y":832,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1856,"y":896,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1856,"y":960,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1856,"y":960,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1792,"y":960,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1728,"y":1024,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1664,"y":1088,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1664,"y":1088,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1600,"y":1088,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1536,"y":1088,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1536,"y":1024,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1536,"y":1024,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1536,"y":1024,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1472,"y":1024,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1408,"y":960,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1408,"y":896,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1408,"y":896,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1344,"y":896,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1280,"y":960,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1216,"y":1024,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1216,"y":1024,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1216,"y":1088,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1152,"y":1024,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1088,"y":1024,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1088,"y":1024,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1024,"y":960,"exts":{},"template":"pixil-frame-0_(25)"},{"x":960,"y":960,"exts":{},"template":"pixil-frame-0_(25)"},{"x":960,"y":896,"exts":{},"template":"pixil-frame-0_(25)"},{"x":960,"y":832,"exts":{},"template":"pixil-frame-0_(25)"},{"x":896,"y":832,"exts":{},"template":"pixil-frame-0_(25)"},{"x":896,"y":768,"exts":{},"template":"pixil-frame-0_(25)"},{"x":832,"y":704,"exts":{},"template":"pixil-frame-0_(25)"},{"x":256,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":320,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(25)"},{"x":384,"y":192,"exts":{},"template":"pixil-frame-0_(25)"},{"x":192,"y":384,"exts":{},"template":"pixil-frame-0_(25)"},{"x":192,"y":448,"exts":{},"template":"pixil-frame-0_(25)"},{"x":192,"y":320,"exts":{},"template":"pixil-frame-0_(25)"},{"x":384,"y":576,"exts":{},"template":"pixil-frame-0_(25)"},{"x":896,"y":192,"exts":{},"template":"pixil-frame-0_(25)"},{"x":832,"y":128,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1856,"y":576,"exts":{},"template":"pixil-frame-0_(25)"},{"x":2048,"y":704,"exts":{},"template":"ExitNiewidzialne"},{"x":2048,"y":704,"exts":{},"template":"uio"},{"x":2048,"y":768,"exts":{},"template":"uio"},{"x":832,"y":320,"exts":{},"template":"pixil-frame-0_(5)"},{"x":768,"y":320,"exts":{},"template":"pixil-frame-0_(5)"},{"x":768,"y":192,"exts":{"targetRoom":"wyspa dywanowa"},"template":"pixil-frame-0_(5)"},{"x":960,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":960,"y":320,"exts":{},"template":"pixil-frame-0_(25)"},{"x":960,"y":384,"exts":{},"template":"pixil-frame-0_(25)"},{"x":896,"y":384,"exts":{},"template":"pixil-frame-0_(25)"},{"x":896,"y":448,"exts":{},"template":"pixil-frame-0_(25)"},{"x":768,"y":320,"exts":{},"template":"ExitNiewidzialne"},{"x":832,"y":320,"exts":{},"template":"ExitNiewidzialne"},{"x":768,"y":192,"exts":{},"template":"ExitNiewidzialne"},{"x":704,"y":256,"exts":{"targetRoom":"wyspa dywanowa"},"template":"ExitNiewidzialne"},{"x":768,"y":256,"exts":{},"template":"pixil-frame-0_(5)"},{"x":832,"y":256,"exts":{},"template":"pixil-frame-0_(5)"},{"x":896,"y":256,"exts":{},"template":"pixil-frame-0_(5)"},{"x":1984,"y":704,"exts":{},"template":"pixil-frame-0_(5)"},{"x":1984,"y":704,"exts":{},"template":"pixil-frame-0_(5)"},{"x":1920,"y":704,"exts":{},"template":"pixil-frame-0_(5)"},{"x":1984,"y":704,"exts":{},"template":"pixil-frame-0_(5)"},{"x":1984,"y":640,"exts":{},"template":"pixil-frame-0_(5)"},{"x":1984,"y":640,"exts":{},"template":"pixil-frame-0_(5)"},{"x":1984,"y":768,"exts":{},"template":"pixil-frame-0_(68)"},{"x":1984,"y":768,"exts":{},"template":"wer"},{"x":1152,"y":512,"exts":{},"template":"wer"},{"x":1024,"y":960,"exts":{},"template":"wer"},{"x":256,"y":384,"exts":{},"template":"wer"},{"x":256,"y":320,"exts":{},"template":"wer"},{"x":192,"y":384,"exts":{},"template":"wer"},{"x":384,"y":192,"exts":{},"template":"wer"},{"x":384,"y":192,"exts":{},"template":"wer"},{"x":384,"y":256,"exts":{},"template":"wer"},{"x":832,"y":128,"exts":{},"template":"wer"},{"x":960,"y":320,"exts":{},"template":"wer"},{"x":896,"y":384,"exts":{},"template":"wer"},{"x":960,"y":384,"exts":{},"template":"wer"},{"x":1728,"y":320,"exts":{},"template":"wer"},{"x":2304,"y":704,"exts":{},"template":"wer"},{"x":2304,"y":704,"exts":{},"template":"wer"},{"x":1792,"y":1152,"exts":{},"template":"wer"},{"x":1408,"y":1600,"exts":{},"template":"wer"},{"x":960,"y":1536,"exts":{},"template":"wer"},{"x":768,"y":1280,"exts":{},"template":"wer"},{"x":640,"y":1024,"exts":{},"template":"wer"},{"x":1088,"y":256,"exts":{},"template":"pixil-frame-0_(68)"},{"x":0,"y":64,"exts":{},"template":"pixil-frame-0_(68)"},{"x":-64,"y":256,"exts":{},"template":"pixil-frame-0_(68)"},{"x":0,"y":768,"exts":{},"template":"pixil-frame-0_(68)"},{"x":384,"y":1408,"exts":{},"template":"pixil-frame-0_(68)"},{"x":768,"y":-512,"exts":{},"template":"pixil-frame-0_(68)"},{"x":1664,"y":0,"exts":{},"template":"pixil-frame-0_(68)"},{"x":1984,"y":384,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1472,"y":192,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1024,"y":-192,"exts":{},"template":"pixil-frame-0_(25)"},{"x":640,"y":-192,"exts":{},"template":"pixil-frame-0_(25)"},{"x":-256,"y":704,"exts":{},"template":"pixil-frame-0_(25)"},{"x":512,"y":960,"exts":{},"template":"pixil-frame-0_(25)"},{"x":128,"y":1216,"exts":{},"template":"pixil-frame-0_(25)"},{"x":960,"y":1600,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1728,"y":1728,"exts":{},"template":"pixil-frame-0_(25)"},{"x":2048,"y":1408,"exts":{},"template":"pixil-frame-0_(25)"},{"x":0,"y":1280,"exts":{},"template":"pixil-frame-0_(24)"},{"x":320,"y":832,"exts":{},"template":"pixil-frame-0_(24)"},{"x":128,"y":512,"exts":{},"template":"pixil-frame-0_(24)"},{"x":128,"y":-128,"exts":{},"template":"pixil-frame-0_(24)"},{"x":704,"y":-128,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1216,"y":0,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1664,"y":320,"exts":{},"template":"pixil-frame-0_(24)"},{"x":2624,"y":320,"exts":{},"template":"pixil-frame-0_(24)"},{"x":2624,"y":896,"exts":{},"template":"pixil-frame-0_(24)"},{"x":2496,"y":1472,"exts":{},"template":"pixil-frame-0_(24)"},{"x":2304,"y":1088,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1344,"y":1216,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1728,"y":1472,"exts":{},"template":"pixil-frame-0_(24)"},{"x":896,"y":1408,"exts":{},"template":"pixil-frame-0_(24)"},{"x":1344,"y":832,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1728,"y":832,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1664,"y":832,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1024,"y":832,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1216,"y":960,"exts":{},"template":"pixil-frame-0_(25)"},{"x":320,"y":512,"exts":{},"template":"wer"},{"x":1024,"y":960,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1984,"y":832,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1984,"y":768,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1152,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":896,"y":384,"exts":{},"template":"pixil-frame-0_(25)"},{"x":896,"y":384,"exts":{},"template":"pixil-frame-0_(25)"},{"x":960,"y":384,"exts":{},"template":"pixil-frame-0_(25)"},{"x":960,"y":320,"exts":{},"template":"pixil-frame-0_(25)"},{"x":896,"y":128,"exts":{},"template":"pixil-frame-0_(25)"},{"x":832,"y":128,"exts":{},"template":"pixil-frame-0_(25)"},{"x":448,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":448,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":384,"y":256,"exts":{},"template":"pixil-frame-0_(25)"},{"x":384,"y":192,"exts":{},"template":"pixil-frame-0_(25)"},{"x":256,"y":384,"exts":{},"template":"pixil-frame-0_(25)"},{"x":192,"y":384,"exts":{},"template":"pixil-frame-0_(25)"},{"x":256,"y":320,"exts":{},"template":"pixil-frame-0_(25)"},{"x":320,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":384,"y":384,"exts":{},"template":"ExitNiewidzialne"},{"x":512,"y":576,"exts":{},"template":"robot"},{"x":429,"y":424,"exts":{},"template":"pixil-frame-0_(22)"},{"x":1728,"y":832,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1728,"y":768,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1344,"y":768,"exts":{},"template":"Boss1"},{"x":704,"y":576,"exts":{},"template":"zernnit"},{"x":704,"y":576,"exts":{},"template":"Checkpoint"},{"x":1536,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1536,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1600,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1664,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1856,"y":640,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1280,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1344,"y":512,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1472,"y":448,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1472,"y":448,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1408,"y":448,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1216,"y":448,"exts":{},"template":"pixil-frame-0_(25)"},{"x":1088,"y":832,"exts":{},"template":"pppppooooo"},{"x":1408,"y":832,"exts":{},"template":"pppppooooo"},{"x":1408,"y":832,"exts":{},"template":"pppppooooo"},{"x":1600,"y":832,"exts":{},"template":"pppppooooo"},{"x":1664,"y":896,"exts":{},"template":"pppppooooo"},{"x":1152,"y":960,"exts":{},"template":"pppppooooo"},{"x":1216,"y":896,"exts":{},"template":"pppppooooo"},{"x":1600,"y":1024,"exts":{},"template":"pppppooooo"},{"x":1088,"y":832,"exts":{},"template":"uio"},{"x":1216,"y":896,"exts":{},"template":"uio"},{"x":1152,"y":960,"exts":{},"template":"uio"},{"x":1408,"y":832,"exts":{},"template":"uio"},{"x":1600,"y":832,"exts":{},"template":"uio"},{"x":1664,"y":896,"exts":{},"template":"uio"},{"x":1600,"y":1024,"exts":{},"template":"uio"},{"x":1728,"y":1024,"exts":{},"template":"uio"},{"x":2304,"y":832,"exts":{},"template":"uio"},{"x":1984,"y":832,"exts":{},"template":"uio"},{"x":2112,"y":448,"exts":{},"template":"uio"},{"x":1920,"y":768,"exts":{},"template":"ExitNiewidzialne"},{"x":1856,"y":704,"exts":{},"template":"ExitNiewidzialne"},{"x":1920,"y":640,"exts":{"targetRoom":1},"template":"ExitNiewidzialne"}]'),
    bgs: JSON.parse('[{"depth":-1,"texture":"BG","extends":{}},{"depth":-1,"texture":"pixil-frame-0_(24)","extends":{"shiftX":0}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'wyspa dywanowa';
inGameRoomStart(this);
for(var a of ct.templates.list.LevelExit){
    a.visible = false;
}
    },
    extends: {}
}
ct.rooms.templates['wyspa dywanowa'] = {
    name: 'wyspa dywanowa',
    width: 800,
    height: 600,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":192,"y":512,"exts":{},"template":"trawa2"},{"x":256,"y":512,"exts":{},"template":"trawa2"},{"x":320,"y":512,"exts":{},"template":"trawa2"},{"x":448,"y":512,"exts":{},"template":"trawa2"},{"x":448,"y":512,"exts":{},"template":"trawa2"},{"x":384,"y":512,"exts":{},"template":"trawa2"},{"x":512,"y":512,"exts":{},"template":"trawa2"},{"x":576,"y":512,"exts":{},"template":"trawa2"},{"x":256,"y":448,"exts":{},"template":"trawa2"},{"x":320,"y":512,"exts":{},"template":"trawa2"},{"x":320,"y":448,"exts":{},"template":"trawa2"},{"x":384,"y":448,"exts":{},"template":"trawa2"},{"x":448,"y":448,"exts":{},"template":"trawa2"},{"x":512,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":512,"exts":{},"template":"trawa2"},{"x":704,"y":512,"exts":{},"template":"trawa2"},{"x":192,"y":512,"exts":{},"template":"trawa2"},{"x":128,"y":512,"exts":{},"template":"trawa2"},{"x":64,"y":512,"exts":{},"template":"trawa2"},{"x":64,"y":576,"exts":{},"template":"trawa2"},{"x":0,"y":512,"exts":{},"template":"trawa2"},{"x":0,"y":576,"exts":{},"template":"trawa2"},{"x":128,"y":576,"exts":{},"template":"trawa2"},{"x":192,"y":576,"exts":{},"template":"trawa2"},{"x":256,"y":576,"exts":{},"template":"trawa2"},{"x":320,"y":576,"exts":{},"template":"trawa2"},{"x":384,"y":576,"exts":{},"template":"trawa2"},{"x":448,"y":576,"exts":{},"template":"trawa2"},{"x":576,"y":576,"exts":{},"template":"trawa2"},{"x":512,"y":576,"exts":{},"template":"trawa2"},{"x":640,"y":576,"exts":{},"template":"trawa2"},{"x":704,"y":576,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":448,"exts":{},"template":"trawa2"},{"x":576,"y":448,"exts":{},"template":"trawa2"},{"x":64,"y":512,"exts":{},"template":"trawa2"},{"x":0,"y":448,"exts":{},"template":"trawa2"},{"x":64,"y":448,"exts":{},"template":"trawa2"},{"x":128,"y":448,"exts":{},"template":"trawa2"},{"x":192,"y":448,"exts":{},"template":"trawa2"},{"x":64,"y":448,"exts":{},"template":"trawa2"},{"x":128,"y":384,"exts":{},"template":"trawa2"},{"x":64,"y":384,"exts":{},"template":"trawa2"},{"x":320,"y":384,"exts":{},"template":"trawa2"},{"x":256,"y":384,"exts":{},"template":"trawa2"},{"x":384,"y":384,"exts":{},"template":"trawa2"},{"x":448,"y":384,"exts":{},"template":"trawa2"},{"x":512,"y":384,"exts":{},"template":"trawa2"},{"x":576,"y":384,"exts":{},"template":"trawa2"},{"x":640,"y":384,"exts":{},"template":"trawa2"},{"x":768,"y":512,"exts":{},"template":"trawa2"},{"x":768,"y":576,"exts":{},"template":"trawa2"},{"x":-64,"y":576,"exts":{},"template":"trawa2"},{"x":-64,"y":512,"exts":{},"template":"trawa2"},{"x":-128,"y":576,"exts":{},"template":"piach d"},{"x":-192,"y":576,"exts":{},"template":"piach d"},{"x":-256,"y":576,"exts":{},"template":"piach d"},{"x":-320,"y":576,"exts":{},"template":"piach d"},{"x":-128,"y":576,"exts":{},"template":"piach d"},{"x":-128,"y":512,"exts":{},"template":"piach d"},{"x":-192,"y":512,"exts":{},"template":"piach d"},{"x":832,"y":576,"exts":{},"template":"piach d"},{"x":896,"y":576,"exts":{},"template":"piach d"},{"x":960,"y":576,"exts":{},"template":"piach d"},{"x":896,"y":512,"exts":{},"template":"piach d"},{"x":1024,"y":576,"exts":{},"template":"piach d"},{"x":1216,"y":640,"exts":{},"template":"piach d"},{"x":1280,"y":640,"exts":{},"template":"piach d"},{"x":1344,"y":640,"exts":{},"template":"piach d"},{"x":1408,"y":640,"exts":{},"template":"piach d"},{"x":1536,"y":640,"exts":{},"template":"piach d"},{"x":1472,"y":640,"exts":{},"template":"piach d"},{"x":1600,"y":640,"exts":{},"template":"piach d"},{"x":-384,"y":576,"exts":{},"template":"piach d"},{"x":-512,"y":640,"exts":{},"template":"piach d"},{"x":-640,"y":640,"exts":{},"template":"piach d"},{"x":-576,"y":640,"exts":{},"template":"piach d"},{"x":-832,"y":640,"exts":{},"template":"piach d"},{"x":-704,"y":640,"exts":{},"template":"piach d"},{"x":-768,"y":640,"exts":{},"template":"piach d"},{"x":-320,"y":640,"exts":{},"template":"piach d"},{"x":-320,"y":640,"exts":{},"template":"piach d"},{"x":-384,"y":640,"exts":{},"template":"piach d"},{"x":-256,"y":640,"exts":{},"template":"piach d"},{"x":-192,"y":640,"exts":{},"template":"piach d"},{"x":-128,"y":640,"exts":{},"template":"piach d"},{"x":1088,"y":640,"exts":{},"template":"piach d"},{"x":1024,"y":640,"exts":{},"template":"piach d"},{"x":1024,"y":640,"exts":{},"template":"piach d"},{"x":960,"y":640,"exts":{},"template":"piach d"},{"x":896,"y":640,"exts":{},"template":"piach d"},{"x":896,"y":640,"exts":{},"template":"piach d"},{"x":832,"y":640,"exts":{},"template":"piach d"},{"x":768,"y":640,"exts":{},"template":"piach d"},{"x":704,"y":640,"exts":{},"template":"piach d"},{"x":640,"y":640,"exts":{},"template":"piach d"},{"x":576,"y":640,"exts":{},"template":"piach d"},{"x":512,"y":640,"exts":{},"template":"piach d"},{"x":0,"y":640,"exts":{},"template":"trawa2"},{"x":-64,"y":640,"exts":{},"template":"trawa2"},{"x":-128,"y":640,"exts":{},"template":"trawa2"},{"x":64,"y":640,"exts":{},"template":"trawa2"},{"x":128,"y":640,"exts":{},"template":"trawa2"},{"x":192,"y":640,"exts":{},"template":"trawa2"},{"x":256,"y":640,"exts":{},"template":"trawa2"},{"x":320,"y":640,"exts":{},"template":"trawa2"},{"x":384,"y":640,"exts":{},"template":"trawa2"},{"x":448,"y":640,"exts":{},"template":"trawa2"},{"x":576,"y":640,"exts":{},"template":"trawa2"},{"x":576,"y":640,"exts":{},"template":"trawa2"},{"x":512,"y":640,"exts":{},"template":"trawa2"},{"x":704,"y":640,"exts":{},"template":"trawa2"},{"x":640,"y":640,"exts":{},"template":"trawa2"},{"x":768,"y":640,"exts":{},"template":"trawa2"},{"x":832,"y":640,"exts":{},"template":"trawa2"},{"x":-832,"y":576,"exts":{},"template":"Water"},{"x":-704,"y":576,"exts":{},"template":"Water"},{"x":-768,"y":576,"exts":{},"template":"Water"},{"x":-640,"y":576,"exts":{},"template":"Water"},{"x":-384,"y":512,"exts":{},"template":"Water"},{"x":-320,"y":512,"exts":{},"template":"Water"},{"x":1024,"y":512,"exts":{},"template":"Water"},{"x":1600,"y":576,"exts":{},"template":"Water"},{"x":1536,"y":576,"exts":{},"template":"Water"},{"x":1536,"y":576,"exts":{},"template":"Water"},{"x":1472,"y":576,"exts":{},"template":"Water"},{"x":1408,"y":576,"exts":{},"template":"Water"},{"x":1344,"y":576,"exts":{},"template":"Water"},{"x":1280,"y":576,"exts":{},"template":"Water"},{"x":1024,"y":576,"exts":{},"template":"Water"},{"x":960,"y":576,"exts":{},"template":"Water"},{"x":1024,"y":640,"exts":{},"template":"Water"},{"x":960,"y":640,"exts":{},"template":"Water"},{"x":1088,"y":640,"exts":{},"template":"Water"},{"x":-192,"y":640,"exts":{},"template":"piach d"},{"x":-256,"y":576,"exts":{},"template":"piach d"},{"x":960,"y":640,"exts":{},"template":"piach d"},{"x":960,"y":576,"exts":{},"template":"piach d"},{"x":1024,"y":576,"exts":{},"template":"piach d"},{"x":1024,"y":576,"exts":{},"template":"Water"},{"x":1280,"y":640,"exts":{},"template":"Water"},{"x":1280,"y":640,"exts":{},"template":"Water"},{"x":1216,"y":640,"exts":{},"template":"Water"},{"x":1344,"y":640,"exts":{},"template":"Water"},{"x":1344,"y":640,"exts":{},"template":"Water"},{"x":1472,"y":640,"exts":{},"template":"Water"},{"x":1536,"y":640,"exts":{},"template":"Water"},{"x":1600,"y":640,"exts":{},"template":"Water"},{"x":1408,"y":640,"exts":{},"template":"Water"},{"x":-320,"y":576,"exts":{},"template":"Water"},{"x":-384,"y":576,"exts":{},"template":"Water"},{"x":-320,"y":640,"exts":{},"template":"Water"},{"x":-384,"y":640,"exts":{},"template":"Water"},{"x":-384,"y":640,"exts":{},"template":"Water"},{"x":-512,"y":640,"exts":{},"template":"Water"},{"x":-576,"y":640,"exts":{},"template":"Water"},{"x":-576,"y":640,"exts":{},"template":"Water"},{"x":-640,"y":640,"exts":{},"template":"Water"},{"x":-704,"y":640,"exts":{},"template":"Water"},{"x":-768,"y":640,"exts":{},"template":"Water"},{"x":-832,"y":640,"exts":{},"template":"Water"},{"x":-320,"y":640,"exts":{},"template":"piach d"},{"x":-320,"y":576,"exts":{},"template":"piach d"},{"x":-320,"y":576,"exts":{},"template":"piach d"},{"x":-320,"y":512,"exts":{},"template":"piach d"},{"x":1024,"y":640,"exts":{},"template":"piach d"},{"x":1024,"y":576,"exts":{},"template":"piach d"},{"x":1024,"y":512,"exts":{},"template":"piach d"},{"x":-384,"y":640,"exts":{},"template":"piach d"},{"x":-384,"y":576,"exts":{},"template":"piach d"},{"x":-384,"y":512,"exts":{},"template":"piach d"},{"x":1088,"y":640,"exts":{},"template":"piach d"},{"x":-448,"y":640,"exts":{},"template":"piach d"},{"x":-576,"y":576,"exts":{},"template":"Water"},{"x":-512,"y":576,"exts":{},"template":"Water"},{"x":-448,"y":576,"exts":{},"template":"Water"},{"x":-768,"y":-128,"exts":{},"template":"BG"},{"x":-704,"y":-192,"exts":{},"template":"BG"},{"x":-768,"y":640,"exts":{},"template":"BG"},{"x":-768,"y":640,"exts":{},"template":"Water"},{"x":-704,"y":640,"exts":{},"template":"Water"},{"x":-640,"y":640,"exts":{},"template":"Water"},{"x":-576,"y":640,"exts":{},"template":"Water"},{"x":192,"y":384,"exts":{},"template":"trawa2"},{"x":128,"y":320,"exts":{},"template":"pixil"},{"x":128,"y":256,"exts":{},"template":"pixil"},{"x":128,"y":192,"exts":{},"template":"pixil"},{"x":192,"y":320,"exts":{},"template":"pixil-frame-0_(8)"},{"x":192,"y":256,"exts":{},"template":"pixil-frame-0_(8)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(8)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(8)"},{"x":384,"y":320,"exts":{},"template":"pixil"},{"x":384,"y":192,"exts":{},"template":"pixil"},{"x":512,"y":320,"exts":{},"template":"g1"},{"x":512,"y":256,"exts":{},"template":"g1"},{"x":576,"y":320,"exts":{},"template":"pixil-frame-0_(8)"},{"x":576,"y":256,"exts":{},"template":"pixil-frame-0_(8)"},{"x":576,"y":192,"exts":{},"template":"pixil-frame-0_(8)"},{"x":384,"y":256,"exts":{},"template":"pixil"},{"x":192,"y":128,"exts":{},"template":"pixil-frame-0_(8)"},{"x":128,"y":128,"exts":{},"template":"pixil"},{"x":85,"y":256,"exts":{},"template":"g1"},{"x":64,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":64,"exts":{},"template":"pixil-frame-0_(4)"},{"x":256,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":256,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":384,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":384,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":576,"y":128,"exts":{},"template":"pixil-frame-0_(4)"},{"x":576,"y":192,"exts":{},"template":"pixil-frame-0_(4)"},{"x":640,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":576,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":320,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":320,"exts":{},"template":"pixil-frame-0_(4)"},{"x":256,"y":320,"exts":{},"template":"g1"},{"x":256,"y":256,"exts":{},"template":"g1"},{"x":320,"y":384,"exts":{},"template":"Bluey"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":256,"exts":{},"template":"pixil-frame-0_(8)"},{"x":320,"y":320,"exts":{},"template":"pixil-frame-0_(8)"},{"x":320,"y":320,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":320,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":448,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":384,"exts":{},"template":"pixil-frame-0_(4)"},{"x":512,"y":384,"exts":{},"template":"pixil-frame-0_(4)"},{"x":640,"y":512,"exts":{},"template":"pixil-frame-0_(4)"},{"x":448,"y":576,"exts":{},"template":"pixil-frame-0_(4)"},{"x":192,"y":640,"exts":{},"template":"pixil-frame-0_(4)"},{"x":320,"y":576,"exts":{},"template":"pixil-frame-0_(4)"},{"x":0,"y":576,"exts":{},"template":"pixil-frame-0_(4)"},{"x":64,"y":448,"exts":{},"template":"pixil-frame-0_(4)"},{"x":640,"y":384,"exts":{},"template":"pixil-frame-0_(4)"},{"x":704,"y":640,"exts":{},"template":"pixil-frame-0_(4)"},{"x":128,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":128,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":128,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":256,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":256,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":384,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":384,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":384,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":384,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":512,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":512,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":640,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":64,"y":256,"exts":{},"template":"pixil-frame-0_(11)"},{"x":256,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":576,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":576,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":128,"y":128,"exts":{},"template":"pixil-frame-0_(11)"},{"x":192,"y":64,"exts":{},"template":"pixil-frame-0_(11)"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(11)"},{"x":84,"y":319,"exts":{},"template":"g1"},{"x":64,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":-256,"y":512,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":640,"y":320,"exts":{},"template":"pixil-frame-0_(11)"},{"x":320,"y":-256,"exts":{},"template":"z1"},{"x":384,"y":-256,"exts":{},"template":"z1"},{"x":448,"y":-256,"exts":{},"template":"z1"},{"x":448,"y":-320,"exts":{},"template":"z1"},{"x":384,"y":-320,"exts":{},"template":"z1"},{"x":384,"y":-320,"exts":{},"template":"z1"},{"x":320,"y":-320,"exts":{},"template":"z1"},{"x":384,"y":-384,"exts":{},"template":"z1"},{"x":320,"y":-384,"exts":{},"template":"z1"},{"x":448,"y":-384,"exts":{},"template":"z1"},{"x":320,"y":-448,"exts":{},"template":"z1"},{"x":448,"y":-448,"exts":{},"template":"z1"},{"x":384,"y":-448,"exts":{},"template":"z1"},{"x":512,"y":-384,"exts":{},"template":"z1"},{"x":512,"y":-320,"exts":{},"template":"z1"},{"x":512,"y":-256,"exts":{},"template":"z1"},{"x":448,"y":-192,"exts":{},"template":"z1"},{"x":384,"y":-192,"exts":{},"template":"z1"},{"x":320,"y":-192,"exts":{},"template":"z1"},{"x":256,"y":-256,"exts":{},"template":"z1"},{"x":256,"y":-320,"exts":{},"template":"z1"},{"x":256,"y":-384,"exts":{},"template":"z1"},{"x":1152,"y":640,"exts":{},"template":"Water"},{"x":1216,"y":576,"exts":{},"template":"Water"},{"x":1216,"y":576,"exts":{},"template":"Water"},{"x":1152,"y":576,"exts":{},"template":"Water"},{"x":1152,"y":576,"exts":{},"template":"Water"},{"x":1088,"y":576,"exts":{},"template":"Water"},{"x":1216,"y":576,"exts":{},"template":"Water"},{"x":1030,"y":518,"exts":{},"template":"piach d"},{"x":1035,"y":522,"exts":{},"template":"piach d"},{"x":1042,"y":529,"exts":{},"template":"piach d"},{"x":1051,"y":539,"exts":{},"template":"piach d"},{"x":1057,"y":547,"exts":{},"template":"piach d"},{"x":1072,"y":555,"exts":{},"template":"piach d"},{"x":1081,"y":568,"exts":{},"template":"piach d"},{"x":1086,"y":579,"exts":{},"template":"piach d"},{"x":1092,"y":593,"exts":{},"template":"piach d"},{"x":1095,"y":602,"exts":{},"template":"piach d"},{"x":1100,"y":616,"exts":{},"template":"piach d"},{"x":1119,"y":635,"exts":{},"template":"piach d"},{"x":1126,"y":650,"exts":{},"template":"piach d"},{"x":1108,"y":626,"exts":{},"template":"piach d"},{"x":1135,"y":666,"exts":{},"template":"piach d"},{"x":1148,"y":674,"exts":{},"template":"piach d"},{"x":1153,"y":677,"exts":{},"template":"piach d"},{"x":1152,"y":768,"exts":{},"template":"BG"},{"x":1152,"y":832,"exts":{},"template":"BG"},{"x":1152,"y":768,"exts":{},"template":"BG"},{"x":1152,"y":768,"exts":{},"template":"BG"},{"x":1088,"y":768,"exts":{},"template":"BG"},{"x":1152,"y":704,"exts":{},"template":"BG"},{"x":1152,"y":704,"exts":{},"template":"BG"},{"x":1152,"y":704,"exts":{},"template":"BG"},{"x":1088,"y":704,"exts":{},"template":"BG"},{"x":1024,"y":512,"exts":{},"template":"piach d"},{"x":1088,"y":576,"exts":{},"template":"piach d"},{"x":1088,"y":640,"exts":{},"template":"piach d"},{"x":896,"y":640,"exts":{},"template":"piach d"},{"x":896,"y":576,"exts":{},"template":"piach d"},{"x":1088,"y":640,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":1024,"y":576,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":651,"y":389,"exts":{},"template":"trawa2"},{"x":656,"y":396,"exts":{},"template":"trawa2"},{"x":663,"y":401,"exts":{},"template":"trawa2"},{"x":669,"y":406,"exts":{},"template":"trawa2"},{"x":674,"y":413,"exts":{},"template":"trawa2"},{"x":690,"y":427,"exts":{},"template":"trawa2"},{"x":690,"y":427,"exts":{},"template":"trawa2"},{"x":685,"y":417,"exts":{},"template":"trawa2"},{"x":701,"y":430,"exts":{},"template":"trawa2"},{"x":710,"y":443,"exts":{},"template":"trawa2"},{"x":716,"y":459,"exts":{},"template":"trawa2"},{"x":722,"y":459,"exts":{},"template":"trawa2"},{"x":721,"y":452,"exts":{},"template":"trawa2"},{"x":728,"y":456,"exts":{},"template":"trawa2"},{"x":737,"y":462,"exts":{},"template":"trawa2"},{"x":748,"y":472,"exts":{},"template":"trawa2"},{"x":760,"y":475,"exts":{},"template":"trawa2"},{"x":770,"y":483,"exts":{},"template":"trawa2"},{"x":788,"y":490,"exts":{},"template":"trawa2"},{"x":791,"y":502,"exts":{},"template":"trawa2"},{"x":801,"y":515,"exts":{},"template":"trawa2"},{"x":802,"y":516,"exts":{},"template":"trawa2"},{"x":813,"y":526,"exts":{},"template":"trawa2"},{"x":823,"y":540,"exts":{},"template":"trawa2"},{"x":836,"y":551,"exts":{},"template":"trawa2"},{"x":853,"y":560,"exts":{},"template":"trawa2"},{"x":861,"y":579,"exts":{},"template":"trawa2"},{"x":866,"y":601,"exts":{},"template":"trawa2"},{"x":882,"y":619,"exts":{},"template":"trawa2"},{"x":885,"y":633,"exts":{},"template":"trawa2"},{"x":888,"y":644,"exts":{},"template":"trawa2"},{"x":888,"y":640,"exts":{},"template":"trawa2"},{"x":832,"y":576,"exts":{},"template":"trawa2"},{"x":832,"y":512,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":803,"y":507,"exts":{},"template":"trawa2"},{"x":817,"y":521,"exts":{},"template":"trawa2"},{"x":832,"y":534,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":448,"exts":{},"template":"trawa2"},{"x":640,"y":384,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":768,"y":512,"exts":{},"template":"trawa2"},{"x":832,"y":576,"exts":{},"template":"trawa2"},{"x":832,"y":640,"exts":{},"template":"trawa2"},{"x":768,"y":704,"exts":{},"template":"BG"},{"x":55,"y":387,"exts":{},"template":"trawa2"},{"x":50,"y":396,"exts":{},"template":"trawa2"},{"x":44,"y":396,"exts":{},"template":"trawa2"},{"x":44,"y":404,"exts":{},"template":"trawa2"},{"x":36,"y":404,"exts":{},"template":"trawa2"},{"x":28,"y":414,"exts":{},"template":"trawa2"},{"x":22,"y":416,"exts":{},"template":"trawa2"},{"x":21,"y":418,"exts":{},"template":"trawa2"},{"x":17,"y":418,"exts":{},"template":"trawa2"},{"x":17,"y":418,"exts":{},"template":"trawa2"},{"x":8,"y":422,"exts":{},"template":"trawa2"},{"x":8,"y":423,"exts":{},"template":"trawa2"},{"x":7,"y":424,"exts":{},"template":"trawa2"},{"x":4,"y":424,"exts":{},"template":"trawa2"},{"x":4,"y":425,"exts":{},"template":"trawa2"},{"x":0,"y":435,"exts":{},"template":"trawa2"},{"x":0,"y":435,"exts":{},"template":"trawa2"},{"x":-4,"y":442,"exts":{},"template":"trawa2"},{"x":-4,"y":442,"exts":{},"template":"trawa2"},{"x":-4,"y":443,"exts":{},"template":"trawa2"},{"x":-4,"y":443,"exts":{},"template":"trawa2"},{"x":-4,"y":443,"exts":{},"template":"trawa2"},{"x":-6,"y":446,"exts":{},"template":"trawa2"},{"x":-7,"y":448,"exts":{},"template":"trawa2"},{"x":-8,"y":448,"exts":{},"template":"trawa2"},{"x":-15,"y":450,"exts":{},"template":"trawa2"},{"x":-15,"y":450,"exts":{},"template":"trawa2"},{"x":-18,"y":450,"exts":{},"template":"trawa2"},{"x":-33,"y":473,"exts":{},"template":"trawa2"},{"x":-30,"y":455,"exts":{},"template":"trawa2"},{"x":-43,"y":459,"exts":{},"template":"trawa2"},{"x":-43,"y":468,"exts":{},"template":"trawa2"},{"x":-43,"y":469,"exts":{},"template":"trawa2"},{"x":-63,"y":470,"exts":{},"template":"trawa2"},{"x":-52,"y":462,"exts":{},"template":"trawa2"},{"x":-71,"y":474,"exts":{},"template":"trawa2"},{"x":-72,"y":476,"exts":{},"template":"trawa2"},{"x":-72,"y":490,"exts":{},"template":"trawa2"},{"x":-78,"y":491,"exts":{},"template":"trawa2"},{"x":-79,"y":488,"exts":{},"template":"trawa2"},{"x":-83,"y":503,"exts":{},"template":"trawa2"},{"x":-83,"y":512,"exts":{},"template":"trawa2"},{"x":-96,"y":515,"exts":{},"template":"trawa2"},{"x":-104,"y":537,"exts":{},"template":"trawa2"},{"x":-86,"y":505,"exts":{},"template":"trawa2"},{"x":-95,"y":507,"exts":{},"template":"trawa2"},{"x":-85,"y":499,"exts":{},"template":"trawa2"},{"x":-103,"y":517,"exts":{},"template":"trawa2"},{"x":-109,"y":532,"exts":{},"template":"trawa2"},{"x":-116,"y":545,"exts":{},"template":"trawa2"},{"x":-129,"y":581,"exts":{},"template":"trawa2"},{"x":-123,"y":571,"exts":{},"template":"trawa2"},{"x":-126,"y":567,"exts":{},"template":"trawa2"},{"x":-134,"y":592,"exts":{},"template":"trawa2"},{"x":-134,"y":583,"exts":{},"template":"trawa2"},{"x":-138,"y":596,"exts":{},"template":"trawa2"},{"x":-140,"y":609,"exts":{},"template":"trawa2"},{"x":-143,"y":613,"exts":{},"template":"trawa2"},{"x":-147,"y":619,"exts":{},"template":"trawa2"},{"x":-147,"y":619,"exts":{},"template":"trawa2"},{"x":-154,"y":637,"exts":{},"template":"trawa2"},{"x":-155,"y":638,"exts":{},"template":"trawa2"},{"x":-155,"y":638,"exts":{},"template":"trawa2"},{"x":-157,"y":639,"exts":{},"template":"trawa2"},{"x":-163,"y":657,"exts":{},"template":"trawa2"},{"x":-149,"y":626,"exts":{},"template":"trawa2"},{"x":-64,"y":512,"exts":{},"template":"trawa2"},{"x":0,"y":512,"exts":{},"template":"trawa2"},{"x":-64,"y":640,"exts":{},"template":"trawa2"},{"x":-128,"y":704,"exts":{},"template":"trawa2"},{"x":-128,"y":640,"exts":{},"template":"trawa2"},{"x":-64,"y":640,"exts":{},"template":"trawa2"},{"x":-64,"y":640,"exts":{},"template":"trawa2"},{"x":-64,"y":640,"exts":{},"template":"trawa2"},{"x":-64,"y":576,"exts":{},"template":"trawa2"},{"x":-64,"y":640,"exts":{},"template":"trawa2"},{"x":-64,"y":640,"exts":{},"template":"trawa2"},{"x":-128,"y":576,"exts":{},"template":"pixil-frame-0_(4)"},{"x":-192,"y":704,"exts":{},"template":"BG"},{"x":-396,"y":517,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-399,"y":530,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-400,"y":530,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-407,"y":539,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-416,"y":549,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-416,"y":549,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-416,"y":549,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-416,"y":554,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-423,"y":566,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-423,"y":568,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-434,"y":582,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-434,"y":582,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-434,"y":582,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-434,"y":585,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-435,"y":588,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-436,"y":589,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-436,"y":592,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-444,"y":610,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-445,"y":611,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-450,"y":630,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-459,"y":649,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-462,"y":640,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-468,"y":643,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-469,"y":644,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-475,"y":652,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-475,"y":652,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-477,"y":652,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-478,"y":652,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-498,"y":674,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-490,"y":665,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-488,"y":659,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-507,"y":681,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-509,"y":685,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-514,"y":686,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-512,"y":689,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-522,"y":691,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-527,"y":698,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-441,"y":601,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-443,"y":598,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-438,"y":580,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-433,"y":574,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-421,"y":563,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-428,"y":554,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-422,"y":551,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-384,"y":576,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-384,"y":576,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-384,"y":512,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-448,"y":640,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":-640,"y":704,"exts":{},"template":"BG"},{"x":-384,"y":960,"exts":{},"template":"BG"},{"x":512,"y":1152,"exts":{},"template":"BG"},{"x":1152,"y":576,"exts":{},"template":"Water"},{"x":1088,"y":576,"exts":{},"template":"Water"},{"x":1024,"y":576,"exts":{},"template":"Water"},{"x":1024,"y":576,"exts":{},"template":"Water"},{"x":960,"y":576,"exts":{},"template":"Water"},{"x":960,"y":576,"exts":{},"template":"Water"},{"x":896,"y":576,"exts":{},"template":"Water"},{"x":896,"y":576,"exts":{},"template":"Water"},{"x":832,"y":576,"exts":{},"template":"Water"},{"x":896,"y":640,"exts":{},"template":"Water"},{"x":1024,"y":640,"exts":{},"template":"Water"},{"x":960,"y":640,"exts":{},"template":"Water"},{"x":1088,"y":640,"exts":{},"template":"Water"},{"x":1088,"y":640,"exts":{},"template":"Water"},{"x":1152,"y":640,"exts":{},"template":"Water"},{"x":832,"y":640,"exts":{},"template":"Water"},{"x":1344,"y":576,"exts":{},"template":"pixil-frame-0_(12)"},{"x":1280,"y":576,"exts":{},"template":"pixil-frame-0_(12)"},{"x":1216,"y":576,"exts":{},"template":"pixil-frame-0_(12)"},{"x":768,"y":576,"exts":{},"template":"Water"},{"x":704,"y":576,"exts":{},"template":"Water"},{"x":640,"y":576,"exts":{},"template":"Water"},{"x":-448,"y":576,"exts":{},"template":"Water"},{"x":-320,"y":576,"exts":{},"template":"Water"},{"x":-384,"y":576,"exts":{},"template":"Water"},{"x":-192,"y":576,"exts":{},"template":"Water"},{"x":-256,"y":576,"exts":{},"template":"Water"},{"x":-64,"y":576,"exts":{},"template":"Water"},{"x":-128,"y":576,"exts":{},"template":"Water"},{"x":-64,"y":576,"exts":{},"template":"Water"},{"x":0,"y":576,"exts":{},"template":"Water"},{"x":64,"y":576,"exts":{},"template":"Water"},{"x":128,"y":576,"exts":{},"template":"Water"},{"x":320,"y":576,"exts":{},"template":"Water"},{"x":256,"y":640,"exts":{},"template":"Water"},{"x":256,"y":576,"exts":{},"template":"Water"},{"x":192,"y":576,"exts":{},"template":"Water"},{"x":448,"y":576,"exts":{},"template":"Water"},{"x":512,"y":576,"exts":{},"template":"Water"},{"x":576,"y":576,"exts":{},"template":"Water"},{"x":384,"y":576,"exts":{},"template":"Water"},{"x":768,"y":640,"exts":{},"template":"Water"},{"x":768,"y":640,"exts":{},"template":"Water"},{"x":704,"y":640,"exts":{},"template":"Water"},{"x":640,"y":640,"exts":{},"template":"Water"},{"x":448,"y":640,"exts":{},"template":"Water"},{"x":512,"y":640,"exts":{},"template":"Water"},{"x":576,"y":640,"exts":{},"template":"Water"},{"x":384,"y":640,"exts":{},"template":"Water"},{"x":320,"y":640,"exts":{},"template":"Water"},{"x":192,"y":640,"exts":{},"template":"Water"},{"x":128,"y":640,"exts":{},"template":"Water"},{"x":0,"y":640,"exts":{},"template":"Water"},{"x":64,"y":640,"exts":{},"template":"Water"},{"x":-64,"y":640,"exts":{},"template":"Water"},{"x":-128,"y":640,"exts":{},"template":"Water"},{"x":-128,"y":640,"exts":{},"template":"Water"},{"x":-256,"y":640,"exts":{},"template":"Water"},{"x":-128,"y":640,"exts":{},"template":"Water"},{"x":-192,"y":640,"exts":{},"template":"Water"},{"x":-384,"y":640,"exts":{},"template":"Water"},{"x":-448,"y":640,"exts":{},"template":"Water"},{"x":-448,"y":640,"exts":{},"template":"Water"},{"x":-448,"y":640,"exts":{},"template":"Water"},{"x":-512,"y":640,"exts":{},"template":"Water"},{"x":-512,"y":640,"exts":{},"template":"Water"},{"x":-576,"y":640,"exts":{},"template":"Water"},{"x":-512,"y":576,"exts":{},"template":"Water"},{"x":-320,"y":640,"exts":{},"template":"Water"},{"x":128,"y":320,"exts":{},"template":"Water"},{"x":-172,"y":506,"exts":{},"template":"piach d"},{"x":-146,"y":498,"exts":{},"template":"piach d"},{"x":-135,"y":489,"exts":{},"template":"piach d"},{"x":-127,"y":482,"exts":{},"template":"piach d"},{"x":-116,"y":475,"exts":{},"template":"piach d"},{"x":-108,"y":465,"exts":{},"template":"piach d"},{"x":-99,"y":460,"exts":{},"template":"piach d"},{"x":-183,"y":511,"exts":{},"template":"piach d"},{"x":-192,"y":512,"exts":{},"template":"piach d"},{"x":-38,"y":458,"exts":{},"template":"trawa2"},{"x":-42,"y":487,"exts":{},"template":"trawa2"},{"x":-47,"y":504,"exts":{},"template":"trawa2"},{"x":-55,"y":506,"exts":{},"template":"trawa2"},{"x":-62,"y":511,"exts":{},"template":"trawa2"},{"x":-70,"y":519,"exts":{},"template":"trawa2"},{"x":-91,"y":528,"exts":{},"template":"trawa2"},{"x":-42,"y":462,"exts":{},"template":"trawa2"},{"x":-46,"y":462,"exts":{},"template":"trawa2"},{"x":-55,"y":462,"exts":{},"template":"trawa2"},{"x":-53,"y":495,"exts":{},"template":"trawa2"},{"x":-66,"y":501,"exts":{},"template":"trawa2"},{"x":-68,"y":506,"exts":{},"template":"trawa2"},{"x":-69,"y":507,"exts":{},"template":"trawa2"},{"x":-67,"y":478,"exts":{},"template":"trawa2"},{"x":-75,"y":507,"exts":{},"template":"trawa2"},{"x":-82,"y":515,"exts":{},"template":"trawa2"},{"x":-83,"y":515,"exts":{},"template":"trawa2"},{"x":-83,"y":515,"exts":{},"template":"trawa2"},{"x":-102,"y":540,"exts":{},"template":"trawa2"},{"x":-113,"y":545,"exts":{},"template":"trawa2"},{"x":-117,"y":547,"exts":{},"template":"trawa2"},{"x":-117,"y":547,"exts":{},"template":"trawa2"},{"x":-123,"y":553,"exts":{},"template":"trawa2"},{"x":-132,"y":559,"exts":{},"template":"trawa2"},{"x":-141,"y":564,"exts":{},"template":"trawa2"},{"x":-128,"y":576,"exts":{},"template":"Water"},{"x":-64,"y":576,"exts":{},"template":"Water"},{"x":-192,"y":640,"exts":{},"template":"Water"},{"x":-192,"y":576,"exts":{},"template":"Water"},{"x":896,"y":576,"exts":{},"template":"Water"},{"x":832,"y":506,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":825,"y":502,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":814,"y":496,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":801,"y":491,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":790,"y":485,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":781,"y":479,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":772,"y":475,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":761,"y":472,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":750,"y":468,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":737,"y":464,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":739,"y":463,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":740,"y":462,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":832,"y":512,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":896,"y":512,"exts":{},"template":"pixil-frame-0_(1)_2"},{"x":766,"y":542,"exts":{},"template":"trawa2"},{"x":759,"y":538,"exts":{},"template":"trawa2"},{"x":748,"y":533,"exts":{},"template":"trawa2"},{"x":779,"y":561,"exts":{},"template":"trawa2"},{"x":791,"y":564,"exts":{},"template":"trawa2"},{"x":798,"y":566,"exts":{},"template":"trawa2"},{"x":776,"y":556,"exts":{},"template":"trawa2"},{"x":803,"y":568,"exts":{},"template":"trawa2"},{"x":810,"y":570,"exts":{},"template":"trawa2"},{"x":709,"y":524,"exts":{},"template":"trawa2"},{"x":698,"y":517,"exts":{},"template":"trawa2"},{"x":687,"y":508,"exts":{},"template":"trawa2"},{"x":688,"y":492,"exts":{},"template":"trawa2"},{"x":683,"y":478,"exts":{},"template":"trawa2"},{"x":692,"y":473,"exts":{},"template":"trawa2"},{"x":694,"y":466,"exts":{},"template":"trawa2"},{"x":705,"y":442,"exts":{},"template":"trawa2"},{"x":716,"y":415,"exts":{},"template":"trawa2"},{"x":723,"y":415,"exts":{},"template":"trawa2"},{"x":716,"y":421,"exts":{},"template":"trawa2"},{"x":705,"y":410,"exts":{},"template":"trawa2"},{"x":729,"y":424,"exts":{},"template":"trawa2"},{"x":733,"y":433,"exts":{},"template":"trawa2"},{"x":748,"y":447,"exts":{},"template":"trawa2"},{"x":742,"y":460,"exts":{},"template":"trawa2"},{"x":742,"y":475,"exts":{},"template":"trawa2"},{"x":748,"y":493,"exts":{},"template":"trawa2"},{"x":754,"y":452,"exts":{},"template":"trawa2"},{"x":756,"y":465,"exts":{},"template":"trawa2"},{"x":764,"y":476,"exts":{},"template":"trawa2"},{"x":762,"y":472,"exts":{},"template":"trawa2"},{"x":771,"y":496,"exts":{},"template":"trawa2"},{"x":832,"y":576,"exts":{},"template":"Water"},{"x":768,"y":576,"exts":{},"template":"Water"},{"x":768,"y":576,"exts":{},"template":"Water"},{"x":768,"y":576,"exts":{},"template":"Water"},{"x":704,"y":576,"exts":{},"template":"Water"},{"x":704,"y":576,"exts":{},"template":"Water"},{"x":640,"y":576,"exts":{},"template":"Water"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":704,"y":512,"exts":{},"template":"trawa2"},{"x":768,"y":512,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":704,"y":448,"exts":{},"template":"trawa2"},{"x":830,"y":505,"exts":{},"template":"piach d"},{"x":829,"y":501,"exts":{},"template":"piach d"},{"x":815,"y":494,"exts":{},"template":"piach d"},{"x":801,"y":491,"exts":{},"template":"piach d"},{"x":789,"y":484,"exts":{},"template":"piach d"},{"x":779,"y":478,"exts":{},"template":"piach d"},{"x":768,"y":473,"exts":{},"template":"piach d"},{"x":817,"y":550,"exts":{},"template":"trawa2"},{"x":801,"y":543,"exts":{},"template":"trawa2"},{"x":785,"y":533,"exts":{},"template":"trawa2"},{"x":774,"y":530,"exts":{},"template":"trawa2"},{"x":762,"y":524,"exts":{},"template":"trawa2"},{"x":744,"y":511,"exts":{},"template":"trawa2"},{"x":722,"y":486,"exts":{},"template":"trawa2"},{"x":722,"y":481,"exts":{},"template":"trawa2"},{"x":724,"y":471,"exts":{},"template":"trawa2"},{"x":732,"y":428,"exts":{},"template":"trawa2"},{"x":737,"y":471,"exts":{},"template":"trawa2"},{"x":745,"y":471,"exts":{},"template":"trawa2"},{"x":760,"y":483,"exts":{},"template":"trawa2"},{"x":773,"y":506,"exts":{},"template":"trawa2"},{"x":783,"y":513,"exts":{},"template":"trawa2"},{"x":811,"y":550,"exts":{},"template":"trawa2"},{"x":747,"y":472,"exts":{},"template":"trawa2"},{"x":753,"y":476,"exts":{},"template":"trawa2"},{"x":830,"y":566,"exts":{},"template":"trawa2"},{"x":830,"y":561,"exts":{},"template":"trawa2"},{"x":844,"y":567,"exts":{},"template":"trawa2"},{"x":858,"y":570,"exts":{},"template":"trawa2"},{"x":768,"y":576,"exts":{},"template":"Water"},{"x":768,"y":576,"exts":{},"template":"Water"},{"x":704,"y":640,"exts":{},"template":"Water"},{"x":704,"y":576,"exts":{},"template":"Water"},{"x":832,"y":640,"exts":{},"template":"Water"},{"x":896,"y":576,"exts":{},"template":"Water"},{"x":832,"y":576,"exts":{},"template":"Water"},{"x":960,"y":512,"exts":{},"template":"vbn"},{"x":960,"y":512,"exts":{},"template":"piach d"},{"x":128,"y":320,"exts":{},"template":"pixil-frame-0_(8)"},{"x":154,"y":320,"exts":{},"template":"pixil-frame-0_(8)"},{"x":474,"y":-239,"exts":{},"template":"z1"},{"x":467,"y":-215,"exts":{},"template":"z1"},{"x":465,"y":-188,"exts":{},"template":"z1"},{"x":496,"y":-228,"exts":{},"template":"z1"},{"x":527,"y":-295,"exts":{},"template":"z1"},{"x":527,"y":-324,"exts":{},"template":"z1"},{"x":530,"y":-338,"exts":{},"template":"z1"},{"x":536,"y":-371,"exts":{},"template":"z1"},{"x":512,"y":-192,"exts":{},"template":"z1"},{"x":576,"y":-256,"exts":{},"template":"z1"},{"x":576,"y":-320,"exts":{},"template":"z1"},{"x":576,"y":-384,"exts":{},"template":"z1"},{"x":448,"y":-128,"exts":{},"template":"z1"},{"x":384,"y":-128,"exts":{},"template":"z1"},{"x":320,"y":-128,"exts":{},"template":"z1"},{"x":320,"y":-192,"exts":{},"template":"z1"},{"x":320,"y":-192,"exts":{},"template":"z1"},{"x":256,"y":-192,"exts":{},"template":"z1"},{"x":192,"y":-320,"exts":{},"template":"z1"},{"x":192,"y":-384,"exts":{},"template":"z1"},{"x":192,"y":-256,"exts":{},"template":"z1"},{"x":256,"y":-448,"exts":{},"template":"z1"},{"x":384,"y":-512,"exts":{},"template":"z1"},{"x":320,"y":-512,"exts":{},"template":"z1"},{"x":320,"y":-512,"exts":{},"template":"z1"},{"x":448,"y":-512,"exts":{},"template":"z1"},{"x":512,"y":-448,"exts":{},"template":"z1"},{"x":64,"y":-192,"exts":{},"template":"BG"},{"x":320,"y":-128,"exts":{},"template":"BG"},{"x":512,"y":-192,"exts":{},"template":"BG"},{"x":576,"y":-320,"exts":{},"template":"BG"},{"x":576,"y":-384,"exts":{},"template":"BG"},{"x":512,"y":-640,"exts":{},"template":"BG"},{"x":320,"y":-704,"exts":{},"template":"BG"},{"x":64,"y":-640,"exts":{},"template":"BG"},{"x":0,"y":-448,"exts":{},"template":"BG"},{"x":487,"y":-222,"exts":{},"template":"z1"},{"x":483,"y":-422,"exts":{},"template":"z1"},{"x":284,"y":-420,"exts":{},"template":"z1"},{"x":289,"y":-215,"exts":{},"template":"z1"},{"x":527,"y":-345,"exts":{},"template":"z1"},{"x":535,"y":-308,"exts":{},"template":"z1"},{"x":532,"y":-332,"exts":{},"template":"z1"},{"x":388,"y":-478,"exts":{},"template":"z1"},{"x":378,"y":-476,"exts":{},"template":"z1"},{"x":402,"y":-476,"exts":{},"template":"z1"},{"x":250,"y":-297,"exts":{},"template":"z1"},{"x":242,"y":-297,"exts":{},"template":"z1"},{"x":234,"y":-326,"exts":{},"template":"z1"},{"x":372,"y":-164,"exts":{},"template":"z1"},{"x":407,"y":-161,"exts":{},"template":"z1"},{"x":842,"y":-710,"exts":{},"template":"BG"},{"x":1216,"y":-512,"exts":{},"template":"BG"},{"x":320,"y":192,"exts":{},"template":"pixil-frame-0_(23)"},{"x":448,"y":256,"exts":{},"template":"pixil-frame-0_(23)"},{"x":192,"y":192,"exts":{},"template":"pixil-frame-0_(23)"},{"x":512,"y":192,"exts":{},"template":"pixil-frame-0_(23)"},{"x":192,"y":128,"exts":{},"template":"pixil-frame-0_(23)"},{"x":576,"y":128,"exts":{},"template":"pixil-frame-0_(23)"},{"x":64,"y":320,"exts":{},"template":"ExitNiewidzialne"},{"x":-256,"y":512,"exts":{},"template":"robot"},{"x":-256,"y":512,"exts":{},"template":"piach d"},{"x":-320,"y":512,"exts":{},"template":"piach d"},{"x":-256,"y":512,"exts":{},"template":"piach d"},{"x":-256,"y":512,"exts":{},"template":"piach d"},{"x":-256,"y":512,"exts":{},"template":"piach d"},{"x":-384,"y":512,"exts":{},"template":"piach d"}]'),
    bgs: JSON.parse('[{"depth":-2,"texture":"BG","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.nextRoom = 'dzungla';
inGameRoomStart(this);
    },
    extends: {}
}
ct.rooms.templates['jaskinia'] = {
    name: 'jaskinia',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}


/**
 * @namespace
 */
ct.styles = {
    types: { },
    /**
     * Creates a new style with a given name.
     * Technically, it just writes `data` to `ct.styles.types`
     */
    new(name, styleTemplate) {
        ct.styles.types[name] = styleTemplate;
        return styleTemplate;
    },
    /**
     * Returns a style of a given name. The actual behavior strongly depends on `copy` parameter.
     * @param {string} name The name of the style to load
     * @param {boolean|Object} [copy] If not set, returns the source style object.
     * Editing it will affect all new style calls.
     * When set to `true`, will create a new object, which you can safely modify
     * without affecting the source style.
     * When set to an object, this will create a new object as well,
     * augmenting it with given properties.
     * @returns {object} The resulting style
     */
    get(name, copy) {
        if (copy === true) {
            return ct.u.ext({}, ct.styles.types[name]);
        }
        if (copy) {
            return ct.u.ext(ct.u.ext({}, ct.styles.types[name]), copy);
        }
        return ct.styles.types[name];
    }
};

ct.styles.new(
    "CrystalCounter",
    {
    "fontFamily": "sans-serif",
    "fontSize": 24,
    "fontStyle": "normal",
    "fontWeight": "600",
    "align": "left",
    "lineJoin": "round",
    "lineHeight": 32.400000000000006,
    "fill": "#00A847",
    "strokeThickness": 5,
    "stroke": "#FFFFFF"
});

ct.styles.new(
    "HeartCounter",
    {
    "fontFamily": "sans-serif",
    "fontSize": 24,
    "fontStyle": "normal",
    "fontWeight": "600",
    "align": "left",
    "lineJoin": "round",
    "lineHeight": 32.400000000000006,
    "fill": "#E85017",
    "strokeThickness": 5,
    "stroke": "#FFFFFF"
});



/**
 * @extends {PIXI.AnimatedSprite}
 * @class
 * @property {string} template The name of the template from which the copy was created
 * @property {IShapeTemplate} shape The collision shape of a copy
 * @property {number} depth The relative position of a copy in a drawing stack.
 * Higher values will draw the copy on top of those with lower ones
 * @property {number} xprev The horizontal location of a copy in the previous frame
 * @property {number} yprev The vertical location of a copy in the previous frame
 * @property {number} xstart The starting location of a copy,
 * meaning the point where it was created — either by placing it in a room with ct.IDE
 * or by calling `ct.templates.copy`.
 * @property {number} ystart The starting location of a copy,
 * meaning the point where it was created — either by placing it in a room with ct.IDE
 * or by calling `ct.templates.copy`.
 * @property {number} hspeed The horizontal speed of a copy
 * @property {number} vspeed The vertical speed of a copy
 * @property {number} gravity The acceleration that pulls a copy at each frame
 * @property {number} gravityDir The direction of acceleration that pulls a copy at each frame
 * @property {number} depth The position of a copy in draw calls
 * @property {boolean} kill If set to `true`, the copy will be destroyed by the end of a frame.
 */
const Copy = (function Copy() {
    const textureAccessor = Symbol('texture');
    const zeroDirectionAccessor = Symbol('zeroDirection');
    const hspeedAccessor = Symbol('hspeed');
    const vspeedAccessor = Symbol('vspeed');
    let uid = 0;
    class Copy extends PIXI.AnimatedSprite {
        /**
         * Creates an instance of Copy.
         * @param {string} template The name of the template to copy
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {object} [exts] An optional object with additional properties
         * that will exist prior to a copy's OnCreate event
         * @param {PIXI.DisplayObject|Room} [container] A container to set as copy's parent
         * before its OnCreate event. Defaults to ct.room.
         * @memberof Copy
         */
        constructor(template, x, y, exts, container) {
            container = container || ct.room;
            var t;
            if (template) {
                if (!(template in ct.templates.templates)) {
                    throw new Error(`[ct.templates] An attempt to create a copy of a non-existent template \`${template}\` detected. A typo?`);
                }
                t = ct.templates.templates[template];
                if (t.texture && t.texture !== '-1') {
                    const textures = ct.res.getTexture(t.texture);
                    super(textures);
                    this[textureAccessor] = t.texture;
                    this.anchor.x = textures[0].defaultAnchor.x;
                    this.anchor.y = textures[0].defaultAnchor.y;
                } else {
                    super([PIXI.Texture.EMPTY]);
                }
                this.template = template;
                this.parent = container;
                this.blendMode = t.blendMode || PIXI.BLEND_MODES.NORMAL;
                if (t.playAnimationOnStart) {
                    this.play();
                }
                if (t.extends) {
                    ct.u.ext(this, t.extends);
                }
            } else {
                super([PIXI.Texture.EMPTY]);
            }
            // it is defined in main.js
            // eslint-disable-next-line no-undef
            this[copyTypeSymbol] = true;
            this.position.set(x || 0, y || 0);
            this.xprev = this.xstart = this.x;
            this.yprev = this.ystart = this.y;
            this[hspeedAccessor] = 0;
            this[vspeedAccessor] = 0;
            this[zeroDirectionAccessor] = 0;
            this.speed = this.direction = this.gravity = 0;
            this.gravityDir = 90;
            this.depth = 0;
            if (exts) {
                ct.u.ext(this, exts);
                if (exts.tx) {
                    this.scale.x = exts.tx;
                }
                if (exts.ty) {
                    this.scale.y = exts.ty;
                }
                if (exts.tr) {
                    this.angle = exts.tr;
                }
            }
            this.uid = ++uid;
            if (template) {
                ct.u.ext(this, {
                    template,
                    depth: t.depth,
                    onStep: t.onStep,
                    onDraw: t.onDraw,
                    onCreate: t.onCreate,
                    onDestroy: t.onDestroy,
                    shape: ct.res.getTextureShape(t.texture || -1)
                });
                if (exts && exts.depth !== void 0) {
                    this.depth = exts.depth;
                }
                if (ct.templates.list[template]) {
                    ct.templates.list[template].push(this);
                } else {
                    ct.templates.list[template] = [this];
                }
                this.onBeforeCreateModifier();
                ct.templates.templates[template].onCreate.apply(this);
            }
            return this;
        }

        /**
         * The name of the current copy's texture, or -1 for an empty texture.
         * @param {string} value The name of the new texture
         * @type {(string|number)}
         */
        set tex(value) {
            if (this[textureAccessor] === value) {
                return value;
            }
            var {playing} = this;
            this.textures = ct.res.getTexture(value);
            this[textureAccessor] = value;
            this.shape = ct.res.getTextureShape(value);
            this.anchor.x = this.textures[0].defaultAnchor.x;
            this.anchor.y = this.textures[0].defaultAnchor.y;
            if (playing) {
                this.play();
            }
            return value;
        }
        get tex() {
            return this[textureAccessor];
        }

        get speed() {
            return Math.hypot(this.hspeed, this.vspeed);
        }
        /**
         * The speed of a copy that is used in `this.move()` calls
         * @param {number} value The new speed value
         * @type {number}
         */
        set speed(value) {
            if (value === 0) {
                this[zeroDirectionAccessor] = this.direction;
                this.hspeed = this.vspeed = 0;
                return;
            }
            if (this.speed === 0) {
                this.hspeed = value;
                return;
            }
            var multiplier = value / this.speed;
            this.hspeed *= multiplier;
            this.vspeed *= multiplier;
        }
        get hspeed() {
            return this[hspeedAccessor];
        }
        set hspeed(value) {
            if (this.vspeed === 0 && value === 0) {
                this[zeroDirectionAccessor] = this.direction;
            }
            this[hspeedAccessor] = value;
            return value;
        }
        get vspeed() {
            return this[vspeedAccessor];
        }
        set vspeed(value) {
            if (this.hspeed === 0 && value === 0) {
                this[zeroDirectionAccessor] = this.direction;
            }
            this[vspeedAccessor] = value;
            return value;
        }
        get direction() {
            if (this.speed === 0) {
                return this[zeroDirectionAccessor];
            }
            return (Math.atan2(this.vspeed, this.hspeed) * 180 / Math.PI + 360) % 360;
        }
        /**
         * The moving direction of the copy, in degrees, starting with 0 at the right side
         * and going with 90 facing upwards, 180 facing left, 270 facing down.
         * This parameter is used by `this.move()` call.
         * @param {number} value New direction
         * @type {number}
         */
        set direction(value) {
            this[zeroDirectionAccessor] = value;
            if (this.speed > 0) {
                var speed = this.speed;
                this.hspeed = speed * Math.cos(value * Math.PI / 180);
                this.vspeed = speed * Math.sin(value * Math.PI / 180);
            }
            return value;
        }

        /**
         * Performs a movement step, reading such parameters as `gravity`, `speed`, `direction`.
         * @returns {void}
         */
        move() {
            if (this.gravity) {
                this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / 180);
                this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / 180);
            }
            this.x += this.hspeed * ct.delta;
            this.y += this.vspeed * ct.delta;
        }
        /**
         * Adds a speed vector to the copy, accelerating it by a given delta speed
         * in a given direction.
         * @param {number} spd Additive speed
         * @param {number} dir The direction in which to apply additional speed
         * @returns {void}
         */
        addSpeed(spd, dir) {
            this.hspeed += spd * Math.cos(dir * Math.PI / 180);
            this.vspeed += spd * Math.sin(dir * Math.PI / 180);
        }

        /**
         * Returns the room that owns the current copy
         * @returns {Room} The room that owns the current copy
         */
        getRoom() {
            let parent = this.parent;
            while (!(parent instanceof Room)) {
                parent = parent.parent;
            }
            return parent;
        }

        // eslint-disable-next-line class-methods-use-this
        onBeforeCreateModifier() {
            // Filled by ct.IDE and catmods
            
        }
    }
    return Copy;
})();

(function ctTemplateAddon(ct) {
    const onCreateModifier = function () {
        this.$chashes = ct.place.getHashes(this);
for (const hash of this.$chashes) {
    if (!(hash in ct.place.grid)) {
        ct.place.grid[hash] = [this];
    } else {
        ct.place.grid[hash].push(this);
    }
}
if ([false][0] && this instanceof ct.templates.Copy) {
    this.$cDebugText = new PIXI.Text('Not initialized', {
        fill: 0xffffff,
        dropShadow: true,
        dropShadowDistance: 2,
        fontSize: [][0] || 16
    });
    this.$cDebugCollision = new PIXI.Graphics();
    this.addChild(this.$cDebugCollision, this.$cDebugText);
}

    };

    /**
     * An object with properties and methods for manipulating templates and copies,
     * mainly for finding particular copies and creating new ones.
     * @namespace
     */
    ct.templates = {
        Copy,
        /**
         * An object that contains arrays of copies of all templates.
         * @type {Object.<string,Array<Copy>>}
         */
        list: {
            BACKGROUND: [],
            TILEMAP: []
        },
        /**
         * A map of all the templates of templates exported from ct.IDE.
         * @type {object}
         */
        templates: { },
        /**
         * Creates a new copy of a given template inside a specific room.
         * @param {string} template The name of the template to use
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {Room} [room] The room to which add the copy.
         * Defaults to the current room.
         * @param {object} [exts] An optional object which parameters will be applied
         * to the copy prior to its OnCreate event.
         * @returns {Copy} the created copy.
         */
        copyIntoRoom(template, x = 0, y = 0, room, exts) {
            // An advanced constructor. Returns a Copy
            if (!room || !(room instanceof Room)) {
                throw new Error(`Attempt to spawn a copy of template ${template} inside an invalid room. Room's value provided: ${room}`);
            }
            const obj = new Copy(template, x, y, exts);
            room.addChild(obj);
            ct.stack.push(obj);
            onCreateModifier.apply(obj);
            return obj;
        },
        /**
         * Creates a new copy of a given template inside the current root room.
         * A shorthand for `ct.templates.copyIntoRoom(template, x, y, ct.room, exts)`
         * @param {string} template The name of the template to use
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {object} [exts] An optional object which parameters will be applied
         * to the copy prior to its OnCreate event.
         * @returns {Copy} the created copy.
         */
        copy(template, x = 0, y = 0, exts) {
            return ct.templates.copyIntoRoom(template, x, y, ct.room, exts);
        },
        /**
         * Applies a function to each copy in the current room
         * @param {Function} func The function to apply
         * @returns {void}
         */
        each(func) {
            for (const copy of ct.stack) {
                if (!(copy instanceof Copy)) {
                    continue; // Skip backgrounds and tile layers
                }
                func.apply(copy, this);
            }
        },
        /**
         * Applies a function to a given object (e.g. to a copy)
         * @param {Copy} obj The copy to perform function upon.
         * @param {Function} function The function to be applied.
         */
        withCopy(obj, func) {
            func.apply(obj, this);
        },
        /**
         * Applies a function to every copy of the given template name
         * @param {string} template The name of the template to perform function upon.
         * @param {Function} function The function to be applied.
         */
        withTemplate(template, func) {
            for (const copy of ct.templates.list[template]) {
                func.apply(copy, this);
            }
        },
        /**
         * Checks whether there are any copies of this template's name.
         * Will throw an error if you pass an invalid template name.
         * @param {string} template The name of a template to check.
         * @returns {boolean} Returns `true` if at least one copy exists in a room;
         * `false` otherwise.
         */
        exists(template) {
            if (!(template in ct.templates.templates)) {
                throw new Error(`[ct.templates] ct.templates.exists: There is no such template ${template}.`);
            }
            return ct.templates.list[template].length > 0;
        },
        /*
         * Checks whether a given object exists in game's world.
         * Intended to be applied to copies, but may be used with other PIXI entities.
         * @param {Copy|PIXI.DisplayObject|any} obj The copy which existence needs to be checked.
         * @returns {boolean} Returns `true` if a copy exists; `false` otherwise.
         */
        valid(obj) {
            if (obj instanceof Copy) {
                return !obj.kill;
            }
            if (obj instanceof PIXI.DisplayObject) {
                return Boolean(obj.position);
            }
            return Boolean(obj);
        },
        /**
         * Checks whether a given object is a ct.js copy.
         * @param {any} obj The object which needs to be checked.
         * @returns {boolean} Returns `true` if the passed object is a copy; `false` otherwise.
         */
        isCopy(obj) {
            return obj instanceof Copy;
        }
    };

    
ct.templates.templates["robot"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Robot_Idle",
    onStep: function () {
        this.movespeed = 4 * ct.delta; // Max horizontal speed

if(!this.first_setup) {
this.jumpSpeed = ct.room.underwaterLevel ? -3 : -10;
this.gravity = ct.room.underwaterLevel ? 0.05 : 0.4;
if (this.tex !== this.walking_texture && ct.room.underwaterLevel) {
    this.tex = this.walking_texture;
    this.play();
}
if(ct.room.underwaterLevel) {
        this.rotation = -90;
    }
}



if (ct.actions.MoveLeft.down) {
    // If the A key or left arrow on a keyboard is down, then move to left
    this.hspeed = -this.movespeed;
    if (this.tex !== this.walking_texture && !ct.room.underwaterLevel) {
        this.tex = this.walking_texture;
        this.play();
    }
    this.scale.x = -1;
    if(ct.room.underwaterLevel) {
        this.rotation = 90;
    }
} else if (ct.actions.MoveRight.down) {
    // If the D key or right arrow on a keyboard is down, then move to right
    this.hspeed = this.movespeed;
    // Set the walking animation and transform the robot to the right
    if (this.tex !== this.walking_texture && !ct.room.underwaterLevel) {
        this.tex = this.walking_texture;
        this.play();
    }
    
    this.scale.x = 1;
    if(ct.room.underwaterLevel) {
        this.rotation = -90;
    }
} else {
    // Don't move horizontally if no input
    this.hspeed = 0;
    if(!ct.room.underwaterLevel) {
        this.tex = 'Robot_Idle';
    }
}

var skrzynia;

// If there is ground underneath the Robot…
if ((ct.room.underwaterLevel && ct.actions.Jump.down) || ct.place.occupied(this, this.x, this.y + 1, 'Solid')) {
    // …and the W key or the spacebar is down…
    if (ct.actions.Jump.down) {
        // …then jump!
        this.vspeed = this.jumpSpeed;
    } else {
        // Reset our vspeed. We don't want to be buried underground!
        this.vspeed = 0;
    }
} else {
    // If there is no ground
    this.vspeed += this.gravity * ct.delta;

    // Set jumping animation!
    if(!ct.room.underwaterLevel) {
        this.tex = 'Robot_Jump';
    }
}

if(ct.room.underwaterLevel){
  if (skrzynia = ct.place.occupied(this, this.x, this.y + 1, 'skrzynia')) {
        skrzynia.kill = true
    }
if (skrzynia = ct.place.occupied(this, this.x, this.y - 1, 'skrzynia')) {
        skrzynia.kill = true
    }
if (skrzynia = ct.place.occupied(this, this.x - 1, this.y , 'skrzynia')) {
        skrzynia.kill = true
    }
    if (skrzynia = ct.place.occupied(this, this.x + 1, this.y , 'skrzynia')) {
        skrzynia.kill = true
    }
} else {
    if (skrzynia = ct.place.occupied(this, this.x, this.y + 1, 'skrzynia')) {
        this.vspeed = this.jumpSpeed;
        if(!ct.room.underwaterLevel) {
            this.tex = 'Robot_Jump';
        }
        skrzynia.kill = true
    }
}



// Move by horizontal axis, pixel by pixel
for (var i = 0; i < Math.abs(this.hspeed); i++) {
    if (ct.place.free(this, this.x + Math.sign(this.hspeed), this.y, 'Solid') && ct.place.free(this, this.x + Math.sign(this.hspeed), this.y, 'skrzynia')) {
        this.x += Math.sign(this.hspeed);
    } else {
        break;
    }
}
// Do the same for vertical speed
for (var i = 0; i < Math.abs(this.vspeed); i++) {
    if (ct.place.free(this, this.x, this.y + Math.sign(this.vspeed), 'Solid') && ct.place.free(this, this.x, this.y + Math.sign(this.vspeed), 'skrzynia') ) {
        this.y += Math.sign(this.vspeed);
    } else {
        break;
    }
}

if (ct.place.occupied(this, this.x, this.y, 'Deadly')) {
    this.x = this.savedX;
    this.y = this.savedY;
    ct.room.waterLevel = ct.room.savedWaterLevel || 0.0;
    this.hspeed = 0;
    this.vspeed = 0;
    // remove one life
    ct.room.lives --;
    if (ct.room.lives <= 0) {
        // Restart a room: switch to the room of its own name
        ct.rooms.switch(ct.room.name);
    }
    return;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.jumpSpeed = ct.room.underwaterLevel ? -3 : -10;
this.gravity = ct.room.underwaterLevel ? 0.05 : 0.4;
this.animationSpeed = 0.2;
this.hspeed = 0; // Horizontal speed
this.vspeed = 0; // Vertical speed
this.first_setup = false;
this.walking_texture = 'Robot_Walking'

this.savedX = this.x;
this.savedY = this.y;

ct.camera.follow = this;
ct.camera.borderX = 450;
ct.camera.borderY = 200;
    },
    extends: {}
};
ct.templates.list['robot'] = [];
ct.templates.templates["skała"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Rocks",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['skała'] = [];
ct.templates.templates["pratforma"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Rocks_Platform",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['pratforma'] = [];
ct.templates.templates["trawa"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Rocks_Top",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['trawa'] = [];
ct.templates.templates["Water"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Water",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['Water'] = [];
ct.templates.templates["WaterTop"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Water_Top",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['WaterTop'] = [];
ct.templates.templates["Spikes"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Spikes",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['Spikes'] = [];
ct.templates.templates["Checkpoint"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Checkpoint",
    onStep: function () {
        var robot = ct.place.meet(this, this.x, this.y, 'robot');
if (robot) {
    robot.savedX = this.x + 32;
    robot.savedY = this.y + 32;
    ct.room.savedWaterLevel = Math.min((ct.room.waterLevel || 0.0) + 128.0, 0.0);
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.visible = false;
    },
    extends: {}
};
ct.templates.list['Checkpoint'] = [];
ct.templates.templates["LevelExit"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Exit",
    onStep: function () {
        // Are there next rooms defined?
if(this.targetRoom && this.visible) {
    // Do we collide with the Robot?
    if (ct.place.meet(this, this.x, this.y, 'robot')) {
        // Switch to the next room
        ct.rooms.switch(this.targetRoom);
    }
} else if (ct.room.nextRoom && this.visible) {
    
    // Do we collide with the Robot?
    if (ct.place.meet(this, this.x, this.y, 'robot')) {
        // Switch to the next room
        ct.rooms.switch(ct.room.nextRoom);
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['LevelExit'] = [];
ct.templates.templates["GreenCrystal"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "GreenCrystal",
    onStep: function () {
        if (ct.place.meet(this, this.x, this.y, 'robot')) {
    ct.room.crystals ++;
    this.kill = true;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['GreenCrystal'] = [];
ct.templates.templates["liczbak"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "GreenCrystal",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        this.text.text = `${ct.room.crystals} / ${ct.room.crystalsTotal}`;
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.text = new PIXI.Text('0 / ' + ct.room.crystalsTotal, ct.styles.get('CrystalCounter'));
this.text.x = 32;
this.text.anchor.y = 0.5;

this.addChild(this.text);

    },
    extends: {}
};
ct.templates.list['liczbak'] = [];
ct.templates.templates["platforma_ukryta"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "platforma_ukryta",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.visible = false;
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['platforma_ukryta'] = [];
ct.templates.templates["Heart"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Heart",
    onStep: function () {
        if (ct.place.meet(this, this.x, this.y, 'robot')) {
    if (ct.room.lives < 3) {
        ct.room.lives++;
        this.kill = true;
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Heart'] = [];
ct.templates.templates["liczbazyc"] = {
    depth: 2,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Heart",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        this.text.text = ct.room.lives;
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.text = new PIXI.Text(ct.room.lives, ct.styles.get('HeartCounter'));
this.text.x = 32;
this.text.anchor.y = 0.5;

this.addChild(this.text);

    },
    extends: {}
};
ct.templates.list['liczbazyc'] = [];
ct.templates.templates["Platform"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Platform",
    onStep: function () {
        var robot = ct.place.meet(this, this.x, this.y, 'robot');
if (robot) {
    this.cgroup = undefined;
} else {
    this.cgroup = 'Solid';
    robot = ct.place.meet(this, this.x, this.y - 1, 'robot');
    if (robot) {
        robot.x += ct.u.ldx(this.speed, this.direction);
    }
}

if (ct.place.occupied(this, this.x + this.speed * ct.delta, this.y, 'Solid')) {
    // Flip direction
    this.direction += 180;
}
this.move();

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.speed = 2;
this.cgroup = 'Solid';

    },
    extends: {
    "ctype": "",
    "cgroup": "Solid"
}
};
ct.templates.list['Platform'] = [];
ct.templates.templates["lava2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "lava2",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['lava2'] = [];
ct.templates.templates["lava2-top"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "lava2-top",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['lava2-top'] = [];
ct.templates.templates["kolce"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "kolce",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['kolce'] = [];
ct.templates.templates["lod"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "lod",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['lod'] = [];
ct.templates.templates["snieg"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "snieg",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['snieg'] = [];
ct.templates.templates["snieg-platforma"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "snieg-platforma",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['snieg-platforma'] = [];
ct.templates.templates["szklo2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "szklo2",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['szklo2'] = [];
ct.templates.templates["dywan"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "mur-gora",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['dywan'] = [];
ct.templates.templates["zamek-platforma"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "zamek-platforma",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['zamek-platforma'] = [];
ct.templates.templates["plat"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "kolce-piach-2",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['plat'] = [];
ct.templates.templates["piach g"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "kolce_piach",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['piach g'] = [];
ct.templates.templates["piach d"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(1)_2",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['piach d'] = [];
ct.templates.templates["dwn"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "mur-gora",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['dwn'] = [];
ct.templates.templates["Boss1"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "lava_boss",
    onStep: function () {
        this.robot_copy = this.robot_copy || ct.templates.list.robot[0];

if(this.y+1 > this.robot_copy.y) {
    this.cgroup = "Solid";

    if(this.robot_copy.vspeed > 0 && ct.place.meet(this, this.x, this.y - 5, 'robot')){
        this.robot_copy.vspeed = -10;
        this.lives--;
        if(this.lives <= 0) {
           this.kill = true;
           for(var a of ct.templates.list.LevelExit){
               a.visible = true;
           }
        }
    }
} else if (this.y-2 < this.robot_copy.y) { 
    this.cgroup = "Deadly";
}

if (ct.place.occupied(this, this.x + this.speed * ct.delta, this.y, 'Solid')) {
    // Flip direction
    this.direction += 180;
}


this.move();

    },
    onDraw: function () {
        this.text.text = this.lives;
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.lives = 5;
this.speed = 2;

this.text = new PIXI.Text(this.lives, ct.styles.get('HeartCounter'));
this.text.x = 64;
this.text.anchor.y = 0.5;

this.addChild(this.text);

    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['Boss1'] = [];
ct.templates.templates["kolc"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(17)-kopia_2",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['kolc'] = [];
ct.templates.templates["skrzynia"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(9)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "skrzynia"
}
};
ct.templates.list['skrzynia'] = [];
ct.templates.templates["skrzynia_lod"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(10)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "skrzynia"
}
};
ct.templates.list['skrzynia_lod'] = [];
ct.templates.templates["Water_Top_grow"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Water_Top_grow",
    onStep: function () {
        this.y = this.star_y + (ct.room.waterLevel || 0.0);
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.star_y = this.y;

    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['Water_Top_grow'] = [];
ct.templates.templates["Water_grow"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Water-grow",
    onStep: function () {
        this.y = this.start_y + (ct.room.waterLevel || 0.0);
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.start_y = this.y;
    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['Water_grow'] = [];
ct.templates.templates["Boss2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(17)",
    onStep: function () {
        this.robot_copy = this.robot_copy || ct.templates.list.robot[0];

if(this.y+1 > this.robot_copy.y) {
    this.cgroup = "Solid";

    if(this.robot_copy.vspeed > 0 && ct.place.meet(this, this.x, this.y - 5, 'robot')){
        this.robot_copy.vspeed = -10;
        this.lives--;
        if(this.lives <= 0) {
           this.kill = true;
           for(var a of ct.templates.list.LevelExit){
               a.visible = true;
           }
        }
    }
} else if (this.y-2 < this.robot_copy.y) { 
    this.cgroup = "Deadly";
}

if (ct.place.occupied(this, this.x + this.speed * ct.delta, this.y, 'Solid')) {
    // Flip direction
    this.direction += 180;
}


this.move();

    },
    onDraw: function () {
        this.text.text = this.lives;
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.lives = 5;
this.speed = 3;

this.text = new PIXI.Text(this.lives, ct.styles.get('HeartCounter'));
this.text.x = 64;
this.text.anchor.y = 0.5;

this.addChild(this.text);

    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['Boss2'] = [];
ct.templates.templates[""] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list[''] = [];
ct.templates.templates["ziemia"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(29)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['ziemia'] = [];
ct.templates.templates["zernnit"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(32)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['zernnit'] = [];
ct.templates.templates["qwe"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(35)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['qwe'] = [];
ct.templates.templates["rty"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(36)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['rty'] = [];
ct.templates.templates["uio"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(37)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['uio'] = [];
ct.templates.templates["pas"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(38)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pas'] = [];
ct.templates.templates["dfg"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(39)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['dfg'] = [];
ct.templates.templates["hjk"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(40)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Deadly"
}
};
ct.templates.list['hjk'] = [];
ct.templates.templates["jkl"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(42)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['jkl'] = [];
ct.templates.templates["zxc"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(41)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['zxc'] = [];
ct.templates.templates["vbn"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(34)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['vbn'] = [];
ct.templates.templates["wer"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(43)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['wer'] = [];
ct.templates.templates["rew"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(44)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['rew'] = [];
ct.templates.templates["krat"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(45)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['krat'] = [];
ct.templates.templates["p0o"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(46)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['p0o'] = [];
ct.templates.templates["o0p"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(47)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['o0p'] = [];
ct.templates.templates["sk"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(48)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['sk'] = [];
ct.templates.templates["z89"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(49)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['z89'] = [];
ct.templates.templates["d98"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(50)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['d98'] = [];
ct.templates.templates["NewType"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['NewType'] = [];
ct.templates.templates["kri"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(51)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['kri'] = [];
ct.templates.templates["TNT"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(52)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['TNT'] = [];
ct.templates.templates["ned"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(53)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['ned'] = [];
ct.templates.templates["z1"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(54)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['z1'] = [];
ct.templates.templates["pppppooooo"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(55)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['pppppooooo'] = [];
ct.templates.templates["pin"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(56)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pin'] = [];
ct.templates.templates["pi1"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(58)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pi1'] = [];
ct.templates.templates["pixil-frame-0_(5)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(5)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(5)'] = [];
ct.templates.templates["pixil-frame-0_(1)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "magnez",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(1)'] = [];
ct.templates.templates["pixil-frame-0_(2)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(2)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(2)'] = [];
ct.templates.templates["pixil-frame-0"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "sciana",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0'] = [];
ct.templates.templates["pixil-frame-0_(44)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(44)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(44)'] = [];
ct.templates.templates["hgy"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['hgy'] = [];
ct.templates.templates["pixi"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(1)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixi'] = [];
ct.templates.templates["pixil-frame-0_(66)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(66)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(66)'] = [];
ct.templates.templates["pixil-frame-0_(67)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(67)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(67)'] = [];
ct.templates.templates["pixil-frame-0_(68)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(68)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(68)'] = [];
ct.templates.templates["Bluey"] = {
    depth: -1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "bluey-art",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "ctype": ""
}
};
ct.templates.list['Bluey'] = [];
ct.templates.templates["trawa2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "trawa",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['trawa2'] = [];
ct.templates.templates["BG"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "BG",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['BG'] = [];
ct.templates.templates["pixil-frame-0_(1)_2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(1)_2",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(1)_2'] = [];
ct.templates.templates["ExitNiewidzialne"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "drzwi_ukryte",
    onStep: function () {
        // Are there next rooms defined?
if(this.targetRoom) {
    // Do we collide with the Robot?
    if (ct.place.meet(this, this.x, this.y, 'robot')) {
        // Switch to the next room
        ct.rooms.switch(this.targetRoom);
    }
} else if (ct.room.nextRoom) {
    
    // Do we collide with the Robot?
    if (ct.place.meet(this, this.x, this.y, 'robot')) {
        // Switch to the next room
        ct.rooms.switch(ct.room.nextRoom);
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.visible=false;
    },
    extends: {}
};
ct.templates.list['ExitNiewidzialne'] = [];
ct.templates.templates["g1"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "g1",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['g1'] = [];
ct.templates.templates["pixil-frame"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame'] = [];
ct.templates.templates["pixil"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil'] = [];
ct.templates.templates["pixil-frame-0_(8)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(8)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(8)'] = [];
ct.templates.templates["pixil-frame-0_(4)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(4)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(4)'] = [];
ct.templates.templates["pixil-frame-0_(11)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(11)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(11)'] = [];
ct.templates.templates["pixil-frame-0_(12)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(12)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['pixil-frame-0_(12)'] = [];
ct.templates.templates["pixil-frame-0_(14)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(14)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(14)'] = [];
ct.templates.templates["pixil-frame-0_(13)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(13)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(13)'] = [];
ct.templates.templates["NewTemplate"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['NewTemplate'] = [];
ct.templates.templates["pixil-frame-0_(21)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(21)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(21)'] = [];
ct.templates.templates["pixil-frame-0_(22)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(22)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(22)'] = [];
ct.templates.templates["pixil-frame-0_(23)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(23)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(23)'] = [];
ct.templates.templates["pixil-frame-0_(24)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(24)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['pixil-frame-0_(24)'] = [];
ct.templates.templates["pixil-frame-0_(25)"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "pixil-frame-0_(25)",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {
    "cgroup": "Solid"
}
};
ct.templates.list['pixil-frame-0_(25)'] = [];
    

    ct.templates.beforeStep = function beforeStep() {
        
    };
    ct.templates.afterStep = function afterStep() {
        
    };
    ct.templates.beforeDraw = function beforeDraw() {
        if ([false][0] && this instanceof ct.templates.Copy) {
    this.$cDebugText.scale.x = this.$cDebugCollision.scale.x = 1 / this.scale.x;
    this.$cDebugText.scale.y = this.$cDebugCollision.scale.y = 1 / this.scale.y;
    this.$cDebugText.angle = this.$cDebugCollision.angle = -this.angle;

    const newtext = `Partitions: ${this.$chashes.join(', ')}
CGroup: ${this.cgroup || 'unset'}
Shape: ${(this._shape && this._shape.__type) || 'unused'}`;
    if (this.$cDebugText.text !== newtext) {
        this.$cDebugText.text = newtext;
    }
    this.$cDebugCollision
    .clear();
    ct.place.drawDebugGraphic.apply(this);
    this.$cHadCollision = false;
}

    };
    ct.templates.afterDraw = function afterDraw() {
        /* eslint-disable no-underscore-dangle */
if ((this.transform && (this.transform._localID !== this.transform._currentLocalID)) ||
    this.x !== this.xprev ||
    this.y !== this.yprev
) {
    delete this._shape;
    const oldHashes = this.$chashes || [];
    this.$chashes = ct.place.getHashes(this);
    for (const hash of oldHashes) {
        if (this.$chashes.indexOf(hash) === -1) {
            ct.place.grid[hash].splice(ct.place.grid[hash].indexOf(this), 1);
        }
    }
    for (const hash of this.$chashes) {
        if (oldHashes.indexOf(hash) === -1) {
            if (!(hash in ct.place.grid)) {
                ct.place.grid[hash] = [this];
            } else {
                ct.place.grid[hash].push(this);
            }
        }
    }
}

    };
    ct.templates.onDestroy = function onDestroy() {
        if (this.$chashes) {
    for (const hash of this.$chashes) {
        ct.place.grid[hash].splice(ct.place.grid[hash].indexOf(this), 1);
    }
}

    };
})(ct);
/**
 * @extends {PIXI.TilingSprite}
 * @property {number} shiftX How much to shift the texture horizontally, in pixels.
 * @property {number} shiftY How much to shift the texture vertically, in pixels.
 * @property {number} movementX The speed at which the background's texture moves by X axis,
 * wrapping around its area. The value is measured in pixels per frame, and takes
 * `ct.delta` into account.
 * @property {number} movementY The speed at which the background's texture moves by Y axis,
 * wrapping around its area. The value is measured in pixels per frame, and takes
 * `ct.delta` into account.
 * @property {number} parallaxX A value that makes background move faster
 * or slower relative to other objects. It is often used to create an effect of depth.
 * `1` means regular movement, values smaller than 1
 * will make it move slower and make an effect that a background is placed farther away from camera;
 * values larger than 1 will do the opposite, making the background appear closer than the rest
 * of object.
 * This property is for horizontal movement.
 * @property {number} parallaxY A value that makes background move faster
 * or slower relative to other objects. It is often used to create an effect of depth.
 * `1` means regular movement, values smaller than 1
 * will make it move slower and make an effect that a background is placed farther away from camera;
 * values larger than 1 will do the opposite, making the background appear closer than the rest
 * of object.
 * This property is for vertical movement.
 * @class
 */
class Background extends PIXI.TilingSprite {
    constructor(texName, frame = 0, depth = 0, exts = {}) {
        var width = ct.camera.width,
            height = ct.camera.height;
        const texture = texName instanceof PIXI.Texture ?
            texName :
            ct.res.getTexture(texName, frame || 0);
        if (exts.repeat === 'no-repeat' || exts.repeat === 'repeat-x') {
            height = texture.height * (exts.scaleY || 1);
        }
        if (exts.repeat === 'no-repeat' || exts.repeat === 'repeat-y') {
            width = texture.width * (exts.scaleX || 1);
        }
        super(texture, width, height);
        if (!ct.backgrounds.list[texName]) {
            ct.backgrounds.list[texName] = [];
        }
        ct.backgrounds.list[texName].push(this);
        ct.templates.list.BACKGROUND.push(this);
        ct.stack.push(this);
        this.anchor.x = this.anchor.y = 0;
        this.depth = depth;
        this.shiftX = this.shiftY = this.movementX = this.movementY = 0;
        this.parallaxX = this.parallaxY = 1;
        if (exts) {
            ct.u.extend(this, exts);
        }
        if (this.scaleX) {
            this.tileScale.x = Number(this.scaleX);
        }
        if (this.scaleY) {
            this.tileScale.y = Number(this.scaleY);
        }
        this.reposition();
    }
    onStep() {
        this.shiftX += ct.delta * this.movementX;
        this.shiftY += ct.delta * this.movementY;
    }
    /**
     * Updates the position of this background.
     */
    reposition() {
        const cameraBounds = this.isUi ?
            {
                x: 0, y: 0, width: ct.camera.width, height: ct.camera.height
            } :
            ct.camera.getBoundingBox();
        if (this.repeat !== 'repeat-x' && this.repeat !== 'no-repeat') {
            this.y = cameraBounds.y;
            this.tilePosition.y = -this.y * this.parallaxY + this.shiftY;
            this.height = cameraBounds.height + 1;
        } else {
            this.y = this.shiftY + cameraBounds.y * (this.parallaxY - 1);
        }
        if (this.repeat !== 'repeat-y' && this.repeat !== 'no-repeat') {
            this.x = cameraBounds.x;
            this.tilePosition.x = -this.x * this.parallaxX + this.shiftX;
            this.width = cameraBounds.width + 1;
        } else {
            this.x = this.shiftX + cameraBounds.x * (this.parallaxX - 1);
        }
    }
    onDraw() {
        this.reposition();
    }
    static onCreate() {
        void 0;
    }
    static onDestroy() {
        void 0;
    }
    get isUi() {
        return this.parent ? Boolean(this.parent.isUi) : false;
    }
}
/**
 * @namespace
 */
ct.backgrounds = {
    Background,
    list: {},
    /**
     * @returns {Background} The created background
     */
    add(texName, frame = 0, depth = 0, container = ct.room) {
        if (!texName) {
            throw new Error('[ct.backgrounds] The texName argument is required.');
        }
        const bg = new Background(texName, frame, depth);
        container.addChild(bg);
        return bg;
    }
};
ct.templates.Background = Background;

/**
 * @extends {PIXI.Container}
 * @class
 */
class Tilemap extends PIXI.Container {
    /**
     * @param {object} template A template object that contains data about depth
     * and tile placement. It is usually used by ct.IDE.
     */
    constructor(template) {
        super();
        this.pixiTiles = [];
        if (template) {
            this.depth = template.depth;
            this.tiles = template.tiles.map(tile => ({
                ...tile
            }));
            if (template.extends) {
                Object.assign(this, template.extends);
            }
            for (let i = 0, l = template.tiles.length; i < l; i++) {
                const textures = ct.res.getTexture(template.tiles[i].texture);
                const sprite = new PIXI.Sprite(textures[template.tiles[i].frame]);
                sprite.anchor.x = sprite.anchor.y = 0;
                sprite.shape = textures.shape;
                this.addChild(sprite);
                this.pixiTiles.push(sprite);
                this.tiles[i].sprite = sprite;
                sprite.x = template.tiles[i].x;
                sprite.y = template.tiles[i].y;
            }
        } else {
            this.tiles = [];
        }
        ct.templates.list.TILEMAP.push(this);
    }
    /**
     * Adds a tile to the tilemap. Will throw an error if a tilemap is cached.
     * @param {string} textureName The name of the texture to use
     * @param {number} x The horizontal location of the tile
     * @param {number} y The vertical location of the tile
     * @param {number} [frame] The frame to pick from the source texture. Defaults to 0.
     * @returns {PIXI.Sprite} The created tile
     */
    addTile(textureName, x, y, frame = 0) {
        if (this.cached) {
            throw new Error('[ct.tiles] Adding tiles to cached tilemaps is forbidden. Create a new tilemap, or add tiles before caching the tilemap.');
        }
        const texture = ct.res.getTexture(textureName, frame);
        const sprite = new PIXI.Sprite(texture);
        sprite.x = x;
        sprite.y = y;
        sprite.shape = texture.shape;
        this.tiles.push({
            texture: textureName,
            frame,
            x,
            y,
            width: sprite.width,
            height: sprite.height,
            sprite
        });
        this.addChild(sprite);
        this.pixiTiles.push(sprite);
        return sprite;
    }
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     */
    cache(chunkSize = 1024) {
        if (this.cached) {
            throw new Error('[ct.tiles] Attempt to cache an already cached tilemap.');
        }

        // Divide tiles into a grid of larger cells so that we can cache these cells as
        const bounds = this.getLocalBounds();
        const cols = Math.ceil(bounds.width / chunkSize),
              rows = Math.ceil(bounds.height / chunkSize);
        this.cells = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = new PIXI.Container();
                this.cells.push(cell);
            }
        }
        for (let i = 0, l = this.tiles.length; i < l; i++) {
            const tile = this.children[0],
                  x = Math.floor((tile.x - bounds.x) / chunkSize),
                  y = Math.floor((tile.y - bounds.y) / chunkSize);
            this.cells[y * cols + x].addChild(tile);
        }
        this.removeChildren();

        // Filter out empty cells, cache filled ones
        for (let i = 0, l = this.cells.length; i < l; i++) {
            if (this.cells[i].children.length === 0) {
                this.cells.splice(i, 1);
                i--;
                l--;
                continue;
            }
            this.addChild(this.cells[i]);
            this.cells[i].cacheAsBitmap = true;
        }

        this.cached = true;
    }
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     *
     * This version packs tiles into rhombus-shaped chunks, and sorts them
     * from top to bottom. This fixes seam issues for isometric games.
     */
    cacheDiamond(chunkSize = 1024) {
        if (this.cached) {
            throw new Error('[ct.tiles] Attempt to cache an already cached tilemap.');
        }

        this.cells = [];
        this.diamondCellMap = {};
        for (let i = 0, l = this.tiles.length; i < l; i++) {
            const tile = this.children[0];
            const [xNormalized, yNormalized] = ct.u.rotate(tile.x, tile.y * 2, -45);
            const x = Math.floor(xNormalized / chunkSize),
                  y = Math.floor(yNormalized / chunkSize),
                  key = `${x}:${y}`;
            if (!(key in this.diamondCellMap)) {
                const chunk = new PIXI.Container();
                chunk.chunkX = x;
                chunk.chunkY = y;
                this.diamondCellMap[key] = chunk;
                this.cells.push(chunk);
            }
            this.diamondCellMap[key].addChild(tile);
        }
        this.removeChildren();

        this.cells.sort((a, b) => {
            const maxA = Math.max(a.chunkY, a.chunkX),
                  maxB = Math.max(b.chunkY, b.chunkX);
            if (maxA === maxB) {
                return b.chunkX - a.chunkX;
            }
            return maxA - maxB;
        });

        for (let i = 0, l = this.cells.length; i < l; i++) {
            this.addChild(this.cells[i]);
            this.cells[i].cacheAsBitmap = true;
        }

        this.cached = true;
    }
}
ct.templates.Tilemap = Tilemap;

/**
 * @namespace
 */
ct.tilemaps = {
    /**
     * Creates a new tilemap at a specified depth, and adds it to the main room (ct.room).
     * @param {number} [depth] The depth of a newly created tilemap. Defaults to 0.
     * @returns {Tilemap} The created tilemap.
     */
    create(depth = 0) {
        const tilemap = new Tilemap();
        tilemap.depth = depth;
        ct.room.addChild(tilemap);
        return tilemap;
    },
    /**
     * Adds a tile to the specified tilemap. It is the same as
     * calling `tilemap.addTile(textureName, x, y, frame).
     * @param {Tilemap} tilemap The tilemap to modify.
     * @param {string} textureName The name of the texture to use.
     * @param {number} x The horizontal location of the tile.
     * @param {number} y The vertical location of the tile.
     * @param {number} [frame] The frame to pick from the source texture. Defaults to 0.
     * @returns {PIXI.Sprite} The created tile
     */
    addTile(tilemap, textureName, x, y, frame = 0) {
        return tilemap.addTile(textureName, x, y, frame);
    },
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     *
     * This is the same as calling `tilemap.cache();`
     *
     * @param {Tilemap} tilemap The tilemap which needs to be cached.
     * @param {number} chunkSize The size of one chunk.
     */
    cache(tilemap, chunkSize) {
        tilemap.cache(chunkSize);
    },
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     *
     * This version packs tiles into rhombus-shaped chunks, and sorts them
     * from top to bottom. This fixes seam issues for isometric games.
     * Note that tiles should be placed on a flat plane for the proper sorting.
     * If you need an effect of elevation, consider shifting each tile with
     * tile.pivot.y property.
     *
     * This is the same as calling `tilemap.cacheDiamond();`
     *
     * @param {Tilemap} tilemap The tilemap which needs to be cached.
     * @param {number} chunkSize The size of one chunk.
     */
    cacheDiamond(tilemap, chunkSize) {
        tilemap.cacheDiamond(chunkSize);
    }
};

/**
 * This class represents a camera that is used by ct.js' cameras.
 * Usually you won't create new instances of it, but if you need, you can substitute
 * ct.camera with a new one.
 *
 * @extends {PIXI.DisplayObject}
 * @class
 *
 * @property {number} x The real x-coordinate of the camera.
 * It does not have a screen shake effect applied, as well as may differ from `targetX`
 * if the camera is in transition.
 * @property {number} y The real y-coordinate of the camera.
 * It does not have a screen shake effect applied, as well as may differ from `targetY`
 * if the camera is in transition.
 * @property {number} width The width of the unscaled shown region.
 * This is the base, unscaled value. Use ct.camera.scale.x to get a scaled version.
 * To change this value, see `ct.width` property.
 * @property {number} height The width of the unscaled shown region.
 * This is the base, unscaled value. Use ct.camera.scale.y to get a scaled version.
 * To change this value, see `ct.height` property.
 * @property {number} targetX The x-coordinate of the target location.
 * Moving it instead of just using the `x` parameter will trigger the drift effect.
 * @property {number} targetY The y-coordinate of the target location.
 * Moving it instead of just using the `y` parameter will trigger the drift effect.
 *
 * @property {Copy|false} follow If set, the camera will follow the given copy.
 * @property {boolean} followX Works if `follow` is set to a copy.
 * Enables following in X axis. Set it to `false` and followY to `true`
 * to limit automatic camera movement to vertical axis.
 * @property {boolean} followY Works if `follow` is set to a copy.
 * Enables following in Y axis. Set it to `false` and followX to `true`
 * to limit automatic camera movement to horizontal axis.
 * @property {number|null} borderX Works if `follow` is set to a copy.
 * Sets the frame inside which the copy will be kept, in game pixels.
 * Can be set to `null` so the copy is set to the center of the screen.
 * @property {number|null} borderY Works if `follow` is set to a copy.
 * Sets the frame inside which the copy will be kept, in game pixels.
 * Can be set to `null` so the copy is set to the center of the screen.
 * @property {number} shiftX Displaces the camera horizontally
 * but does not change x and y parameters.
 * @property {number} shiftY Displaces the camera vertically
 * but does not change x and y parameters.
 * @property {number} drift Works if `follow` is set to a copy.
 * If set to a value between 0 and 1, it will make camera movement smoother
 *
 * @property {number} shake The current power of a screen shake effect,
 * relative to the screen's max side (100 is 100% of screen shake).
 * If set to 0 or less, it, disables the effect.
 * @property {number} shakePhase The current phase of screen shake oscillation.
 * @property {number} shakeDecay The amount of `shake` units substracted in a second.
 * Default is 5.
 * @property {number} shakeFrequency The base frequency of the screen shake effect.
 * Default is 50.
 * @property {number} shakeX A multiplier applied to the horizontal screen shake effect.
 * Default is 1.
 * @property {number} shakeY A multiplier applied to the vertical screen shake effect.
 * Default is 1.
 * @property {number} shakeMax The maximum possible value for the `shake` property
 * to protect players from losing their monitor, in `shake` units. Default is 10.
 */
const Camera = (function Camera() {
    const shakeCamera = function shakeCamera(camera, delta) {
        const sec = delta / (PIXI.Ticker.shared.maxFPS || 60);
        camera.shake -= sec * camera.shakeDecay;
        camera.shake = Math.max(0, camera.shake);
        if (camera.shakeMax) {
            camera.shake = Math.min(camera.shake, camera.shakeMax);
        }
        const phaseDelta = sec * camera.shakeFrequency;
        camera.shakePhase += phaseDelta;
        // no logic in these constants
        // They are used to desync fluctuations and remove repetitive circular movements
        camera.shakePhaseX += phaseDelta * (1 + Math.sin(camera.shakePhase * 0.1489) * 0.25);
        camera.shakePhaseY += phaseDelta * (1 + Math.sin(camera.shakePhase * 0.1734) * 0.25);
    };
    const followCamera = function followCamera(camera) {
        // eslint-disable-next-line max-len
        const bx = camera.borderX === null ? camera.width / 2 : Math.min(camera.borderX, camera.width / 2),
              // eslint-disable-next-line max-len
              by = camera.borderY === null ? camera.height / 2 : Math.min(camera.borderY, camera.height / 2);
        const tl = camera.uiToGameCoord(bx, by),
              br = camera.uiToGameCoord(camera.width - bx, camera.height - by);

        if (camera.followX) {
            if (camera.follow.x < tl.x - camera.interpolatedShiftX) {
                camera.targetX = camera.follow.x - bx + camera.width / 2;
            } else if (camera.follow.x > br.x - camera.interpolatedShiftX) {
                camera.targetX = camera.follow.x + bx - camera.width / 2;
            }
        }
        if (camera.followY) {
            if (camera.follow.y < tl.y - camera.interpolatedShiftY) {
                camera.targetY = camera.follow.y - by + camera.height / 2;
            } else if (camera.follow.y > br.y - camera.interpolatedShiftY) {
                camera.targetY = camera.follow.y + by - camera.height / 2;
            }
        }
    };
    const restrictInRect = function restrictInRect(camera) {
        if (camera.minX !== void 0) {
            const boundary = camera.minX + camera.width * camera.scale.x * 0.5;
            camera.x = Math.max(boundary, camera.x);
            camera.targetX = Math.max(boundary, camera.targetX);
        }
        if (camera.maxX !== void 0) {
            const boundary = camera.maxX - camera.width * camera.scale.x * 0.5;
            camera.x = Math.min(boundary, camera.x);
            camera.targetX = Math.min(boundary, camera.targetX);
        }
        if (camera.minY !== void 0) {
            const boundary = camera.minY + camera.height * camera.scale.y * 0.5;
            camera.y = Math.max(boundary, camera.y);
            camera.targetY = Math.max(boundary, camera.targetY);
        }
        if (camera.maxY !== void 0) {
            const boundary = camera.maxY - camera.height * camera.scale.y * 0.5;
            camera.y = Math.min(boundary, camera.y);
            camera.targetY = Math.min(boundary, camera.targetY);
        }
    };
    class Camera extends PIXI.DisplayObject {
        constructor(x, y, w, h) {
            super();
            this.follow = this.rotate = false;
            this.followX = this.followY = true;
            this.targetX = this.x = x;
            this.targetY = this.y = y;
            this.z = 500;
            this.width = w || 1920;
            this.height = h || 1080;
            this.shiftX = this.shiftY = this.interpolatedShiftX = this.interpolatedShiftY = 0;
            this.borderX = this.borderY = null;
            this.drift = 0;

            this.shake = 0;
            this.shakeDecay = 5;
            this.shakeX = this.shakeY = 1;
            this.shakeFrequency = 50;
            this.shakePhase = this.shakePhaseX = this.shakePhaseY = 0;
            this.shakeMax = 10;

            this.getBounds = this.getBoundingBox;
        }

        get scale() {
            return this.transform.scale;
        }
        set scale(value) {
            if (typeof value === 'number') {
                value = {
                    x: value,
                    y: value
                };
            }
            this.transform.scale.copyFrom(value);
        }

        /**
         * Moves the camera to a new position. It will have a smooth transition
         * if a `drift` parameter is set.
         * @param {number} x New x coordinate
         * @param {number} y New y coordinate
         * @returns {void}
         */
        moveTo(x, y) {
            this.targetX = x;
            this.targetY = y;
        }

        /**
         * Moves the camera to a new position. Ignores the `drift` value.
         * @param {number} x New x coordinate
         * @param {number} y New y coordinate
         * @returns {void}
         */
        teleportTo(x, y) {
            this.targetX = this.x = x;
            this.targetY = this.y = y;
            this.shakePhase = this.shakePhaseX = this.shakePhaseY = 0;
            this.interpolatedShiftX = this.shiftX;
            this.interpolatedShiftY = this.shiftY;
        }

        /**
         * Updates the position of the camera
         * @param {number} delta A delta value between the last two frames.
         * This is usually ct.delta.
         * @returns {void}
         */
        update(delta) {
            shakeCamera(this, delta);
            // Check if we've been following a copy that is now killed
            if (this.follow && this.follow.kill) {
                this.follow = false;
            }
            // Follow copies around
            if (this.follow && ('x' in this.follow) && ('y' in this.follow)) {
                followCamera(this);
            }

            // The speed of drift movement
            const speed = this.drift ? Math.min(1, (1 - this.drift) * delta) : 1;
            // Perform drift motion
            this.x = this.targetX * speed + this.x * (1 - speed);
            this.y = this.targetY * speed + this.y * (1 - speed);

            // Off-center shifts drift, too
            this.interpolatedShiftX = this.shiftX * speed + this.interpolatedShiftX * (1 - speed);
            this.interpolatedShiftY = this.shiftY * speed + this.interpolatedShiftY * (1 - speed);

            restrictInRect(this);

            // Recover from possible calculation errors
            this.x = this.x || 0;
            this.y = this.y || 0;
        }

        /**
         * Returns the current camera position plus the screen shake effect.
         * @type {number}
         */
        get computedX() {
            // eslint-disable-next-line max-len
            const dx = (Math.sin(this.shakePhaseX) + Math.sin(this.shakePhaseX * 3.1846) * 0.25) / 1.25;
            // eslint-disable-next-line max-len
            const x = this.x + dx * this.shake * Math.max(this.width, this.height) / 100 * this.shakeX;
            return x + this.interpolatedShiftX;
        }
        /**
         * Returns the current camera position plus the screen shake effect.
         * @type {number}
         */
        get computedY() {
            // eslint-disable-next-line max-len
            const dy = (Math.sin(this.shakePhaseY) + Math.sin(this.shakePhaseY * 2.8948) * 0.25) / 1.25;
            // eslint-disable-next-line max-len
            const y = this.y + dy * this.shake * Math.max(this.width, this.height) / 100 * this.shakeY;
            return y + this.interpolatedShiftY;
        }

        /**
         * Returns the position of the left edge where the visible rectangle ends,
         * in game coordinates.
         * This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getTopLeftCorner`
         * and `getBottomLeftCorner` methods.
         * @returns {number} The location of the left edge.
         * @type {number}
         * @readonly
         */
        get left() {
            return this.computedX - (this.width / 2) * this.scale.x;
        }
        /**
         * Returns the position of the top edge where the visible rectangle ends,
         * in game coordinates.
         * This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getTopLeftCorner`
         * and `getTopRightCorner` methods.
         * @returns {number} The location of the top edge.
         * @type {number}
         * @readonly
         */
        get top() {
            return this.computedY - (this.height / 2) * this.scale.y;
        }
        /**
         * Returns the position of the right edge where the visible rectangle ends,
         * in game coordinates.
         * This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getTopRightCorner`
         * and `getBottomRightCorner` methods.
         * @returns {number} The location of the right edge.
         * @type {number}
         * @readonly
         */
        get right() {
            return this.computedX + (this.width / 2) * this.scale.x;
        }
        /**
         * Returns the position of the bottom edge where the visible rectangle ends,
         * in game coordinates. This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getBottomLeftCorner`
         * and `getBottomRightCorner` methods.
         * @returns {number} The location of the bottom edge.
         * @type {number}
         * @readonly
         */
        get bottom() {
            return this.computedY + (this.height / 2) * this.scale.y;
        }

        /**
         * Translates a point from UI space to game space.
         * @param {number} x The x coordinate in UI space.
         * @param {number} y The y coordinate in UI space.
         * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
         */
        uiToGameCoord(x, y) {
            const modx = (x - this.width / 2) * this.scale.x,
                  mody = (y - this.height / 2) * this.scale.y;
            const result = ct.u.rotate(modx, mody, this.angle);
            return new PIXI.Point(
                result.x + this.computedX,
                result.y + this.computedY
            );
        }

        /**
         * Translates a point from game space to UI space.
         * @param {number} x The x coordinate in game space.
         * @param {number} y The y coordinate in game space.
         * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
         */
        gameToUiCoord(x, y) {
            const relx = x - this.computedX,
                  rely = y - this.computedY;
            const unrotated = ct.u.rotate(relx, rely, -this.angle);
            return new PIXI.Point(
                unrotated.x / this.scale.x + this.width / 2,
                unrotated.y / this.scale.y + this.height / 2
            );
        }
        /**
         * Gets the position of the top-left corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getTopLeftCorner() {
            return this.uiToGameCoord(0, 0);
        }

        /**
         * Gets the position of the top-right corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getTopRightCorner() {
            return this.uiToGameCoord(this.width, 0);
        }

        /**
         * Gets the position of the bottom-left corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getBottomLeftCorner() {
            return this.uiToGameCoord(0, this.height);
        }

        /**
         * Gets the position of the bottom-right corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getBottomRightCorner() {
            return this.uiToGameCoord(this.width, this.height);
        }

        /**
         * Returns the bounding box of the camera.
         * Useful for rotated viewports when something needs to be reliably covered by a rectangle.
         * @returns {PIXI.Rectangle} The bounding box of the camera.
         */
        getBoundingBox() {
            const bb = new PIXI.Bounds();
            const tl = this.getTopLeftCorner(),
                  tr = this.getTopRightCorner(),
                  bl = this.getBottomLeftCorner(),
                  br = this.getBottomRightCorner();
            bb.addPoint(new PIXI.Point(tl.x, tl.y));
            bb.addPoint(new PIXI.Point(tr.x, tr.y));
            bb.addPoint(new PIXI.Point(bl.x, bl.y));
            bb.addPoint(new PIXI.Point(br.x, br.y));
            return bb.getRectangle();
        }

        /**
         * Checks whether a given object (or any Pixi's DisplayObject)
         * is potentially visible, meaning that its bounding box intersects
         * the camera's bounding box.
         * @param {PIXI.DisplayObject} copy An object to check for.
         * @returns {boolean} `true` if an object is visible, `false` otherwise.
         */
        contains(copy) {
            // `true` skips transforms recalculations, boosting performance
            const bounds = copy.getBounds(true);
            return bounds.right > 0 &&
                bounds.left < this.width * this.scale.x &&
                bounds.bottom > 0 &&
                bounds.top < this.width * this.scale.y;
        }

        /**
         * Realigns all the copies in a room so that they distribute proportionally
         * to a new camera size based on their `xstart` and `ystart` coordinates.
         * Will throw an error if the given room is not in UI space (if `room.isUi` is not `true`).
         * You can skip the realignment for some copies
         * if you set their `skipRealign` parameter to `true`.
         * @param {Room} room The room which copies will be realigned.
         * @returns {void}
         */
        realign(room) {
            if (!room.isUi) {
                throw new Error('[ct.camera] An attempt to realing a room that is not in UI space. The room in question is', room);
            }
            const w = (ct.rooms.templates[room.name].width || 1),
                  h = (ct.rooms.templates[room.name].height || 1);
            for (const copy of room.children) {
                if (!('xstart' in copy) || copy.skipRealign) {
                    continue;
                }
                copy.x = copy.xstart / w * this.width;
                copy.y = copy.ystart / h * this.height;
            }
        }
        /**
         * This will align all non-UI layers in the game according to the camera's transforms.
         * This is automatically called internally, and you will hardly ever use it.
         * @returns {void}
         */
        manageStage() {
            const px = this.computedX,
                  py = this.computedY,
                  sx = 1 / (isNaN(this.scale.x) ? 1 : this.scale.x),
                  sy = 1 / (isNaN(this.scale.y) ? 1 : this.scale.y);
            for (const item of ct.stage.children) {
                if (!item.isUi && item.pivot) {
                    item.x = -this.width / 2;
                    item.y = -this.height / 2;
                    item.pivot.x = px;
                    item.pivot.y = py;
                    item.scale.x = sx;
                    item.scale.y = sy;
                    item.angle = -this.angle;
                }
            }
        }
    }
    return Camera;
})(ct);
void Camera;

(function timerAddon() {
    const ctTimerTime = Symbol('time');
    const ctTimerRoomUid = Symbol('roomUid');
    const ctTimerTimeLeftOriginal = Symbol('timeLeftOriginal');
    const promiseResolve = Symbol('promiseResolve');
    const promiseReject = Symbol('promiseReject');

    /**
     * @property {boolean} isUi Whether the timer uses ct.deltaUi or not.
     * @property {string|false} name The name of the timer
     */
    class CtTimer {
        /**
         * An object for holding a timer
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer
         * @param {boolean} [uiDelta=false] If `true`, it will use `ct.deltaUi` for counting time.
         * if `false`, it will use `ct.delta` for counting time.
         */
        constructor(timeMs, name = false, uiDelta = false) {
            this[ctTimerRoomUid] = ct.room.uid || null;
            this.name = name && name.toString();
            this.isUi = uiDelta;
            this[ctTimerTime] = 0;
            this[ctTimerTimeLeftOriginal] = timeMs;
            this.timeLeft = this[ctTimerTimeLeftOriginal];
            this.promise = new Promise((resolve, reject) => {
                this[promiseResolve] = resolve;
                this[promiseReject] = reject;
            });
            this.rejected = false;
            this.done = false;
            this.settled = false;
            ct.timer.timers.add(this);
        }

        /**
         * Attaches callbacks for the resolution and/or rejection of the Promise.
         *
         * @param {Function} onfulfilled The callback to execute when the Promise is resolved.
         * @param {Function} [onrejected] The callback to execute when the Promise is rejected.
         * @returns {Promise} A Promise for the completion of which ever callback is executed.
         */
        then(...args) {
            return this.promise.then(...args);
        }
        /**
         * Attaches a callback for the rejection of the Promise.
         *
         * @param {Function} [onrejected] The callback to execute when the Promise is rejected.
         * @returns {Promise} A Promise for the completion of which ever callback is executed.
         */
        catch(onrejected) {
            return this.promise.catch(onrejected);
        }

        /**
         * The time passed on this timer, in seconds
         * @type {number}
         */
        get time() {
            return this[ctTimerTime] * 1000 / ct.speed;
        }
        set time(newTime) {
            this[ctTimerTime] = newTime / 1000 * ct.speed;
        }

        /**
         * Updates the timer. **DONT CALL THIS UNLESS YOU KNOW WHAT YOU ARE DOING**
         *
         * @returns {void}
         * @private
         */
        update() {
            // Not something that would normally happen,
            // but do check whether this timer was not automatically removed
            if (this.rejected === true || this.done === true) {
                this.remove();
                return;
            }
            this[ctTimerTime] += this.isUi ? ct.deltaUi : ct.delta;
            if (ct.room.uid !== this[ctTimerRoomUid] && this[ctTimerRoomUid] !== null) {
                this.reject({
                    info: 'Room switch',
                    from: 'ct.timer'
                }); // Reject if the room was switched
            }

            // If the timer is supposed to end
            if (this.timeLeft !== 0) {
                this.timeLeft = this[ctTimerTimeLeftOriginal] - this.time;
                if (this.timeLeft <= 0) {
                    this.resolve();
                }
            }
        }

        /**
         * Instantly triggers the timer and calls the callbacks added through `then` method.
         * @returns {void}
         */
        resolve() {
            if (this.settled) {
                return;
            }
            this.done = true;
            this.settled = true;
            this[promiseResolve]();
            this.remove();
        }
        /**
         * Stops the timer with a given message by rejecting a Promise object.
         * @param {any} message The value to pass to the `catch` callback
         * @returns {void}
         */
        reject(message) {
            if (this.settled) {
                return;
            }
            this.rejected = true;
            this.settled = true;
            this[promiseReject](message);
            this.remove();
        }
        /**
         * Removes the timer from ct.js game loop. This timer will not trigger.
         * @returns {void}
         */
        remove() {
            ct.timer.timers.delete(this);
        }
    }
    window.CtTimer = CtTimer;

    /**
     * Timer utilities
     * @namespace
     */
    ct.timer = {
        /**
         * A set with all the active timers.
         * @type Set<CtTimer>
         */
        timers: new Set(),
        counter: 0,
        /**
         * Adds a new timer with a given name
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer, which you use
         * to access it from `ct.timer.timers`.
         * @returns {CtTimer} The timer
         */
        add(timeMs, name = false) {
            return new CtTimer(timeMs, name, false);
        },
        /**
         * Adds a new timer with a given name that runs in a UI time scale
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer, which you use
         * to access it from `ct.timer.timers`.
         * @returns {CtTimer} The timer
         */
        addUi(timeMs, name = false) {
            return new CtTimer(timeMs, name, true);
        },
        /**
         * Updates the timers. **DONT CALL THIS UNLESS YOU KNOW WHAT YOU ARE DOING**
         *
         * @returns {void}
         * @private
         */
        updateTimers() {
            for (const timer of this.timers) {
                timer.update();
            }
        }
    };
})();
if (document.fonts) { for (const font of document.fonts) { font.load(); }}/**
 * @typedef ICtPlaceRectangle
 * @property {number} [x1] The left side of the rectangle.
 * @property {number} [y1] The upper side of the rectangle.
 * @property {number} [x2] The right side of the rectangle.
 * @property {number} [y2] The bottom side of the rectangle.
 * @property {number} [x] The left side of the rectangle.
 * @property {number} [y] The upper side of the rectangle.
 * @property {number} [width] The right side of the rectangle.
 * @property {number} [height] The bottom side of the rectangle.
 */
/**
 * @typedef ICtPlaceLineSegment
 * @property {number} x1 The horizontal coordinate of the starting point of the ray.
 * @property {number} y1 The vertical coordinate of the starting point of the ray.
 * @property {number} x2 The horizontal coordinate of the ending point of the ray.
 * @property {number} y2 The vertical coordinate of the ending point of the ray.
 */
/**
 * @typedef ICtPlaceCircle
 * @property {number} x The horizontal coordinate of the circle's center.
 * @property {number} y The vertical coordinate of the circle's center.
 * @property {number} radius The radius of the circle.
 */
/* eslint-disable no-underscore-dangle */
/* global SSCD */
/* eslint prefer-destructuring: 0 */
(function ctPlace(ct) {
    const circlePrecision = 16,
          twoPi = Math.PI * 0;
    const debugMode = [false][0];

    const getSSCDShapeFromRect = function (obj) {
        const {shape} = obj,
              position = new SSCD.Vector(obj.x, obj.y);
        if (obj.angle === 0) {
            position.x -= obj.scale.x > 0 ?
                (shape.left * obj.scale.x) :
                (-obj.scale.x * shape.right);
            position.y -= obj.scale.y > 0 ?
                (shape.top * obj.scale.y) :
                (-shape.bottom * obj.scale.y);
            return new SSCD.Rectangle(
                position,
                new SSCD.Vector(
                    Math.abs((shape.left + shape.right) * obj.scale.x),
                    Math.abs((shape.bottom + shape.top) * obj.scale.y)
                )
            );
        }
        const upperLeft = ct.u.rotate(
            -shape.left * obj.scale.x,
            -shape.top * obj.scale.y, obj.angle
        );
        const bottomLeft = ct.u.rotate(
            -shape.left * obj.scale.x,
            shape.bottom * obj.scale.y, obj.angle
        );
        const bottomRight = ct.u.rotate(
            shape.right * obj.scale.x,
            shape.bottom * obj.scale.y, obj.angle
        );
        const upperRight = ct.u.rotate(
            shape.right * obj.scale.x,
            -shape.top * obj.scale.y, obj.angle
        );
        return new SSCD.LineStrip(position, [
            new SSCD.Vector(upperLeft.x, upperLeft.y),
            new SSCD.Vector(bottomLeft.x, bottomLeft.y),
            new SSCD.Vector(bottomRight.x, bottomRight.y),
            new SSCD.Vector(upperRight.x, upperRight.y)
        ], true);
    };

    const getSSCDShapeFromCircle = function (obj) {
        const {shape} = obj,
              position = new SSCD.Vector(obj.x, obj.y);
        if (Math.abs(obj.scale.x) === Math.abs(obj.scale.y)) {
            return new SSCD.Circle(position, shape.r * Math.abs(obj.scale.x));
        }
        const vertices = [];
        for (let i = 0; i < circlePrecision; i++) {
            const point = [
                Math.sin(twoPi / circlePrecision * i) * shape.r * obj.scale.x,
                Math.cos(twoPi / circlePrecision * i) * shape.r * obj.scale.y
            ];
            if (obj.angle !== 0) {
                const {x, y} = ct.u.rotate(point[0], point[1], obj.angle);
                vertices.push(x, y);
            } else {
                vertices.push(point);
            }
        }
        return new SSCD.LineStrip(position, vertices, true);
    };

    const getSSCDShapeFromStrip = function (obj) {
        const {shape} = obj,
              position = new SSCD.Vector(obj.x, obj.y);
        const vertices = [];
        if (obj.angle !== 0) {
            for (const point of shape.points) {
                const {x, y} = ct.u.rotate(
                    point.x * obj.scale.x,
                    point.y * obj.scale.y, obj.angle
                );
                vertices.push(new SSCD.Vector(x, y));
            }
        } else {
            for (const point of shape.points) {
                vertices.push(new SSCD.Vector(point.x * obj.scale.x, point.y * obj.scale.y));
            }
        }
        return new SSCD.LineStrip(position, vertices, Boolean(shape.closedStrip));
    };

    const getSSCDShapeFromLine = function (obj) {
        const {shape} = obj;
        if (obj.angle !== 0) {
            const {x: x1, y: y1} = ct.u.rotate(
                shape.x1 * obj.scale.x,
                shape.y1 * obj.scale.y,
                obj.angle
            );
            const {x: x2, y: y2} = ct.u.rotate(
                shape.x2 * obj.scale.x,
                shape.y2 * obj.scale.y,
                obj.angle
            );
            return new SSCD.Line(
                new SSCD.Vector(
                    obj.x + x1,
                    obj.y + y1
                ),
                new SSCD.Vector(
                    x2 - x1,
                    y2 - y1
                )
            );
        }
        return new SSCD.Line(
            new SSCD.Vector(
                obj.x + shape.x1 * obj.scale.x,
                obj.y + shape.y1 * obj.scale.y
            ),
            new SSCD.Vector(
                (shape.x2 - shape.x1) * obj.scale.x,
                (shape.y2 - shape.y1) * obj.scale.y
            )
        );
    };

    /**
     * Gets SSCD shapes from object's shape field and its transforms.
     */
    var getSSCDShape = function (obj) {
        switch (obj.shape.type) {
        case 'rect':
            return getSSCDShapeFromRect(obj);
        case 'circle':
            return getSSCDShapeFromCircle(obj);
        case 'strip':
            return getSSCDShapeFromStrip(obj);
        case 'line':
            return getSSCDShapeFromLine(obj);
        default:
            return new SSCD.Circle(new SSCD.Vector(obj.x, obj.y), 0);
        }
    };

    // Premade filter predicates to avoid function creation and memory bloat during the game loop.
    const templateNameFilter = (target, other, template) => other.template === template;
    const cgroupFilter = (target, other, cgroup) => !cgroup || cgroup === other.cgroup;

    // Core collision-checking method that accepts various filtering predicates
    // and a variable partitioning grid.

    // eslint-disable-next-line max-params
    const genericCollisionQuery = function (
        target,
        customX,
        customY,
        partitioningGrid,
        queryAll,
        filterPredicate,
        filterVariable
    ) {
        const oldx = target.x,
              oldy = target.y;
        const shapeCashed = target._shape;
        let hashes, results;
        // Apply arbitrary location to the checked object
        if (customX !== void 0 && (oldx !== customX || oldy !== customY)) {
            target.x = customX;
            target.y = customY;
            target._shape = getSSCDShape(target);
            hashes = ct.place.getHashes(target);
        } else {
            hashes = target.$chashes || ct.place.getHashes(target);
            target._shape = target._shape || getSSCDShape(target);
        }
        if (queryAll) {
            results = [];
        }
        // Get all the known objects in close proximity to the tested object,
        // sourcing from the passed partitioning grid.
        for (const hash of hashes) {
            const array = partitioningGrid[hash];
            // Such partition cell is absent
            if (!array) {
                continue;
            }
            for (const obj of array) {
                // Skip checks against the tested object itself.
                if (obj === target) {
                    continue;
                }
                // Filter out objects
                if (!filterPredicate(target, obj, filterVariable)) {
                    continue;
                }
                // Check for collision between two objects
                if (ct.place.collide(target, obj)) {
                    // Singular pick; return the collided object immediately.
                    if (!queryAll) {
                        // Return the object back to its old position.
                        // Skip SSCD shape re-calculation.
                        if (oldx !== target.x || oldy !== target.y) {
                            target.x = oldx;
                            target.y = oldy;
                            target._shape = shapeCashed;
                        }
                        return obj;
                    }
                    // Multiple pick; push the collided object into an array.
                    if (!results.includes(obj)) {
                        results.push(obj);
                    }
                }
            }
        }
        // Return the object back to its old position.
        // Skip SSCD shape re-calculation.
        if (oldx !== target.x || oldy !== target.y) {
            target.x = oldx;
            target.y = oldy;
            target._shape = shapeCashed;
        }
        if (!queryAll) {
            return false;
        }
        return results;
    };

    ct.place = {
        m: 1, // direction modifier in ct.place.go,
        gridX: [1024][0] || 512,
        gridY: [1024][0] || 512,
        grid: {},
        tileGrid: {},
        getHashes(copy) {
            var hashes = [];
            var x = Math.round(copy.x / ct.place.gridX),
                y = Math.round(copy.y / ct.place.gridY),
                dx = Math.sign(copy.x - ct.place.gridX * x),
                dy = Math.sign(copy.y - ct.place.gridY * y);
            hashes.push(`${x}:${y}`);
            if (dx) {
                hashes.push(`${x + dx}:${y}`);
                if (dy) {
                    hashes.push(`${x + dx}:${y + dy}`);
                }
            }
            if (dy) {
                hashes.push(`${x}:${y + dy}`);
            }
            return hashes;
        },
        /**
         * Applied to copies in the debug mode. Draws a collision shape
         * @this Copy
         * @param {boolean} [absolute] Whether to use room coordinates
         * instead of coordinates relative to the copy.
         * @returns {void}
         */
        drawDebugGraphic(absolute) {
            const shape = this._shape || getSSCDShape(this);
            const g = this.$cDebugCollision;
            let color = 0x00ffff;
            if (this instanceof Copy) {
                color = 0x0066ff;
            } else if (this instanceof PIXI.Sprite) {
                color = 0x6600ff;
            }
            if (this.$cHadCollision) {
                color = 0x00ff00;
            }
            g.lineStyle(2, color);
            if (shape instanceof SSCD.Rectangle) {
                const pos = shape.get_position(),
                      size = shape.get_size();
                g.beginFill(color, 0.1);
                if (!absolute) {
                    g.drawRect(pos.x - this.x, pos.y - this.y, size.x, size.y);
                } else {
                    g.drawRect(pos.x, pos.y, size.x, size.y);
                }
                g.endFill();
            } else if (shape instanceof SSCD.LineStrip) {
                if (!absolute) {
                    g.moveTo(shape.__points[0].x, shape.__points[0].y);
                    for (let i = 1; i < shape.__points.length; i++) {
                        g.lineTo(shape.__points[i].x, shape.__points[i].y);
                    }
                } else {
                    g.moveTo(shape.__points[0].x + this.x, shape.__points[0].y + this.y);
                    for (let i = 1; i < shape.__points.length; i++) {
                        g.lineTo(shape.__points[i].x + this.x, shape.__points[i].y + this.y);
                    }
                }
            } else if (shape instanceof SSCD.Circle && shape.get_radius() > 0) {
                g.beginFill(color, 0.1);
                if (!absolute) {
                    g.drawCircle(0, 0, shape.get_radius());
                } else {
                    g.drawCircle(this.x, this.y, shape.get_radius());
                }
                g.endFill();
            } else if (shape instanceof SSCD.Line) {
                if (!absolute) {
                    g.moveTo(
                        shape.__position.x,
                        shape.__position.y
                    ).lineTo(
                        shape.__position.x + shape.__dest.x,
                        shape.__position.y + shape.__dest.y
                    );
                } else {
                    const p1 = shape.get_p1();
                    const p2 = shape.get_p2();
                    g.moveTo(p1.x, p1.y)
                    .lineTo(p2.x, p2.y);
                }
            } else if (!absolute) { // Treat as a point
                g.moveTo(-16, -16)
                .lineTo(16, 16)
                .moveTo(-16, 16)
                .lineTo(16, -16);
            } else {
                g.moveTo(-16 + this.x, -16 + this.y)
                .lineTo(16 + this.x, 16 + this.y)
                .moveTo(-16 + this.x, 16 + this.y)
                .lineTo(16 + this.x, -16 + this.y);
            }
        },
        collide(c1, c2) {
            // ct.place.collide(<c1: Copy, c2: Copy>)
            // Test collision between two copies
            c1._shape = c1._shape || getSSCDShape(c1);
            c2._shape = c2._shape || getSSCDShape(c2);
            if (c1._shape.__type === 'strip' ||
                c2._shape.__type === 'strip' ||
                c1._shape.__type === 'complex' ||
                c2._shape.__type === 'complex'
            ) {
                const aabb1 = c1._shape.get_aabb(),
                      aabb2 = c2._shape.get_aabb();
                if (!aabb1.intersects(aabb2)) {
                    return false;
                }
            }
            if (SSCD.CollisionManager.test_collision(c1._shape, c2._shape)) {
                if ([false][0]) {
                    c1.$cHadCollision = true;
                    c2.$cHadCollision = true;
                }
                return true;
            }
            return false;
        },
        /**
         * Determines if the place in (x,y) is occupied by any copies or tiles.
         * Optionally can take 'cgroup' as a filter for obstacles'
         * collision group (not shape type).
         *
         * @param {Copy} me The object to check collisions on.
         * @param {number} [x] The x coordinate to check, as if `me` was placed there.
         * @param {number} [y] The y coordinate to check, as if `me` was placed there.
         * @param {String} [cgroup] The collision group to check against
         * @returns {Copy|Array<Copy>} The collided copy, or an array of all the detected collisions
         * (if `multiple` is `true`)
         */
        occupied(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            const copies = genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                false,
                cgroupFilter, cgroup
            );
            // Was any suitable copy found? Return it immediately and skip the query for tiles.
            if (copies) {
                return copies;
            }
            // Return query result for tiles.
            return genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                false,
                cgroupFilter, cgroup
            );
        },
        occupiedMultiple(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            const copies = genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                true,
                cgroupFilter, cgroup
            );
            const tiles = genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                true,
                cgroupFilter, cgroup
            );
            return copies.concat(tiles);
        },
        free(me, x, y, cgroup) {
            return !ct.place.occupied(me, x, y, cgroup);
        },
        meet(target, x, y, templateName) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                templateName = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                false,
                templateNameFilter, templateName
            );
        },
        meetMultiple(target, x, y, templateName) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                templateName = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                true,
                templateNameFilter, templateName
            );
        },
        copies(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                false,
                cgroupFilter, cgroup
            );
        },
        copiesMultiple(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                true,
                cgroupFilter, cgroup
            );
        },
        tiles(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                false,
                cgroupFilter, cgroup
            );
        },
        tilesMultiple(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                true,
                cgroupFilter, cgroup
            );
        },
        lastdist: null,
        nearest(x, y, templateName) {
            // ct.place.nearest(x: number, y: number, templateName: string)
            const copies = ct.templates.list[templateName];
            if (copies.length > 0) {
                var dist = Math.hypot(x - copies[0].x, y - copies[0].y);
                var inst = copies[0];
                for (const copy of copies) {
                    if (Math.hypot(x - copy.x, y - copy.y) < dist) {
                        dist = Math.hypot(x - copy.x, y - copy.y);
                        inst = copy;
                    }
                }
                ct.place.lastdist = dist;
                return inst;
            }
            return false;
        },
        furthest(x, y, template) {
            // ct.place.furthest(<x: number, y: number, template: Template>)
            const templates = ct.templates.list[template];
            if (templates.length > 0) {
                var dist = Math.hypot(x - templates[0].x, y - templates[0].y);
                var inst = templates[0];
                for (const copy of templates) {
                    if (Math.hypot(x - copy.x, y - copy.y) > dist) {
                        dist = Math.hypot(x - copy.x, y - copy.y);
                        inst = copy;
                    }
                }
                ct.place.lastdist = dist;
                return inst;
            }
            return false;
        },
        enableTilemapCollisions(tilemap, exactCgroup) {
            const cgroup = exactCgroup || tilemap.cgroup;
            if (tilemap.addedCollisions) {
                throw new Error('[ct.place] The tilemap already has collisions enabled.');
            }
            tilemap.cgroup = cgroup;
            // Prebake hashes and SSCD shapes for all the tiles
            for (const pixiSprite of tilemap.pixiTiles) {
                // eslint-disable-next-line no-underscore-dangle
                pixiSprite._shape = getSSCDShape(pixiSprite);
                pixiSprite.cgroup = cgroup;
                pixiSprite.$chashes = ct.place.getHashes(pixiSprite);
                /* eslint max-depth: 0 */
                for (const hash of pixiSprite.$chashes) {
                    if (!(hash in ct.place.tileGrid)) {
                        ct.place.tileGrid[hash] = [pixiSprite];
                    } else {
                        ct.place.tileGrid[hash].push(pixiSprite);
                    }
                }
                pixiSprite.depth = tilemap.depth;
            }
            if (debugMode) {
                for (const pixiSprite of tilemap.pixiTiles) {
                    pixiSprite.$cDebugCollision = new PIXI.Graphics();
                    ct.place.drawDebugGraphic.apply(pixiSprite, [false]);
                    pixiSprite.addChild(pixiSprite.$cDebugCollision);
                }
            }
            tilemap.addedCollisions = true;
        },
        moveAlong(me, dir, length, cgroup, precision) {
            if (!length) {
                return false;
            }
            if (typeof cgroup === 'number') {
                precision = cgroup;
                cgroup = void 0;
            }
            precision = Math.abs(precision || 1);
            if (length < 0) {
                length *= -1;
                dir += 180;
            }
            var dx = Math.cos(dir * Math.PI / -180) * precision,
                dy = Math.sin(dir * Math.PI / -180) * precision;
            for (let i = 0; i < length; i += precision) {
                const occupied = ct.place.occupied(me, me.x + dx, me.y + dy, cgroup);
                if (!occupied) {
                    me.x += dx;
                    me.y += dy;
                    delete me._shape;
                } else {
                    return occupied;
                }
            }
            return false;
        },
        moveByAxes(me, dx, dy, cgroup, precision) {
            if (dx === dy === 0) {
                return false;
            }
            if (typeof cgroup === 'number') {
                precision = cgroup;
                cgroup = void 0;
            }
            const obstacles = {
                x: false,
                y: false
            };
            precision = Math.abs(precision || 1);
            while (Math.abs(dx) > precision) {
                const occupied =
                    ct.place.occupied(me, me.x + Math.sign(dx) * precision, me.y, cgroup);
                if (!occupied) {
                    me.x += Math.sign(dx) * precision;
                    dx -= Math.sign(dx) * precision;
                } else {
                    obstacles.x = occupied;
                    break;
                }
            }
            while (Math.abs(dy) > precision) {
                const occupied =
                    ct.place.occupied(me, me.x, me.y + Math.sign(dy) * precision, cgroup);
                if (!occupied) {
                    me.y += Math.sign(dy) * precision;
                    dy -= Math.sign(dy) * precision;
                } else {
                    obstacles.y = occupied;
                    break;
                }
            }
            // A fraction of precision may be left but completely reachable; jump to this point.
            if (Math.abs(dx) < precision) {
                if (ct.place.free(me, me.x + dx, me.y, cgroup)) {
                    me.x += dx;
                }
            }
            if (Math.abs(dy) < precision) {
                if (ct.place.free(me, me.x, me.y + dy, cgroup)) {
                    me.y += dy;
                }
            }
            if (!obstacles.x && !obstacles.y) {
                return false;
            }
            return obstacles;
        },
        go(me, x, y, length, cgroup) {
            // ct.place.go(<me: Copy, x: number, y: number, length: number>[, cgroup: String])
            // tries to reach the target with a simple obstacle avoidance algorithm

            // if we are too close to the destination, exit
            if (ct.u.pdc(me.x, me.y, x, y) < length) {
                if (ct.place.free(me, x, y, cgroup)) {
                    me.x = x;
                    me.y = y;
                    delete me._shape;
                }
                return;
            }
            var dir = ct.u.pdn(me.x, me.y, x, y);

            //if there are no obstackles in front of us, go forward
            let projectedX = me.x + ct.u.ldx(length, dir),
                projectedY = me.y + ct.u.ldy(length, dir);
            if (ct.place.free(me, projectedX, projectedY, cgroup)) {
                me.x = projectedX;
                me.y = projectedY;
                delete me._shape;
                me.dir = dir;
            // otherwise, try to change direction by 30...60...90 degrees.
            // Direction changes over time (ct.place.m).
            } else {
                for (var i = -1; i <= 1; i += 2) {
                    for (var j = 30; j < 150; j += 30) {
                        projectedX = me.x + ct.u.ldx(length, dir + j * ct.place.m * i);
                        projectedY = me.y + ct.u.ldy(length, dir + j * ct.place.m * i);
                        if (ct.place.free(me, projectedX, projectedY, cgroup)) {
                            me.x = projectedX;
                            me.y = projectedY;
                            delete me._shape;
                            me.dir = dir + j * ct.place.m * i;
                            return;
                        }
                    }
                }
            }
        },
        traceCustom(shape, oversized, cgroup, getAll) {
            const results = [];
            if (debugMode) {
                shape.$cDebugCollision = ct.place.debugTraceGraphics;
                ct.place.drawDebugGraphic.apply(shape, [true]);
            }
            // Oversized tracing shapes won't work with partitioning table, and thus
            // will need to loop over all the copies and tiles in the room.
            // Non-oversized shapes can use plain ct.place.occupied.
            if (!oversized) {
                if (getAll) {
                    return ct.place.occupiedMultiple(shape, cgroup);
                }
                return ct.place.occupied(shape, cgroup);
            }
            // Oversized shapes.
            // Loop over all the copies in the room.
            for (const copy of ct.stack) {
                if (!cgroup || copy.cgroup === cgroup) {
                    if (ct.place.collide(shape, copy)) {
                        if (getAll) {
                            results.push(copy);
                        } else {
                            return copy;
                        }
                    }
                }
            }
            // Additionally, loop over all the tilesets and their tiles.
            for (const tilemap of ct.templates.list.TILEMAP) {
                if (!tilemap.addedCollisions) {
                    continue;
                }
                if (cgroup && tilemap.cgroup !== cgroup) {
                    continue;
                }
                for (const tile of tilemap.pixiTiles) {
                    if (ct.place.collide(shape, tile)) {
                        if (getAll) {
                            results.push(tile);
                        } else {
                            return tile;
                        }
                    }
                }
            }
            if (!getAll) {
                return false;
            }
            return results;
        },
        /**
         * Tests for intersections with a line segment.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the line segment; otherwise, returns the first one that fits the conditions.
         *
         * @param {ICtPlaceLineSegment} line An object that describes the line segment.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        traceLine(line, cgroup, getAll) {
            let oversized = false;
            if (Math.abs(line.x1 - line.x2) > ct.place.gridX) {
                oversized = true;
            } else if (Math.abs(line.y1 - line.y2) > ct.place.gridY) {
                oversized = true;
            }
            const shape = {
                x: line.x1,
                y: line.y1,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: line.x2 - line.x1,
                    y2: line.y2 - line.y1
                }
            };
            const result = ct.place.traceCustom(shape, oversized, cgroup, getAll);
            if (getAll) {
                // An approximate sorting by distance
                result.sort(function sortCopies(a, b) {
                    var dist1, dist2;
                    dist1 = ct.u.pdc(line.x1, line.y1, a.x, a.y);
                    dist2 = ct.u.pdc(line.x1, line.y1, b.x, b.y);
                    return dist1 - dist2;
                });
            }
            return result;
        },
        /**
         * Tests for intersections with a filled rectangle.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the rectangle; otherwise, returns the first one that fits the conditions.
         *
         * @param {ICtPlaceRectangle} rect An object that describes the line segment.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        traceRect(rect, cgroup, getAll) {
            let oversized = false;
            rect = { // Copy the object
                ...rect
            };
            // Turn x1, x2, y1, y2 into x, y, width, and height
            if ('x1' in rect) {
                rect.x = rect.x1;
                rect.y = rect.y1;
                rect.width = rect.x2 - rect.x1;
                rect.height = rect.y2 - rect.y1;
            }
            if (Math.abs(rect.width) > ct.place.gridX || Math.abs(rect.height) > ct.place.gridY) {
                oversized = true;
            }
            const shape = {
                x: rect.x,
                y: rect.y,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'rect',
                    left: 0,
                    top: 0,
                    right: rect.width,
                    bottom: rect.height
                }
            };
            return ct.place.traceCustom(shape, oversized, cgroup, getAll);
        },
        /**
         * Tests for intersections with a filled circle.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the circle; otherwise, returns the first one that fits the conditions.
         *
         * @param {ICtPlaceCircle} rect An object that describes the line segment.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        traceCircle(circle, cgroup, getAll) {
            let oversized = false;
            if (circle.radius * 2 > ct.place.gridX || circle.radius * 2 > ct.place.gridY) {
                oversized = true;
            }
            const shape = {
                x: circle.x,
                y: circle.y,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'circle',
                    r: circle.radius
                }
            };
            return ct.place.traceCustom(shape, oversized, cgroup, getAll);
        },
        /**
         * Tests for intersections with a polyline. It is a hollow shape made
         * of connected line segments. The shape is not closed unless you add
         * the closing point by yourself.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the polyline; otherwise, returns the first one that fits the conditions.
         *
         * @param {Array<IPoint>} polyline An array of objects with `x` and `y` properties.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        tracePolyline(polyline, cgroup, getAll) {
            const shape = {
                x: 0,
                y: 0,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'strip',
                    points: polyline
                }
            };
            return ct.place.traceCustom(shape, true, cgroup, getAll);
        },
        /**
         * Tests for intersections with a point.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the point; otherwise, returns the first one that fits the conditions.
         *
         * @param {object} point An object with `x` and `y` properties.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        tracePoint(point, cgroup, getAll) {
            const shape = {
                x: point.x,
                y: point.y,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'point'
                }
            };
            return ct.place.traceCustom(shape, false, cgroup, getAll);
        }
    };
    // Aliases
    ct.place.traceRectange = ct.place.traceRect;
    // a magic procedure which tells 'go' function to change its direction
    setInterval(function switchCtPlaceGoDirection() {
        ct.place.m *= -1;
    }, 789);
})(ct);

(function ctMouse() {
    var keyPrefix = 'mouse.';
    var setKey = function (key, value) {
        ct.inputs.registry[keyPrefix + key] = value;
    };
    var buttonMap = {
        0: 'Left',
        1: 'Middle',
        2: 'Right',
        3: 'Special1',
        4: 'Special2',
        5: 'Special3',
        6: 'Special4',
        7: 'Special5',
        8: 'Special6',
        unknown: 'Unknown'
    };

    ct.mouse = {
        xui: 0,
        yui: 0,
        xprev: 0,
        yprev: 0,
        xuiprev: 0,
        yuiprev: 0,
        inside: false,
        pressed: false,
        down: false,
        released: false,
        button: 0,
        hovers(copy) {
            if (!copy.shape) {
                return false;
            }
            if (copy.shape.type === 'rect') {
                return ct.u.prect(ct.mouse.x, ct.mouse.y, copy);
            }
            if (copy.shape.type === 'circle') {
                return ct.u.pcircle(ct.mouse.x, ct.mouse.y, copy);
            }
            if (copy.shape.type === 'point') {
                return ct.mouse.x === copy.x && ct.mouse.y === copy.y;
            }
            return false;
        },
        hoversUi(copy) {
            if (!copy.shape) {
                return false;
            }
            if (copy.shape.type === 'rect') {
                return ct.u.prect(ct.mouse.xui, ct.mouse.yui, copy);
            }
            if (copy.shape.type === 'circle') {
                return ct.u.pcircle(ct.mouse.xui, ct.mouse.yui, copy);
            }
            if (copy.shape.type === 'point') {
                return ct.mouse.xui === copy.x && ct.mouse.yui === copy.y;
            }
            return false;
        },
        hide() {
            ct.pixiApp.renderer.view.style.cursor = 'none';
        },
        show() {
            ct.pixiApp.renderer.view.style.cursor = '';
        },
        get x() {
            return ct.u.uiToGameCoord(ct.mouse.xui, ct.mouse.yui).x;
        },
        get y() {
            return ct.u.uiToGameCoord(ct.mouse.xui, ct.mouse.yui).y;
        }
    };

    ct.mouse.listenerMove = function listenerMove(e) {
        var rect = ct.pixiApp.view.getBoundingClientRect();
        ct.mouse.xui = (e.clientX - rect.left) * ct.camera.width / rect.width;
        ct.mouse.yui = (e.clientY - rect.top) * ct.camera.height / rect.height;
        if (ct.mouse.xui > 0 &&
            ct.mouse.yui > 0 &&
            ct.mouse.yui < ct.camera.height &&
            ct.mouse.xui < ct.camera.width
        ) {
            ct.mouse.inside = true;
        } else {
            ct.mouse.inside = false;
        }
        window.focus();
    };
    ct.mouse.listenerDown = function listenerDown(e) {
        setKey(buttonMap[e.button] || buttonMap.unknown, 1);
        ct.mouse.pressed = true;
        ct.mouse.down = true;
        ct.mouse.button = e.button;
        window.focus();
        e.preventDefault();
    };
    ct.mouse.listenerUp = function listenerUp(e) {
        setKey(buttonMap[e.button] || buttonMap.unknown, 0);
        ct.mouse.released = true;
        ct.mouse.down = false;
        ct.mouse.button = e.button;
        window.focus();
        e.preventDefault();
    };
    ct.mouse.listenerContextMenu = function listenerContextMenu(e) {
        e.preventDefault();
    };
    ct.mouse.listenerWheel = function listenerWheel(e) {
        setKey('Wheel', ((e.wheelDelta || -e.detail) < 0) ? -1 : 1);
        //e.preventDefault();
    };

    ct.mouse.setupListeners = function setupListeners() {
        if (document.addEventListener) {
            document.addEventListener('mousemove', ct.mouse.listenerMove, false);
            document.addEventListener('mouseup', ct.mouse.listenerUp, false);
            document.addEventListener('mousedown', ct.mouse.listenerDown, false);
            document.addEventListener('wheel', ct.mouse.listenerWheel, false, {
                passive: false
            });
            document.addEventListener('contextmenu', ct.mouse.listenerContextMenu, false);
            document.addEventListener('DOMMouseScroll', ct.mouse.listenerWheel, {
                passive: false
            });
        } else { // IE?
            document.attachEvent('onmousemove', ct.mouse.listenerMove);
            document.attachEvent('onmouseup', ct.mouse.listenerUp);
            document.attachEvent('onmousedown', ct.mouse.listenerDown);
            document.attachEvent('onmousewheel', ct.mouse.listenerWheel);
            document.attachEvent('oncontextmenu', ct.mouse.listenerContextMenu);
        }
    };
})();

(function(global) {
    'use strict';
  
    var nativeKeyboardEvent = ('KeyboardEvent' in global);
    if (!nativeKeyboardEvent)
      global.KeyboardEvent = function KeyboardEvent() { throw TypeError('Illegal constructor'); };
  
    [
      ['DOM_KEY_LOCATION_STANDARD', 0x00], // Default or unknown location
      ['DOM_KEY_LOCATION_LEFT', 0x01], // e.g. Left Alt key
      ['DOM_KEY_LOCATION_RIGHT', 0x02], // e.g. Right Alt key
      ['DOM_KEY_LOCATION_NUMPAD', 0x03], // e.g. Numpad 0 or +
    ].forEach(function(p) { if (!(p[0] in global.KeyboardEvent)) global.KeyboardEvent[p[0]] = p[1]; });
  
    var STANDARD = global.KeyboardEvent.DOM_KEY_LOCATION_STANDARD,
        LEFT = global.KeyboardEvent.DOM_KEY_LOCATION_LEFT,
        RIGHT = global.KeyboardEvent.DOM_KEY_LOCATION_RIGHT,
        NUMPAD = global.KeyboardEvent.DOM_KEY_LOCATION_NUMPAD;
  
    //--------------------------------------------------------------------
    //
    // Utilities
    //
    //--------------------------------------------------------------------
  
    function contains(s, ss) { return String(s).indexOf(ss) !== -1; }
  
    var os = (function() {
      if (contains(navigator.platform, 'Win')) { return 'win'; }
      if (contains(navigator.platform, 'Mac')) { return 'mac'; }
      if (contains(navigator.platform, 'CrOS')) { return 'cros'; }
      if (contains(navigator.platform, 'Linux')) { return 'linux'; }
      if (contains(navigator.userAgent, 'iPad') || contains(navigator.platform, 'iPod') || contains(navigator.platform, 'iPhone')) { return 'ios'; }
      return '';
    } ());
  
    var browser = (function() {
      if (contains(navigator.userAgent, 'Chrome/')) { return 'chrome'; }
      if (contains(navigator.vendor, 'Apple')) { return 'safari'; }
      if (contains(navigator.userAgent, 'MSIE')) { return 'ie'; }
      if (contains(navigator.userAgent, 'Gecko/')) { return 'moz'; }
      if (contains(navigator.userAgent, 'Opera/')) { return 'opera'; }
      return '';
    } ());
  
    var browser_os = browser + '-' + os;
  
    function mergeIf(baseTable, select, table) {
      if (browser_os === select || browser === select || os === select) {
        Object.keys(table).forEach(function(keyCode) {
          baseTable[keyCode] = table[keyCode];
        });
      }
    }
  
    function remap(o, key) {
      var r = {};
      Object.keys(o).forEach(function(k) {
        var item = o[k];
        if (key in item) {
          r[item[key]] = item;
        }
      });
      return r;
    }
  
    function invert(o) {
      var r = {};
      Object.keys(o).forEach(function(k) {
        r[o[k]] = k;
      });
      return r;
    }
  
    //--------------------------------------------------------------------
    //
    // Generic Mappings
    //
    //--------------------------------------------------------------------
  
    // "keyInfo" is a dictionary:
    //   code: string - name from UI Events KeyboardEvent code Values
    //     https://w3c.github.io/uievents-code/
    //   location (optional): number - one of the DOM_KEY_LOCATION values
    //   keyCap (optional): string - keyboard label in en-US locale
    // USB code Usage ID from page 0x07 unless otherwise noted (Informative)
  
    // Map of keyCode to keyInfo
    var keyCodeToInfoTable = {
      // 0x01 - VK_LBUTTON
      // 0x02 - VK_RBUTTON
      0x03: { code: 'Cancel' }, // [USB: 0x9b] char \x0018 ??? (Not in D3E)
      // 0x04 - VK_MBUTTON
      // 0x05 - VK_XBUTTON1
      // 0x06 - VK_XBUTTON2
      0x06: { code: 'Help' }, // [USB: 0x75] ???
      // 0x07 - undefined
      0x08: { code: 'Backspace' }, // [USB: 0x2a] Labelled Delete on Macintosh keyboards.
      0x09: { code: 'Tab' }, // [USB: 0x2b]
      // 0x0A-0x0B - reserved
      0X0C: { code: 'Clear' }, // [USB: 0x9c] NumPad Center (Not in D3E)
      0X0D: { code: 'Enter' }, // [USB: 0x28]
      // 0x0E-0x0F - undefined
  
      0x10: { code: 'Shift' },
      0x11: { code: 'Control' },
      0x12: { code: 'Alt' },
      0x13: { code: 'Pause' }, // [USB: 0x48]
      0x14: { code: 'CapsLock' }, // [USB: 0x39]
      0x15: { code: 'KanaMode' }, // [USB: 0x88]
      0x16: { code: 'Lang1' }, // [USB: 0x90]
      // 0x17: VK_JUNJA
      // 0x18: VK_FINAL
      0x19: { code: 'Lang2' }, // [USB: 0x91]
      // 0x1A - undefined
      0x1B: { code: 'Escape' }, // [USB: 0x29]
      0x1C: { code: 'Convert' }, // [USB: 0x8a]
      0x1D: { code: 'NonConvert' }, // [USB: 0x8b]
      0x1E: { code: 'Accept' }, // [USB: ????]
      0x1F: { code: 'ModeChange' }, // [USB: ????]
  
      0x20: { code: 'Space' }, // [USB: 0x2c]
      0x21: { code: 'PageUp' }, // [USB: 0x4b]
      0x22: { code: 'PageDown' }, // [USB: 0x4e]
      0x23: { code: 'End' }, // [USB: 0x4d]
      0x24: { code: 'Home' }, // [USB: 0x4a]
      0x25: { code: 'ArrowLeft' }, // [USB: 0x50]
      0x26: { code: 'ArrowUp' }, // [USB: 0x52]
      0x27: { code: 'ArrowRight' }, // [USB: 0x4f]
      0x28: { code: 'ArrowDown' }, // [USB: 0x51]
      0x29: { code: 'Select' }, // (Not in D3E)
      0x2A: { code: 'Print' }, // (Not in D3E)
      0x2B: { code: 'Execute' }, // [USB: 0x74] (Not in D3E)
      0x2C: { code: 'PrintScreen' }, // [USB: 0x46]
      0x2D: { code: 'Insert' }, // [USB: 0x49]
      0x2E: { code: 'Delete' }, // [USB: 0x4c]
      0x2F: { code: 'Help' }, // [USB: 0x75] ???
  
      0x30: { code: 'Digit0', keyCap: '0' }, // [USB: 0x27] 0)
      0x31: { code: 'Digit1', keyCap: '1' }, // [USB: 0x1e] 1!
      0x32: { code: 'Digit2', keyCap: '2' }, // [USB: 0x1f] 2@
      0x33: { code: 'Digit3', keyCap: '3' }, // [USB: 0x20] 3#
      0x34: { code: 'Digit4', keyCap: '4' }, // [USB: 0x21] 4$
      0x35: { code: 'Digit5', keyCap: '5' }, // [USB: 0x22] 5%
      0x36: { code: 'Digit6', keyCap: '6' }, // [USB: 0x23] 6^
      0x37: { code: 'Digit7', keyCap: '7' }, // [USB: 0x24] 7&
      0x38: { code: 'Digit8', keyCap: '8' }, // [USB: 0x25] 8*
      0x39: { code: 'Digit9', keyCap: '9' }, // [USB: 0x26] 9(
      // 0x3A-0x40 - undefined
  
      0x41: { code: 'KeyA', keyCap: 'a' }, // [USB: 0x04]
      0x42: { code: 'KeyB', keyCap: 'b' }, // [USB: 0x05]
      0x43: { code: 'KeyC', keyCap: 'c' }, // [USB: 0x06]
      0x44: { code: 'KeyD', keyCap: 'd' }, // [USB: 0x07]
      0x45: { code: 'KeyE', keyCap: 'e' }, // [USB: 0x08]
      0x46: { code: 'KeyF', keyCap: 'f' }, // [USB: 0x09]
      0x47: { code: 'KeyG', keyCap: 'g' }, // [USB: 0x0a]
      0x48: { code: 'KeyH', keyCap: 'h' }, // [USB: 0x0b]
      0x49: { code: 'KeyI', keyCap: 'i' }, // [USB: 0x0c]
      0x4A: { code: 'KeyJ', keyCap: 'j' }, // [USB: 0x0d]
      0x4B: { code: 'KeyK', keyCap: 'k' }, // [USB: 0x0e]
      0x4C: { code: 'KeyL', keyCap: 'l' }, // [USB: 0x0f]
      0x4D: { code: 'KeyM', keyCap: 'm' }, // [USB: 0x10]
      0x4E: { code: 'KeyN', keyCap: 'n' }, // [USB: 0x11]
      0x4F: { code: 'KeyO', keyCap: 'o' }, // [USB: 0x12]
  
      0x50: { code: 'KeyP', keyCap: 'p' }, // [USB: 0x13]
      0x51: { code: 'KeyQ', keyCap: 'q' }, // [USB: 0x14]
      0x52: { code: 'KeyR', keyCap: 'r' }, // [USB: 0x15]
      0x53: { code: 'KeyS', keyCap: 's' }, // [USB: 0x16]
      0x54: { code: 'KeyT', keyCap: 't' }, // [USB: 0x17]
      0x55: { code: 'KeyU', keyCap: 'u' }, // [USB: 0x18]
      0x56: { code: 'KeyV', keyCap: 'v' }, // [USB: 0x19]
      0x57: { code: 'KeyW', keyCap: 'w' }, // [USB: 0x1a]
      0x58: { code: 'KeyX', keyCap: 'x' }, // [USB: 0x1b]
      0x59: { code: 'KeyY', keyCap: 'y' }, // [USB: 0x1c]
      0x5A: { code: 'KeyZ', keyCap: 'z' }, // [USB: 0x1d]
      0x5B: { code: 'MetaLeft', location: LEFT }, // [USB: 0xe3]
      0x5C: { code: 'MetaRight', location: RIGHT }, // [USB: 0xe7]
      0x5D: { code: 'ContextMenu' }, // [USB: 0x65] Context Menu
      // 0x5E - reserved
      0x5F: { code: 'Standby' }, // [USB: 0x82] Sleep
  
      0x60: { code: 'Numpad0', keyCap: '0', location: NUMPAD }, // [USB: 0x62]
      0x61: { code: 'Numpad1', keyCap: '1', location: NUMPAD }, // [USB: 0x59]
      0x62: { code: 'Numpad2', keyCap: '2', location: NUMPAD }, // [USB: 0x5a]
      0x63: { code: 'Numpad3', keyCap: '3', location: NUMPAD }, // [USB: 0x5b]
      0x64: { code: 'Numpad4', keyCap: '4', location: NUMPAD }, // [USB: 0x5c]
      0x65: { code: 'Numpad5', keyCap: '5', location: NUMPAD }, // [USB: 0x5d]
      0x66: { code: 'Numpad6', keyCap: '6', location: NUMPAD }, // [USB: 0x5e]
      0x67: { code: 'Numpad7', keyCap: '7', location: NUMPAD }, // [USB: 0x5f]
      0x68: { code: 'Numpad8', keyCap: '8', location: NUMPAD }, // [USB: 0x60]
      0x69: { code: 'Numpad9', keyCap: '9', location: NUMPAD }, // [USB: 0x61]
      0x6A: { code: 'NumpadMultiply', keyCap: '*', location: NUMPAD }, // [USB: 0x55]
      0x6B: { code: 'NumpadAdd', keyCap: '+', location: NUMPAD }, // [USB: 0x57]
      0x6C: { code: 'NumpadComma', keyCap: ',', location: NUMPAD }, // [USB: 0x85]
      0x6D: { code: 'NumpadSubtract', keyCap: '-', location: NUMPAD }, // [USB: 0x56]
      0x6E: { code: 'NumpadDecimal', keyCap: '.', location: NUMPAD }, // [USB: 0x63]
      0x6F: { code: 'NumpadDivide', keyCap: '/', location: NUMPAD }, // [USB: 0x54]
  
      0x70: { code: 'F1' }, // [USB: 0x3a]
      0x71: { code: 'F2' }, // [USB: 0x3b]
      0x72: { code: 'F3' }, // [USB: 0x3c]
      0x73: { code: 'F4' }, // [USB: 0x3d]
      0x74: { code: 'F5' }, // [USB: 0x3e]
      0x75: { code: 'F6' }, // [USB: 0x3f]
      0x76: { code: 'F7' }, // [USB: 0x40]
      0x77: { code: 'F8' }, // [USB: 0x41]
      0x78: { code: 'F9' }, // [USB: 0x42]
      0x79: { code: 'F10' }, // [USB: 0x43]
      0x7A: { code: 'F11' }, // [USB: 0x44]
      0x7B: { code: 'F12' }, // [USB: 0x45]
      0x7C: { code: 'F13' }, // [USB: 0x68]
      0x7D: { code: 'F14' }, // [USB: 0x69]
      0x7E: { code: 'F15' }, // [USB: 0x6a]
      0x7F: { code: 'F16' }, // [USB: 0x6b]
  
      0x80: { code: 'F17' }, // [USB: 0x6c]
      0x81: { code: 'F18' }, // [USB: 0x6d]
      0x82: { code: 'F19' }, // [USB: 0x6e]
      0x83: { code: 'F20' }, // [USB: 0x6f]
      0x84: { code: 'F21' }, // [USB: 0x70]
      0x85: { code: 'F22' }, // [USB: 0x71]
      0x86: { code: 'F23' }, // [USB: 0x72]
      0x87: { code: 'F24' }, // [USB: 0x73]
      // 0x88-0x8F - unassigned
  
      0x90: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
      0x91: { code: 'ScrollLock' }, // [USB: 0x47]
      // 0x92-0x96 - OEM specific
      // 0x97-0x9F - unassigned
  
      // NOTE: 0xA0-0xA5 usually mapped to 0x10-0x12 in browsers
      0xA0: { code: 'ShiftLeft', location: LEFT }, // [USB: 0xe1]
      0xA1: { code: 'ShiftRight', location: RIGHT }, // [USB: 0xe5]
      0xA2: { code: 'ControlLeft', location: LEFT }, // [USB: 0xe0]
      0xA3: { code: 'ControlRight', location: RIGHT }, // [USB: 0xe4]
      0xA4: { code: 'AltLeft', location: LEFT }, // [USB: 0xe2]
      0xA5: { code: 'AltRight', location: RIGHT }, // [USB: 0xe6]
  
      0xA6: { code: 'BrowserBack' }, // [USB: 0x0c/0x0224]
      0xA7: { code: 'BrowserForward' }, // [USB: 0x0c/0x0225]
      0xA8: { code: 'BrowserRefresh' }, // [USB: 0x0c/0x0227]
      0xA9: { code: 'BrowserStop' }, // [USB: 0x0c/0x0226]
      0xAA: { code: 'BrowserSearch' }, // [USB: 0x0c/0x0221]
      0xAB: { code: 'BrowserFavorites' }, // [USB: 0x0c/0x0228]
      0xAC: { code: 'BrowserHome' }, // [USB: 0x0c/0x0222]
      0xAD: { code: 'AudioVolumeMute' }, // [USB: 0x7f]
      0xAE: { code: 'AudioVolumeDown' }, // [USB: 0x81]
      0xAF: { code: 'AudioVolumeUp' }, // [USB: 0x80]
  
      0xB0: { code: 'MediaTrackNext' }, // [USB: 0x0c/0x00b5]
      0xB1: { code: 'MediaTrackPrevious' }, // [USB: 0x0c/0x00b6]
      0xB2: { code: 'MediaStop' }, // [USB: 0x0c/0x00b7]
      0xB3: { code: 'MediaPlayPause' }, // [USB: 0x0c/0x00cd]
      0xB4: { code: 'LaunchMail' }, // [USB: 0x0c/0x018a]
      0xB5: { code: 'MediaSelect' },
      0xB6: { code: 'LaunchApp1' },
      0xB7: { code: 'LaunchApp2' },
      // 0xB8-0xB9 - reserved
      0xBA: { code: 'Semicolon',  keyCap: ';' }, // [USB: 0x33] ;: (US Standard 101)
      0xBB: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
      0xBC: { code: 'Comma', keyCap: ',' }, // [USB: 0x36] ,<
      0xBD: { code: 'Minus', keyCap: '-' }, // [USB: 0x2d] -_
      0xBE: { code: 'Period', keyCap: '.' }, // [USB: 0x37] .>
      0xBF: { code: 'Slash', keyCap: '/' }, // [USB: 0x38] /? (US Standard 101)
  
      0xC0: { code: 'Backquote', keyCap: '`' }, // [USB: 0x35] `~ (US Standard 101)
      // 0xC1-0xCF - reserved
  
      // 0xD0-0xD7 - reserved
      // 0xD8-0xDA - unassigned
      0xDB: { code: 'BracketLeft', keyCap: '[' }, // [USB: 0x2f] [{ (US Standard 101)
      0xDC: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
      0xDD: { code: 'BracketRight', keyCap: ']' }, // [USB: 0x30] ]} (US Standard 101)
      0xDE: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
      // 0xDF - miscellaneous/varies
  
      // 0xE0 - reserved
      // 0xE1 - OEM specific
      0xE2: { code: 'IntlBackslash',  keyCap: '\\' }, // [USB: 0x64] \| (UK Standard 102)
      // 0xE3-0xE4 - OEM specific
      0xE5: { code: 'Process' }, // (Not in D3E)
      // 0xE6 - OEM specific
      // 0xE7 - VK_PACKET
      // 0xE8 - unassigned
      // 0xE9-0xEF - OEM specific
  
      // 0xF0-0xF5 - OEM specific
      0xF6: { code: 'Attn' }, // [USB: 0x9a] (Not in D3E)
      0xF7: { code: 'CrSel' }, // [USB: 0xa3] (Not in D3E)
      0xF8: { code: 'ExSel' }, // [USB: 0xa4] (Not in D3E)
      0xF9: { code: 'EraseEof' }, // (Not in D3E)
      0xFA: { code: 'Play' }, // (Not in D3E)
      0xFB: { code: 'ZoomToggle' }, // (Not in D3E)
      // 0xFC - VK_NONAME - reserved
      // 0xFD - VK_PA1
      0xFE: { code: 'Clear' } // [USB: 0x9c] (Not in D3E)
    };
  
    // No legacy keyCode, but listed in D3E:
  
    // code: usb
    // 'IntlHash': 0x070032,
    // 'IntlRo': 0x070087,
    // 'IntlYen': 0x070089,
    // 'NumpadBackspace': 0x0700bb,
    // 'NumpadClear': 0x0700d8,
    // 'NumpadClearEntry': 0x0700d9,
    // 'NumpadMemoryAdd': 0x0700d3,
    // 'NumpadMemoryClear': 0x0700d2,
    // 'NumpadMemoryRecall': 0x0700d1,
    // 'NumpadMemoryStore': 0x0700d0,
    // 'NumpadMemorySubtract': 0x0700d4,
    // 'NumpadParenLeft': 0x0700b6,
    // 'NumpadParenRight': 0x0700b7,
  
    //--------------------------------------------------------------------
    //
    // Browser/OS Specific Mappings
    //
    //--------------------------------------------------------------------
  
    mergeIf(keyCodeToInfoTable,
            'moz', {
              0x3B: { code: 'Semicolon', keyCap: ';' }, // [USB: 0x33] ;: (US Standard 101)
              0x3D: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
              0x6B: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
              0x6D: { code: 'Minus', keyCap: '-' }, // [USB: 0x2d] -_
              0xBB: { code: 'NumpadAdd', keyCap: '+', location: NUMPAD }, // [USB: 0x57]
              0xBD: { code: 'NumpadSubtract', keyCap: '-', location: NUMPAD } // [USB: 0x56]
            });
  
    mergeIf(keyCodeToInfoTable,
            'moz-mac', {
              0x0C: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
              0xAD: { code: 'Minus', keyCap: '-' } // [USB: 0x2d] -_
            });
  
    mergeIf(keyCodeToInfoTable,
            'moz-win', {
              0xAD: { code: 'Minus', keyCap: '-' } // [USB: 0x2d] -_
            });
  
    mergeIf(keyCodeToInfoTable,
            'chrome-mac', {
              0x5D: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
            });
  
    // Windows via Bootcamp (!)
    if (0) {
      mergeIf(keyCodeToInfoTable,
              'chrome-win', {
                0xC0: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
                0xDE: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
                0xDF: { code: 'Backquote', keyCap: '`' } // [USB: 0x35] `~ (US Standard 101)
              });
  
      mergeIf(keyCodeToInfoTable,
              'ie', {
                0xC0: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
                0xDE: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
                0xDF: { code: 'Backquote', keyCap: '`' } // [USB: 0x35] `~ (US Standard 101)
              });
    }
  
    mergeIf(keyCodeToInfoTable,
            'safari', {
              0x03: { code: 'Enter' }, // [USB: 0x28] old Safari
              0x19: { code: 'Tab' } // [USB: 0x2b] old Safari for Shift+Tab
            });
  
    mergeIf(keyCodeToInfoTable,
            'ios', {
              0x0A: { code: 'Enter', location: STANDARD } // [USB: 0x28]
            });
  
    mergeIf(keyCodeToInfoTable,
            'safari-mac', {
              0x5B: { code: 'MetaLeft', location: LEFT }, // [USB: 0xe3]
              0x5D: { code: 'MetaRight', location: RIGHT }, // [USB: 0xe7]
              0xE5: { code: 'KeyQ', keyCap: 'Q' } // [USB: 0x14] On alternate presses, Ctrl+Q sends this
            });
  
    //--------------------------------------------------------------------
    //
    // Identifier Mappings
    //
    //--------------------------------------------------------------------
  
    // Cases where newer-ish browsers send keyIdentifier which can be
    // used to disambiguate keys.
  
    // keyIdentifierTable[keyIdentifier] -> keyInfo
  
    var keyIdentifierTable = {};
    if ('cros' === os) {
      keyIdentifierTable['U+00A0'] = { code: 'ShiftLeft', location: LEFT };
      keyIdentifierTable['U+00A1'] = { code: 'ShiftRight', location: RIGHT };
      keyIdentifierTable['U+00A2'] = { code: 'ControlLeft', location: LEFT };
      keyIdentifierTable['U+00A3'] = { code: 'ControlRight', location: RIGHT };
      keyIdentifierTable['U+00A4'] = { code: 'AltLeft', location: LEFT };
      keyIdentifierTable['U+00A5'] = { code: 'AltRight', location: RIGHT };
    }
    if ('chrome-mac' === browser_os) {
      keyIdentifierTable['U+0010'] = { code: 'ContextMenu' };
    }
    if ('safari-mac' === browser_os) {
      keyIdentifierTable['U+0010'] = { code: 'ContextMenu' };
    }
    if ('ios' === os) {
      // These only generate keyup events
      keyIdentifierTable['U+0010'] = { code: 'Function' };
  
      keyIdentifierTable['U+001C'] = { code: 'ArrowLeft' };
      keyIdentifierTable['U+001D'] = { code: 'ArrowRight' };
      keyIdentifierTable['U+001E'] = { code: 'ArrowUp' };
      keyIdentifierTable['U+001F'] = { code: 'ArrowDown' };
  
      keyIdentifierTable['U+0001'] = { code: 'Home' }; // [USB: 0x4a] Fn + ArrowLeft
      keyIdentifierTable['U+0004'] = { code: 'End' }; // [USB: 0x4d] Fn + ArrowRight
      keyIdentifierTable['U+000B'] = { code: 'PageUp' }; // [USB: 0x4b] Fn + ArrowUp
      keyIdentifierTable['U+000C'] = { code: 'PageDown' }; // [USB: 0x4e] Fn + ArrowDown
    }
  
    //--------------------------------------------------------------------
    //
    // Location Mappings
    //
    //--------------------------------------------------------------------
  
    // Cases where newer-ish browsers send location/keyLocation which
    // can be used to disambiguate keys.
  
    // locationTable[location][keyCode] -> keyInfo
    var locationTable = [];
    locationTable[LEFT] = {
      0x10: { code: 'ShiftLeft', location: LEFT }, // [USB: 0xe1]
      0x11: { code: 'ControlLeft', location: LEFT }, // [USB: 0xe0]
      0x12: { code: 'AltLeft', location: LEFT } // [USB: 0xe2]
    };
    locationTable[RIGHT] = {
      0x10: { code: 'ShiftRight', location: RIGHT }, // [USB: 0xe5]
      0x11: { code: 'ControlRight', location: RIGHT }, // [USB: 0xe4]
      0x12: { code: 'AltRight', location: RIGHT } // [USB: 0xe6]
    };
    locationTable[NUMPAD] = {
      0x0D: { code: 'NumpadEnter', location: NUMPAD } // [USB: 0x58]
    };
  
    mergeIf(locationTable[NUMPAD], 'moz', {
      0x6D: { code: 'NumpadSubtract', location: NUMPAD }, // [USB: 0x56]
      0x6B: { code: 'NumpadAdd', location: NUMPAD } // [USB: 0x57]
    });
    mergeIf(locationTable[LEFT], 'moz-mac', {
      0xE0: { code: 'MetaLeft', location: LEFT } // [USB: 0xe3]
    });
    mergeIf(locationTable[RIGHT], 'moz-mac', {
      0xE0: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
    mergeIf(locationTable[RIGHT], 'moz-win', {
      0x5B: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
  
  
    mergeIf(locationTable[RIGHT], 'mac', {
      0x5D: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
  
    mergeIf(locationTable[NUMPAD], 'chrome-mac', {
      0x0C: { code: 'NumLock', location: NUMPAD } // [USB: 0x53]
    });
  
    mergeIf(locationTable[NUMPAD], 'safari-mac', {
      0x0C: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
      0xBB: { code: 'NumpadAdd', location: NUMPAD }, // [USB: 0x57]
      0xBD: { code: 'NumpadSubtract', location: NUMPAD }, // [USB: 0x56]
      0xBE: { code: 'NumpadDecimal', location: NUMPAD }, // [USB: 0x63]
      0xBF: { code: 'NumpadDivide', location: NUMPAD } // [USB: 0x54]
    });
  
  
    //--------------------------------------------------------------------
    //
    // Key Values
    //
    //--------------------------------------------------------------------
  
    // Mapping from `code` values to `key` values. Values defined at:
    // https://w3c.github.io/uievents-key/
    // Entries are only provided when `key` differs from `code`. If
    // printable, `shiftKey` has the shifted printable character. This
    // assumes US Standard 101 layout
  
    var codeToKeyTable = {
      // Modifier Keys
      ShiftLeft: { key: 'Shift' },
      ShiftRight: { key: 'Shift' },
      ControlLeft: { key: 'Control' },
      ControlRight: { key: 'Control' },
      AltLeft: { key: 'Alt' },
      AltRight: { key: 'Alt' },
      MetaLeft: { key: 'Meta' },
      MetaRight: { key: 'Meta' },
  
      // Whitespace Keys
      NumpadEnter: { key: 'Enter' },
      Space: { key: ' ' },
  
      // Printable Keys
      Digit0: { key: '0', shiftKey: ')' },
      Digit1: { key: '1', shiftKey: '!' },
      Digit2: { key: '2', shiftKey: '@' },
      Digit3: { key: '3', shiftKey: '#' },
      Digit4: { key: '4', shiftKey: '$' },
      Digit5: { key: '5', shiftKey: '%' },
      Digit6: { key: '6', shiftKey: '^' },
      Digit7: { key: '7', shiftKey: '&' },
      Digit8: { key: '8', shiftKey: '*' },
      Digit9: { key: '9', shiftKey: '(' },
      KeyA: { key: 'a', shiftKey: 'A' },
      KeyB: { key: 'b', shiftKey: 'B' },
      KeyC: { key: 'c', shiftKey: 'C' },
      KeyD: { key: 'd', shiftKey: 'D' },
      KeyE: { key: 'e', shiftKey: 'E' },
      KeyF: { key: 'f', shiftKey: 'F' },
      KeyG: { key: 'g', shiftKey: 'G' },
      KeyH: { key: 'h', shiftKey: 'H' },
      KeyI: { key: 'i', shiftKey: 'I' },
      KeyJ: { key: 'j', shiftKey: 'J' },
      KeyK: { key: 'k', shiftKey: 'K' },
      KeyL: { key: 'l', shiftKey: 'L' },
      KeyM: { key: 'm', shiftKey: 'M' },
      KeyN: { key: 'n', shiftKey: 'N' },
      KeyO: { key: 'o', shiftKey: 'O' },
      KeyP: { key: 'p', shiftKey: 'P' },
      KeyQ: { key: 'q', shiftKey: 'Q' },
      KeyR: { key: 'r', shiftKey: 'R' },
      KeyS: { key: 's', shiftKey: 'S' },
      KeyT: { key: 't', shiftKey: 'T' },
      KeyU: { key: 'u', shiftKey: 'U' },
      KeyV: { key: 'v', shiftKey: 'V' },
      KeyW: { key: 'w', shiftKey: 'W' },
      KeyX: { key: 'x', shiftKey: 'X' },
      KeyY: { key: 'y', shiftKey: 'Y' },
      KeyZ: { key: 'z', shiftKey: 'Z' },
      Numpad0: { key: '0' },
      Numpad1: { key: '1' },
      Numpad2: { key: '2' },
      Numpad3: { key: '3' },
      Numpad4: { key: '4' },
      Numpad5: { key: '5' },
      Numpad6: { key: '6' },
      Numpad7: { key: '7' },
      Numpad8: { key: '8' },
      Numpad9: { key: '9' },
      NumpadMultiply: { key: '*' },
      NumpadAdd: { key: '+' },
      NumpadComma: { key: ',' },
      NumpadSubtract: { key: '-' },
      NumpadDecimal: { key: '.' },
      NumpadDivide: { key: '/' },
      Semicolon: { key: ';', shiftKey: ':' },
      Equal: { key: '=', shiftKey: '+' },
      Comma: { key: ',', shiftKey: '<' },
      Minus: { key: '-', shiftKey: '_' },
      Period: { key: '.', shiftKey: '>' },
      Slash: { key: '/', shiftKey: '?' },
      Backquote: { key: '`', shiftKey: '~' },
      BracketLeft: { key: '[', shiftKey: '{' },
      Backslash: { key: '\\', shiftKey: '|' },
      BracketRight: { key: ']', shiftKey: '}' },
      Quote: { key: '\'', shiftKey: '"' },
      IntlBackslash: { key: '\\', shiftKey: '|' }
    };
  
    mergeIf(codeToKeyTable, 'mac', {
      MetaLeft: { key: 'Meta' },
      MetaRight: { key: 'Meta' }
    });
  
    // Corrections for 'key' names in older browsers (e.g. FF36-, IE9, etc)
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent.key#Key_values
    var keyFixTable = {
      Add: '+',
      Decimal: '.',
      Divide: '/',
      Subtract: '-',
      Multiply: '*',
      Spacebar: ' ',
      Esc: 'Escape',
      Nonconvert: 'NonConvert',
      Left: 'ArrowLeft',
      Up: 'ArrowUp',
      Right: 'ArrowRight',
      Down: 'ArrowDown',
      Del: 'Delete',
      Menu: 'ContextMenu',
      MediaNextTrack: 'MediaTrackNext',
      MediaPreviousTrack: 'MediaTrackPrevious',
      SelectMedia: 'MediaSelect',
      HalfWidth: 'Hankaku',
      FullWidth: 'Zenkaku',
      RomanCharacters: 'Romaji',
      Crsel: 'CrSel',
      Exsel: 'ExSel',
      Zoom: 'ZoomToggle'
    };
  
    //--------------------------------------------------------------------
    //
    // Exported Functions
    //
    //--------------------------------------------------------------------
  
  
    var codeTable = remap(keyCodeToInfoTable, 'code');
  
    try {
      var nativeLocation = nativeKeyboardEvent && ('location' in new KeyboardEvent(''));
    } catch (_) {}
  
    function keyInfoForEvent(event) {
      var keyCode = 'keyCode' in event ? event.keyCode : 'which' in event ? event.which : 0;
      var keyInfo = (function(){
        if (nativeLocation || 'keyLocation' in event) {
          var location = nativeLocation ? event.location : event.keyLocation;
          if (location && keyCode in locationTable[location]) {
            return locationTable[location][keyCode];
          }
        }
        if ('keyIdentifier' in event && event.keyIdentifier in keyIdentifierTable) {
          return keyIdentifierTable[event.keyIdentifier];
        }
        if (keyCode in keyCodeToInfoTable) {
          return keyCodeToInfoTable[keyCode];
        }
        return null;
      }());
  
      // TODO: Track these down and move to general tables
      if (0) {
        // TODO: Map these for newerish browsers?
        // TODO: iOS only?
        // TODO: Override with more common keyIdentifier name?
        switch (event.keyIdentifier) {
        case 'U+0010': keyInfo = { code: 'Function' }; break;
        case 'U+001C': keyInfo = { code: 'ArrowLeft' }; break;
        case 'U+001D': keyInfo = { code: 'ArrowRight' }; break;
        case 'U+001E': keyInfo = { code: 'ArrowUp' }; break;
        case 'U+001F': keyInfo = { code: 'ArrowDown' }; break;
        }
      }
  
      if (!keyInfo)
        return null;
  
      var key = (function() {
        var entry = codeToKeyTable[keyInfo.code];
        if (!entry) return keyInfo.code;
        return (event.shiftKey && 'shiftKey' in entry) ? entry.shiftKey : entry.key;
      }());
  
      return {
        code: keyInfo.code,
        key: key,
        location: keyInfo.location,
        keyCap: keyInfo.keyCap
      };
    }
  
    function queryKeyCap(code, locale) {
      code = String(code);
      if (!codeTable.hasOwnProperty(code)) return 'Undefined';
      if (locale && String(locale).toLowerCase() !== 'en-us') throw Error('Unsupported locale');
      var keyInfo = codeTable[code];
      return keyInfo.keyCap || keyInfo.code || 'Undefined';
    }
  
    if ('KeyboardEvent' in global && 'defineProperty' in Object) {
      (function() {
        function define(o, p, v) {
          if (p in o) return;
          Object.defineProperty(o, p, v);
        }
  
        define(KeyboardEvent.prototype, 'code', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return keyInfo ? keyInfo.code : '';
        }});
  
        // Fix for nonstandard `key` values (FF36-)
        if ('key' in KeyboardEvent.prototype) {
          var desc = Object.getOwnPropertyDescriptor(KeyboardEvent.prototype, 'key');
          Object.defineProperty(KeyboardEvent.prototype, 'key', { get: function() {
            var key = desc.get.call(this);
            return keyFixTable.hasOwnProperty(key) ? keyFixTable[key] : key;
          }});
        }
  
        define(KeyboardEvent.prototype, 'key', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return (keyInfo && 'key' in keyInfo) ? keyInfo.key : 'Unidentified';
        }});
  
        define(KeyboardEvent.prototype, 'location', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return (keyInfo && 'location' in keyInfo) ? keyInfo.location : STANDARD;
        }});
  
        define(KeyboardEvent.prototype, 'locale', { get: function() {
          return '';
        }});
      }());
    }
  
    if (!('queryKeyCap' in global.KeyboardEvent))
      global.KeyboardEvent.queryKeyCap = queryKeyCap;
  
    // Helper for IE8-
    global.identifyKey = function(event) {
      if ('code' in event)
        return;
  
      var keyInfo = keyInfoForEvent(event);
      event.code = keyInfo ? keyInfo.code : '';
      event.key = (keyInfo && 'key' in keyInfo) ? keyInfo.key : 'Unidentified';
      event.location = ('location' in event) ? event.location :
        ('keyLocation' in event) ? event.keyLocation :
        (keyInfo && 'location' in keyInfo) ? keyInfo.location : STANDARD;
      event.locale = '';
    };
  
  }(self));
  
/* global Howler Howl */
(function ctHowler() {
    ct.sound = {};
    ct.sound.howler = Howler;
    Howler.orientation(0, -1, 0, 0, 0, 1);
    Howler.pos(0, 0, 0);
    ct.sound.howl = Howl;

    var defaultMaxDistance = [][0] || 2500;
    ct.sound.useDepth = [false][0] === void 0 ?
        false :
        [false][0];
    ct.sound.manageListenerPosition = [false][0] === void 0 ?
        true :
        [false][0];

    /**
     * Detects if a particular codec is supported in the system
     * @param {string} type One of: "mp3", "mpeg", "opus", "ogg", "oga", "wav",
     * "aac", "caf", m4a", "mp4", "weba", "webm", "dolby", "flac".
     * @returns {boolean} true/false
     */
    ct.sound.detect = Howler.codecs;

    /**
     * Creates a new Sound object and puts it in resource object
     *
     * @param {string} name Sound's name
     * @param {object} formats A collection of sound files of specified extension,
     * in format `extension: path`
     * @param {string} [formats.ogg] Local path to the sound in ogg format
     * @param {string} [formats.wav] Local path to the sound in wav format
     * @param {string} [formats.mp3] Local path to the sound in mp3 format
     * @param {object} options An options object
     *
     * @returns {object} Sound's object
     */
    ct.sound.init = function init(name, formats, options) {
        options = options || {};
        var sounds = [];
        if (formats.wav && formats.wav.slice(-4) === '.wav') {
            sounds.push(formats.wav);
        }
        if (formats.mp3 && formats.mp3.slice(-4) === '.mp3') {
            sounds.push(formats.mp3);
        }
        if (formats.ogg && formats.ogg.slice(-4) === '.ogg') {
            sounds.push(formats.ogg);
        }
        // Do not use music preferences for ct.js debugger
        var isMusic = !navigator.userAgent.startsWith('ct.js') && options.music;
        var howl = new Howl({
            src: sounds,
            autoplay: false,
            preload: !isMusic,
            html5: isMusic,
            loop: options.loop,
            pool: options.poolSize || 5,

            onload: function () {
                if (!isMusic) {
                    ct.res.soundsLoaded++;
                }
            },
            onloaderror: function () {
                ct.res.soundsError++;
                howl.buggy = true;
                console.error('[ct.sound.howler] Oh no! We couldn\'t load ' +
                    (formats.wav || formats.mp3 || formats.ogg) + '!');
            }
        });
        if (isMusic) {
            ct.res.soundsLoaded++;
        }
        ct.res.sounds[name] = howl;
    };

    var set3Dparameters = (howl, opts, id) => {
        howl.pannerAttr({
            coneInnerAngle: opts.coneInnerAngle || 360,
            coneOuterAngle: opts.coneOuterAngle || 360,
            coneOuterGain: opts.coneOuterGain || 1,
            distanceModel: opts.distanceModel || 'linear',
            maxDistance: opts.maxDistance || defaultMaxDistance,
            refDistance: opts.refDistance || 1,
            rolloffFactor: opts.rolloffFactor || 1,
            panningModel: opts.panningModel || 'HRTF'
        }, id);
    };
    /**
     * Spawns a new sound and plays it.
     *
     * @param {string} name The name of a sound to be played
     * @param {object} [opts] Options object.
     * @param {Function} [cb] A callback, which is called when the sound finishes playing
     *
     * @returns {number} The ID of the created sound. This can be passed to Howler methods.
     */
    ct.sound.spawn = function spawn(name, opts, cb) {
        opts = opts || {};
        if (typeof opts === 'function') {
            cb = opts;
            opts = {};
        }
        var howl = ct.res.sounds[name];
        var id = howl.play();
        if (opts.loop) {
            howl.loop(true, id);
        }
        if (opts.volume !== void 0) {
            howl.volume(opts.volume, id);
        }
        if (opts.rate !== void 0) {
            howl.rate(opts.rate, id);
        }
        if (opts.x !== void 0 || opts.position) {
            if (opts.x !== void 0) {
                howl.pos(opts.x, opts.y || 0, opts.z || 0, id);
            } else {
                const copy = opts.position;
                howl.pos(copy.x, copy.y, opts.z || (ct.sound.useDepth ? copy.depth : 0), id);
            }
            set3Dparameters(howl, opts, id);
        }
        if (cb) {
            howl.once('end', cb, id);
        }
        return id;
    };

    /**
     * Stops playback of a sound, resetting its time to 0.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.stop = function stop(name, id) {
        if (ct.sound.playing(name, id)) {
            ct.res.sounds[name].stop(id);
        }
    };

    /**
     * Pauses playback of a sound or group, saving the seek of playback.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.pause = function pause(name, id) {
        ct.res.sounds[name].pause(id);
    };

    /**
     * Resumes a given sound, e.g. after pausing it.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.resume = function resume(name, id) {
        ct.res.sounds[name].play(id);
    };
    /**
     * Returns whether a sound is currently playing,
     * either an exact sound (found by its ID) or any sound of a given name.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {boolean} `true` if the sound is playing, `false` otherwise.
     */
    ct.sound.playing = function playing(name, id) {
        return ct.res.sounds[name].playing(id);
    };
    /**
     * Preloads a sound. This is usually applied to music files before playing
     * as they are not preloaded by default.
     *
     * @param {string} name The name of a sound
     * @returns {void}
     */
    ct.sound.load = function load(name) {
        ct.res.sounds[name].load();
    };


    /**
     * Changes/returns the volume of the given sound.
     *
     * @param {string} name The name of a sound to affect.
     * @param {number} [volume] The new volume from `0.0` to `1.0`.
     * If empty, will return the existing volume.
     * @param {number} [id] If specified, then only the given sound instance is affected.
     *
     * @returns {number} The current volume of the sound.
     */
    ct.sound.volume = function volume(name, volume, id) {
        return ct.res.sounds[name].volume(volume, id);
    };

    /**
     * Fades a sound to a given volume. Can affect either a specific instance or the whole group.
     *
     * @param {string} name The name of a sound to affect.
     * @param {number} newVolume The new volume from `0.0` to `1.0`.
     * @param {number} duration The duration of transition, in milliseconds.
     * @param {number} [id] If specified, then only the given sound instance is affected.
     *
     * @returns {void}
     */
    ct.sound.fade = function fade(name, newVolume, duration, id) {
        if (ct.sound.playing(name, id)) {
            var howl = ct.res.sounds[name],
                oldVolume = id ? howl.volume(id) : howl.volume;
            try {
                howl.fade(oldVolume, newVolume, duration, id);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('Could not reliably fade a sound, reason:', e);
                ct.sound.volume(name, newVolume, id);
            }
        }
    };

    /**
     * Moves the 3D listener to a new position.
     *
     * @see https://github.com/goldfire/howler.js#posx-y-z
     *
     * @param {number} x The new x coordinate
     * @param {number} y The new y coordinate
     * @param {number} [z] The new z coordinate
     *
     * @returns {void}
     */
    ct.sound.moveListener = function moveListener(x, y, z) {
        Howler.pos(x, y, z || 0);
    };

    /**
     * Moves a 3D sound to a new location
     *
     * @param {string} name The name of a sound to move
     * @param {number} id The ID of a particular sound.
     * Pass `null` if you want to affect all the sounds of a given name.
     * @param {number} x The new x coordinate
     * @param {number} y The new y coordinate
     * @param {number} [z] The new z coordinate
     *
     * @returns {void}
     */
    ct.sound.position = function position(name, id, x, y, z) {
        if (ct.sound.playing(name, id)) {
            var howl = ct.res.sounds[name],
                oldPosition = howl.pos(id);
            howl.pos(x, y, z || oldPosition[2], id);
        }
    };

    /**
     * Get/set the global volume for all sounds, relative to their own volume.
     * @param {number} [volume] The new volume from `0.0` to `1.0`.
     * If omitted, will return the current global volume.
     *
     * @returns {number} The current volume.
     */
    ct.sound.globalVolume = Howler.volume.bind(Howler);

    ct.sound.exists = function exists(name) {
        return (name in ct.res.sounds);
    };
})();

(function ctKeyboard() {
    var keyPrefix = 'keyboard.';
    var setKey = function (key, value) {
        ct.inputs.registry[keyPrefix + key] = value;
    };

    ct.keyboard = {
        string: '',
        lastKey: '',
        lastCode: '',
        alt: false,
        shift: false,
        ctrl: false,
        clear() {
            delete ct.keyboard.lastKey;
            delete ct.keyboard.lastCode;
            ct.keyboard.string = '';
            ct.keyboard.alt = false;
            ct.keyboard.shift = false;
            ct.keyboard.ctrl = false;
        },
        check: [],
        onDown(e) {
            ct.keyboard.shift = e.shiftKey;
            ct.keyboard.alt = e.altKey;
            ct.keyboard.ctrl = e.ctrlKey;
            ct.keyboard.lastKey = e.key;
            ct.keyboard.lastCode = e.code;
            if (e.code) {
                setKey(e.code, 1);
            } else {
                setKey('Unknown', 1);
            }
            if (e.key) {
                if (e.key.length === 1) {
                    ct.keyboard.string += e.key;
                } else if (e.key === 'Backspace') {
                    ct.keyboard.string = ct.keyboard.string.slice(0, -1);
                } else if (e.key === 'Enter') {
                    ct.keyboard.string = '';
                }
            }
            e.preventDefault();
        },
        onUp(e) {
            ct.keyboard.shift = e.shiftKey;
            ct.keyboard.alt = e.altKey;
            ct.keyboard.ctrl = e.ctrlKey;
            if (e.code) {
                setKey(e.code, 0);
            } else {
                setKey('Unknown', 0);
            }
            e.preventDefault();
        }
    };

    if (document.addEventListener) {
        document.addEventListener('keydown', ct.keyboard.onDown, false);
        document.addEventListener('keyup', ct.keyboard.onUp, false);
    } else {
        document.attachEvent('onkeydown', ct.keyboard.onDown);
        document.attachEvent('onkeyup', ct.keyboard.onUp);
    }
})();

(function fittoscreen(ct) {
    document.body.style.overflow = 'hidden';
    var canv = ct.pixiApp.view;
    const positionCanvas = function positionCanvas(mode, scale) {
        if (mode === 'fastScale' || mode === 'fastScaleInteger') {
            canv.style.transform = `translate(-50%, -50%) scale(${scale})`;
            canv.style.position = 'absolute';
            canv.style.top = '50%';
            canv.style.left = '50%';
        } else if (mode === 'expandViewport' || mode === 'expand' || mode === 'scaleFill') {
            canv.style.position = 'static';
            canv.style.top = 'unset';
            canv.style.left = 'unset';
        } else if (mode === 'scaleFit') {
            canv.style.transform = 'translate(-50%, -50%)';
            canv.style.position = 'absolute';
            canv.style.top = '50%';
            canv.style.left = '50%';
        }
    };
    var resize = function resize() {
        const {mode} = ct.fittoscreen;
        const pixelScaleModifier = ct.highDensity ? (window.devicePixelRatio || 1) : 1;
        const kw = window.innerWidth / ct.roomWidth,
              kh = window.innerHeight / ct.roomHeight;
        let k = Math.min(kw, kh);
        if (mode === 'fastScaleInteger') {
            k = k < 1 ? k : Math.floor(k);
        }
        var canvasWidth, canvasHeight,
            cameraWidth, cameraHeight;
        if (mode === 'expandViewport' || mode === 'expand') {
            canvasWidth = Math.ceil(window.innerWidth * pixelScaleModifier);
            canvasHeight = Math.ceil(window.innerHeight * pixelScaleModifier);
            cameraWidth = window.innerWidth;
            cameraHeight = window.innerHeight;
        } else if (mode === 'fastScale' || mode === 'fastScaleInteger') {
            canvasWidth = Math.ceil(ct.roomWidth * pixelScaleModifier);
            canvasHeight = Math.ceil(ct.roomHeight * pixelScaleModifier);
            cameraWidth = ct.roomWidth;
            cameraHeight = ct.roomHeight;
        } else if (mode === 'scaleFit' || mode === 'scaleFill') {
            if (mode === 'scaleFill') {
                canvasWidth = Math.ceil(ct.roomWidth * kw * pixelScaleModifier);
                canvasHeight = Math.ceil(ct.roomHeight * kh * pixelScaleModifier);
                cameraWidth = window.innerWidth / k;
                cameraHeight = window.innerHeight / k;
            } else { // scaleFit
                canvasWidth = Math.ceil(ct.roomWidth * k * pixelScaleModifier);
                canvasHeight = Math.ceil(ct.roomHeight * k * pixelScaleModifier);
                cameraWidth = ct.roomWidth;
                cameraHeight = ct.roomHeight;
            }
        }

        ct.pixiApp.renderer.resize(canvasWidth, canvasHeight);
        if (mode !== 'scaleFill' && mode !== 'scaleFit') {
            ct.pixiApp.stage.scale.x = ct.pixiApp.stage.scale.y = pixelScaleModifier;
        } else {
            ct.pixiApp.stage.scale.x = ct.pixiApp.stage.scale.y = pixelScaleModifier * k;
        }
        canv.style.width = Math.ceil(canvasWidth / pixelScaleModifier) + 'px';
        canv.style.height = Math.ceil(canvasHeight / pixelScaleModifier) + 'px';
        if (ct.camera) {
            ct.camera.width = cameraWidth;
            ct.camera.height = cameraHeight;
        }
        positionCanvas(mode, k);
    };
    var toggleFullscreen = function () {
        try {
            // Are we in Electron?
            const win = require('electron').remote.BrowserWindow.getFocusedWindow();
            win.setFullScreen(!win.isFullScreen());
            return;
        } catch (e) {
            void e; // Continue with web approach
        }
        var canvas = document.fullscreenElement ||
                     document.webkitFullscreenElement ||
                     document.mozFullScreenElement ||
                     document.msFullscreenElement,
            requester = document.getElementById('ct'),
            request = requester.requestFullscreen ||
                      requester.webkitRequestFullscreen ||
                      requester.mozRequestFullScreen ||
                      requester.msRequestFullscreen,
            exit = document.exitFullscreen ||
                   document.webkitExitFullscreen ||
                   document.mozCancelFullScreen ||
                   document.msExitFullscreen;
        if (!canvas) {
            var promise = request.call(requester);
            if (promise) {
                promise
                .catch(function fullscreenError(err) {
                    console.error('[ct.fittoscreen]', err);
                });
            }
        } else if (exit) {
            exit.call(document);
        }
    };
    var queuedFullscreen = function queuedFullscreen() {
        toggleFullscreen();
        document.removeEventListener('mouseup', queuedFullscreen);
        document.removeEventListener('keyup', queuedFullscreen);
        document.removeEventListener('click', queuedFullscreen);
    };
    var queueFullscreen = function queueFullscreen() {
        document.addEventListener('mouseup', queuedFullscreen);
        document.addEventListener('keyup', queuedFullscreen);
        document.addEventListener('click', queuedFullscreen);
    };
    window.addEventListener('resize', resize);
    ct.fittoscreen = resize;
    ct.fittoscreen.toggleFullscreen = queueFullscreen;
    var $mode = 'fastScale';
    Object.defineProperty(ct.fittoscreen, 'mode', {
        configurable: false,
        enumerable: true,
        set(value) {
            $mode = value;
        },
        get() {
            return $mode;
        }
    });
    ct.fittoscreen.mode = $mode;
    ct.fittoscreen.getIsFullscreen = function getIsFullscreen() {
        try {
            // Are we in Electron?
            const win = require('electron').remote.BrowserWindow.getFocusedWindow;
            return win.isFullScreen;
        } catch (e) {
            void e; // Continue with web approach
        }
        return document.fullscreen || document.webkitIsFullScreen || document.mozFullScreen;
    };
})(ct);

/* Based on https://github.com/luser/gamepadtest */

(function() {
  const standardMapping = {
    controllers: {},
    buttonsMapping: [
      'Button1',
      'Button2',
      'Button3',
      'Button4',
      'L1',
      'R1',
      'L2',
      'R2',
      'Select',
      'Start',
      // here, must have same name as in module.js
      'L3',
      //'LStickButton',
      // here, too...
      'R3',
      //'RStickButton',
      // up, down, left and right are all mapped as axes.
      'Up',
      'Down',
      'Left',
      'Right'

      // + a special button code `Any`, that requires special handling
    ],
    axesMapping: ['LStickX', 'LStickY', 'RStickX', 'RStickY']
  };

  const prefix = 'gamepad.';

  const setRegistry = function(key, value) {
    ct.inputs.registry[prefix + key] = value;
  };
  const getRegistry = function(key) {
    return ct.inputs.registry[prefix + key] || 0;
  };

  const getGamepads = function() {
    return navigator.getGamepads();
  };

  const addGamepad = function(gamepad) {
    standardMapping.controllers[gamepad.index] = gamepad;
  };

  const scanGamepads = function() {
    const gamepads = getGamepads();
    for (let i = 0, len = gamepads.length; i < len; i++) {
      if (gamepads[i]) {
        const {controllers} = standardMapping;
        if (!(gamepads[i].index in controllers)) {
          // add new gamepad object
          addGamepad(gamepads[i]);
        } else {
          // update gamepad object state
          controllers[gamepads[i].index] = gamepads[i];
        }
      }
    }
  };

  const updateStatus = function() {
    scanGamepads();
    let j;
    const {controllers} = standardMapping;
    const {buttonsMapping} = standardMapping;
    const {axesMapping} = standardMapping;
    for (j in controllers) {
      /**
       * @type {Gamepad}
       */
      const controller = controllers[j];
      const buttonsLen = controller.buttons.length;

      // Reset the 'any button' input
      setRegistry('Any', 0);
      // loop through all the known button codes and update their state
      for (let i = 0; i < buttonsLen; i++) {
        setRegistry(buttonsMapping[i], controller.buttons[i].value);
        // update the 'any button', if needed
        setRegistry('Any', Math.max(getRegistry('Any'), controller.buttons[i].value));
        ct.gamepad.lastButton = buttonsMapping[i];
      }

      // loop through all the known axes and update their state
      const axesLen = controller.axes.length;
      for (let i = 0; i < axesLen; i++) {
        setRegistry(axesMapping[i], controller.axes[i]);
      }
    }
  };

  ct.gamepad = Object.assign(new PIXI.utils.EventEmitter(), {
    list: getGamepads(),
    connected(e) {
      ct.gamepad.emit('connected', e.gamepad, e);
      addGamepad(e.gamepad);
    },
    disconnected(e) {
      ct.gamepad.emit('disconnected', e.gamepad, e);
      delete standardMapping.controllers[e.gamepad.index];
    },
    getButton: code => {
      if (standardMapping.buttonsMapping.indexOf(code) === -1 && code !== 'Any') {
        throw new Error(`[ct.gamepad] Attempt to get the state of a non-existing button ${code}. A typo?`);
      }
      return getRegistry(code);
    },
    getAxis: code => {
      if (standardMapping.axesMapping.indexOf(code) === -1) {
        throw new Error(`[ct.gamepad] Attempt to get the state of a non-existing axis ${code}. A typo?`);
      }
      return getRegistry(code);
    },
    lastButton: null
  });

  // register events
  window.addEventListener('gamepadconnected', ct.gamepad.connected);
  window.addEventListener('gamepaddisconnected', ct.gamepad.disconnected);
  // register a ticker listener
  ct.pixiApp.ticker.add(updateStatus);
})();
/**
 * @typedef {ITextureOptions}
 * @property {} []
 */

(function resAddon(ct) {
    const loadingScreen = document.querySelector('.ct-aLoadingScreen'),
          loadingBar = loadingScreen.querySelector('.ct-aLoadingBar');
    const dbFactory = window.dragonBones ? dragonBones.PixiFactory.factory : null;
    /**
     * A utility object that manages and stores textures and other entities
     * @namespace
     */
    ct.res = {
        sounds: {},
        textures: {},
        skeletons: {},
        /**
         * Loads and executes a script by its URL
         * @param {string} url The URL of the script file, with its extension.
         * Can be relative or absolute.
         * @returns {Promise<void>}
         * @async
         */
        loadScript(url = ct.u.required('url', 'ct.res.loadScript')) {
            var script = document.createElement('script');
            script.src = url;
            const promise = new Promise((resolve, reject) => {
                script.onload = () => {
                    resolve();
                };
                script.onerror = () => {
                    reject();
                };
            });
            document.getElementsByTagName('head')[0].appendChild(script);
            return promise;
        },
        /**
         * Loads an individual image as a named ct.js texture.
         * @param {string} url The path to the source image.
         * @param {string} name The name of the resulting ct.js texture
         * as it will be used in your code.
         * @param {ITextureOptions} textureOptions Information about texture's axis
         * and collision shape.
         * @returns {Promise<Array<PIXI.Texture>>}
         */
        loadTexture(url = ct.u.required('url', 'ct.res.loadTexture'), name = ct.u.required('name', 'ct.res.loadTexture'), textureOptions = {}) {
            const loader = new PIXI.Loader();
            loader.add(url, url);
            return new Promise((resolve, reject) => {
                loader.load((loader, resources) => {
                    resolve(resources);
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load image ${url}`));
                });
            })
            .then(resources => {
                const tex = [resources[url].texture];
                tex.shape = tex[0].shape = textureOptions.shape || {};
                tex[0].defaultAnchor = new PIXI.Point(
                    textureOptions.anchor.x || 0,
                    textureOptions.anchor.x || 0
                );
                ct.res.textures[name] = tex;
                return tex;
            });
        },
        /**
         * Loads a skeleton made in DragonBones into the game
         * @param {string} ske Path to the _ske.json file that contains
         * the armature and animations.
         * @param {string} tex Path to the _tex.json file that describes the atlas
         * with a skeleton's textures.
         * @param {string} png Path to the _tex.png atlas that contains
         * all the textures of the skeleton.
         * @param {string} name The name of the skeleton as it will be used in ct.js game
         */
        loadDragonBonesSkeleton(ske, tex, png, name = ct.u.required('name', 'ct.res.loadDragonBonesSkeleton')) {
            const dbf = dragonBones.PixiFactory.factory;
            const loader = new PIXI.Loader();
            loader
                .add(ske, ske)
                .add(tex, tex)
                .add(png, png);
            return new Promise((resolve, reject) => {
                loader.load(() => {
                    resolve();
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load skeleton with _ske.json: ${ske}, _tex.json: ${tex}, _tex.png: ${png}.`));
                });
            }).then(() => {
                dbf.parseDragonBonesData(loader.resources[ske].data);
                dbf.parseTextureAtlasData(
                    loader.resources[tex].data,
                    loader.resources[png].texture
                );
                // eslint-disable-next-line id-blacklist
                ct.res.skeletons[name] = loader.resources[ske].data;
            });
        },
        /**
         * Loads a Texture Packer compatible .json file with its source image,
         * adding ct.js textures to the game.
         * @param {string} url The path to the JSON file that describes the atlas' textures.
         * @returns {Promise<Array<string>>} A promise that resolves into an array
         * of all the loaded textures.
         */
        loadAtlas(url = ct.u.required('url', 'ct.res.loadAtlas')) {
            const loader = new PIXI.Loader();
            loader.add(url, url);
            return new Promise((resolve, reject) => {
                loader.load((loader, resources) => {
                    resolve(resources);
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load atlas ${url}`));
                });
            })
            .then(resources => {
                const sheet = resources[url].spritesheet;
                for (const animation in sheet.animations) {
                    const tex = sheet.animations[animation];
                    const animData = sheet.data.animations;
                    for (let i = 0, l = animData[animation].length; i < l; i++) {
                        const a = animData[animation],
                              f = a[i];
                        tex[i].shape = sheet.data.frames[f].shape;
                    }
                    tex.shape = tex[0].shape || {};
                    ct.res.textures[animation] = tex;
                }
                return Object.keys(sheet.animations);
            });
        },
        /**
         * Loads a bitmap font by its XML file.
         * @param {string} url The path to the XML file that describes the bitmap fonts.
         * @param {string} name The name of the font.
         * @returns {Promise<string>} A promise that resolves into the font's name
         * (the one you've passed with `name`).
         */
        loadBitmapFont(url = ct.u.required('url', 'ct.res.loadBitmapFont'), name = ct.u.required('name', 'ct.res.loadBitmapFont')) {
            const loader = new PIXI.Loader();
            loader.add(name, url);
            return new Promise((resolve, reject) => {
                loader.load((loader, resources) => {
                    resolve(resources);
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load bitmap font ${url}`));
                });
            });
        },
        loadGame() {
            // !! This method is intended to be filled by ct.IDE and be executed
            // exactly once at game startup. Don't put your code here.
            const changeProgress = percents => {
                loadingScreen.setAttribute('data-progress', percents);
                loadingBar.style.width = percents + '%';
            };

            const atlases = [["./img/a0.json"]][0];
            const tiledImages = [{"BG":{"source":"./img/t0.png","shape":{"type":"rect","top":0,"bottom":256,"left":0,"right":256},"anchor":{"x":0,"y":0}},"pixil-frame-0_(20)":{"source":"./img/t1.png","shape":{"type":"rect","top":0,"bottom":64,"left":0,"right":64},"anchor":{"x":0,"y":0}},"SpringShort1_3":{"source":"./img/t2.png","shape":{"type":"rect","top":0,"bottom":582,"left":0,"right":1919},"anchor":{"x":0,"y":0}},"SpringShort1_4":{"source":"./img/t3.png","shape":{"type":"rect","top":0,"bottom":621,"left":0,"right":1924},"anchor":{"x":0,"y":0}},"SpringShort1_2":{"source":"./img/t4.png","shape":{"type":"rect","top":0,"bottom":723,"left":0,"right":1923},"anchor":{"x":0,"y":0}},"SpringShort1_5":{"source":"./img/t5.png","shape":{"type":"rect","top":0,"bottom":1081,"left":0,"right":1923},"anchor":{"x":0,"y":0}},"pixil-frame-0_(19)":{"source":"./img/t6.png","shape":{"type":"rect","top":0,"bottom":64,"left":0,"right":64},"anchor":{"x":0,"y":0}},"pixil-frame-0_(37)":{"source":"./img/t7.png","shape":{"type":"rect","top":0,"bottom":64,"left":0,"right":64},"anchor":{"x":0,"y":0}},"pixil-frame-0_(24)":{"source":"./img/t8.png","shape":{"type":"rect","top":0,"bottom":37,"left":0,"right":37},"anchor":{"x":0,"y":0}},"pixil-frame-0_(25)":{"source":"./img/t9.png","shape":{"type":"rect","top":0,"bottom":64,"left":0,"right":64},"anchor":{"x":0,"y":0}}}][0];
            const sounds = [[]][0];
            const bitmapFonts = [{}][0];
            const dbSkeletons = [[]][0]; // DB means DragonBones

            if (sounds.length && !ct.sound) {
                throw new Error('[ct.res] No sound system found. Make sure you enable one of the `sound` catmods. If you don\'t need sounds, remove them from your ct.js project.');
            }

            const totalAssets = atlases.length;
            let assetsLoaded = 0;
            const loadingPromises = [];

            loadingPromises.push(...atlases.map(atlas =>
                ct.res.loadAtlas(atlas)
                .then(texturesNames => {
                    assetsLoaded++;
                    changeProgress(assetsLoaded / totalAssets * 100);
                    return texturesNames;
                })));

            for (const name in tiledImages) {
                loadingPromises.push(ct.res.loadTexture(
                    tiledImages[name].source,
                    name,
                    {
                        anchor: tiledImages[name].anchor,
                        shape: tiledImages[name].shape
                    }
                ));
            }
            for (const font in bitmapFonts) {
                loadingPromises.push(ct.res.loadBitmapFont(bitmapFonts[font], font));
            }
            for (const skel of dbSkeletons) {
                ct.res.loadDragonBonesSkeleton(...skel);
            }

            for (const sound of sounds) {
                ct.sound.init(sound.name, {
                    wav: sound.wav || false,
                    mp3: sound.mp3 || false,
                    ogg: sound.ogg || false
                }, {
                    poolSize: sound.poolSize,
                    music: sound.isMusic
                });
            }

            /*@res@*/
            

            Promise.all(loadingPromises)
            .then(() => {
                Object.defineProperty(ct.templates.Copy.prototype, 'cgroup', {
    set: function (value) {
        this.$cgroup = value;
    },
    get: function () {
        return this.$cgroup;
    }
});
Object.defineProperty(ct.templates.Copy.prototype, 'moveContinuous', {
    value: function (cgroup, precision) {
        if (this.gravity) {
            this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / 180);
            this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / 180);
        }
        return ct.place.moveAlong(this, this.direction, this.speed * ct.delta, cgroup, precision);
    }
});

Object.defineProperty(ct.templates.Copy.prototype, 'moveContinuousByAxes', {
    value: function (cgroup, precision) {
        if (this.gravity) {
            this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / 180);
            this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / 180);
        }
        return ct.place.moveByAxes(
            this,
            this.hspeed * ct.delta,
            this.vspeed * ct.delta,
            cgroup,
            precision
        );
    }
});

Object.defineProperty(ct.templates.Tilemap.prototype, 'enableCollisions', {
    value: function (cgroup) {
        ct.place.enableTilemapCollisions(this, cgroup);
    }
});
ct.mouse.setupListeners();

                loadingScreen.classList.add('hidden');
                ct.pixiApp.ticker.add(ct.loop);
                ct.rooms.forceSwitch(ct.rooms.starting);
            })
            .catch(console.error);
        },
        /*
         * Gets a pixi.js texture from a ct.js' texture name,
         * so that it can be used in pixi.js objects.
         * @param {string|-1} name The name of the ct.js texture, or -1 for an empty texture
         * @param {number} [frame] The frame to extract
         * @returns {PIXI.Texture|Array<PIXI.Texture>} If `frame` was specified,
         * returns a single PIXI.Texture. Otherwise, returns an array
         * with all the frames of this ct.js' texture.
         *
         * @note Formatted as a non-jsdoc comment as it requires a better ts declaration
         * than the auto-generated one
         */
        getTexture(name, frame) {
            if (frame === null) {
                frame = void 0;
            }
            if (name === -1) {
                if (frame !== void 0) {
                    return PIXI.Texture.EMPTY;
                }
                return [PIXI.Texture.EMPTY];
            }
            if (!(name in ct.res.textures)) {
                throw new Error(`Attempt to get a non-existent texture ${name}`);
            }
            const tex = ct.res.textures[name];
            if (frame !== void 0) {
                return tex[frame];
            }
            return tex;
        },
        /*
         * Returns the collision shape of the given texture.
         * @param {string|-1} name The name of the ct.js texture, or -1 for an empty collision shape
         * @returns {object}
         *
         * @note Formatted as a non-jsdoc comment as it requires a better ts declaration
         * than the auto-generated one
         */
        getTextureShape(name) {
            if (name === -1) {
                return {};
            }
            if (!(name in ct.res.textures)) {
                throw new Error(`Attempt to get a shape of a non-existent texture ${name}`);
            }
            return ct.res.textures[name].shape;
        },
        /**
         * Creates a DragonBones skeleton, ready to be added to your copies.
         * @param {string} name The name of the skeleton asset
         * @param {string} [skin] Optional; allows you to specify the used skin
         * @returns {object} The created skeleton
         */
        makeSkeleton(name, skin) {
            const r = ct.res.skeletons[name],
                  skel = dbFactory.buildArmatureDisplay('Armature', r.name, skin);
            skel.ctName = name;
            skel.on(dragonBones.EventObject.SOUND_EVENT, function skeletonSound(event) {
                if (ct.sound.exists(event.name)) {
                    ct.sound.spawn(event.name);
                } else {
                    // eslint-disable-next-line no-console
                    console.warn(`Skeleton ${skel.ctName} tries to play a non-existing sound ${event.name} at animation ${skel.animation.lastAnimationName}`);
                }
            });
            return skel;
        }
    };

    ct.res.loadGame();
})(ct);

/**
 * A collection of content that was made inside ct.IDE.
 * @type {any}
 */
ct.content = JSON.parse(["{}"][0] || '{}');

var inGameRoomStart = function (room) {
    room.crystals = 0;
    room.lives = 3;
    room.crystalsTotal = ct.templates.list['GreenCrystal'].length;
    ct.rooms.append('LayerUI', {
        isUi: true
    });
};;
