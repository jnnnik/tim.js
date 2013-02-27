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

    /**
     * Initialize Tim
     * To be called on page load
     */
    function init()
    {
        // Init collections
        steps = {};
        boxRefs = {};

        // The table itself
        var seqTable = document.createElement('table');
        // ID for css reasons
        // TODO: do this differently
        seqTable.id = 'timseq';

        // The first (indicator) row
        var firstRow = document.createElement('tr');
        firstRow.appendChild(document.createElement('td'));

        for(var step = 0; step < config.steps; step ++) {
            boxRefs[step] = {};
            // Init steps array for each column
            steps[step] = [];
            // Single grid column, first row
            var rowStep = document.createElement('td');
            // Yay, filler content
            rowStep.innerHTML = '&nbsp;';
            firstRow.appendChild(rowStep);
            indicatorRefs[step] = rowStep;

            for (var note = config.bottomNote; note < config.noteRange+config.bottomNote; note++) {
                // Prefill... with nothing
                boxRefs[step][note] = null;
            }
        }

        // Adding the first row
        seqTable.appendChild(firstRow);

        // Create all the other columns
        for (var y=config.noteRange; y >= 0; y--) {
            var row = document.createElement('tr');
            // This is where the "Piano Roll" effect comes in
            if(MIDI.noteToKey[config.bottomNote+y] && MIDI.noteToKey[config.bottomNote+y].match('b')) row.className = 'flat';

            var keyName = document.createElement('td');
            keyName.innerHTML = MIDI.noteToKey[config.bottomNote+y];

            row.appendChild(keyName);

            for (var x= 0; x < config.steps; x++) {
                var column = document.createElement('td');

                // Wicked onclick magic
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

        // And create all the other elements
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

        var seqDiv = document.getElementById('sequencer');

        // Finally, append 'em
        seqDiv.appendChild(seqTable);
        seqDiv.appendChild(playBtn);
        seqDiv.appendChild(stopBtn);
    }

    /**
     * Play the programmed sequence
     */
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

    /**
     * Try desperately to stop playback
     * TODO: stop being desperate
     */
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

    /**
     * Toggle a note on/off on a given step
     */
    function toggleNote(step, note)
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

    /**
     * Shortcut for MIDI.noteOn with default values 0 and 127
     * TODO: velocity and whatever the first value was again
     */
    function playNote(note, delay)
    {
        MIDI.noteOn(0, note, 127, delay);
    }

    /**
     * Clear all the indicator columns in the first row
     * TODO: Shouldn't be necessary, be more specific
     */
    function resetDisplaySteps()
    {
        for(var i in indicatorRefs) {
            indicatorRefs[i].style.backgroundColor = '#FFF';
        }
    }

    /**
     * Move the step indicator one step closer (to the edge, and I'm about to BREAK)
     */
    function nextDisplayStep()
    {
        resetDisplaySteps();
        indicatorRefs[currentDisplayStep].style.backgroundColor = '#000';
        currentDisplayStep++;
        if(currentDisplayStep == config.steps) currentDisplayStep = 0;
    }

    /**
     * Interval for the step-indicator
     */
    var stepInterval = null;

    /**
     * Timeout for re-triggering of play after a bar has played
     * TODO: Figure out a way to make more consistent with slow BPMs
     */
    var playTimeout = null;

    /**
     * This is where the notes are saved
     */
    var steps = {};

    /**
     * Collection of DOM references for the step-indicator 
     */
    var indicatorRefs = {};

    /**
     * Collection of DOM references for the grid
     */
    var boxRefs = {};

    /**
     * Self-explanatory play vars
     */
    var currentDisplayStep = 0;
    var playing = false;
    var notesToPlay = [];

    /**
     * Global config
     * TODO: make dynamic inputs which trigger a reload of the grid when applied
     */
    var config =
    {
        steps: 32,
        noteRange: 17,
        bottomNote: 44,
        bpm: 240
    }

    return {"init": init}
})();
