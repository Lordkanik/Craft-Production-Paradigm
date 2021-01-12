(function($) {
    const PART_IDS = Object.keys(partProperties.PARTS).map(value => parseInt(value)),
        COLS_PER_ROW = 4;
    let nextGridID = 0;

    function initArray(rootNode)
    {
        PART_IDS.forEach(thisPartID => {
            rootNode.data('partGrid.pieceOrder')[thisPartID] = 0;
            rootNode.data('partGrid.colors')[thisPartID] = BrickColors.defaultBrickColor.colorID;
        });
    }

    /**
     * Dynamically generate all the squares to add to a supply order
     * This would have been terrible to do by hand
     */
    function initGrid(rootNode)
    {
        let thisGridID = nextGridID;
        ++nextGridID;

        rootNode.addClass(`ui celled grid grid-${thisGridID}`);

        rootNode.data('partGrid.pieceOrder', {})
            .data('partGrid.colors', {});
        initArray(rootNode);

        let html = '<div class="row">';
        PART_IDS.forEach((thisPartID, index) => {
            if (index % COLS_PER_ROW === 0 && index > 0) {
                html += '</div><div class="row">';
            }

            html += '<div class="four wide column">';
            html += `<p align="left">${partProperties.PARTS[thisPartID].name}</p>`;
            html += `<p align="left">$${partProperties.PARTS[thisPartID].price.toFixed(2)} each</p>`;
            html += `<p align="left">${partProperties.PARTS[thisPartID].weight.toFixed(2)} grams</p>`;
            html += `<p> <img class = "piece" src= "/../images/Lego pieces/${partProperties.PARTS[thisPartID].name}.jpg"> </p>`;
            // Start off each piece with an order of 0
            html += `<div class="row"><div class="ui statistic"><div class="${thisPartID}-value value">0</div></div></div>`;
            html += `<div class="row picker"><input type="text" class="${thisPartID}-picker" value="${BrickColors.defaultBrickColor.RGBString}"/></div>`;
            // Adds the plus and minus buttons to each piece
            html += '<div class="row"><div class="ui icon buttons">' +
                `<button class="${thisPartID}-minus ui button"><i class="minus icon"></i></button>` +
                `<button class="${thisPartID}-plus ui button"><i class="plus icon"></i></button></div></div></div>`;
            // I want there to be vertical lines between each cube so I need to add a blank space
            // if (i + 1 >= partProperties.length / 4) html += '<div class="five wide column"></div>';
        });

        if(PART_IDS.length % COLS_PER_ROW !== 0)
        {
            html += '<div class="four wide column"></div>';
        }

        html += '</div>';

        rootNode.html(html);

        PART_IDS.forEach(thisPartID => {
            let num = '.' + thisPartID;
            rootNode.find(num + '-plus').click(e => {
                let currentNum = parseInt(rootNode.find(num + '-value').html());
                rootNode.find(num + '-value').html(currentNum < 10 ? ++currentNum : 10);
                rootNode.data('partGrid.pieceOrder')[thisPartID] = currentNum;
                // updateCostWeight();

                rootNode.trigger('partGrid.partAdd', {partID: thisPartID, currentCount: currentNum});
            });
            rootNode.find(num + '-minus').click(e => {
                let currentNum = parseInt(rootNode.find(num + '-value').html());
                rootNode.find(num + '-value').html(currentNum == 0 ? 0 : --currentNum);
                rootNode.data('partGrid.pieceOrder')[thisPartID] = currentNum;

                rootNode.trigger('partGrid.partRemove', {partID: thisPartID, currentCount: currentNum});

                // let partSum = 0;
                // Object.keys(pieceOrder).forEach((elem) => {
                //     partSum += pieceOrder[elem];
                // });
                // if(partSum <= 0)
                // {
                //     $('#send-supplier-order').addClass('disabled');
                // }
                // updateCostWeight();
            });

            (function (partID) {
                let thisPickerClass = thisGridID + '-' + partID + '-picker-container';

                rootNode.find('.' + partID + '-picker').spectrum({
                    showPalette: true,
                    showPaletteOnly: true,
                    showAlpha: true,
                    containerClassName: thisPickerClass,
                    palette: BrickColors.spectrumPalette,
                    color: BrickColors.defaultBrickColor.RGBString,
                    change: function (color) {
                        let activeElement = $('.' + thisPickerClass).find('.sp-thumb-el.sp-thumb-active');
                        rootNode.data('partGrid.colors')[partID] = BrickColors.allPaletteData[$(activeElement).closest('.sp-palette-row').index()][$(activeElement).index()].colorID;
                    },
                    show: function (color) {
                        let paletteBoxes = $('.' + thisPickerClass).find('.sp-thumb-el');
                        paletteBoxes.each(function (index, element) {
                            let colorInfo = BrickColors.allPaletteData[$(element).closest('.sp-palette-row').index()][$(element).index()];
                            $(element).attr('title', `${colorInfo.colorName} (${colorInfo.colorID})`);
                        });
                    }
                });
            })(thisPartID);
        });
    }

    function resetGrid(rootNode)
    {
        initArray(rootNode);
        rootNode.find('.value').text('0');

        PART_IDS.forEach((thisPartID) => {
            $('.' + thisPartID + '-picker').spectrum('set', BrickColors.defaultBrickColor.RGBString);
        });
    }

    $.fn.partGrid = function(operation) {
        switch(operation)
        {
            case undefined:
            case '':
                this.each((index, elem) => {
                    initGrid($(elem));
                });

                return this;
            case 'getCounts':
                return this.first().data('partGrid.pieceOrder');
            case 'getColors':
                return this.first().data('partGrid.colors');
            case 'reset':
                this.each((index, elem) => {
                    resetGrid($(elem));
                });

                return this;
            default:
                throw 'Invalid operation for partGrid';
        }
    };
})(jQuery);