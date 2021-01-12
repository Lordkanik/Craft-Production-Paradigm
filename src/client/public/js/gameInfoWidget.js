(function($) {
    const VERTICAL_WIDGET_HTML = `
        <div class="ui celled centered grid game-info-widget-grid game-info-widget-grid-vertical">
            <div class="row group-name-vertical">
                <div class="ui centered grid group-name-grid">
                    <p class="game-info-header-text">Group:</p>
                    <p class="group-name-text"></p>
                </div>
            </div>
            <div class="row player-name-vertical">
                <div class="ui centered grid player-name-grid">
                    <p class="game-info-header-text">Player:</p>
                    <p class="player-name-text"></p>
                </div>
            </div>
        </div>
    `;

    const HORIZONTAL_WIDGET_HTML = `
        <div class="ui celled grid game-info-widget-grid game-info-widget-grid-horizontal">
            <div class="row">
                <div class="column group-name-horizontal">
                    <div class="ui centered grid group-name-grid">
                        <p class="game-info-header-text">Group:</p>
                        <p class="group-name-text"></p>
                    </div>
                </div>
                <div class="column player-name-horizontal">
                    <div class="ui centered grid player-name-grid">
                        <p class="game-info-header-text">Player:</p>
                        <p class="player-name-text"></p>
                    </div>
                </div>
            </div>
        </div>
    `;

    $.gameInfo = {
        Orientation: {
            HORIZONTAL: 'Horizontal',
            VERTICAL: 'Vertical'
        }
    };
    
    $.fn.gameInfo = function(widgetOptions) {
        widgetOptions = $.extend({
            positionName: undefined,
            orientation: $.gameInfo.Orientation.VERTICAL
        }, widgetOptions);

        let nodeSet = this;
        nodeSet.addClass('game-info-widget');
        nodeSet.addClass(widgetOptions.orientation === $.gameInfo.Orientation.HORIZONTAL ? 'game-info-widget-horizontal' : 'game-info-widget-vertical');
        nodeSet.append($(widgetOptions.orientation === $.gameInfo.Orientation.HORIZONTAL ? HORIZONTAL_WIDGET_HTML : VERTICAL_WIDGET_HTML));

        function attemptLoad()
        {
            GameAPI.getGameInfo().then((info) => {
                let playerName = GameAPI.getPlayerName(info, widgetOptions.positionName);

                switch (playerName) {
                    case undefined:
                        playerName = '<Unknown>';
                        break;
                    case '':
                        playerName = '<Anonymous player>';
                        break;
                }

                nodeSet.find('.group-name-text').text(info.groupName);
                nodeSet.find('.player-name-text').text(playerName);
            }).catch(errorInfo => {
                console.error(errorInfo);
                setTimeout(attemptLoad, 10000);
            });
        }

        attemptLoad();
    };
})(jQuery);