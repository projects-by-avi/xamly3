import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAvAliML01AuacHMIvgSLFdtDr__b_CQ3s",
  authDomain: "xamly-4557f.firebaseapp.com",
  projectId: "xamly-4557f",
  storageBucket: "xamly-4557f.firebasestorage.app",
  messagingSenderId: "1017664219023",
  appId: "1:1017664219023:web:a26149c22dd86396b84dfa",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded");
  const toggle = document.querySelector('.navbar-toggle');
  const menu = document.querySelector('.navbar-menu');
  const signinForm = document.getElementById('signin-form');

  console.log("signinForm:", signinForm);

  if (!signinForm) {
    alert('Sign-in form not found! Check HTML ID.');
    return;
  }

  toggle.addEventListener('click', () => {
    menu.classList.toggle('active');
  });

  signinForm.addEventListener('submit', e => {
    e.preventDefault();
    signin();
  });
});

function signin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  signInWithEmailAndPassword(auth, email, password).then(userCredential => {
    const user = userCredential.user;
    getDoc(doc(db, 'users', email)).then(docSnap => {
      if (docSnap.exists()) {
        const role = docSnap.data().role;
        window.location.href = role === 'teacher' ? 'teacherdashboard.html' : 'studentdashboard.html';
      } else {
        alert('User data not found!');
      }
    }).catch(error => alert('Error fetching user data: ' + error.message));
  }).catch(error => alert('Error: ' + error.message));
}