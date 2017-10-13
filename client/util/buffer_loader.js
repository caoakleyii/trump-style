export default class BufferLoader {
  constructor(context) {
    this.context = context;
    this.bufferList = new Array();
    this.loadCount = 0;
  }

  load(clip, callback) {

    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", `/clips/${clip.fileName}`, true);
    request.responseType = "arraybuffer";

    var loader = this;

    request.onload = function() {
      // Asynchronously decode the audio file data in request.response
      loader.context.decodeAudioData(
        request.response,
        function(buffer) {
          if (!buffer) {
            alert('Error decoding sound clip data: ' + url);
            return;
          }
          loader.bufferList[clip.pseudonym] = buffer;
          callback(clip);
        },
        function(error) {
          console.error('decodeAudioData error', error);
        }
      );
    }

    request.onerror = function() {
      alert('BufferLoader: XHR error');
    }

    request.send();
  }

  loadAll(clips, callback) {
    for (var i = 0; i < clips.length; ++i) {
      this.load(clip, this.loadAllCompleted.bind(this, clips.length, callback));
    }
  }

  loadAllCompleted(length, callback) {
    this.loadCount++;
    if (this.loadCount == length) {
      this.loadCount = 0;
      callback();
    }
  }


}
