import React, { useEffect, useState } from "react";
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
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import './meeting.css';

const App = () => {


  let baseURL= process.env.REACT_APP_API_URL
  let passcode='';
  const [authenticated, setAuthenticated] = useState(false);
  const [meetingDate, setMeetingDate] = useState(null);
  const params = window.location.search.split('room_name=')[1];
  useEffect(()=>{
  if (passcode != null) {
    if(passcode.length <1) {
      passcode = prompt('enter passcode');
    }
  }
  },[]);

  useEffect(() => {
    if(passcode === null) {
      alert('Patient not autheticated to connect to the appoitnment. You may close the browser.')
    }
    else if(passcode.length > 2 && !authenticated) {
      var myHeaders2 = new Headers();
      myHeaders2.append("Authorization", "Token QzECldEQkWZDHTzGa4V7uhCqshJRRHmcQlgWWvXkBkqMG");
      myHeaders2.append("Content-Type", "application/json");

      var raw2 = JSON.stringify({
        "room_name": params,
        "pass_code": passcode
      });

      var requestOptions2 = {
        method: 'POST',
        headers: myHeaders2,
        body: raw2,
        redirect: 'follow'
      };

      fetch(`${baseURL}/user/user_verification`, requestOptions2)
        .then(response => response.text())
        .then((result) => {
          console.log('result', result)
          if (JSON.parse(result).status) {
            // console.log("data", new Date(JSON.parse(result).data.schedule_date).getTime());
            // console.log("now", new Date().getTime());
            // console.log("15", new Date(JSON.parse(result).data.schedule_date).getTime()+15*60000);
            if(!((new Date(JSON.parse(result).data.schedule_date).getTime()<= new Date().getTime()) && (new Date(JSON.parse(result).data.schedule_date).getTime()+15*60000 >= new Date().getTime())))
            {
              alert('This appointment has not started');
              return;
            }
            setAuthenticated(true);
            setMeetingDate(JSON.parse(result).data.schedule_date);
          }
          else
          {
            alert('This appointment has ended');
              return;
          }
        })
        .catch(error => console.log('error', error));
    }
  },[passcode])

  const styles = {
    video: {
      display: "flex",
      flexWrap: "wrap",
    },
  };
  console.log('room name', params);
  const [globalRoom, setGlobalRoom] = useState();
  const [muted, setMuted] = useState(false);
  const [quitVideo, setQuitVideo] = useState(false);
  const sendData = async () => {
    globalRoom.disconnect();
    window.close();
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
    const responsePromise =await fetch(`${baseURL}/doctor/create_video_room?room_name=` +
    params, requestOptions);
    const response = await responsePromise.text();
    console.log('response', JSON.parse(response));
    const { token, room_name } = JSON.parse(response);
    const room = await joinVideoRoom(room_name, token);
    setGlobalRoom(room);
    handleConnectedParticipant(room.localParticipant);
    room.participants.forEach(handleConnectedParticipant);
    room.on("participantConnected", handleConnectedParticipant);

    // handle cleanup when a participant disconnects
    room.on("participantDisconnected", handleDisconnectedParticipant);
    const theDate = new Date(meetingDate).getTime();
    let updatedDate = theDate;
    setInterval(() => {
      if(updatedDate > theDate +15*60000){
        room.disconnect();
      } else {
        updatedDate = updatedDate +1*60000;
      }
    }, 60000);
    setTimeout(()=>{
      let myHeaders3 = new Headers();
      myHeaders3.append("Authorization", "Token QzECldEQkWZDHTzGa4V7uhCqshJRRHmcQlgWWvXkBkqMG");

      let requestOptions3 = {
        method: 'GET',
        headers: myHeaders3,
        redirect: 'follow'
      };

      fetch(`${baseURL}/user/validate_call_user?room_name=`+params, requestOptions3)
        .then(response => response.text())
        .then((result) => {console.log(result);})
        .catch(error => console.log('error', error));
    },60000);
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
    {authenticated?
    (<div id="test" style={{"textAlign":"center"}}>
      <form id="room-name-form">
        <Button
          variant="primary"
          style={{position:"absolute",top:"50%"}}
          type="submit"
          onClick={(e) => {
            startRoom(e);
            e.currentTarget.style.display="none";
          }}
        >
          Join Room
        </Button>
      </form>
      <div className="videoSection">
        <div id="video-container" className="video-outer" style={styles.video}></div>

      </div>
      {globalRoom?
      (<div className="btn-group-wrap">
          <Button  variant="outline-primary" onClick={()=>{!muted?muteAudio():playAudio()}}>
            {!muted?<FontAwesomeIcon icon={faMicrophone} />:<FontAwesomeIcon icon={faMicrophoneSlash} />}
          </Button>

          <Button  variant="outline-primary" onClick={()=>{!quitVideo?stopVideo():startVideo()}}>
            {!quitVideo?<FontAwesomeIcon icon={faVideo} />:<FontAwesomeIcon icon={faVideoSlash} />}
          </Button>

          <Button
            type="submit"
            variant="outline-danger"
            className="red"
            onClick={() => {
              sendData();
            }}
            color="error"
          >
            <FontAwesomeIcon icon={faPhoneSlash} />
          </Button>
      </div>):''}
    </div>
  ):(<></>)}
    </div>
  );
};

export default App;
