// LIGHTS

function doSkybox()
{
    var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 1024;
    var FLOOR = -5;
    var ambient = new THREE.AmbientLight( 0x444444 );
    scene.add( ambient );

    light = new THREE.SpotLight( 0xffffff, 1, 700, Math.PI / 2, 1,2 );
    light.position.set( 250, 1500, 1000 );
    light.target.position.set( 0, 0, 0 );

    light.castShadow = true;

    light.shadowCameraNear = 1200;
    light.shadowCameraFar = 2500;
    light.shadowCameraFov = 50;

    //light.shadowCameraVisible = true;

    light.shadowBias = 0.0001;
    light.shadowDarkness = 0.5;

    light.shadowMapWidth = SHADOW_MAP_WIDTH;
    light.shadowMapHeight = SHADOW_MAP_HEIGHT;

    scene.add( light );

// GROUND
    var geometry = new THREE.PlaneBufferGeometry( 100, 100 );
    var planeMaterial = new THREE.MeshPhongMaterial( { color: 0xffdd99 } );

    var ground = new THREE.Mesh( geometry, planeMaterial );

    ground.position.set( 0, FLOOR, 0 );
    //ground.rotation.x = - Math.PI / 2;
    ground.scale.set( 100, 100, 100 );

    ground.castShadow = false;
    ground.receiveShadow = true;

    scene.add( ground );
}