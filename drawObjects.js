/**
 * Created by Guest on 09/10/2015.
 */

function drawBuildings (buildings,parent,color,extrudeAmount, elevation) {
    var extrudeSettings = { amount: extrudeAmount,  bevelEnabled: false, steps: 1 };
    var elevation = (elevation) ? elevation : 0;
    var polygons = buildings.map(function(b)
    {
        var height = (b.tags["building:height"] !== undefined) ? parseInt(b.tags["building:height"]) : extrudeSettings.amount;
        var color = (b.tags["building:colour"] !== undefined) ? new THREE.Color(b.tags["building:colour"]) : new THREE.Color(color);
        color = color.getHex();
        var position = b.nodes.map(function(n){return projection([n.lon, n.lat]);});

        return {
            height : height,
            color: color,
            position: position
        }
    });

    polygons.map(function(p) {
        var building = new THREE.Shape();

        //Move building to ???
        building.moveTo(p.position[0][0], p.position[0][1] * -1);

        //Draw lines
        for (var i = 1; i < p.position.length; i++) {
            building.lineTo(p.position[i][0], p.position[i][1] * -1);
        }

        //Extrude
        extrudeSettings.amount = p.height;
        var geometry = new THREE.ExtrudeGeometry(building, extrudeSettings);
        var geoMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial(
            {
                color: p.color,
            }));
        geoMesh.position.setZ(elevation);
        geoMesh.castShadow = true;
        geoMesh.receiveShadow = false;
        var egh = new THREE.EdgesHelper( geoMesh, 0x666666 );
        egh.material.linewidth = 1;
        parent.add( egh );
        parent.add( geoMesh);
        console.log("create Building");
    });
}

function drawLanes (lanes,parent,color,width,elevation) {
    var width = (width) ? width : 20.0;
    var elevation = (elevation) ? elevation : 0;

    var polygons = lanes.map(function(b) {
        var position = b.nodes.map(function(n){return projection([n.lon, n.lat]);});
        width = (b.tags['width']) ? parseFloat(b.tags['width']) : width;
        var id = b._id;
        var name = (b.tags.name) ? b.tags.name : null;

        return {position: position, width:width, id:id, name: name};
    });

    polygons.map(function(p) {

        var geometry = new THREE.Geometry();

        for (var i = 0; i < p.position.length; i++)
        {
            geometry.vertices.push(
                new THREE.Vector3( p.position[i][0], p.position[i][1]*-1,0)
            );
        }
        var geoMesh = new THREE.LineBasicMaterial({ linewidth: p.width, color: (color) ? color : getRandomColor() });
        geoMesh.receiveShadow = true;
        var line = new THREE.Line(geometry, geoMesh);
        line.position.setZ(elevation);
        var egh = new THREE.EdgesHelper( line, 0x666666 );
        egh.material.linewidth = 5;
        parent.add( egh );
        parent.add(line);
        console.log("create Lane");
    });
}


function drawLeisure (leisure,parent,color,extrudeAmount, elevation) {
    //k="leisure" v="park"/>
    var extrudeSettings = { amount: extrudeAmount,  bevelEnabled: false, steps: 1 };

    var elevation = (elevation) ? elevation : 0;
    var polygons = leisure.map(function(b)
    {
        var position = b.nodes.map(function(n){return projection([n.lon, n.lat]);});
        return {
            position: position
        }
    });

    polygons.map(function(p) {
        var park = new THREE.Shape();

        //Move building to ???
        park.moveTo(p.position[0][0], p.position[0][1] * -1);

        //Draw lines
        for (var i = 1; i < p.position.length; i++) {
            park.lineTo(p.position[i][0], p.position[i][1] * -1);
        }

        //Extrude
        var geometry = new THREE.ExtrudeGeometry(park, extrudeSettings);
        //geometry.position.z = elevation;
        var geoMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial(
            {
                color: color
            }));
        geoMesh.position.setZ(elevation);
        geoMesh.castShadow = false;
        geoMesh.receiveShadow = true;
        var egh = new THREE.EdgesHelper( geoMesh, 0x666666 );
        egh.material.linewidth = 1;
        parent.add( egh );
        parent.add( geoMesh);
        console.log("create Leisure");
    });
}