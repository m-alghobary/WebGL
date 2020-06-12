// init webgl
const gl = new GL('canvas');
const webgl = gl._gl;

// create shader program
const program = gl.createProgramFromSource('vertex-shader-src', 'fragment-shader-src');

// get the program attribute locations
const posLocation = gl.getLocation(gl.ATTR, 'a_position');
const colorLocation = gl.getLocation(gl.UNIFORM, 'u_color');

// create the position buffer
const posData = new Float32Array([-0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, -0.5]);
const posBuffer = gl.createBuffer(posData);

// create the index buffer
const indexData = new Uint16Array([0, 1, 2, 2, 3, 0]);
const indexBuffer = gl.createBuffer(indexData, gl.INDEX_BUFFER);

// set the current program
gl.useProgram();

// define position attribute
webgl.vertexAttribPointer(posLocation, 2, webgl.FLOAT, false, 0, 0);

// turn on the position attribute
webgl.enableVertexAttribArray(posLocation);

// pass the color
webgl.uniform3f(colorLocation, 1, 1, 1);

function draw() {
	// rezie canvas
	gl.reSize();

	// clear background color
	gl.clear(130, 140, 250);

	// draw the triangle
	webgl.drawElements(webgl.TRIANGLES, indexData.length, webgl.UNSIGNED_SHORT, 0);
}

draw();
