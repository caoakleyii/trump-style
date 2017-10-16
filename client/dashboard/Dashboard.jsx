import { Component, PropTypes } from 'react';
import {getAllClips} from '../actions/clips';
import {getAllMusic} from '../actions/music';
import {postState, getStateById} from '../actions/state';
import BufferLoader from '../util/buffer_loader'
import Slider from 'bootstrap-slider';
import shortid from 'shortid';
import './less/Dashboard.less';


export default class Dashboard extends Component {
  constructor(props){
    super(props);

    //safari support
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    let ctx = new AudioContext();

    this.state = {
      gain: 1,
      clips: [],
      imported:[],
      music: [],
      board: {},
      generatedUrl: '',
      bufferLoader: new BufferLoader(ctx),
      context : ctx,
      slider: undefined,
      showClipSlider: false
    };

  }
  componentDidMount(){
    this.getClips();
    this.getMusic();
    if (this.props.location.query.trak) {
      this.getState(this.props.location.query.trak);
    }

    // bind components to ui elements
    $(document).on('click', this.closeClipGain.bind(this));
    $(document).on('contextmenu', this.closeClipGain.bind(this));

    let slider = new Slider('#mainVolumeControl', {
      tooltip_position: 'bottom',
      formatter: v => { return `Gain ${Math.ceil(v*100)}%`}
    });

    slider.on('slide', this.onChangeMainVolumeSlide.bind(this));
  }
  componentDidUpdate(){
    // bind components to any new ui elements
    $('.clip-info').draggable({ axis: "x", containment: "parent" });
    $('.clip-gain-box .slider-handle').on('click', e => { e.stopPropagation(); });
    $.contextMenu({
      selector: '.imported-item-name',
      items: {
          "delete": {name: "Delete", icon: "fa-trash-o", callback: this.onImportDeleteClick.bind(this)},
      }
    });
    $.contextMenu({
      selector: '.clip-info',
      items: {
          "gain" : {name: "Gain", icon: "fa-volume-up", callback: this.onClipGainClick.bind(this)},
          sep: "---------",
          "delete": {name: "Delete", icon: "fa-trash-o", callback: this.onClipDeleteClick.bind(this)}
      }
    });
  }

  // BEGIN UTIL FUNCTIONS
  changeVolumeOfSource(source) {
    console.log(source);

  }
  createSource(clip) {
    if (!this.state.bufferLoader.bufferList[clip.pseudonym]) {
      console.log('Attempted to create a source from an audio' +
      'clip that was not loaded into the buffer.');
      return;
    }
    console.log('gain: ', clip.gain);
    let volume = clip.gain * this.state.gain;
    let source = this.state.context.createBufferSource();
    let gainNode = this.state.context.createGain();
    source.buffer = this.state.bufferLoader.bufferList[clip.pseudonym];
    gainNode.gain.value = volume;
    gainNode.connect(this.state.context.destination);
    source.connect(gainNode);
    source.gainNode = gainNode;
    source.onended = this.onSourceEnd.bind(this, clip);
    return source;
  }
  getClips(){
      let {store} = this.context;
      store.dispatch(getAllClips())
      .then(this.loadClips.bind(this))
      .catch(e => {
        console.log(e);
      });
  }
  loadClips() {
    let clips = [];
    Object.assign(clips, this.context.store.getState().entities.clips);
    this.setState({ clips });
  }
  getMusic() {
    let { store } = this.context;
    store.dispatch(getAllMusic())
    .then(this.loadMusic.bind(this))
    .catch(e => {
      console.log(e);
    });
  }
  loadMusic() {
    let music = [];
    Object.assign(music, this.context.store.getState().entities.music);
    music.forEach(x => {
      x.music = true;
    });

    this.setState({ music });
  }
  getState(stateId) {
    let { store } = this.context;
    store.dispatch(getStateById(stateId))
    .then(this.loadState.bind(this, stateId))
    .catch(e => {
      console.log(e);
    });
  }
  loadState(stateId) {
    let state = this.context.store.getState().entities.states.find(s => { return s.pseudonym == stateId });
    this.setState({ imported: state.data.imported, gain: state.data.gain });

    for(var row in state.data.board) {
      state.data.board[row].forEach((clipinfo => {
        this.state.bufferLoader.load(clipinfo.clip, this.finishedLoadingBuffer.bind(this));
      }).bind(this));
    }
  }
  saveState(callback) {
    let {store} = this.context;
    // gather position of each clip
    let board = {};
    for(var row in this.state.board){
      board[row] = [];
      this.state.board[row].forEach(clipinfo => {
        let c = {};
        $.extend(true, c, clipinfo);
        c.clip.position = $(`#${clipinfo.clip.clipId}`).css('left');
        board[row].push(c);
      });
    }
    let data = {
      gain: this.state.gain,
      imported: this.state.imported,
      board,
      bufferList: this.state.bufferLoader.bufferList
    };

    if(!callback) {
      callback = function(){};
    }
    store.dispatch(postState(data))
      .then(callback.bind(this))
      .catch(e => {
        console.log(e);
      });
  }
  closeClipGain(e) {
    if (this.state.showClipSlider)  {
      this.setState({ showClipSlider: false})
      return;
    }
    if (this.state.slider){
      this.state.slider.destroy();
      $('.clip-gain-box').hide();
      this.setState({slider: undefined});
    }
  }
  // END UTIL FUNCTIONS

  // BEGIN CALL BACKS
  finishedLoadingBuffer(clip) {
    let source = this.createSource(clip);
    let rowOfClips = [];

    // if the current row in the board doesn't have any clips in it, create an
    // array and add the current clip info and source
    if (!this.state.board[clip.boardId]) {
      rowOfClips.push({
          source,
          clip
        });
    } else {
      // else copy the array, add this new clip
      rowOfClips = [...this.state.board[clip.boardId]];
      rowOfClips.push({
        source,
        clip
      });
    }

    let board = {};
    Object.assign(board, this.state.board);
    board[clip.boardId] = rowOfClips;
    this.setState({ board });
  }

  stateSaved() {
    let savedId = this.context.store.getState().entities.state_id;
    let generatedUrl = location.origin + `?trak=${savedId}`;
    this.setState({ generatedUrl });
  }

  popUpFacebook() {
    let savedId = this.context.store.getState().entities.state_id;
    let generatedUrl = `${location.origin}?trak=${savedId}`;
    window.open(`https://www.facebook.com/sharer.php?u=${generatedUrl}`, '_blank', 'height=250,width=650');
  }
  popupTwitter(){
    let savedId = this.context.store.getState().entities.state_id;
    let generatedUrl = `${location.origin}?trak=${savedId}`;
    window.open(`https://twitter.com/share?url=${generatedUrl}`, '_blank', 'height=250,width=650');
  }
  popupGoogle(){
    let savedId = this.context.store.getState().entities.state_id;
    let generatedUrl = `${location.origin}?trak=${savedId}`;
    window.open(`https://plus.google.com/share?url=${generatedUrl}`, '_blank', 'height=250,width=650');
  }
  // END CALL BACKS

  // BEGIN EVENT HANDLERS
  onSourceEnd(clip) {
    let index = -1;
    this.state.board[clip.boardId].forEach((info, i) => {
      if (info.clip.clipId == clip.clipId) {
        index = i
      }
    });
    if (index != -1) {
      this.state.board[clip.boardId][index].source = this.createSource(clip);
    }
  }
  onPlayClick () {
    this.onStopClick();
    for (var key in this.state.board) {
      this.state.board[key].forEach(x => {
        let time = Math.abs($(`#${x.clip.clipId}`).offset().left - $('.board-row').offset().left) / 30;
        x.source.start(this.state.context.currentTime + time);
      })
    }
  }
  onStopClick() {
    for (var key in this.state.board) {
      this.state.board[key].forEach(x => {
        try {
          x.source.stop();
        } catch(err) { }
      });
    }
  }
  onChangeMainVolumeSlide(value) {
    for(var row in this.state.board) {
      this.state.board[row].forEach(clipinfo => {
        clipinfo.source.gainNode.gain.value = value;
      });
    }

    this.setState({ gain: value});
  }
  onChangeClipVolume(clip, source, value) {
    if(!source){
      return
    }
    clip.gain = value;
    source.gainNode.gain.value = value;
  }
  onImportDeleteClick(key, options){
    let boardId = options.$trigger.attr('id');
    let board = {};

    $.extend(true, board, this.state.board);
    delete board[boardId];

    let imported = [...this.state.imported];
    this.state.imported.forEach((clip, i) => {
      if (clip.boardId == boardId) {
        imported.splice(i, 1);
        return;
      }
    });

    this.setState({ board, imported });
  }
  onClipGainClick(key, options){
    this.closeClipGain();

    let position = options.$menu.position();
    $('.clip-gain-box').css(position);

    let clipId = options.$trigger.attr('id');
    let source;
    let clip;
    // find source volume for the gain being adjusted
    for (var row in this.state.board) {
      let clipInfo = this.state.board[row].find(c => { return c.clip.clipId == clipId});
      if (clipInfo) {
        clip = clipInfo.clip;
        source = clipInfo.source;
        break;
      }
    }

    if(!source || !clip) {
      return;
    }
    // create slider
    let slider = new Slider('#clipGainSlider', {
      tooltip_position: 'bottom',
      formatter: v => { return `Gain ${Math.ceil(v*100)}%`},
      reversed: true,
      value: clip.gain
    });
    slider.on('slide', this.onChangeClipVolume.bind(this, clip, source));

    // display slider
    $('.clip-gain-box').show();

    this.setState({ slider, showClipSlider: true });
  }
  onClipDeleteClick(key, options) {
    let clipId = options.$trigger.attr('id');
    let board = {};
    for (var key in this.state.board) {
      this.state.board[key].forEach((obj, i) => {
        if (obj.clip.clipId == clipId) {
          $.extend(true, board, this.state.board);
          board[key].splice(i, 1);
        }
      })
    }
    this.setState({ board });
  }
  onAddToBoardClick(clip, e) {
    e.stopPropagation();
    let c = {
      clipId : shortid.generate(),
      gain : 1
    };
    Object.assign(c, clip);
    this.state.bufferLoader.load(c, this.finishedLoadingBuffer.bind(this));
  }
  onPreviewClick(clip, e) {
    e.stopPropagation();
    let audio = new Audio(`/clips/${clip.fileName}`);
    audio.play();

  }
  onImportClipClick(clip){
    let imported = [...this.state.imported];
    let importedClip = { boardId : shortid.generate() };

    Object.assign(importedClip, clip);

    imported.push(importedClip);

    this.setState({ imported });
  }
  onTextChange(e){
    this.setState({filter: $(e.currentTarget).val() });
  }
  onDrawerClick(){
    let closed = $('.drawer').hasClass('slide-out');
    if (closed){
      $('.drawer').addClass('slide-in');
      $('.drawer').removeClass('slide-out');

    } else {
      $('.drawer').addClass('slide-out');
      $('.drawer').removeClass('slide-in');
    }
  }
  onGooglePlusShareClick(e){
    this.saveState(this.popupGoogle.bind(this));
  }
  onTwitterShareClick(e) {
    this.saveState(this.popupTwitter.bind(this));
  }
  onFacebookShareClick(e) {
    this.saveState(this.popUpFacebook.bind(this));
  }
  onGenerateShareClick(e) {
    this.saveState(this.stateSaved.bind(this));
    $('.url-pop-up').show();
  }
  onUrlCloseClick(e){
    e.stopPropagation();
    $('.url-pop-up').hide();
  }
  // END EVENT HANDLERS

  // BEGIN MAP FUNCTIONS
  mapClips(clip, index){
    return(
      <div key={index} className="drawer-item" onClick={this.onImportClipClick.bind(this, clip)}>
        <span className="drawer-item-preview" onClick={this.onPreviewClick.bind(this, clip)}>
          <i className="fa fa-volume-up" aria-hidden="true"></i>
        </span>
        {clip.name}
      </div>
    )
  }
  mapMusic(music, index){
    return (
      <li key={index} onClick={this.onImportClipClick.bind(this, music)}>
        {music.name}
      </li>
    )
  }
  mapImported(clip, index) {
    return(
      <div key={index} className="imported-item" onClick={this.onPreviewClick.bind(this,clip)} >
        <span className="imported-item-name" id={clip.boardId}>
          {clip.name}
        </span>
        <span className="add-clip-to-board">
          <i className="fa fa-plus-circle" aria-hidden="true" onClick={this.onAddToBoardClick.bind(this,clip)}></i>
        </span>
      </div>
    )
  }
  mapImportedToBoard(clip, index) {
    let clipsInCurrentRow = [];
    if (this.state.board[clip.boardId] instanceof Array) {
      clipsInCurrentRow = this.state.board[clip.boardId];
    }
    return (
      <div key={index} className="board-row">
        { clipsInCurrentRow.map(this.mapBoardRowClips.bind(this)) }
      </div>
    )
  }
  mapBoardRowClips(clipInfo, index) {
    let style =  {
      width: `${clipInfo.source.buffer.duration * 30}px`
    };
    if (clipInfo.clip.position) {
      style.left = clipInfo.clip.position;
    }
    return (
      <div id={clipInfo.clip.clipId} key={index} className="clip-info" style={style}>

      </div>
    )
  }
  // END MAP FUNCTIONS
  render() {
    return (
    <div className="dashboard">
      <div className="drawer">
        <div className="hamburger" onClick={this.onDrawerClick.bind(this)}>
          <i className="fa fa-bars"></i>
        </div>
        <div className="search-box">
          <input className="search-box-input" type="text" placeholder="Search..." onChange={this.onTextChange.bind(this)} />
        </div>
        {  this.state.filter ? this.state.clips.filter(x => x.name.toLowerCase().includes(this.state.filter.toLowerCase())).map(this.mapClips.bind(this)) :
          this.state.clips.map(this.mapClips.bind(this)) }
      </div>

      <div className="scene">
        <div className="mixboard-interface-row">
          <div className="dropdown music-list">
            <button className="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown"> <span className="caret"></span> Music </button>
            <ul className="dropdown-menu">
              { this.state.music.map(this.mapMusic.bind(this)) }
            </ul>
          </div>
          <div className="volume-control">
            <input id="mainVolumeControl" type="text" data-slider-handle="custom" data-slider-min="0" data-slider-max="2" data-slider-step=".01" data-slider-value={this.state.gain} />
          </div>
          <button type="button" className="btn btn-danger" onClick={this.onStopClick.bind(this)}><i className="fa fa-stop"></i> Stop </button>
          <button type="button" className="btn btn-success" onClick={this.onPlayClick.bind(this)}><i className="fa fa-play" aria-hidden="true"></i> Play </button>
        </div>
        {
          this.state.imported.length < 1 ?
          <div className="empty-board-title"> Add Clips or Music To Get Started </div>
          :
          <div className="row">
            <div className="imported col-md-3 col-xs-1">
                { this.state.imported.map(this.mapImported.bind(this)) }
            </div>
            <div className="board col-md-9 col-xs-11">
               { this.state.imported.map(this.mapImportedToBoard.bind(this)) }
            </div>
          </div>
        }
        <div className="share-row">
          <button type="button" className="btn btn-primary google" onClick={this.onGooglePlusShareClick.bind(this)}><i className="fa fa-google" aria-hidden="true"></i> </button>
          <button type="button" className="btn btn-primary twitter" onClick={this.onTwitterShareClick.bind(this)}><i className="fa fa-twitter" aria-hidden="true"></i> </button>
          <button type="button" className="btn btn-primary facebook" onClick={this.onFacebookShareClick.bind(this)}><i className="fa fa-facebook" aria-hidden="true"></i> </button>
          <button type="button" className="btn btn-primary link" onClick={this.onGenerateShareClick.bind(this)}><i className="fa fa-share" aria-hidden="true"></i> </button>
        </div>
      </div>

      <div className="url-pop-up">
        <span className="close-btn" onClick={this.onUrlCloseClick.bind(this)}><i className="fa fa-window-close"></i></span>
        <input type="textbox" value={this.state.generatedUrl} />
      </div>

      <div className="clip-gain-box">
        <input className="clip-volume-control" id="clipGainSlider" type="text" data-slider-handle="custom" data-slider-orientation="vertical" data-slider-min="0" data-slider-max="2" data-slider-step=".01" />
      </div>
    </div>
    )
  }
}

Dashboard.contextTypes = {
  store: PropTypes.object.isRequired
};
