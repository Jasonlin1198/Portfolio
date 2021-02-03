
THREE.PlayerControls = function (player, domElement ) {

	this.player = player;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API
	this.center = new THREE.Vector3( player.position.x, player.position.y, player.position.z );
	this.moveSpeed = 0.2;
	this.turnSpeed = 0.04;
	this.tiltSpeed = 0.01;
	this.maxSpeed = 0.6;
	this.defaultSpeed = 0.2;
	var keyState = {};

	this.update = function() { 

		this.checkKeyStates();

	};

	this.checkKeyStates = function () {

	    if (keyState[38] || keyState[87]) {

	        // 'w' - forward
			this.player.translateX(-this.moveSpeed);
	    }

	    if (keyState[40] || keyState[83]) {

	        // 's' - back
			this.player.translateX(this.moveSpeed);

		}
	    if (keyState[37] || keyState[65]) {

	        // left arrow or 'a' - rotate left
	        this.player.rotation.y += this.turnSpeed;

	    }

	    if (keyState[39] || keyState[68]) {

	        // right arrow or 'd' - rotate right
	        this.player.rotation.y -= this.turnSpeed;

	    }

	    if (keyState[81]) {

	        // 'q' - tilt up
	        this.player.rotation.z -= this.tiltSpeed;
		}
		else{
			if(this.player.rotation.z < 0){

				this.player.rotation.z = THREE.MathUtils.lerp(this.player.rotation.z,0,0.1);

			}
		}

		
	    if (keyState[69]) {

	        // 'e' - tilt down
	        this.player.rotation.z += this.tiltSpeed;

		}
		else{
			if(this.player.rotation.z > 0){

				this.player.rotation.z = THREE.MathUtils.lerp(this.player.rotation.z,0,0.1);

			}
		}

		if (keyState[16]) {
			// 'shift' - speed up
			if(this.moveSpeed < this.maxSpeed){
				this.moveSpeed += 0.005;
			}
		}
		else{
			if(this.moveSpeed > this.defaultSpeed){
				var diff = (this.moveSpeed - this.defaultSpeed)/20;
				this.moveSpeed -= diff;

			}
		}



		// if (keyState[32]) {
 
	    //     // 'space'
		// 	this.player.position.y += 0.1;

		// }
		// else{
		// 	if(this.player.position.y > 1){
		// 		this.player.position.y -= 0.1;

		// 	}
		// }

	};

	function onKeyDown( event ) {

    	event = event || window.event;

        keyState[event.keyCode || event.which] = true;

    }

    function onKeyUp( event ) {

        event = event || window.event;

        keyState[event.keyCode || event.which] = false;

    }

	this.domElement.addEventListener('keydown', onKeyDown, false );
	this.domElement.addEventListener('keyup', onKeyUp, false );

};

