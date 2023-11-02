import React, { useState } from "react";
import Video from "twilio-video";
// import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
// import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { faMicrophoneSlash } from "@fortawesome/free-solid-svg-icons";
import { faVideo } from "@fortawesome/free-solid-svg-icons";
import { faVideoSlash } from "@fortawesome/free-solid-svg-icons";
import { faPhoneSlash } from "@fortawesome/free-solid-svg-icons";
// import { faCommentDots } from "@fortawesome/free-solid-svg-icons";

const App = () => {
  const styles = {
    video: {
      display: "flex",
      flexWrap: "wrap",
    },
  };
  const params = window.location.search.split('room_name=')[1];
  console.log('room name', params);
  const [globalRoom, setGlobalRoom] = useState();
  const [muted, setMuted] = useState(false);
  const [quitVideo, setQuitVideo] = useState(false);
  const sendData = async () => {
    globalRoom.disconnect();
  };
  const muteAudio = () => {
    console.log(globalRoom.localParticipant.audioTracks);
    globalRoom.localParticipant.audioTracks.forEach(track => {
      track.track.disable();
    });
    setMuted(!muted);
  }
  const stopVideo = () => {
    globalRoom.localParticipant.videoTracks.forEach(track => {
      track.track.disable();
      setQuitVideo(!quitVideo);
    });
  }
  const playAudio = () => {
    globalRoom.localParticipant.audioTracks.forEach(track => {
      track.track.enable();
      setMuted(!muted);
    });
  }
  const startVideo = () => {
    globalRoom.localParticipant.videoTracks.forEach(track => {
      track.track.enable();
      setQuitVideo(!quitVideo);
    });
  }
  const startRoom = async (event) => {
    // prevent a page reload when a user submits the form
    event.preventDefault();
    // hide the join form
    document.getElementById("room-name-form").style.display = "flex";
    
    try {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNjk4OTg3ODA2LCJpYXQiOjE2OTg5MDE0MDYsImp0aSI6ImY3YzUwMDgxNDhiMTQzMTM5YWVhMmU0MDI3MGUzOWUyIiwidXNlcl9pZCI6MX0.Tss9UDRtc9JHEYQzf9QtqLoWYtRXPy4xObfiT7NRgEY");
    
    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
    const responsePromise =await fetch("https://teleconsultation.niraginfotech.info/doctor/create_video_room?room_name=" +
    params, requestOptions);
    const response = await responsePromise.text();
    console.log('response', JSON.parse(response));
    const { token, room_name } = JSON.parse(response);
    // join the video room with the token
    // const token = 'eyJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIiwidHlwIjoiSldUIn0.eyJqdGkiOiJTS2Q0YTUzZjg5MTE0ZWVlOWU4ZWJkZDI2MjAwZDAyYmRlLTE2OTg4NTMxMjQiLCJncmFudHMiOnsidmlkZW8iOnsicm9vbSI6IjgzZTI2MjIwMDc4ZCJ9LCJpZGVudGl0eSI6IjM2NzU5OTc1LTQwMjItNGI0MS1hOTk2LWRiNTVlMjllNWUwYyJ9LCJpc3MiOiJTS2Q0YTUzZjg5MTE0ZWVlOWU4ZWJkZDI2MjAwZDAyYmRlIiwiZXhwIjoxNjk5NTQ0MzI0LCJuYmYiOjE2OTg4NTM1MDAsInN1YiI6IkFDOWMwMGI1NjIzMjA2NzQyMDdmN2FmZWQ4NGQ5YzNkN2IifQ.9NMmHFnrJcfpMjzw_W5VH4bJiZl-_PoMOJwhapOep1U';
    // const room_name = '83e26220078d';
    const room = await joinVideoRoom(room_name, token);
    setGlobalRoom(room);
    handleConnectedParticipant(room.localParticipant);
    room.participants.forEach(handleConnectedParticipant);
    room.on("participantConnected", handleConnectedParticipant);

    // handle cleanup when a participant disconnects
    room.on("participantDisconnected", handleDisconnectedParticipant);
    const theDate = new Date().getTime();
    let updatedDate = theDate;
    setInterval(() => {
      if(updatedDate > theDate +15*60000){
        room.disconnect();
      } else {
        updatedDate = updatedDate +1*60000;
      }
    }, 60000);
    window.addEventListener("pagehide", () => room.disconnect());
    window.addEventListener("beforeunload", () => room.disconnect());
    } catch(e) {
      console.log(e);
    }
  };

  const handleConnectedParticipant = (participant) => {
    // create a div for this participant's tracks
    const participantDiv = document.createElement("div");
    participantDiv.setAttribute("id", participant.identity);
    document.getElementById("video-container").appendChild(participantDiv);

    // iterate through the participant's published tracks and
    // call `handleTrackPublication` on them
    participant.tracks.forEach((trackPublication) => {
      handleTrackPublication(trackPublication, participant);
    });

    // listen for any new track publications
    participant.on("trackPublished", handleTrackPublication);
  };

  const handleTrackPublication = (trackPublication, participant) => {
    function displayTrack(track) {
      // append this track to the participant's div and render it on the page
      const participantDiv = document.getElementById(participant.identity);
      // track.attach creates an HTMLVideoElement or HTMLAudioElement
      // (depending on the type of track) and adds the video or audio stream
      participantDiv.append(track.attach());
    }

    // check if the trackPublication contains a `track` attribute. If it does,
    // we are subscribed to this track. If not, we are not subscribed.
    if (trackPublication.track) {
      displayTrack(trackPublication.track);
    }

    // listen for any new subscriptions to this track publication
    trackPublication.on("subscribed", displayTrack);
  };

  const handleDisconnectedParticipant = (participant) => {
    // stop listening for this participant
    participant.removeAllListeners();
    // remove this participant's div from the page
    const participantDiv = document.getElementById(participant.identity);
    participantDiv.remove();
  };

  const joinVideoRoom = async (roomName, token) => {
    // join the video room with the Access Token and the given room name
    const room = await Video.connect(token, {
      room: roomName,
    });
    return room;
  };

  return (
    <div>
      <form id="room-name-form">
        <button
          type="submit"
          onClick={(e) => {
            startRoom(e);
          }}
          color="primary"
          variant="contained"
        >
          Join Room
        </button>
      </form>
      <div className="videoSection">
        <div id="video-container" className="video-outer" style={styles.video}></div>

      </div>

      <div className="btn-group-wrap">
          <button type="button" onClick={()=>{!muted?muteAudio():playAudio()}}>
            {!muted?<FontAwesomeIcon icon={faMicrophone} />:<FontAwesomeIcon icon={faMicrophoneSlash} />}
          </button>

          <button type="button" onClick={()=>{!quitVideo?stopVideo():startVideo()}}>
            {!quitVideo?<FontAwesomeIcon icon={faVideo} />:<FontAwesomeIcon icon={faVideoSlash} />}
          </button>

          <button
            type="submit"
            className="red"
            onClick={() => {
              sendData();
            }}
            color="error"
            variant="contained"
          >
            <FontAwesomeIcon icon={faPhoneSlash} />
          </button>
      </div>
    </div>
  );
};

export default App;
