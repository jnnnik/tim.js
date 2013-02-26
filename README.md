tim.js
======

Tiny little step sequencer in JavaScript using MIDI.js - https://github.com/mudcube/MIDI.js

Named after Tim Exile (you don't need to be a keynius...) and Tiny Tim

The code is horrible (this used to be an afternoon project) and hasn't been touched in ages, I just ripped out all of the socket.io / node.js dependencies real quick. tim.js used to be synchronized via socket.io so you could use it at the same time as a friend (or, potentially, hundreds of friends). However, that was just another afternoon project and while it worked, it was coded even more horribly. So I'm starting anew with the current state and will clean up and re-do parts before I re-add the whole socket stuff.

Current issue that stops this thing from being fully functional (for what it is): BPM text-field doesn't work. Too lazy right now. Maybe later.
