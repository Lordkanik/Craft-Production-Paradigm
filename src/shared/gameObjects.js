export let GameObjects = {
    GameTypes: {
        CraftProduction: {
            name: 'Craft Production',
            positions: {
                CUSTOMER: {
                    name: 'Customer',
                    getURL: pin => '/customer/' + pin
                },
                MANUFACTURER: {
                    name: 'Manufacturer',
                    getURL: pin => '/manufacturer/' + pin
                },
                SUPPLIER: {
                    name:'Supplier',
                    getURL: pin => '/supplier/' + pin
                },
                ASSEMBLER: {
                    name: 'Assembler',
                    getURL: pin => '/builder/' + pin
                }
            }
        },
        MassProduction: {
            name: 'Mass Production',
            positions: {
                MANUFACTURER: {
                    name: 'Manufacturer',
                    getURL: pin => '/manufacturer/' + pin
                },
                SUPPLIER: {
                    name:'Supplier',
                    getURL: pin => '/supplier/' + pin
                },
                ASSEMBLER_BODY: {
                    name: 'Assembler - Body',
                    getURL: pin => '/builder/' + pin + '#body'
                },
                ASSEMBLER_WHEEL_AXLE: {
                    name: 'Assembler - Wheel and Axle',
                    getURL: pin => '/builder/' + pin + '#wheel-axle'
                },
                ASSEMBLER_INTERIOR: {
                    name: 'Assembler - Interior',
                    getURL: pin => '/builder/' + pin + '#interior'
                }
            }
        }
    }
};

// Slightly ugly hack for client-side use (client-side code is not organized into modules)
if(typeof(window) !== 'undefined')
{
    window.GameObjects = GameObjects;
}