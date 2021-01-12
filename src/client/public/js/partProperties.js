function Model(options) {
    let defaultObj = {
        scale: 1.0,
        top: 0.0,
        bottom: 0.0,
        front: 0.0,
        back: 0.0,
        left: 0.0,
        right: 0.0,
        collisionX: 0.0,
        collisionY: 0.0,
        collisionZ: 0.0,
        snapOffsetBasisX: Model.SnapBasis.BASIS_MIN,
        snapOffsetBasisZ: Model.SnapBasis.BASIS_MIN,
        snapOffsetX: 0.0,
        snapOffsetZ: 0.0,
        rotationX: 0.0,
        rotationY: 0.0,
        rotationZ: 0.0,
        pinFaces: new Set(),
        pinConnectableFaces: new Set(),
        compatibleRims: new Set(),
        tireConnectableFaces: new Set(),
        rimConnectableFaces: new Set()
    };

    Object.assign(this, defaultObj);
    Object.assign(this, options);
}

Model.SnapBasis = {
    BASIS_MIN: 'BASIS_MIN',
    BASIS_MAX: 'BASIS_MAX',
    BASIS_CENTER: 'BASIS_CENTER'
};

Model.Faces = {
    FRONT: 'FRONT',
    BACK: 'BACK',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
    TOP: 'TOP',
    BOTTOM: 'BOTTOM'
};

(() => {
    window.partProperties = {
        STATIONS: {
            BODY_STATION: {
                order: 0,
                internalName: 'body',
                dispName: 'Body Station',
                getPlayerPosition: () => GameObjects.GameTypes.MassProduction.positions.ASSEMBLER_BODY
            },
            WHEEL_AXLE_STATION: {
                order: 1,
                internalName: 'wheel-axle',
                dispName: 'Wheel and Axle Station',
                getPlayerPosition: () => GameObjects.GameTypes.MassProduction.positions.ASSEMBLER_WHEEL_AXLE
            },
            INTERIOR_STATION: {
                order: 2,
                internalName: 'interior',
                dispName: 'Interior Station',
                getPlayerPosition: () => GameObjects.GameTypes.MassProduction.positions.ASSEMBLER_INTERIOR
            },
        }
    };

    let stationList = window.partProperties.STATIONS;

    // Dictionary containing information about parts in the simulation.
    // It is structured as a dictionary to allow parts to be removed
    // without disrupting other parts; this also helps to make cross-
    // references between parts more clear (e.g. compatibleRims).
    window.partProperties.PARTS = {
        0: {
            name: '1x1',
            price: 0.07,
            weight: 0.45,
            model: new Model({filePath: '../objects/1x1.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION, stationList.INTERIOR_STATION]
        },
        1: {
            name: '1x3',
            price: 0.05,
            weight: 0.59,
            model: new Model({filePath: '../objects/1x3.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION, stationList.INTERIOR_STATION]
        },
        2: {
            name: '2x2',
            price: 0.14,
            weight: 1.15,
            model: new Model({filePath: '../objects/2x2.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION, stationList.INTERIOR_STATION]
        },
        3: {
            name: '2x2 Slope',
            price: 0.14,
            weight: 1.05,
            model: new Model({filePath: '../objects/2x2Slope.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION]
        },
        4: {
            name: '2x2 Pin',
            price: 0.15,
            weight: 0.70,
            model: new Model({filePath: '../objects/2x2wPin.stl', scale: 3, top: 1, bottom: 1, front: 1, collisionY: 5,
                snapOffsetBasisX: Model.SnapBasis.BASIS_CENTER, snapOffsetBasisZ: Model.SnapBasis.BASIS_CENTER,
                pinFaces: new Set([Model.Faces.LEFT, Model.Faces.RIGHT])
            }),
            stations: [stationList.WHEEL_AXLE_STATION]
        },
        5: {
            name: '2x3x2',
            price: 0.13, // temporary
            weight: 1.06, // temporary
            model: new Model({filePath: '../objects/2x3x2.stl', scale: 1.5, top: 1, bottom: 1, collisionX: 12, collisionY: 6}),
            stations: [stationList.BODY_STATION]
        },
        6: {
            name: '1x2 Pin',
            price: 0.05,
            weight: 0.83, // temporary
            model: new Model({filePath: '../objects/1x2wPin.stl', scale: 3, top: 1, bottom: 1, front: 1, collisionY: 5,
                pinFaces: new Set([Model.Faces.FRONT])
            }),
            stations: [stationList.WHEEL_AXLE_STATION]
        },
        7: {
            name: '1x2 Slope',
            price: 0.11,
            weight: 0.65,
            model: new Model({filePath: '../objects/1x2Slope.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION]
        },
        8: {
            name: '1x2 Inverted Slope',
            price: 0.11,
            weight: 0.70,
            model: new Model({filePath: '../objects/1x2InvertedSlope.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION]
        },
        9: {
            name: '2x2x1 Pin',
            price: 0.18,
            weight: 0.95,
            model: new Model({filePath: '../objects/2x2x1wPin.stl', scale: 3, top: 1, bottom: 1, front: 1, collisionY: 5,
                pinFaces: new Set([Model.Faces.RIGHT])
            }),
            stations: [stationList.WHEEL_AXLE_STATION]
        },
        10: {
            name: '2x2x2 Pin',
            price: 0.17,
            weight: 1.31, // temporary
            model: new Model({filePath: '../objects/2x2x2wPin.stl', scale: 3, top: 1, bottom: 1, front: 1, collisionY: 5,
                pinFaces: new Set([Model.Faces.RIGHT])
            }),
            stations: [stationList.WHEEL_AXLE_STATION]
        },
        11: {
            name: '2x2 Double',
            price: 0.29,
            weight: 1.4,
            model: new Model({filePath: '../objects/2x2Double.stl', scale: 3, top: 1, bottom: 1, front: 1, collisionY: 5,
                pinFaces: new Set([Model.Faces.LEFT, Model.Faces.RIGHT])
            }),
            stations: [stationList.WHEEL_AXLE_STATION]
        },
        18: {
            name: '1x2',
            price: 0.11,
            weight: 0.8,
            model: new Model({filePath: '../objects/1x2.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION, stationList.INTERIOR_STATION]
        },
        19: {
            name: '1x4',
            price: 0.15,
            weight: 1.5,
            model: new Model({filePath: '../objects/1x4.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION, stationList.INTERIOR_STATION]
        },
        20: {
            name: '1x2 Plate',
            price: 0.11,
            weight: 0.32, // temporary
            model: new Model({filePath: '../objects/1x2P.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION]
        },
        21: {
            name: '2x2 Plate',
            price: 0.11,
            weight: 0.60,
            model: new Model({filePath: '../objects/2x2P.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION]
        },
        22: {
            name: '4x6 Plate',
            price: 0.43,
            weight: 3.35,
            model: new Model({filePath: '../objects/4x6P.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION]
        },
        23: {
            name: '4x10 Plate',
            price: 0.54,
            weight: 5.40,
            model: new Model({filePath: '../objects/4x10P.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION]
        },
        24: {
            name: '2x8 Plate',
            price: 0.25,
            weight: 2.25,
            model: new Model({filePath: '../objects/2x8P.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION]
        },
        25: {
            name: '2x6 Plate',
            price: 0.19,
            weight: 1.70,
            model: new Model({filePath: '../objects/2x6P.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION]
        },
        26: {
            name: '6x8 Plate',
            price: 0.67,
            weight: 6.63, // temporary
            model: new Model({filePath: '../objects/6x8P.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION]
        },
        27: {
            name: '2x10 Plate',
            price: 0.25,
            weight: 2.8,
            model: new Model({filePath: '../objects/2x10P.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION]
        },
        28: {
            name: 'Windshield',
            price: 0.38,
            weight: 2.5,
            model: new Model({filePath: '../objects/windshield.stl', scale: 3, top: 1, bottom: 1, collisionY: 5}),
            stations: [stationList.BODY_STATION]
        },
        29: {
            name: 'Steering Wheel',
            price: 0.29,
            weight: 0.6,
            model: new Model({filePath: '../objects/steering.stl', scale: 3, bottom: 1, snapOffsetBasisX: Model.SnapBasis.BASIS_MIN, snapOffsetBasisZ: Model.SnapBasis.BASIS_MAX}),
            stations: [stationList.INTERIOR_STATION]
        },
        30: {
            name: 'Lego Man',
            price: 1.00,
            weight: 3.47, // temporary
            model: new Model({filePath: '../objects/lego_man.stl', scale: 3, bottom: 1, collisionY: 5, snapOffsetBasisX: Model.SnapBasis.BASIS_CENTER, snapOffsetBasisZ: Model.SnapBasis.BASIS_MAX}),
            stations: [stationList.INTERIOR_STATION]
        },
        31: {
            name: 'Small Hard Wheel',
            price: 0.29,
            weight: 1.3,
            model: new Model({filePath: '../objects/SmallestWheelAOP.fbx', scale: 4.8, front: 1, back: 1, rotationX: Math.PI / 2.0, pinConnectableFaces: new Set([Model.Faces.BACK])}),
            stations: [stationList.WHEEL_AXLE_STATION]
        },
        32: {
            name: 'Small Soft Rim',
            price: 0.20,
            weight: 0.25,
            model: new Model({filePath: '../objects/rim2.stl', scale: 3, back: 1, tireConnectableFaces: new Set([Model.Faces.FRONT, Model.Faces.BACK]),
                pinConnectableFaces: new Set([Model.Faces.BACK])
            }),
            stations: [stationList.WHEEL_AXLE_STATION]
        },
        33: {
            name: 'Small Soft Tire',
            price: 0.15,
            weight: 0.65,
            model: new Model({filePath: '../objects/tire2.stl', scale: 3, front: 1, back: 1, compatibleRims: new Set([32]),
                rimConnectableFaces: new Set([Model.Faces.FRONT, Model.Faces.BACK])
            }),
            stations: [stationList.WHEEL_AXLE_STATION]
        },
        34: {
            name: 'Large Soft Rim',
            price: 0.20,
            weight: 0.25,
            model: new Model({filePath: '../objects/BigWheelRim.fbx', scale: 3, back: 1, rotationX: Math.PI / 2.0, tireConnectableFaces: new Set([Model.Faces.FRONT, Model.Faces.BACK]),
                pinConnectableFaces: new Set([Model.Faces.BACK])
            }),
            stations: [stationList.WHEEL_AXLE_STATION]
        },
        35: {
            name: 'Large Soft Tire',
            price: 0.15,
            weight: 0.65,
            model: new Model({filePath: '../objects/BigWheelTire.fbx', scale: 3, front: 1, back: 1, rotationX: Math.PI / 2.0,
                compatibleRims: new Set([34]), rimConnectableFaces: new Set([Model.Faces.FRONT, Model.Faces.BACK])
            }),
            stations: [stationList.WHEEL_AXLE_STATION]
        }
    };

    partProperties.totalPartCost = function(qtyObj)
    {
        let totalCost = 0;
        Object.keys(qtyObj).forEach((partID) => {
            totalCost += (qtyObj[partID] * window.partProperties.PARTS[partID].price);
        });

        return totalCost;
    };

    partProperties.totalPartWeight = function(qtyObj)
    {
        let totalWeight = 0;
        Object.keys(qtyObj).forEach((partID) => {
            totalWeight += (qtyObj[partID] * window.partProperties.PARTS[partID].weight);
        });

        return totalWeight;
    };

    partProperties.getPartIDsByStation = function(stationOrder)
    {
        return Object.keys(window.partProperties.PARTS).map(value => parseInt(value))
            .filter(partID => window.partProperties.PARTS[partID].stations.some(thisStation => thisStation.order === stationOrder));
    }
})();
