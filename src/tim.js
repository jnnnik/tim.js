var loader;
window.onload = function () {
	loader = new widgets.Loader;
	MIDI.loadPlugin({
		instruments: [ "acoustic_grand_piano" ], // or multiple instruments
		callback: function() {
			loader.stop();
			MIDI.programChange(0, 0);
			MIDI.programChange(1, 118);
            Tim.init();
		}
	});
};

var Tim = (function() {
    function init()
    {
        steps = {};
        boxRefs = {};

        var seqTable = document.createElement('table');
        seqTable.id = 'timseq';
        var firstRow = document.createElement('tr');
        firstRow.appendChild(document.createElement('td'));


        for(var step = 0; step < config.steps; step ++) {
            boxRefs[step] = {};
            // init steps
            steps[step] = [];
            var rowStep = document.createElement('td');
            rowStep.innerHTML = '&nbsp;';

            firstRow.appendChild(rowStep);
            indicatorRefs[step] = rowStep;
            for (var note = config.bottomNote; note < config.noteRange+config.bottomNote; note++) {
                boxRefs[step][note] = null;
            }
        }

        seqTable.appendChild(firstRow);

        for (var y=config.noteRange; y >= 0; y--) {
            var row = document.createElement('tr');
            if(MIDI.noteToKey[config.bottomNote+y] && MIDI.noteToKey[config.bottomNote+y].match('b')) row.className = 'flat';

            var keyName = document.createElement('td');
            keyName.innerHTML = MIDI.noteToKey[config.bottomNote+y];

            row.appendChild(keyName);

            for (var x= 0; x < config.steps; x++) {
                var column = document.createElement('td');

                column.onclick = (function(cX, cY) {
                    return function() {
                        toggleNote(cX + '', cY + '');
                    }
                })(x, y+config.bottomNote);

                boxRefs[x][y+config.bottomNote] = column;

                row.appendChild(column);
            }
            seqTable.appendChild(row);
        }

        var playBtn = document.createElement('input');
        playBtn.type = 'button';
        playBtn.onclick = function() { 
            if(playing) return; 
            playing=true;
            play(); 
        };
        playBtn.value = 'go';

        var stopBtn = document.createElement('input');
        stopBtn.type = 'button';
        stopBtn.onclick = stop;
        stopBtn.value = 'stahp';

        html = '<input type="text" id="bpm" maxlength="3" size="3"/>bpm';
        document.getElementById('sequencer').innerHTML = html;
        document.getElementById('bpm').value = config.bpm;
        document.body.appendChild(seqTable);
        document.body.appendChild(playBtn);
        document.body.appendChild(stopBtn);

    }

    function play()
    {
        notesToPlay = [];
        var delay = 0;
        var stepLength = 60/config.bpm;

        for(var i in steps) {
            for (var j= 0, k=steps[i].length; j<k; j++) {
                notesToPlay[notesToPlay.length] = steps[i][j];
                playNote(steps[i][j], delay);
            }
            delay += stepLength;
        }
        if(playing) playTimeout = setTimeout(play, delay*1000);
        clearInterval(stepInterval);
        currentDisplayStep = 0;
        stepInterval = setInterval(nextDisplayStep, stepLength * 1000);
        nextDisplayStep();
    }

    function stop()
    {
        playing = false;
        clearTimeout(playTimeout);
        clearInterval(stepInterval);
        stepInterval = null;
        currentDisplayStep = 0;
        resetDisplaySteps();
        for(var i=0, j=notesToPlay.length; i<j; i++) {
            MIDI.noteOff(0, notesToPlay[i], 0);
        }
    }

    function toggleNote(step, note, fromSocket)
    {
        removed = false;
        for(var i= 0, j=steps[step].length; i<j; i++) {
            if(steps[step][i] == note) {
                removed = true;
                steps[step].splice(i, 1);
            }
        }
        if(!removed) {
            steps[step][steps[step].length] = note;
            playNote(note);
        }

        boxRefs[step][note].className = removed ? '' : 'selected';
    }

    function playNote(note, delay)
    {
        MIDI.noteOn(0, note, 127, delay);
    }

    function resetDisplaySteps()
    {
        for(var i in indicatorRefs) {
            indicatorRefs[i].style.backgroundColor = '#FFF';
        }
    }

    function nextDisplayStep()
    {
        resetDisplaySteps();
        indicatorRefs[currentDisplayStep].style.backgroundColor = '#000';
        currentDisplayStep++;
        if(currentDisplayStep == config.steps) currentDisplayStep = 0;
    }

    var stepInterval = null;
    var playTimeout = null;
    var steps = {};
    var indicatorRefs = {};
    var boxRefs = {};
    var currentDisplayStep = 0;
    var playing = false;
    var playRemote = false;
    var notesToPlay = [];

    var config =
    {
        steps: 32,
        noteRange: 17,
        bottomNote: 44,
        bpm: 240
    }

    return {"play":play, "playing":playing, "stop":stop, "init": init, "toggleNote": toggleNote}
})();
