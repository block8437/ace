function Player(camera, scene, colliders, _add) {
    var self = this; // EEWW :(

    this.camera = camera;
    this.scene = scene;
    this.colliders = colliders;
    this._add = _add;

    this.controls = new THREE.PointerLockControls(camera);
    this.scene.add(this.controls.getObject());
    this.controls.enabled = true;

    this.upRaycaster    = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3( 0,  1,  0), 0, 10);
    this.downRaycaster  = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3( 0, -1,  0), 0, 10);
    this.leftRaycaster  = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3( 1,  0,  0), 0, 10);
    this.rightRaycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(-1,  0,  0), 0, 10);
    this.frontRaycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3( 0,  0,  1), 0, 10);
    this.backRaycaster  = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3( 0,  0, -1), 0, 10);


	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;

	this.prevTime = performance.now();
    this.velocity = new THREE.Vector3();

    this.float = false;

    this.mass = 100;
    this.gravity = 9.8;
    this.size = [10.0, 10.0, 10.0];
    this.acceleration = [400.0, 350.0, 400.0];
    this.position = [0.0, 0.0, 0.0];

    this.mouse = new THREE.Vector2(0.0, 0.0);
    this.mouseray = new THREE.Raycaster();

    this.cubeSize = 25;

    this.rollOverGeo = new THREE.BoxGeometry( this.cubeSize, this.cubeSize, this.cubeSize );
    this.rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
    this.rollOverMesh = new THREE.Mesh( this.rollOverGeo, this.rollOverMaterial );
    this.scene.add( this.rollOverMesh );

    $('#blocker').click(function() {
        $('#blocker').hide();

        var element = document.body;

        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        element.requestPointerLock();
    });

    var pointerChangeEvent = function() {
        var canvas = document.body;
        if ( document.pointerLockElement === canvas || document.mozPointerLockElement === canvas || document.webkitPointerLockElement === canvas ) {
            $('#blocker').hide();

            if ( !self.float ) {
                self.controls.enabled = true;
            }
        }
        else {
            if ( !self.float ) {
                self.controls.enabled = false;
                $('#blocker').show();
            }
        }
    };

    if ( "onpointerlockchange" in document ) {
        document.addEventListener('pointerlockchange', pointerChangeEvent, false);
    }
    else if ( "onmozpointerlockchange" in document ) {
        document.addEventListener('mozpointerlockchange', pointerChangeEvent, false);
    }
    else if ( "onwebkitpointerlockchange" in document ) {
        document.addEventListener('webkitpointerlockchange', pointerChangeEvent, false);
    }

    self.camera.updateProjectionMatrix();

	document.addEventListener('keydown', function ( event ) {
        switch ( event.keyCode ) {
            case 67:
                self.float = !self.float;
                this.rollOverMesh.visible = self.float;

                if ( !self.float ) {
                    self.velocity.x = 0;
                    self.velocity.y = 0;
                    self.velocity.z = 0;
                }
                break;
            case 38: // up
			case 87: // w
			    self.moveForward = true;
				break;

			case 37: // left
			case 65: // a
				self.moveLeft = true;
                break;

			case 40: // down
			case 83: // s
				self.moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				self.moveRight = true;
				break;

			case 32: // space
				if ( self.canJump == true && !self.float ) {
                    self.velocity.y += self.acceleration[1];
					self.canJump = false;
                }
				break;
		}
	}, false);

	document.addEventListener('keyup', function ( event ) {
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
                self.moveForward = false;
                break;

            case 37: // left
            case 65: // a
                self.moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                self.moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                self.moveRight = false;
                break;
        }
    }, false);

    document.addEventListener('click', function ( event ) {
        if ( !self.float ) {
            return;
        }

        self.mouseray.setFromCamera(self.mouse, self.camera);
        var colliders = self.currentChunk != undefined ? self.colliders.concat(self.currentChunk.mesh) : self.colliders;
        var intersects = self.mouseray.intersectObjects( colliders );

        if ( intersects.length > 0 ) {
            var intersect = intersects[0];

            var pos = new THREE.Vector3().copy(intersect.point).add(intersect.face.normal);
            pos.divideScalar( self.cubeSize ).floor().multiplyScalar( self.cubeSize ).addScalar( self.cubeSize/2 );

            self._add(pos.x, pos.y, pos.z, [(pos.x * 2000) % 255, (pos.y * 2000) % 255, (pos.z * 2000) % 255]);
        }
    }, false);

    document.addEventListener('mousemove', function ( event ) {
        if ( !self.float ) {
            return;
        }

        self.mouseray.setFromCamera(self.mouse, self.camera);
        var colliders = self.currentChunk != undefined ? self.colliders.concat(self.currentChunk.mesh) : self.colliders;
        var intersects = self.mouseray.intersectObjects( colliders );

        if ( intersects.length > 0 ) {
            var intersect = intersects[ 0 ];

            self.rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );
            self.rollOverMesh.position.divideScalar( self.cubeSize ).floor().multiplyScalar( self.cubeSize ).addScalar( self.cubeSize/2 );
        }
    });

    this.update = function () {
        if ( !self.controls.enabled ) {
            return;
        }

        var time = performance.now();
        var delta = ( time - self.prevTime ) / 1000;

        if  ( !self.float ) {
            self.downRaycaster.ray.origin.copy( self.controls.getObject().position );
            self.downRaycaster.ray.origin.y -= 10;

            var colliders = self.currentChunk != undefined ? self.colliders.concat(self.currentChunk.mesh) : self.colliders;
            var intersections = self.downRaycaster.intersectObjects(colliders);

            var isOnObject = intersections.length > 0;

            self.velocity.x -= self.velocity.x * self.size[0] * delta;
            self.velocity.z -= self.velocity.z * self.size[2] * delta;
            self.velocity.y -= self.gravity * self.mass * delta;

            if ( self.moveForward )  self.velocity.z -= self.acceleration[2] * delta;
            if ( self.moveBackward ) self.velocity.z += self.acceleration[2] * delta;

            if ( self.moveLeft )  self.velocity.x -= self.acceleration[0] * delta;
            if ( self.moveRight ) self.velocity.x += self.acceleration[0] * delta;

            if ( isOnObject === true ) {
                self.velocity.y = Math.max( 0, self.velocity.y );

                self.canJump = true;
            }

            self.controls.getObject().translateX( self.velocity.x * delta );
            self.controls.getObject().translateY( self.velocity.y * delta );
            self.controls.getObject().translateZ( self.velocity.z * delta );

            if ( self.controls.getObject().position.y < self.size[1] ) {
                self.velocity.y = 0;
                self.controls.getObject().position.y = self.size[1];

                self.canJump = true;
            }

            self.position = [self.camera.position.x, self.camera.position.y, self.camera.position.z];
        }
        else {
            if ( self.moveForward ) {
                self.controls.getObject().translateZ(-400 * delta);
                self.controls.getObject().translateY( self.camera.getWorldDirection().y * 400 * delta);
            }
            if ( self.moveBackward ) {
                self.controls.getObject().translateZ(400 * delta);
                self.controls.getObject().translateY( self.camera.getWorldDirection().y * -400 * delta);
            }

            if ( self.moveLeft  ) self.controls.getObject().translateX(-(400 * delta));
            if ( self.moveRight ) self.controls.getObject().translateX( (400 * delta));

            self.position = [self.camera.position.x, self.camera.position.y, self.camera.position.z];

            self.mouseray.setFromCamera(self.mouse, self.camera);
            var colliders = self.currentChunk != undefined ? self.colliders.concat(self.currentChunk.mesh) : self.colliders;
            var intersects = self.mouseray.intersectObjects( colliders );

        	if ( intersects.length > 0 ) {
                var intersect = intersects[ 0 ];

        		self.rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );
        		self.rollOverMesh.position.divideScalar( self.cubeSize ).floor().multiplyScalar( self.cubeSize ).addScalar( self.cubeSize/2 );
        	}
        }

        self.prevTime = time;
    }
}
