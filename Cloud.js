import { Colors, scene } from "./app";

class Cloud {
    constructor() {
        // Create an empty container that will hold the different parts of the cloud
        this.mesh = new THREE.Object3D();

        // create a cube geometry;
        // this shape will be duplicated to create the cloud
        var geom = new THREE.BoxGeometry(20, 20, 20);

        // create a material; a simple white material will do the trick
        var mat = new THREE.MeshPhongMaterial({
            color: Colors.softwhite,
        });

        // duplicate the geometry a random number of times
        var nBlocs = 3 + Math.floor(Math.random() * 3);
        for (var i = 0; i < nBlocs; i++) {
            // create the mesh by cloning the geometry
            var m = new THREE.Mesh(geom, mat);

            // set the position and the rotation of each cube randomly
            m.position.x = i * 2;
            m.position.y = 15;
            m.position.z = Math.random() * 1;
            m.rotation.z = Math.random() * Math.PI * 2;
            m.rotation.y = Math.random() * Math.PI * 2;

            // set the size of the cube randomly
            var s = 0.01 + Math.random() * 0.1;
            m.scale.set(s, s, s);

            // allow each cube to cast and to receive shadows
            m.castShadow = true;

            // add the cube to the container we first created
            this.mesh.add(m);
        }

        scene.add(this.mesh);
    }
}

export { Cloud };