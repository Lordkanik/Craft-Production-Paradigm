let currentTimer = 0;
let interval = 0;
let lastUpdateTime = new Date().getTime();
const start = document.getElementById('start');
const stop = document.getElementById('stop');
const reset = document.getElementById('reset');
const mins = document.getElementById('min');
const secs = document.getElementById('sec');
const cent = document.getElementById('cent');

$(document).ready(() => {
    begin();
});
    function begin () {
        start.addEventListener('click', startTimer);
        stop.addEventListener('click', stopTimer);
        reset.addEventListener('click', resetTimer);
    }

        function pad (n){
            return ('00' + n).substr(-2);
        }
        function updateTimer(){
            var now = new Date().getTime(),
                dt = now - lastUpdateTime;
            currentTimer += dt;
            var time = new Date(currentTimer);

            mins.innerHTML = pad(time.getMinutes());
            secs.innerHTML = pad(time.getSeconds());
            cent.innerHTML = pad(Math.floor(time.getMilliseconds()/10));

            lastUpdateTime = now;
        }
        function startTimer(){
            if (!interval){
                lastUpdateTime = new Date().getTime();
                interval = setInterval(updateTimer,1);
            }
        }
        function stopTimer(){
            clearInterval(interval);
            interval = 0;
        }
        function resetTimer(){
            stopTimer();
            currentTimer = 0;

            min.innerHTML = secs.innerHTML = cent.innerHTML = pad(0);
        }
