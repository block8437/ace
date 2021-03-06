// Return the vertices to be popped onto a VBO for rendering.
function Cube(position, size, up, down, left, right, front, back) {
    size = size / 2;

    var vertices = [];
    var normals = [];

    if ( up ) {
        vertices.push(
            [-size + position[0],  size + position[1], size + position[2]],
            [-size + position[0], -size + position[1], size + position[2]],
            [ size + position[0], -size + position[1], size + position[2]]
        );

        vertices.push(
            [ size + position[0],  size + position[1], size + position[2]],
            [-size + position[0],  size + position[1], size + position[2]],
            [ size + position[0], -size + position[1], size + position[2]]
        );

        for ( var i = 0; i < 6; i++ )
            normals.push([0, 1, 0]);
    }

    if ( down ) {
        vertices.push(
            [-size + position[0], -size + position[1], -size + position[2]],
            [-size + position[0],  size + position[1], -size + position[2]],
            [ size + position[0], -size + position[1], -size + position[2]]
        );

        vertices.push(
            [ size + position[0], -size + position[1], -size + position[2]],
            [-size + position[0],  size + position[1], -size + position[2]],
            [ size + position[0],  size + position[1], -size + position[2]]
        );

        for ( var i = 0; i < 6; i++ )
            normals.push([0, -1, 0]);
    }

    if ( left ) {
        vertices.push(
            [-size + position[0], -size + position[1],  size + position[2]],
            [-size + position[0], -size + position[1], -size + position[2]],
            [ size + position[0], -size + position[1], -size + position[2]]
        );

        vertices.push(
            [-size + position[0], -size + position[1],  size + position[2]],
            [ size + position[0], -size + position[1], -size + position[2]],
            [ size + position[0], -size + position[1],  size + position[2]]
        );

        for ( var i = 0; i < 6; i++ )
            normals.push([1, 0, 0]);
    }

    if ( right ) {
        vertices.push(
            [-size + position[0], size + position[1], -size + position[2]],
            [-size + position[0], size + position[1], size + position[2]],
            [ size + position[0], size + position[1], -size + position[2]]
        );
        vertices.push(
            [ size + position[0], size + position[1], -size + position[2]],
            [-size + position[0], size + position[1], size + position[2]],
            [ size + position[0], size + position[1], size + position[2]]
        );

        for ( var i = 0; i < 6; i++ )
            normals.push([-1, 0, 0]);
    }

    if ( back ) {
        vertices.push(
            [ size + position[0], -size + position[1],  size + position[2]],
            [ size + position[0],  size + position[1], -size + position[2]],
            [ size + position[0],  size + position[1],  size + position[2]]
        );

        vertices.push(
            [ size + position[0], -size + position[1],  size + position[2]],
            [ size + position[0], -size + position[1], -size + position[2]],
            [ size + position[0],  size + position[1], -size + position[2]]
        );

        for ( var i = 0; i < 6; i++ )
            normals.push([0, 0, -1]);
    }

    if ( front ) {
        vertices.push(
                [-size + position[0], -size + position[1], -size + position[2]],
                [-size + position[0], -size + position[1],  size + position[2]],
                [-size + position[0],  size + position[1], -size + position[2]]
            );

        vertices.push(
                [-size + position[0], -size + position[1],  size + position[2]],
                [-size + position[0],  size + position[1],  size + position[2]],
                [-size + position[0],  size + position[1], -size + position[2]]
            );

        for ( var i = 0; i < 6; i++ )
            normals.push([0, 0, 1]);
    }

    return [vertices, normals];
}

// Chunk
// Parameters:
// position - position of chunk within map
// size     - size of chunk. should be static for all chunks.

function Chunk(position, size, cubeSize) {
    this.cubeSize = cubeSize;
    this.position = [position[0] * size[0], position[1] * size[1], position[2] * size[2]];
    this.blocks = {};                           // Morton encoded position -> color
    this.list = [];                             // List of non morton encoded positions.
    this.mesh;                                  // Cached mesh
    this.geometry = new THREE.BufferGeometry(); // VBO
    this.needsBuild = true;                     // Should this be rebuilt?
    this.size = size;
    this.material = new THREE.MeshLambertMaterial({ vertexColors: THREE.VertexColors, wireframe: false });;

    // Add a block to the chunk. Position is relative to the chunk.
    this.add = function (x, y, z, color) {
        if ( x < 0 || y < 0 || z < 0 || x > this.size[0] || y > this.size[1] || z > this.size[2]) {
            throw "Out of range error!";
        }

        this.blocks[ [x, y, z] ] = [color[0] / 255, color[1] / 255, color[2] / 255];
        this.list.push([x, y, z]);
        this.needsBuild = true;

        console.log("TESTICLES");
    };

    // Build a mesh from the buffer.
    this.build = function (verts, norms, colors) {
        if ( !this.needsBuild )
            return;

        if ( verts === undefined || norms === undefined || colors === undefined ) {
            var out = buildChunk(this.list, this.blocks, this.position, this.cubeSize);

            verts = out[0];
            norms = out[1];
            colors = out[2];
        }

        this.geometry.addAttribute( 'position', new THREE.BufferAttribute( verts,  3) );
        this.geometry.addAttribute( 'color',    new THREE.BufferAttribute( colors, 3) );
        this.geometry.addAttribute( 'normal',   new THREE.BufferAttribute( norms,  3) );

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(this.position[0] * this.cubeSize,
                               this.position[1] * this.cubeSize,
                               this.position[2] * this.cubeSize);

        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;

        this.needsBuild = false;
    };
}
