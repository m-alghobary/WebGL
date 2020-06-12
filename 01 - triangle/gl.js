'use strict';

class GL {
	/**
	 * init the WebGl context and do brawser support check.
	 *
	 * @param {String} canvasId the HTML id attr of the canvas element
	 */
	constructor(canvasId, is3D = false) {
		const canvas = document.getElementById('canvas');

		// object state
		this._gl = canvas.getContext('webgl');
		this.glProgram = null;

		// constants
		this.ATTR = 1001;
		this.UNIFORM = 1002;
		this.INDEX_BUFFER = this._gl.ELEMENT_ARRAY_BUFFER;

		// for edge and IE
		if (this._gl === null) {
			this._gl = canvas.getContext('experimental-webgl');
		}

		if (this._gl === null) {
			throw new Error(`Your brawser doesn't support WebGL!`);
		}

		// enable back face
		if (is3D) {
			this._gl.enable(this._gl.DEPTH_TEST);
			this._gl.enable(this._gl.CULL_FACE);
			this._gl.frontFace(this._gl.CCW);
			this._gl.cullFace(this._gl.BACK);
		}
	}

	/**
	 * rezise the canvas
	 *
	 * @param {Boolean} isFullScreen is the canvas fill in the whole screen
	 */
	reSize(isFullScreen = false) {
		let displayW = this._gl.canvas.clientWidth;
		let displayH = this._gl.canvas.clientHeight;

		//# for full width
		if (isFullScreen) {
			const realToCSSPixels = window.devicePixelRatio;
			displayW = Math.floor(this._gl.canvas.clientWidth * realToCSSPixels);
			displayH = Math.floor(this._gl.canvas.clientHeight * realToCSSPixels);
		}

		if (this._gl.canvas.width !== displayW || this._gl.canvas.height !== displayH) {
			this._gl.canvas.width = displayW;
			this._gl.canvas.height = displayH;
		}

		this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
	}

	/**
	 * clear the canvas with a color.
	 *
	 * @param {Number} r the red color value 0 - 255 [default = 0]
	 * @param {Number } g the green color value 0 - 255 [default = 0]
	 * @param {Number} b the blue color value 0 - 255 [default = 0]
	 * @param {Number} a the alpha value 0 - 1 [default = 1]
	 */
	clear(r = 0, g = 0, b = 0, a = 1.0) {
		this._gl.clearColor(
			parseFloat((r / 255).toFixed(2)),
			parseFloat((g / 255).toFixed(2)),
			parseFloat((b / 255).toFixed(2)),
			a
		);
		this._gl.clear(this._gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}

	/**
	 * Creates and compiles a shader.
	 *
	 * @param {Number} type the shader type [VERTEX_SHADER, FRAGMENT_SHADER]
	 * @param {String} source the GLSL source code for the shader
	 * @returns {WebGLShader} the shader.
	 */
	createShader(type, source) {
		const typeName = type === this._gl.VERTEX_SHADER ? 'VERTEX_SHADER' : 'FRAGMENT_SHADER';

		const shader = this._gl.createShader(type);
		// set shader source code
		this._gl.shaderSource(shader, source);
		// compile it
		this._gl.compileShader(shader);

		// check compile status.
		const success = this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS);
		if (!success) {
			const error = this._gl.getShaderInfoLog(shader);
			this._gl.deleteShader(shader);
			throw new Error(`Failed to compile ${typeName} with these errors: ${error}`);
		}

		return shader;
	}

	/**
	 * Creates and link a shader program
	 *
	 * @param {WebGLShader} vertexShader the vertex shader
	 * @param {WebGLShader} fragmentShader the fragment shader
	 * @returns {WebGLProgram} the shader program.
	 */
	createProgram(vertexShader, fragmentShader) {
		// Create a WebGLProgram object
		const program = this._gl.createProgram();

		// Attach the shader objects
		this._gl.attachShader(program, vertexShader);
		this._gl.attachShader(program, fragmentShader);

		// Link the WebGLProgram object
		this._gl.linkProgram(program);

		// Check for link status
		const linked = this._gl.getProgramParameter(program, this._gl.LINK_STATUS);
		if (!linked) {
			const error = this._gl.getProgramInfoLog(program);

			// delete program and shaders
			this._gl.deleteProgram(program);
			this._gl.deleteShader(fragmentShader);
			this._gl.deleteShader(vertexShader);

			throw new Error(`Fatal error: Failed to link program: ${error}`);
		}

		// Remember the shaders. This allows for them to be cleanly deleted.
		program.vShader = vertexShader;
		program.fShader = fragmentShader;

		// add refrence to this instance
		this.glProgram = program;

		return program;
	}

	/**
	 * Create and link a shader program from shader sources in script tags
	 *
	 * @param {String} vShaderId the id of a script tag which contains the vertex shader source code
	 * @param {String} fShaderId the id of a script tag which contains the fragment shader source code
	 * @returns {WebGLProgram} the shader program.
	 */
	createProgramFromSource(vShaderId, fShaderId) {
		// read the source code
		const vertexSource = document.getElementById(vShaderId).textContent;
		const fragmentSource = document.getElementById(fShaderId).textContent;

		// create shaders
		const vertexShader = this.createShader(this._gl.VERTEX_SHADER, vertexSource);
		const fragmentShader = this.createShader(this._gl.FRAGMENT_SHADER, fragmentSource);

		// create program
		const program = this.createProgram(vertexShader, fragmentShader);

		return program;
	}

	/**
	 * Create WebGLBuffer object & bind it.
	 *
	 * @param {Array} data the buffer data array
	 * @param {Number} type the buffer type [ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER]
	 * @returns {WebGLBuffer} the created buffer.
	 */
	createBuffer(data, type = this._gl.ARRAY_BUFFER) {
		if (type !== this._gl.ARRAY_BUFFER && type !== this._gl.ELEMENT_ARRAY_BUFFER) {
			throw new Error(`invalid buffer tyep: [${type}]`);
		}

		const buffer = this._gl.createBuffer();
		this._gl.bindBuffer(type, buffer);
		this._gl.bufferData(type, data, this._gl.STATIC_DRAW);

		return buffer;
	}

	/**
	 * get the location of an attribute or uniform.
	 *
	 * @param {Number} type a shader attribute or uniform [ATTR, UNIFORM]
	 * @param {String} name the shader attribute or uniform name
	 */
	getLocation(type, name) {
		if (type !== this.ATTR && type !== this.UNIFORM) {
			throw new Error(`invalid shader attrbute type!: [${type}]`);
		}

		if (type === this.ATTR) {
			return this._gl.getAttribLocation(this.glProgram, name);
		}

		return this._gl.getUniformLocation(this.glProgram, name);
	}

	/**
	 * Wrap the WebGl useProgram function.
	 */
	useProgram() {
		if (this.glProgram) {
			this._gl.useProgram(this.glProgram);
		}
	}
}
