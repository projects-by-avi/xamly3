// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, query, where, addDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvAliML01AuacHMIvgSLFdtDr__b_CQ3s",
  authDomain: "xamly-4557f.firebaseapp.com",
  projectId: "xamly-4557f",
  storageBucket: "xamly-4557f.firebasestorage.app",
  messagingSenderId: "1017664219023",
  appId: "1:1017664219023:web:a26149c22dd86396b84dfa",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Dashboard object
const dashboard = {
  init: function () {
    this.cacheDOM();
    this.bindEvents();
    this.checkAuthState();
  },

  cacheDOM: function () {
    this.welcomeMessage = document.getElementById('welcome-message');
    this.contentDiv = document.getElementById('content');
    this.takeExamBtn = document.getElementById('take-exam-btn');
    this.viewGradesBtn = document.getElementById('view-grades-btn');
    this.logoutLink = document.getElementById('logout-link');
  },

  bindEvents: function () {
    this.takeExamBtn.addEventListener('click', () => this.showTakeExam());
    this.viewGradesBtn.addEventListener('click', () => this.showGrades());
    this.logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.logout();
    });
    // Delegate event for download buttons
    this.contentDiv.addEventListener('click', (e) => {
      if (e.target && e.target.tagName === 'BUTTON' && e.target.textContent === 'Download') {
        const examId = e.target.dataset.examId;
        const email = e.target.dataset.email;
        if (examId && email) this.downloadGrade(examId, email);
      }
    });
  },

  checkAuthState: function () {
    onAuthStateChanged(auth, (user) => {
      if (user && this.welcomeMessage) {
        this.welcomeMessage.textContent = `Welcome, ${user.email}!`;
      } else if (!this.welcomeMessage) {
        console.error('Welcome message element not found!');
      }
    });
  },

  showTakeExam: function () {
    if (!this.contentDiv) {
      console.error('Content div not found!');
      return;
    }
    this.contentDiv.innerHTML = `
      <h3>Take Exam</h3>
      <input type="text" id="exam-code" placeholder="Enter Exam Code" required>
      <button id="submit-exam-btn">Submit</button>
    `;
    document.getElementById('submit-exam-btn').addEventListener('click', () => this.takeExam());
  },

  showGrades: function () {
    if (!this.contentDiv) {
      console.error('Content div not found!');
      return;
    }
    this.contentDiv.innerHTML = '<h3>Your Grades</h3><div id="grades-list"></div>';
    this.viewGrades();
  },

  takeExam: function () {
    const code = document.getElementById('exam-code')?.value || '';
    if (!code) {
      alert('Please enter an exam code!');
      return;
    }
    getDoc(doc(db, 'exams', code)).then(docSnap => {
      if (docSnap.exists()) {
        const exam = docSnap.data();
        let html = `<h3>${exam.title}</h3><p>Time: ${exam.duration} mins</p><div id="timer">5:00</div><form id="exam-form">`;
        exam.questions.forEach((q, index) => {
          html += `<p><strong>${index + 1}. ${q.question}</strong></p>`;
          if (q.type === 'mcq' && q.options) {
            html += `<div class="options-container">`;
            q.options.forEach(opt => html += `<label><input type="radio" name="q${index}" value="${opt}"> ${opt}</label>`);
            html += `</div>`;
          } else {
            html += `<textarea name="q${index}"></textarea>`;
          }
        });
        html += '<button type="submit">Submit</button></form>';
        this.contentDiv.innerHTML = html;
        this.startTimer(exam.duration);

        const form = document.getElementById('exam-form');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) {
              alert('Please log in to submit the exam!');
              return;
            }
            const answers = [];
            exam.questions.forEach((_, index) => {
              const answer = document.querySelector(`input[name="q${index}"]:checked`)?.value || document.querySelector(`textarea[name="q${index}"]`)?.value || '';
              answers.push(answer);
            });
            addDoc(collection(db, 'submissions'), {
              examId: code,
              studentEmail: user.email,
              answers: answers,
              questions: exam.questions,
              timestamp: new Date()
            }).then(() => {
              alert('Exam submitted successfully!');
              this.contentDiv.innerHTML = '<h3>Exam Submitted</h3>';
            }).catch(error => {
              console.error('Submission error:', error.message);
              alert('Error submitting exam: ' + error.message);
            });
          });
        }
      } else {
        alert('Invalid exam code!');
      }
    }).catch(error => {
      console.error('Fetch error:', error.message);
      alert('Error fetching exam: ' + error.message);
    });
  },

  viewGrades: function () {
    const user = auth.currentUser;
    if (!user || !this.contentDiv) {
      console.error('User or content div not found!');
      return;
    }
    getDocs(query(collection(db, 'grades'), where('studentEmail', '==', user.email))).then(querySnapshot => {
      let html = '';
      querySnapshot.forEach(docSnap => {
        const { examId, score, maxScore } = docSnap.data();
        html += `<p>${examId}: ${score} / ${maxScore} <button data-exam-id="${examId}" data-email="${user.email}">Download</button></p>`;
      });
      this.contentDiv.innerHTML = '<h3>Your Grades</h3><div id="grades-list">' + (html || '<p>No grades yet.</p>') + '</div>';
    }).catch(error => {
      console.error('Grades fetch error:', error.message);
      alert('Error fetching grades: ' + error.message);
    });
  },

  downloadGrade: function (examId, email) {
    getDoc(doc(db, 'grades', `${examId}_${email}`)).then(docSnap => {
      if (docSnap.exists()) {
        const { score, maxScore } = docSnap.data();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(`Grade Report for ${email}`, 10, 10);
        doc.text(`${examId}: ${score} / ${maxScore}`, 10, 20);
        doc.save(`${examId}_${email}_grade.pdf`);
      } else {
        alert('Grade not found!');
      }
    }).catch(error => {
      console.error('Download error:', error.message);
      alert('Error downloading grade: ' + error.message);
    });
  },

  logout: function () {
    signOut(auth).then(() => {
      window.location.href = 'index.html';
    }).catch(error => console.error('Logout error:', error.message));
  },

  startTimer: function (duration) {
    let time = duration * 60;
    const timerDisplay = document.getElementById('timer');
    if (!timerDisplay) {
      console.error('Timer display not found!');
      return;
    }
    const timer = setInterval(() => {
      let minutes = Math.floor(time / 60);
      let seconds = time % 60;
      timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      if (time <= 0) {
        clearInterval(timer);
        alert('Time’s up!');
        const form = document.getElementById('exam-form');
        if (form) form.dispatchEvent(new Event('submit'));
      }
      time--;
    }, 1000);
  }
};

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  dashboard.init();
  console.log('Student dashboard initialized');
});