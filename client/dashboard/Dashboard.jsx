import { Component, PropTypes } from 'react';
import {getAllClips} from '../actions/clips';
import {getAllMusic} from '../actions/music';
import {postState, getStateById} from '../actions/state';
import BufferLoader from '../util/buffer_loader'
import shortid from 'shortid';
import './less/Dashboard.less';

export default class Dashboard extends Component {
  constructor(props){
    super(props);
    console.log('dashboard');
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    let ctx = new AudioContext();

    this.state = {
      clips: [],
      imported:[],
      music: [],
      board: {},
      generatedUrl: '',
      bufferLoader: new BufferLoader(ctx),
      context : ctx
    };
  }
  componentDidMount(){
    this.getClips();
    this.getMusic();
    if (this.props.location.query.trak) {
      this.getState(this.props.location.query.trak);
    }
  }
  componentDidUpdate(){
    $('.clip-info').draggable({ axis: "x", containment: "parent" });
    $.contextMenu({
      selector: '.imported-item-name',
      callback:this.onImportDeleteClick.bind(this),
      items: {
          "delete": {name: "Delete", icon: "fa-trash-o"},
      }
    });
    $.contextMenu({
      selector: '.clip-info',
      callback: this.onClipDeleteClick.bind(this),
      items: {
          "delete": {name: "Delete", icon: "fa-trash-o"},
      }
    });
  }

  // BEGIN UTIL FUNCTIONS
  createSource(clip) {
    if (!this.state.bufferLoader.bufferList[clip.pseudonym]) {
      console.log('Attemptted to create a source from an audio' +
      'clip that was not loaded into the buffer.');
      return;
    }

    let source = this.state.context.createBufferSource();
    source.buffer = this.state.bufferLoader.bufferList[clip.pseudonym];
    source.connect(this.state.context.destination);
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
    this.setState({ imported: state.data.imported });

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
        $.extend(true,c, clipinfo);
        c.clip.position = $(`#${clipinfo.clip.clipId}`).css('left');
        board[row].push(c);
      });
    }
    let data = {
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
      clipId : shortid.generate()
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
      clipsInCurrentRow = this.state.board[clip.boardId]
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
          <button type="button" className="btn btn-danger" onClick={this.onStopClick.bind(this)}><i className="fa fa-stop"></i> Stop </button>
          <button type="button" className="btn btn-success" onClick={this.onPlayClick.bind(this)}><i className="fa fa-play" aria-hidden="true"></i> Play </button>
        </div>
        {
          this.state.imported.length < 1 ?
          <div className="empty-board-title"> Add Clips or Music To Generate A Sound Board </div>
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
          <button type="button" className="btn btn-primary google" onClick={this.onGenerateShareClick.bind(this)}><i className="fa fa-google" aria-hidden="true"></i> </button>
          <button type="button" className="btn btn-primary twitter" onClick={this.onGenerateShareClick.bind(this)}><i className="fa fa-twitter" aria-hidden="true"></i> </button>
          <button type="button" className="btn btn-primary facebook" onClick={this.onGenerateShareClick.bind(this)}><i className="fa fa-facebook" aria-hidden="true"></i> </button>
          <button type="button" className="btn btn-primary link" onClick={this.onGenerateShareClick.bind(this)}><i className="fa fa-share" aria-hidden="true"></i> </button>
        </div>
      </div>

      <div className="url-pop-up">
        <span className="close-btn" onClick={this.onUrlCloseClick.bind(this)}><i className="fa fa-window-close"></i></span>
        <input type="textbox" value={this.state.generatedUrl} />
      </div>
    </div>
    )
  }
}

Dashboard.contextTypes = {
  store: PropTypes.object.isRequired
};
