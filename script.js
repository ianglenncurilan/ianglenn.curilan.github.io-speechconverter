try {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();
} catch (e) {
  console.error("Speech recognition is not supported in this browser.", e);
  document.querySelector('.no-browser-support').style.display = "block";
  document.querySelector('.app').style.display = "none";
}

// Select elements
const noteTextarea = document.getElementById("note-textarea");
const instructions = document.getElementById("recording-instructions");
const notesList = document.getElementById("notes");
const startBtn = document.getElementById("start-record-btn");
const pauseBtn = document.getElementById("pause-record-btn");
const saveBtn = document.getElementById("save-note-btn");

let noteContent = "";
let notes = getAllNotes();

// Render existing notes on load
renderNotes(notes);

// Configure recognition settings
recognition.continuous = true;
recognition.interimResults = true; // Enables real-time updates

/* -----------------------------
    Speech Recognition
------------------------------ */
recognition.onresult = function (event) {
  let current = event.resultIndex;
  let transcript = event.results[current][0].transcript;

  // Prevent duplicate speech bug on mobile
  let mobileRepeatBug = (current === 1 && transcript === event.results[0][0].transcript);
  if (!mobileRepeatBug) {
      noteContent += transcript;
      noteTextarea.value = noteContent;
  }
};

recognition.onstart = function () {
  instructions.textContent = "Voice recognition is ON. Speak into the microphone...";
  startBtn.classList.add("active");
  pauseBtn.classList.remove("active");
};

recognition.onspeechend = function () {
  instructions.textContent = "You stopped speaking. Recognition paused.";
  startBtn.classList.remove("active");
};

recognition.onerror = function (event) {
  console.error("Recognition Error:", event.error);
  if (event.error === "no-speech") {
      instructions.textContent = "No speech detected. Try again.";
  } else if (event.error === "audio-capture") {
      instructions.textContent = "Microphone access denied. Please allow microphone usage.";
  } else {
      instructions.textContent = "An error occurred: " + event.error;
  }
};

/* -----------------------------
    Button Actions
------------------------------ */
startBtn.addEventListener("click", function () {
  if (noteContent.length) {
      noteContent += " ";
  }
  recognition.start();
});

pauseBtn.addEventListener("click", function () {
  recognition.stop();
  instructions.textContent = "Voice recognition paused.";
  startBtn.classList.remove("active");
});

saveBtn.addEventListener("click", function () {
  recognition.stop();

  if (!noteContent.trim().length) {
      instructions.textContent = "Cannot save an empty note.";
      return;
  }

  let note = {
      date: new Date().toLocaleString(),
      content: noteContent.trim(),
  };

  saveNote(note);
  noteContent = "";
  noteTextarea.value = "";
  renderNotes(getAllNotes());

  instructions.textContent = "Note saved successfully!";
});

/* -----------------------------
    Note Management
------------------------------ */
notesList.addEventListener("click", function (e) {
  e.preventDefault();
  let target = e.target;

  if (target.classList.contains("listen-note")) {
      let content = target.closest(".note").querySelector(".content").textContent;
      readOutLoud(content);
  }

  if (target.classList.contains("delete-note")) {
      let dateTime = target.closest(".note").querySelector(".date").textContent;
      deleteNote(dateTime);
      target.closest(".note").remove();
  }
});

function renderNotes(notes) {
  notesList.innerHTML = notes.length
      ? notes
            .map(
                (note) => `
          <li class="note">
              <p class="header">
                  <span class="date">${note.date}</span>
                  <a href="#" class="listen-note" title="Listen">🔊</a>
                  <a href="#" class="delete-note" title="Delete">🗑</a>
              </p>
              <p class="content">${note.content}</p>
          </li>
      `
            )
            .join("")
      : '<li><p class="content">You don\'t have any notes yet.</p></li>';
}

function readOutLoud(message) {
  let speech = new SpeechSynthesisUtterance();
  speech.text = message;
  speech.volume = 1;
  speech.rate = 1;
  speech.pitch = 1;

  window.speechSynthesis.speak(speech);
}

function saveNote(note) {
  localStorage.setItem(`note-${note.date}`, note.content);
}

function getAllNotes() {
  let notes = [];
  for (let i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);
      if (key.startsWith("note-")) {
          notes.push({
              date: key.replace("note-", ""),
              content: localStorage.getItem(key),
          });
      }
  }
  return notes.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort latest first
}

function deleteNote(dateTime) {
  localStorage.removeItem(`note-${dateTime}`);
}
